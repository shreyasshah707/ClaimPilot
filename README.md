# 🚗 ClaimPilot — Setup & Execution Guide

ClaimPilot is a hybrid motor insurance repair-cost estimation pipeline that combines 2D YOLO damage detection with localized 3D metric depth estimation.

---

## 📁 Directory Structure

Organize your project directory as follows before running any scripts. Download the **CarDD** dataset and place it inside the `./CarDD` folder:

```text
ClaimPilot/
├── CarDD/                               <-- PLACE DATASET HERE
│   ├── annotations/
│   │   ├── instances_train2017.json
│   │   └── instances_val2017.json
│   └── images/
│       ├── train2017/                   <-- Train RGB images (.jpg)
│       └── val2017/                     <-- Validation RGB images (.jpg)
├── weights/                             <-- Auto-generated during training
│   ├── claimpilot_final_weights.pt
│   └── cardd_best.pt
├── requirements.txt
├── convert_cardd.py
├── train_yolo.py
├── train_metric_depth.py
├── app.py
└── README.md

⚡ Execution Sequence
Step 1: Install Dependencies
Open a terminal in the project root directory and run:
pip install -r requirements.txt

Step 2: Train 3D Metric Depth Model (~2 Minutes)
Generates synthetic deformation fields in memory, trains the 3D multi-task depth and surface normal architecture, and exports ./weights/claimpilot_final_weights.pt:
python train_metric_depth.py

Step 3: Convert & Train 2D YOLO Detector (~15–20 Minutes)
Converts CarDD COCO annotations to YOLO format and trains YOLOv8s on your NVIDIA GPU (exports ./weights/cardd_best.pt):
python convert_cardd.py
python train_yolo.py

Step 4: Launch Streamlit Dashboard
Run the interactive dashboard once weights are exported:
streamlit run app.py


⚙️ System Requirements & Fallbacks
GPU Acceleration: Scripts automatically detect and select CUDA (device=0) when an NVIDIA GPU (e.g., RTX 5070) is available.

Fail-Safe Mock Mode: If weight files (cardd_best.pt or claimpilot_final_weights.pt) are missing, app.py automatically falls back to an internal synthetic demo mode with heuristic CV processing so the application remains fully functional.