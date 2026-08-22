"""
train_yolo.py — High-Accuracy YOLOv8 Fine-Tuner
"""
import os
import shutil
import torch
from ultralytics import YOLO

def train_cardd_model():
    use_cuda = torch.cuda.is_available()
    device = 0 if use_cuda else "cpu"
    
    print("=" * 60)
    print(f"🚀 Fine-Tuning YOLOv8 Damage Detector")
    print(f"💻 Device: {'GPU (CUDA)' if use_cuda else 'CPU'}")
    print("=" * 60)

    model = YOLO("yolov8s.pt")
    yaml_path = os.path.abspath("./cardd.yaml")

    results = model.train(
        data=yaml_path,
        epochs=30 if use_cuda else 15,
        imgsz=640,
        batch=16 if use_cuda else 8,
        workers=4,
        device=device,
        amp=use_cuda,
        mosaic=1.0,          # Boosts small dent detection
        mixup=0.15,         # Prevents overfitting
        degrees=10.0,       # Handles angled phone photos
        fliplr=0.5,
        scale=0.5,
        project="ClaimPilot_YOLO",
        name="cardd_run",
        exist_ok=True
    )

    output_dir = "./weights"
    os.makedirs(output_dir, exist_ok=True)
    src_weights = "./ClaimPilot_YOLO/cardd_run/weights/best.pt"
    dst_weights = os.path.join(output_dir, "cardd_best.pt")

    if os.path.exists(src_weights):
        shutil.copy(src_weights, dst_weights)
        print("✅ YOLO Fine-Tuning Complete! Saved to ./weights/cardd_best.pt")

if __name__ == "__main__":
    train_cardd_model()