# Reusable SAM2 box-prompted segmentation + pixel-to-mm area calibration for ClaimPilot.
# Used by this notebook (T2.2) and by the end-to-end pipeline (T2.4).
import numpy as np
import torch


def load_sam2(model_id="facebook/sam2.1-hiera-base-plus", device="cuda"):
    from transformers import Sam2Model, Sam2Processor
    processor = Sam2Processor.from_pretrained(model_id)
    model = Sam2Model.from_pretrained(model_id).to(device)
    model.eval()
    return processor, model


def segment_boxes(processor, model, image, boxes_xyxy, device="cuda"):
    # image: PIL.Image (RGB). boxes_xyxy: list of [x1, y1, x2, y2] in pixel coords.
    # Returns a list of (mask_bool_hw, iou_score) tuples, one per box, in the same order.
    if len(boxes_xyxy) == 0:
        return []

    input_boxes = [[list(map(float, b)) for b in boxes_xyxy]]  # (image_dim, object_dim, 4)
    inputs = processor(images=image, input_boxes=input_boxes, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs, multimask_output=False)

    masks = processor.post_process_masks(outputs.pred_masks.cpu(), inputs["original_sizes"])[0]
    # masks shape: (num_objects, 1, H, W) since multimask_output=False
    scores = outputs.iou_scores.squeeze().detach().cpu().numpy()
    scores = np.atleast_1d(scores)

    results = []
    for i in range(masks.shape[0]):
        mask_bool = masks[i, 0].numpy().astype(bool)
        score = float(scores[i]) if i < len(scores) else None
        results.append((mask_bool, score))
    return results


def compute_pixel_to_mm(image_path, image_width_px, plate_bbox=None,
                         plate_width_mm=520.0, assumed_hfov_deg=60.0):
    # Flat-plane calibration: mm-per-pixel derived directly from the plate's pixel width,
    # assuming the damage is roughly at the same camera distance as the plate. See the
    # module docstring in the notebook for why this is a documented simplification.
    #
    # Returns (mm_per_pixel_or_None, calibration_info_dict). plate_bbox=None triggers
    # the Haar-cascade auto-detector from depth_estimation.detect_license_plate().
    from depth_estimation import detect_license_plate

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

    mm_per_pixel = plate_width_mm / w
    calibration_info = {
        "status": "calibrated",
        "detection_method": detection_method,
        "plate_bbox_xywh": [int(x), int(y), int(w), int(h)],
        "plate_width_mm": plate_width_mm,
        "mm_per_pixel": mm_per_pixel,
    }
    return mm_per_pixel, calibration_info


def compute_mask_area(mask_bool, mm_per_pixel=None):
    # Returns (pixel_count, area_cm2_or_None).
    pixel_count = int(mask_bool.sum())
    if mm_per_pixel is None:
        return pixel_count, None
    area_mm2 = pixel_count * (mm_per_pixel ** 2)
    area_cm2 = area_mm2 / 100.0
    return pixel_count, area_cm2
