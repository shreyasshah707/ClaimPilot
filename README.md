# ClaimPilot — Automated Motor Insurance Claim Processing

ClaimPilot is an AI-powered pipeline for processing motor insurance claims.
It takes a photo or video of a damaged vehicle and produces a structured JSON
report with damage classification, physical measurements, cost estimates, and
fraud risk scores — without requiring a human adjuster for initial triage.

\---

## Architecture

```
Input (Photo or Video)
        │
        ▼
┌───────────────────────────────────────────────┐
│              PHOTO MODE PIPELINE              │
│                                               │
│  ┌─────────────┐   ┌───────────────────────┐ │
│  │  YOLOv11m   │   │   Depth Anything V2   │ │
│  │  (T1.3)     │   │   (T2.1)              │ │
│  │             │   │                       │ │
│  │  6 damage   │   │  Relative depth map   │ │
│  │  classes    │   │  + metric calibration │ │
│  │  mAP50:65%  │   │  via license plate    │ │
│  └──────┬──────┘   └───────────────────────┘ │
│         │                                     │
│         ▼                                     │
│  ┌─────────────┐   ┌───────────────────────┐ │
│  │    SAM2     │   │        DSINE          │ │
│  │  (T2.2)     │   │        (T2.3)         │ │
│  │             │   │                       │ │
│  │  Box-prompt │   │  Surface normal maps  │ │
│  │  masks      │   │  + crease angle (θ°)  │ │
│  │  area (px,  │   │                       │ │
│  │  cm²)       │   │                       │ │
│  └──────┬──────┘   └──────────┬────────────┘ │
│         └──────────┬──────────┘              │
│                    ▼                          │
│         ┌─────────────────────┐               │
│         │   photo\_pipeline    │               │
│         │   analyze\_photo()   │               │
│         │      (T2.4)         │               │
│         └──────────┬──────────┘               │
└────────────────────│──────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────┐
│             VIDEO MODE PIPELINE               │
│                                               │
│  ┌─────────────┐   ┌───────────────────────┐  │
│  │   RT-DETR   │   │  Frame Extraction     │  │
│  │   (T3.1)    │   │  (T3.2)               │  │
│  │             │   │                       │  │
│  │  mAP50:69%  │   │  10–20 keyframes      │  │
│  │  + temporal │   │  from video clip      │  │
│  │  tracker    │   │                       │  │
│  └─────────────┘   └───────────────────────┘  │
│                                               │
│  ┌─────────────┐   ┌───────────────────────┐  │
│  │   COLMAP    │   │       OpenMVS         │  │
│  │   (T3.3)    │   │       (T3.4)          │  │
│  │             │   │                       │  │
│  │  Structure  │   │  Dense point cloud    │  │
│  │  from       │   │  + depth maps         │  │
│  │  Motion     │   │                       │  │
│  └─────────────┘   └───────────────────────┘  │ 
└───────────────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────┐
│           COST ESTIMATION ENGINE              │
│  Lookup table × brand multiplier × physical   │
│  measurement multipliers  (T5.1–T5.5)         │
└───────────────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────┐
│           FRAUD DETECTION ENGINE              │
│  pHash duplicate check  (T6.2)                │
│  Qwen2-VL narrative consistency  (T6.3)       │
│  EXIF metadata forensics  (T6.4)              │
│  Combined fraud risk score 0–100  (T6.5)      │
└───────────────────────────────────────────────┘

---

## Detection Models

|Model|Architecture|mAP50|mAP50-95|Use case|
|-|-|-|-|-|
|YOLOv11m (T1.3)|CNN-based, Ultralytics|64.8%|50.4%|Photo mode|
|RT-DETR-L (T3.1)|Transformer-based|**69.1%**|46.7%|Video mode|

Both fine-tuned on **CarDD** (2,816 images, 6 damage classes) 

\---

## Photo Mode Pipeline Output (JSON schema)

`scripts/photo\_pipeline.py → analyze\_photo()` returns:

```json
{
  "image\_path": "path/to/image.jpg",
  "image\_size": \[width, height],
  "processed\_at": "2026-09-07T21:32:36",
  "models": {
    "detection": "YOLOv11m (ClaimPilot fine-tuned)",
    "depth": "Depth Anything V2",
    "segmentation": "SAM2",
    "normals": "DSINE"
  },
  "calibration": {
    "depth\_metric": { "status": "calibrated | skipped\_no\_plate\_detected", "..." : "..." },
    "area\_pixel\_to\_mm": { "status": "calibrated | skipped\_no\_plate\_detected", "mm\_per\_pixel": 5.2 }
  },
  "damage\_instances": \[
    {
      "instance\_id": 0,
      "class\_name": "dent",
      "confidence": 0.83,
      "bbox\_xyxy": \[x1, y1, x2, y2],
      "mask\_iou\_score": 0.91,
      "area\_px": 4213,
      "area\_cm2": null,
      "crease\_angle\_deg": 12.4,
      "crease\_status": "computed",
      "stage\_errors": {}
    }
  ],
  "summary": {
    "num\_instances": 1,
    "classes\_detected": \["dent"],
    "total\_damage\_area\_cm2": null
  },
  "timing\_sec": {
    "detection": 0.22,
    "depth": 0.79,
    "segmentation": 3.04,
    "normals": 14.1,
    "total": 18.6
  }
}
```

## Quick Start (Photo Mode Demo)

### Clone and install

```bash
git clone https://github.com/your-org/claimpilot.git
cd claimpilot

