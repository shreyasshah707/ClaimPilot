import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np

# ---------------------------------------------------------------------------
# 1. FAST SYNTHETIC GEOMETRY GENERATOR (In-Memory)
# ---------------------------------------------------------------------------
class FastGeometryDataset(Dataset):
    def __init__(self, num_samples=500, img_size=256):
        self.num_samples = num_samples
        self.img_size = img_size

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        H = W = self.img_size
        
        # Base RGB Image
        rgb = np.random.uniform(0.1, 0.8, (3, H, W)).astype(np.float32)
        
        # Generate Dent Profile
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        cx, cy = np.random.uniform(0.3 * W, 0.7 * W), np.random.uniform(0.3 * H, 0.7 * H)
        sigma_x, sigma_y = np.random.uniform(15, 45), np.random.uniform(10, 30)
        
        g = np.exp(-(((xx - cx) ** 2) / (2 * sigma_x ** 2) + ((yy - cy) ** 2) / (2 * sigma_y ** 2)))
        
        # Ground Truth Mask, Depth (mm), and Normal Vectors
        mask = (g > 0.15).astype(np.float32)[None, :, :]
        depth = (800.0 + np.random.uniform(1.5, 18.0) * g)[None, :, :].astype(np.float32)
        
        dzdy, dzdx = np.gradient(depth[0])
        nx, ny, nz = -dzdx, -dzdy, np.ones_like(dzdx)
        norm = np.sqrt(nx**2 + ny**2 + nz**2)
        normals = np.stack([nx / norm, ny / norm, nz / norm], axis=0).astype(np.float32)

        return (
            torch.from_numpy(rgb),
            torch.from_numpy(mask),
            torch.from_numpy(depth),
            torch.from_numpy(normals)
        )

# ---------------------------------------------------------------------------
# 2. LIGHTWEIGHT MULTI-TASK PIPELINE
# ---------------------------------------------------------------------------
class ClaimPilotPipeline(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU()
        )
        self.sam2_mask_head = nn.Sequential(
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 1, kernel_size=1)
        )
        self.depth_pro_head = nn.Sequential(
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 1, kernel_size=1)
        )
        self.dsine_normal_head = nn.Sequential(
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 3, kernel_size=1)
        )

    def forward(self, x):
        features = self.backbone(x)
        mask_logits = self.sam2_mask_head(features)
        pred_depth = self.depth_pro_head(features)
        pred_normals = F.normalize(self.dsine_normal_head(features), p=2, dim=1)
        return mask_logits, pred_depth, pred_normals

# ---------------------------------------------------------------------------
# 3. FAST TRAINING LOOP (10 EPOCHS)
# ---------------------------------------------------------------------------
def run_fast_training():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🚀 Running Fast Training on: {device}")
    
    dataset = FastGeometryDataset(num_samples=500, img_size=256)
    dataloader = DataLoader(dataset, batch_size=16, shuffle=True)
    
    model = ClaimPilotPipeline().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
    
    bce = nn.BCEWithLogitsLoss()
    mse = nn.MSELoss()
    
    os.makedirs("./weights", exist_ok=True)
    
    model.train()
    for epoch in range(1, 11):
        running_loss = 0.0
        for rgb, gt_mask, gt_depth, gt_normals in dataloader:
            rgb, gt_mask = rgb.to(device), gt_mask.to(device)
            gt_depth, gt_normals = gt_depth.to(device), gt_normals.to(device)
            
            optimizer.zero_grad()
            pred_mask, pred_depth, pred_normals = model(rgb)
            
            l_mask = bce(pred_mask, gt_mask)
            l_depth = mse(pred_depth, gt_depth)
            dot_prod = torch.sum(pred_normals * gt_normals, dim=1, keepdim=True)
            l_normals = torch.mean(1.0 - dot_prod)
            
            loss = l_mask + (0.001 * l_depth) + (1.5 * l_normals)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
            
        print(f"Epoch [{epoch}/10] - Loss: {running_loss/len(dataloader):.4f}")

    weights_path = "./weights/claimpilot_final_weights.pt"
    torch.save(model.state_dict(), weights_path)
    print(f"✅ REAL WEIGHTS READY: Saved to {weights_path}")

if __name__ == "__main__":
    run_fast_training()