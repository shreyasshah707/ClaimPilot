import os
import json
from pathlib import Path

def remove_cache_files(base_dir):
    """Deletes stale YOLO cache files if they exist."""
    for root, _, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.cache'):
                cache_path = os.path.join(root, file)
                print(f"🧹 Removing stale cache: {cache_path}")
                os.remove(cache_path)

def convert_coco_json(json_path, output_labels_dir):
    os.makedirs(output_labels_dir, exist_ok=True)
    
    if not os.path.exists(json_path):
        print(f"❌ Error: {json_path} not found.")
        return []

    with open(json_path, 'r') as f:
        data = json.load(f)

    # Map category IDs to 0-indexed IDs
    categories = {cat['id']: i for i, cat in enumerate(data['categories'])}
    cat_names = [cat['name'] for cat in data['categories']]
    
    # Map image IDs
    images = {
        img['id']: {
            'width': img['width'],
            'height': img['height'],
            'file_name': os.path.splitext(img['file_name'])[0]
        }
        for img in data['images']
    }

    # Group annotations by image
    img_annotations = {}
    for ann in data['annotations']:
        img_id = ann['image_id']
        if img_id not in img_annotations:
            img_annotations[img_id] = []
        img_annotations[img_id].append(ann)

    # Write .txt labels directly alongside images
    for img_id, img_info in images.items():
        label_file = os.path.join(output_labels_dir, f"{img_info['file_name']}.txt")
        lines = []
        
        if img_id in img_annotations:
            w_img = img_info['width']
            h_img = img_info['height']
            
            for ann in img_annotations[img_id]:
                cat_idx = categories[ann['category_id']]
                x_min, y_min, w_box, h_box = ann['bbox']
                
                x_center = max(0.0, min(1.0, (x_min + w_box / 2.0) / w_img))
                y_center = max(0.0, min(1.0, (y_min + h_box / 2.0) / h_img))
                w_norm = max(0.0, min(1.0, w_box / w_img))
                h_norm = max(0.0, min(1.0, h_box / h_img))
                
                lines.append(f"{cat_idx} {x_center:.6f} {y_center:.6f} {w_norm:.6f} {h_norm:.6f}\n")
        
        with open(label_file, 'w') as lf:
            lf.writelines(lines)
            
    return cat_names

def main():
    base_dir = "./data/CarDD_release/CarDD_release/CarDD_COCO"
    
    # Clear stale cache files first
    remove_cache_files(base_dir)

    train_json = os.path.join(base_dir, "annotations/instances_train2017.json")
    val_json = os.path.join(base_dir, "annotations/instances_val2017.json")
    
    # Save labels directly into train2017 and val2017 folders alongside images
    train_dir = os.path.join(base_dir, "train2017")
    val_dir = os.path.join(base_dir, "val2017")
    
    print(f"🔄 Converting CarDD COCO annotations from: {base_dir}")
    cat_names = convert_coco_json(train_json, train_dir)
    _ = convert_coco_json(val_json, val_dir)

    if not cat_names:
        print("⚠️ Could not load categories. Check your annotations folder.")
        return

    # Generate cardd.yaml config
    yaml_content = f"""path: {os.path.abspath(base_dir)}
train: train2017
val: val2017

names:
"""
    for idx, name in enumerate(cat_names):
        yaml_content += f"  {idx}: {name}\n"

    yaml_path = os.path.abspath("./cardd.yaml")
    with open(yaml_path, 'w') as f:
        f.write(yaml_content)

    print(f"✅ Conversion complete! Labels written directly to image directories.")
    print(f"📄 Dataset config generated at: {yaml_path}")

if __name__ == "__main__":
    main()