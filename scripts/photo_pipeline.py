# End-to-end ClaimPilot photo-mode pipeline: YOLOv11m + Depth Anything V2 + SAM2 + DSINE.
# Combines T1.3/T1.4, T2.1, T2.2, and T2.3 into one structured JSON-producing function.
import os
import time
import datetime
import numpy as np
from PIL import Image


def analyze_photo(image_path, yolo_model, depth_processor, depth_model,
                   sam2_processor, sam2_model, dsine_model,
                   plate_bbox=None, plate_width_mm=520.0,
                   conf=0.25, iou=0.45, imgsz=640, ring_width_px=15):
    # Run the full photo-mode pipeline on a single image and return a schema-conformant
    # dict (see the notebook markdown for the full JSON schema). Every stage is wrapped
    # so a single stage's failure does not lose the other stages' results for this image.
    import cv2
    import inference
    import depth_estimation
    import segmentation
    import surface_normals

    timing = {}
    t_start = time.time()

    pil_image = Image.open(image_path).convert("RGB")
    img_w, img_h = pil_image.size

    result = {
        "image_path": image_path,
        "image_size": [img_w, img_h],
        "processed_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "models": {
            "detection": "YOLOv11m (ClaimPilot fine-tuned)",
            "depth": "Depth Anything V2",
            "segmentation": "SAM2",
            "normals": "DSINE",
        },
        "calibration": {},
        "damage_instances": [],
        "summary": {},
        "timing_sec": {},
    }

    t0 = time.time()
    detection_error = None
    detections = []
    try:
        detections = inference.run_inference(yolo_model, image_path, conf=conf, iou=iou, imgsz=imgsz)
    except Exception as e:
        detection_error = str(e)
    timing["detection"] = time.time() - t0

    if detection_error or not detections:
        result["summary"] = {
            "num_instances": 0,
            "classes_detected": [],
            "total_damage_area_cm2": None,
        }
        if detection_error:
            result["summary"]["detection_error"] = detection_error
        result["timing_sec"] = {**timing, "total": time.time() - t_start}
        return result

    boxes_xyxy = [d["bbox_xyxy"] for d in detections]

    t0 = time.time()
    depth_error = None
    relative_depth = None
    metric_depth_info = {"status": "skipped_stage_error"}
    try:
        relative_depth = depth_estimation.estimate_relative_depth(depth_processor, depth_model, image_path, device="cuda")
        _, metric_depth_info = depth_estimation.calibrate_metric_depth(
            relative_depth, image_path, plate_bbox=plate_bbox, plate_width_mm=plate_width_mm
        )
    except Exception as e:
        depth_error = str(e)
        metric_depth_info = {"status": "stage_error", "error": depth_error}
    timing["depth"] = time.time() - t0
    result["calibration"]["depth_metric"] = metric_depth_info

    area_calib_error = None
    try:
        mm_per_pixel, area_calib_info = segmentation.compute_pixel_to_mm(
            image_path, img_w, plate_bbox=plate_bbox, plate_width_mm=plate_width_mm
        )
    except Exception as e:
        area_calib_error = str(e)
        mm_per_pixel, area_calib_info = None, {"status": "stage_error", "error": area_calib_error}
    result["calibration"]["area_pixel_to_mm"] = area_calib_info

    t0 = time.time()
    segmentation_error = None
    seg_results = []
    try:
        seg_results = segmentation.segment_boxes(sam2_processor, sam2_model, pil_image, boxes_xyxy, device="cuda")
    except Exception as e:
        segmentation_error = str(e)
    timing["segmentation"] = time.time() - t0

    t0 = time.time()
    normals_error = None
    normal_map = None
    try:
        normal_map = surface_normals.estimate_normals(dsine_model, image_path)
    except Exception as e:
        normals_error = str(e)
    timing["normals"] = time.time() - t0

    damage_instances = []
    classes_detected = set()
    total_area_cm2 = 0.0
    any_area_cm2 = False

    for i, det in enumerate(detections):
        stage_errors = {}
        instance = {
            "instance_id": i,
            "class_name": det["class_name"],
            "confidence": det["confidence"],
            "bbox_xyxy": det["bbox_xyxy"],
            "mask_iou_score": None,
            "area_px": None,
            "area_cm2": None,
            "crease_angle_deg": None,
            "crease_status": "not_computed",
        }
        classes_detected.add(det["class_name"])

        if segmentation_error:
            stage_errors["segmentation"] = segmentation_error
        elif i < len(seg_results):
            mask_bool, iou_score = seg_results[i]
            instance["mask_iou_score"] = iou_score
            pixel_count, area_cm2 = segmentation.compute_mask_area(mask_bool, mm_per_pixel)
            instance["area_px"] = pixel_count
            instance["area_cm2"] = area_cm2
            if area_cm2 is not None:
                total_area_cm2 += area_cm2
                any_area_cm2 = True

            if normals_error:
                stage_errors["normals"] = normals_error
            elif normal_map is not None:
                try:
                    crease_info = surface_normals.compute_crease_angle(normal_map, mask_bool, ring_width_px=ring_width_px)
                    instance["crease_angle_deg"] = crease_info.get("crease_angle_deg")
                    instance["crease_status"] = crease_info.get("status")
                except Exception as e:
                    stage_errors["crease_angle"] = str(e)
                    instance["crease_status"] = "stage_error"

        instance["stage_errors"] = stage_errors
        damage_instances.append(instance)

    result["damage_instances"] = damage_instances
    result["summary"] = {
        "num_instances": len(damage_instances),
        "classes_detected": sorted(classes_detected),
        "total_damage_area_cm2": total_area_cm2 if any_area_cm2 else None,
    }
    if detection_error:
        result["summary"]["detection_error"] = detection_error

    timing["total"] = time.time() - t_start
    result["timing_sec"] = timing
    return result
