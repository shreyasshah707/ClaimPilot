# Reusable monocular depth estimation + license-plate metric calibration for ClaimPilot.
# Used by this notebook (T2.1) and by the end-to-end pipeline (T2.4).
import math
import numpy as np
import torch
import cv2
from PIL import Image, ExifTags


PLATE_CASCADE_PATH = cv2.data.haarcascades + "haarcascade_russian_plate_number.xml"


def load_depth_model(model_id="depth-anything/Depth-Anything-V2-Base-hf", device="cuda"):
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation
    processor = AutoImageProcessor.from_pretrained(model_id)
    model = AutoModelForDepthEstimation.from_pretrained(model_id)
    model.to(device).eval()
    return processor, model


def estimate_relative_depth(processor, model, image_path, device="cuda"):
    # Returns a (H, W) float32 numpy array, upsampled to the original image size.
    # Values are relative depth in an unspecified, uncalibrated unit -- NOT millimeters.
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
        predicted_depth = outputs.predicted_depth

    prediction = torch.nn.functional.interpolate(
        predicted_depth.unsqueeze(1),
        size=image.size[::-1],  # (H, W) from PIL's (W, H)
        mode="bicubic",
        align_corners=False,
    )
    return prediction.squeeze().cpu().numpy().astype(np.float32)


def detect_license_plate(image_path, cascade_path=PLATE_CASCADE_PATH,
                          scale_factor=1.05, min_neighbors=4):
    # Best-effort plate detection via OpenCV Haar cascade. Returns (x, y, w, h) in pixels
    # for the largest detected region, or None if nothing was found (or if the detector
    # itself is unavailable). This is a coarse detector tuned for frontal/rear plate
    # photos -- expect a low hit rate on angled or close-up shots. Use the manual bbox
    # override in calibrate_metric_depth() when it misses.
    #
    # Wrapped defensively: environments with multiple opencv-* pip packages installed
    # (e.g. opencv-python alongside opencv-python-headless, which can happen when a
    # library like fiftyone pulls in a different variant than an earlier install) can end
    # up with a broken cv2 module missing attributes like CascadeClassifier. Plate
    # detection is a best-effort convenience, not the core deliverable of this module --
    # a broken cascade classifier should degrade to "no plate detected", not crash the
    # whole depth-estimation pipeline.
    try:
        cascade = cv2.CascadeClassifier(cascade_path)
        img = cv2.imread(image_path)
        if img is None:
            return None
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        plates = cascade.detectMultiScale(gray, scaleFactor=scale_factor, minNeighbors=min_neighbors)
    except AttributeError as e:
        if not getattr(detect_license_plate, "_warned", False):
            print(f"[depth_estimation] plate detector unavailable ({e}). This usually means "
                  "multiple opencv-* pip packages are installed and conflicting. Metric "
                  "calibration will be skipped for auto-detection; manual plate_bbox still works. "
                  "To fix: pip uninstall -y opencv-python opencv-python-headless opencv-contrib-python "
                  "opencv-contrib-python-headless, then pip install opencv-python-headless, then "
                  "restart the runtime.")
            detect_license_plate._warned = True
        return None

    if len(plates) == 0:
        return None
    # Largest detected region by area is the most likely true positive
    x, y, w, h = max(plates, key=lambda b: b[2] * b[3])
    return int(x), int(y), int(w), int(h)


def estimate_focal_length_px(image_path, image_width_px, assumed_hfov_deg=60.0):
    # Prefer EXIF FocalLengthIn35mmFilm when available: that tag is defined relative to
    # the 36mm-wide full-frame sensor, so focal_length_px = image_width_px * (f35 / 36).
    # Falls back to an assumed horizontal field-of-view otherwise.
    try:
        img = Image.open(image_path)
        exif_raw = img._getexif()
        if exif_raw:
            tag_map = {ExifTags.TAGS.get(k, k): v for k, v in exif_raw.items()}
            f35 = tag_map.get("FocalLengthIn35mmFilm")
            if f35:
                return image_width_px * (float(f35) / 36.0), "exif_35mm_equivalent"
    except Exception:
        pass

    hfov_rad = math.radians(assumed_hfov_deg)
    focal_px = image_width_px / (2 * math.tan(hfov_rad / 2))
    return focal_px, f"assumed_hfov_{assumed_hfov_deg}deg"


def calibrate_metric_depth(relative_depth_map, image_path, plate_bbox=None,
                            plate_width_mm=520.0, assumed_hfov_deg=60.0, patch_radius=3):
    # Convert a relative depth map to metric (mm) using a license plate of known width
    # as a single calibration reference. Scale-only calibration (see module docstring in
    # the notebook for why this is a documented simplification, not a full affine fit).
    #
    # plate_bbox: (x, y, w, h) in pixels. If None, runs the Haar-cascade auto-detector.
    #
    # Returns: (metric_depth_map_or_None, calibration_info_dict)
    h_img, w_img = relative_depth_map.shape

    if plate_bbox is None:
        plate_bbox = detect_license_plate(image_path)
        detection_method = "auto_haar_cascade"
    else:
        detection_method = "manual_override"

    if plate_bbox is None:
        return None, {"status": "skipped_no_plate_detected", "detection_method": "auto_haar_cascade"}

    x, y, w, h = plate_bbox
    if w <= 0:
        return None, {"status": "invalid_plate_bbox", "detection_method": detection_method}

    focal_length_px, focal_method = estimate_focal_length_px(image_path, w_img, assumed_hfov_deg)
    plate_distance_mm = (plate_width_mm * focal_length_px) / w

    cx, cy = x + w // 2, y + h // 2
    y0, y1 = max(cy - patch_radius, 0), min(cy + patch_radius + 1, h_img)
    x0, x1 = max(cx - patch_radius, 0), min(cx + patch_radius + 1, w_img)
    relative_value_at_plate = float(np.median(relative_depth_map[y0:y1, x0:x1]))

    if relative_value_at_plate <= 0:
        return None, {"status": "invalid_relative_depth_at_plate", "detection_method": detection_method}

    scale = plate_distance_mm / relative_value_at_plate
    metric_depth_map = relative_depth_map * scale

    calibration_info = {
        "status": "calibrated",
        "detection_method": detection_method,
        "plate_bbox_xywh": [int(x), int(y), int(w), int(h)],
        "plate_width_mm": plate_width_mm,
        "focal_length_px": float(focal_length_px),
        "focal_length_method": focal_method,
        "plate_distance_mm": float(plate_distance_mm),
        "scale_factor": float(scale),
    }
    return metric_depth_map, calibration_info
