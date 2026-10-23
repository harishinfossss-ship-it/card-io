"""
CORRECTED image extraction script.
The CORRECTED xlsx has images embedded in sequential order:
  image1 -> row 2 -> Alien X
  image2 -> row 3 -> Clockwork
  image3 -> row 4 -> Ultimate Way Big
  ...etc.

So we simply read the card names from the sheet rows and extract image by position.
Row 16 (Diamondhead) has NO image.
Row 10 (NRG) has TWO images (image9 and image10) — we use image9.
"""
import zipfile
import os
import re
import xml.etree.ElementTree as ET
import openpyxl
import shutil

xlsx_path = r"d:\cardio\Ben_10_59_Card_Master_CORRECTED (1).xlsx"
output_dir = r"d:\cardio\public\images\aliens"

os.makedirs(output_dir, exist_ok=True)

# Clear old images
for f in os.listdir(output_dir):
    if f.endswith('.png') or f.endswith('.jpg') or f.endswith('.jpeg') or f.endswith('.webp'):
        os.remove(os.path.join(output_dir, f))
        print(f"Removed old: {f}")

def name_to_slug(name):
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    slug = slug.strip("_")
    return slug

XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
A   = 'http://schemas.openxmlformats.org/drawingml/2006/main'
R   = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

# Step 1: Build image -> row mapping from drawings
image_to_row = {}  # image stem -> 1-indexed row in sheet

with zipfile.ZipFile(xlsx_path, 'r') as z:
    all_files = z.namelist()
    drawings = [f for f in all_files if re.match(r'xl/drawings/drawing\d+\.xml$', f)]
    
    # Also build lookup of image stem -> zip path
    img_zip_lookup = {}
    for f in all_files:
        if f.startswith("xl/media/"):
            stem = os.path.splitext(os.path.basename(f))[0]
            img_zip_lookup[stem] = f
    
    for drawing_path in drawings:
        parts = drawing_path.split('/')
        rel_path = '/'.join(parts[:-1]) + '/_rels/' + parts[-1] + '.rels'
        if rel_path not in z.namelist():
            continue
        
        rels_root = ET.fromstring(z.read(rel_path))
        rid_to_image = {}
        for rel in rels_root:
            rid = rel.get('Id')
            target = rel.get('Target', '')
            if 'media' in target:
                img_name = os.path.basename(target)
                rid_to_image[rid] = os.path.splitext(img_name)[0]
        
        draw_root = ET.fromstring(z.read(drawing_path))
        for anchor in draw_root:
            from_elem = anchor.find(f'{{{XDR}}}from')
            if from_elem is None:
                continue
            row_elem = from_elem.find(f'{{{XDR}}}row')
            if row_elem is None:
                continue
            row = int(row_elem.text) + 1
            blip = anchor.find(f'.//{{{A}}}blip')
            if blip is None:
                continue
            rid = blip.get(f'{{{R}}}embed')
            img_stem = rid_to_image.get(rid)
            if img_stem:
                if img_stem not in image_to_row:
                    image_to_row[img_stem] = row

# Step 2: Create row -> image mapping (for duplicate rows, keep first image)
row_to_image = {}
for img_stem, row in image_to_row.items():
    if row not in row_to_image:
        row_to_image[row] = img_stem
    else:
        # Keep lower-numbered image
        existing = row_to_image[row]
        existing_num = int(re.search(r'\d+', existing).group())
        new_num = int(re.search(r'\d+', img_stem).group())
        if new_num < existing_num:
            row_to_image[row] = img_stem

print("Row -> Image stem mapping:")
for row, img in sorted(row_to_image.items()):
    print(f"  Row {row}: {img}")

# Step 3: Read alien names from main sheet
wb = openpyxl.load_workbook(xlsx_path, data_only=True)
ws = wb["59 Card Master"]

print("\nCard row -> Name mapping:")
row_to_name = {}
for r in range(2, ws.max_row + 1):
    name_val = ws.cell(r, 5).value  # Column 5 = "Alien Name"
    if isinstance(name_val, str) and name_val.strip():
        row_to_name[r] = name_val.strip()
        print(f"  Row {r}: {name_val.strip()}")

# Step 4: Extract images
print("\n\n=== EXTRACTING IMAGES ===")
extracted = 0
skipped = 0

with zipfile.ZipFile(xlsx_path, 'r') as z:
    for row, name in sorted(row_to_name.items()):
        slug = name_to_slug(name)
        
        if row not in row_to_image:
            print(f"  SKIP (no image in sheet): {name}")
            skipped += 1
            continue
        
        img_stem = row_to_image[row]
        if img_stem not in img_zip_lookup:
            print(f"  MISSING in zip: {name} -> {img_stem}")
            skipped += 1
            continue
        
        zip_path = img_zip_lookup[img_stem]
        ext = os.path.splitext(zip_path)[1]  # .png, .jpg, etc.
        out_path = os.path.join(output_dir, f"{slug}{ext}")
        
        data = z.read(zip_path)
        with open(out_path, 'wb') as f:
            f.write(data)
        print(f"  OK: Row {row} | {name} -> {slug}{ext} | {img_stem} | {len(data)//1024} KB")
        extracted += 1

print(f"\nDone! Extracted: {extracted}, Skipped: {skipped}")
print(f"Images saved to: {output_dir}")
print("\n=== FINAL IMAGE MAP (for reference) ===")
for row, name in sorted(row_to_name.items()):
    slug = name_to_slug(name)
    img = row_to_image.get(row, 'NO IMAGE')
    print(f'  "{name}": "/images/aliens/{slug}.png"  [{img}]')
