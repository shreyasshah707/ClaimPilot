"""
ClaimPilot — Model Accuracy & Evaluation Benchmark Script
=========================================================
Calculates:
  1. 2D YOLO Detector: mAP50, mAP50-95, Precision, and Recall on validation images.
  2. 3D Geometry Estimator: Mask IoU (Adaptive), Depth MAE (mm), Depth RMSE (mm), and Normal Angular Error (°).

Run:
    python evaluate_models.py
"""

import os
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader

# Optional YOLO Import
try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False


# ---------------------------------------------------------------------------
# 3D MODEL ARCHITECTURE & DATASET
# ---------------------------------------------------------------------------
class FastGeometryDataset(torch.utils.data.Dataset):
    def __init__(self, num_samples=200, img_size=256):
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


# ---------------------------------------------------------------------------
# EVALUATION FUNCTIONS
# ---------------------------------------------------------------------------
def evaluate_yolo_2d():
    print("\n" + "="*60)
    print("📊 1. EVALUATING 2D YOLO DAMAGE DETECTOR")
    print("="*60)

    weights_path = "./weights/cardd_best.pt"
    yaml_path = "./cardd.yaml"

    if not HAS_YOLO:
        print("⚠️ ultralytics package not installed. Skipping YOLO evaluation.")
        return

    if not os.path.exists(weights_path):
        print(f"⚠️ Model weights not found at: {weights_path}")
        print("Run 'python train_yolo.py' first to train the detector.")
        return

    if not os.path.exists(yaml_path):
        print(f"⚠️ Dataset configuration not found at: {yaml_path}")
        return

    model = YOLO(weights_path)
    metrics = model.val(data=yaml_path, split="val", verbose=False)

    print(f"\n✅ 2D YOLO Detector Metrics:")
    print(f"  • Precision (P)    : {metrics.box.mp * 100:.2f}%")
    print(f"  • Recall (R)       : {metrics.box.mr * 100:.2f}%")
    print(f"  • mAP @ 0.50       : {metrics.box.map50 * 100:.2f}%")
    print(f"  • mAP @ 0.50:0.95  : {metrics.box.map * 100:.2f}%")


def evaluate_3d_metric_model():
    print("\n" + "="*60)
    print("📊 2. EVALUATING 3D METRIC GEOMETRY ESTIMATOR")
    print("="*60)

    weights_path = "./weights/claimpilot_final_weights.pt"

    if not os.path.exists(weights_path):
        print(f"⚠️ 3D Model weights not found at: {weights_path}")
        print("Run 'python train_metric_depth.py' first to generate weights.")
        return

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = ClaimPilotPipeline().to(device)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model.eval()

    dataset = FastGeometryDataset(num_samples=200, img_size=256)
    dataloader = DataLoader(dataset, batch_size=16, shuffle=False)

    total_iou = 0.0
    total_mae_mm = 0.0
    total_rmse_mm = 0.0
    total_angular_err_deg = 0.0
    num_batches = len(dataloader)

    with torch.no_grad():
        for rgb, gt_mask, gt_depth, gt_normals in dataloader:
            rgb, gt_mask = rgb.to(device), gt_mask.to(device)
            gt_depth, gt_normals = gt_depth.to(device), gt_normals.to(device)

            pred_mask_logits, pred_depth, pred_normals = model(rgb)

            # 1. Mask IoU (Adaptive Thresholding based on activation distribution)
            probs = torch.sigmoid(pred_mask_logits)
            max_p = probs.view(probs.size(0), -1).max(dim=1)[0].view(-1, 1, 1, 1)
            thresh = torch.clamp(max_p * 0.5, min=0.15)
            pred_mask_bin = (probs > thresh).float()

            intersection = (pred_mask_bin * gt_mask).sum(dim=(1, 2, 3))
            union = ((pred_mask_bin + gt_mask) > 0).float().sum(dim=(1, 2, 3))
            iou = (intersection / torch.clamp(union, min=1.0)).mean().item()
            total_iou += iou

            # 2. Depth MAE & RMSE
            depth_diff = torch.abs(pred_depth - gt_depth)
            mae = depth_diff.mean().item()
            rmse = torch.sqrt(torch.mean((pred_depth - gt_depth) ** 2)).item()
            total_mae_mm += mae
            total_rmse_mm += rmse

            # 3. Surface Normal Angular Error (Degrees)
            dot_product = torch.sum(pred_normals * gt_normals, dim=1, keepdim=True)
            dot_product = torch.clamp(dot_product, -1.0, 1.0)
            angle_rad = torch.acos(dot_product)
            angle_deg = torch.rad2deg(angle_rad).mean().item()
            total_angular_err_deg += angle_deg

    avg_iou = (total_iou / num_batches) * 100
    avg_mae = total_mae_mm / num_batches
    avg_rmse = total_rmse_mm / num_batches
    avg_angle_err = total_angular_err_deg / num_batches

    print(f"\n✅ 3D Geometry Estimator Metrics:")
    print(f"  • Mask Segmentation IoU  : {avg_iou:.2f}%")
    print(f"  • Depth MAE (ΔZ Error)   : {avg_mae:.3f} mm")
    print(f"  • Depth RMSE             : {avg_rmse:.3f} mm")
    print(f"  • Surface Normal Error   : {avg_angle_err:.2f}°")


if __name__ == "__main__":
    evaluate_yolo_2d()
    evaluate_3d_metric_model()