# Create a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\\Scripts\\activate

# NVIDIA RTX 50-series (Blackwell, e.g. RTX 5070) — install torch from cu128 FIRST:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128

# All other dependencies:
pip install -r requirements.txt
```

### Run inference on your own photos

```python
import sys
sys.path.insert(0, "scripts")

import torch
from ultralytics import YOLO
from photo\_pipeline import analyze\_photo
import depth\_estimation, segmentation, surface\_normals

device = "cuda" if torch.cuda.is\_available() else "cpu"

# Load models once
yolo   = YOLO("models/yolov11m/best.pt").to(device)
d\_proc, d\_model = depth\_estimation.load\_depth\_model(device=device)
s\_proc, s\_model = segmentation.load\_sam2(device=device)
dsine  = torch.hub.load("hugoycj/DSINE-hub", "DSINE", trust\_repo=True)

# Run the full pipeline on one image
result = analyze\_photo(
    "path/to/car\_damage.jpg",
    yolo, d\_proc, d\_model, s\_proc, s\_model, dsine,
    device=device,
)

import json
print(json.dumps(result, indent=2))
```

Or use the local runner script (handles model loading, GPU detection, batches a folder):

```bash
python run\_local\_pipeline.py \\
    --images ./my\_photos \\
    --project-root . \\
    --output ./results
```

\---

## Physical Measurements

|Measurement|Source|Notes|
|-|-|-|
|Damage area (px)|SAM2 mask|Always available|
|Damage area (cm²)|SAM2 + license plate calibration|Only when plate visible|
|Relative depth map|Depth Anything V2|Always available|
|Metric depth (mm)|Depth Anything V2 + plate calibration|Only when plate visible|
|Crease angle (θ°)|DSINE surface normals|Always available; most meaningful for dents|

**Calibration method:** a standard EU/India license plate (520mm wide) in the image is
used as the physical reference. The pipeline auto-detects plates via an OpenCV Haar
cascade; plates can also be specified manually (pixel bounding box) for production photos
where the cascade misses.

\---

## Temporal Consistency (Video Mode)

`scripts/temporal\_consistency.py` provides a `TemporalTracker` class that:

* Matches RT-DETR detections across consecutive frames by IoU (same class required)
* Smooths bounding box coordinates and confidence via exponential moving average
(`ema\_alpha=0.6`)
* Suppresses single-frame false positives via a stability filter (`min\_hits=2`)
* Drops tracks that disappear for too long (`max\_misses=3`)

```python
from temporal\_consistency import TemporalTracker

tracker = TemporalTracker(iou\_threshold=0.3, ema\_alpha=0.6, min\_hits=2, max\_misses=3)

for frame in video\_frames:
    detections = run\_rtdetr(frame)       # list of {class\_name, confidence, bbox\_xyxy}
    stable     = tracker.update(detections)   # only returns tracks seen 2+ frames
---

## Citation

```bibtex
@article{wang2024cardd,
  title   = {CarDD: A New Dataset for Vision-Based Car Damage Detection},
  author  = {Wang, Xinkuang and Li, Wenjing and Wu, Zhongcheng},
  journal = {IEEE Transactions on Intelligent Transportation Systems},
  volume  = {24},
  number  = {7},
  pages   = {7202--7214},
  year    = {2024}
}
```

