import os
import time
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

class FastGeometryDataset(Dataset):
    def __init__(self, num_samples=600, img_size=256):
        self.num_samples = num_samples
        self.img_size = img_size

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        H = W = self.img_size
        
        base_color = np.random.uniform(0.1, 0.8, (3, 1, 1)).astype(np.float32)
        noise = np.random.normal(0, 0.02, (3, H, W)).astype(np.float32)
        rgb = np.clip(base_color + noise, 0.0, 1.0)

        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        cx = np.random.uniform(0.25 * W, 0.75 * W)
        cy = np.random.uniform(0.25 * H, 0.75 * H)
        sigma_x = np.random.uniform(15.0, 45.0)
        sigma_y = np.random.uniform(10.0, 35.0)
        theta = np.random.uniform(0, np.pi)

        a = (np.cos(theta)**2) / (2 * sigma_x**2) + (np.sin(theta)**2) / (2 * sigma_y**2)
        b = -(np.sin(2*theta)) / (4 * sigma_x**2) + (np.sin(2*theta)) / (4 * sigma_y**2)
        c = (np.sin(theta)**2) / (2 * sigma_x**2) + (np.cos(theta)**2) / (2 * sigma_y**2)

        x_diff = xx - cx
        y_diff = yy - cy
        dent_field = np.exp(-(a * x_diff**2 + 2 * b * x_diff * y_diff + c * y_diff**2))

        max_depth_mm = np.random.uniform(2.5, 22.0)
        baseline_depth_mm = 800.0
        depth_map = (baseline_depth_mm + max_depth_mm * dent_field).astype(np.float32)[None, :, :]
        mask = (dent_field > 0.12).astype(np.float32)[None, :, :]

        dzdy, dzdx = np.gradient(depth_map[0])
        nx = -dzdx
        ny = -dzdy
        nz = np.ones_like(dzdx) * 5.0
        norm = np.sqrt(nx**2 + ny**2 + nz**2)
        normals = np.stack([nx / norm, ny / norm, nz / norm], axis=0).astype(np.float32)

        return (
            torch.from_numpy(rgb),
            torch.from_numpy(mask),
            torch.from_numpy(depth_map),
            torch.from_numpy(normals)
        )

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

def run_fast_training(epochs=10, batch_size=16, learning_rate=1e-3):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🚀 Fine-Tuning 3D Geometry Estimator on: {device}")

    dataset = FastGeometryDataset(num_samples=600, img_size=256)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = ClaimPilotPipeline().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)
    bce = nn.BCEWithLogitsLoss()
    mse = nn.MSELoss()

    weights_dir = "./weights"
    os.makedirs(weights_dir, exist_ok=True)
    out_path = os.path.join(weights_dir, "claimpilot_final_weights.pt")

    model.train()
    for epoch in range(1, epochs + 1):
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

            loss = l_mask + (0.001 * l_depth) + (1.2 * l_normals)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()

        print(f"Epoch [{epoch}/{epochs}] - Loss: {running_loss / len(dataloader):.4f}")

    torch.save(model.state_dict(), out_path)
    print(f"✅ SUCCESS: 3D Metric Model saved to: {os.path.abspath(out_path)}")

if __name__ == "__main__":
    run_fast_training()