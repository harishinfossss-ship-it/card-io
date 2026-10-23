"""
Full audit: extract image->row mapping from xlsx drawings,
then read card names row by row from the main sheet.
Output a JSON with the corrected mapping.
"""
import zipfile
import os
import re
import xml.etree.ElementTree as ET
import openpyxl
import json

xlsx_path = r"d:\cardio\Ben_10_59_Card_Master_CORRECTED (1).xlsx"

XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
A   = 'http://schemas.openxmlformats.org/drawingml/2006/main'
R   = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

# ---- Parse drawings to get image -> row mapping ----
image_to_row = {}  # image stem -> 1-indexed row
image_to_col = {}  # image stem -> 1-indexed col

with zipfile.ZipFile(xlsx_path, 'r') as z:
    all_files = z.namelist()
    drawings = [f for f in all_files if re.match(r'xl/drawings/drawing\d+\.xml$', f)]
    
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
            col_elem = from_elem.find(f'{{{XDR}}}col')
            if row_elem is None:
                continue
            row = int(row_elem.text) + 1  # 1-indexed
            col = int(col_elem.text) + 1 if col_elem is not None else None
            
            blip = anchor.find(f'.//{{{A}}}blip')
            if blip is None:
                continue
            rid = blip.get(f'{{{R}}}embed')
            img_stem = rid_to_image.get(rid)
            if img_stem:
                image_to_row[img_stem] = row
                image_to_col[img_stem] = col

# ---- Read card names from main sheet ----
wb = openpyxl.load_workbook(xlsx_path, data_only=True)

# Find sheet with the most rows
main_ws = None
max_rows = 0
for sname in wb.sheetnames:
    ws = wb[sname]
    if ws.max_row > max_rows:
        max_rows = ws.max_row
        main_ws = ws
        main_sheet_name = sname

# Read ALL cell values in all sheets
all_sheet_data = {}
for sname in wb.sheetnames:
    ws = wb[sname]
    sheet_rows = {}
    for r in range(1, ws.max_row + 1):
        row_vals = {}
        for c in range(1, ws.max_column + 1):
            val = ws.cell(r, c).value
            if val is not None:
                row_vals[c] = val
        if row_vals:
            sheet_rows[r] = row_vals
    all_sheet_data[sname] = sheet_rows

result = {
    "image_to_row": image_to_row,
    "image_to_col": image_to_col,
    "sheet_names": wb.sheetnames,
    "sheet_data": {k: {str(rk): {str(ck): str(cv) for ck, cv in rv.items()} for rk, rv in v.items()} for k, v in all_sheet_data.items()}
}

out_path = r"d:\cardio\audit_result.json"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print(f"Written to {out_path}")
print(f"Images found: {len(image_to_row)}")
print(f"Sheets: {wb.sheetnames}")
