"""
train_metric_depth.py — Fast Multi-Task 3D Metric Geometry Trainer
"""
import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
import numpy as np

class DiceBCELoss(nn.Module):
    def __init__(self):
        super().__init__()
        self.bce = nn.BCEWithLogitsLoss()
        
    def forward(self, inputs, targets):
        bce_loss = self.bce(inputs, targets)
        probs = torch.sigmoid(inputs)
        intersection = (probs * targets).sum()
        dice_loss = 1 - (2. * intersection + 1.0) / (probs.sum() + targets.sum() + 1.0)
        return bce_loss + dice_loss

class FastGeometryDataset(Dataset):
    def __init__(self, num_samples=1000, img_size=256):
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
        cx, cy = np.random.uniform(0.25 * W, 0.75 * W), np.random.uniform(0.25 * H, 0.75 * H)
        sigma_x, sigma_y = np.random.uniform(15.0, 45.0), np.random.uniform(10.0, 35.0)
        theta = np.random.uniform(0, np.pi)

        a = (np.cos(theta)**2) / (2 * sigma_x**2) + (np.sin(theta)**2) / (2 * sigma_y**2)
        b = -(np.sin(2*theta)) / (4 * sigma_x**2) + (np.sin(2*theta)) / (4 * sigma_y**2)
        c = (np.sin(theta)**2) / (2 * sigma_x**2) + (np.cos(theta)**2) / (2 * sigma_y**2)

        x_diff, y_diff = xx - cx, yy - cy
        dent_field = np.exp(-(a * x_diff**2 + 2 * b * x_diff * y_diff + c * y_diff**2))

        max_depth_mm = np.random.uniform(2.5, 22.0)
        baseline_depth_mm = 800.0
        depth_map = (baseline_depth_mm + max_depth_mm * dent_field).astype(np.float32)[None, :, :]
        mask = (dent_field > 0.12).astype(np.float32)[None, :, :]

        dzdy, dzdx = np.gradient(depth_map[0])
        nx, ny, nz = -dzdx, -dzdy, np.ones_like(dzdx) * 5.0
        norm = np.sqrt(nx**2 + ny**2 + nz**2)
        normals = np.stack([nx / norm, ny / norm, nz / norm], axis=0).astype(np.float32)

        return torch.from_numpy(rgb), torch.from_numpy(mask), torch.from_numpy(depth_map), torch.from_numpy(normals)

class ClaimPilotPipeline(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU()
        )
        self.sam2_mask_head = nn.Sequential(nn.Conv2d(64, 32, 3, padding=1), nn.ReLU(), nn.Conv2d(32, 1, 1))
        self.depth_pro_head = nn.Sequential(nn.Conv2d(64, 32, 3, padding=1), nn.ReLU(), nn.Conv2d(32, 1, 1))
        self.dsine_normal_head = nn.Sequential(nn.Conv2d(64, 32, 3, padding=1), nn.ReLU(), nn.Conv2d(32, 3, 1))

    def forward(self, x):
        f = self.backbone(x)
        return self.sam2_mask_head(f), self.depth_pro_head(f), F.normalize(self.dsine_normal_head(f), p=2, dim=1)

def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = ClaimPilotPipeline().to(device)
    loader = DataLoader(FastGeometryDataset(num_samples=1200), batch_size=16, shuffle=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)

    mask_criterion = DiceBCELoss()
    depth_criterion = nn.L1Loss()
    normal_criterion = nn.CosineSimilarity(dim=1)

    print("🚀 Training 3D Geometry Model (Dice + Depth + Normal)...")
    model.train()
    for epoch in range(25):
        for rgb, gt_mask, gt_depth, gt_normals in loader:
            rgb, gt_mask = rgb.to(device), gt_mask.to(device)
            gt_depth, gt_normals = gt_depth.to(device), gt_normals.to(device)

            p_mask, p_depth, p_norm = model(rgb)

            l_mask = mask_criterion(p_mask, gt_mask)
            l_depth = depth_criterion(p_depth, gt_depth)
            l_norm = (1.0 - normal_criterion(p_norm, gt_normals)).mean()

            loss = 3.0 * l_mask + 0.1 * l_depth + 2.0 * l_norm
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

    os.makedirs("./weights", exist_ok=True)
    torch.save(model.state_dict(), "./weights/claimpilot_final_weights.pt")
    print("✅ 3D Metric Model retrained and saved to ./weights/claimpilot_final_weights.pt")

if __name__ == "__main__":
    train()