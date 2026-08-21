import os
import shutil
import torch
from ultralytics import YOLO

def train_cardd_model():
    use_cuda = torch.cuda.is_available()
    device = 0 if use_cuda else "cpu"
    
    print("=" * 60)
    print(f"🚀 Initializing YOLOv8s Training")
    print(f"💻 Device Selected: {'GPU (CUDA)' if use_cuda else 'CPU'}")
    print("=" * 60)

    model = YOLO("yolov8s.pt")
    yaml_path = os.path.abspath("./cardd.yaml")

    if not os.path.exists(yaml_path):
        raise FileNotFoundError(f"Missing config: {yaml_path}. Run convert_cardd.py first.")

    # Optimized CPU vs GPU settings for speed
    epochs = 35 if use_cuda else 12         # Reduced epochs on CPU for fast completion
    batch_size = 32 if use_cuda else 8       # Lightweight batch size for CPU memory
    workers = 8 if use_cuda else 2          # CPU thread count

    results = model.train(
        data=yaml_path,
        epochs=epochs,
        imgsz=640,
        batch=batch_size,
        workers=workers,
        device=device,
        amp=use_cuda,                       # Mixed precision enabled only if CUDA exists
        project="ClaimPilot_YOLO",
        name="cardd_run",
        exist_ok=True
    )

    # Export best weights to the Streamlit app's weights directory
    output_dir = "./weights"
    os.makedirs(output_dir, exist_ok=True)
    src_weights = "./ClaimPilot_YOLO/cardd_run/weights/best.pt"
    dst_weights = os.path.join(output_dir, "cardd_best.pt")

    if os.path.exists(src_weights):
        shutil.copy(src_weights, dst_weights)
        print("\n" + "=" * 60)
        print(f"✅ TRAINING COMPLETE!")
        print(f"💾 Model weights saved to: {os.path.abspath(dst_weights)}")
        print("=" * 60)

if __name__ == "__main__":
    train_cardd_model()