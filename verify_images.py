"""
Verify that all images referenced in mockDatabase.py exist on disk.
"""
import sys
sys.path.insert(0, r"d:\cardio")
from mockDatabase import db
import os

aliens_dir = r"d:\cardio\public\images\aliens"
existing_files = set(os.listdir(aliens_dir))

print("=== Image Verification ===")
missing = []
ok = []
for card in db["ben10"]:
    img_path = card.get("image", "")
    if not img_path:
        missing.append((card["name"], "NO IMAGE FIELD"))
        continue
    filename = img_path.split("/")[-1]
    if filename in existing_files:
        ok.append((card["name"], filename))
    else:
        # Try different extension
        stem = os.path.splitext(filename)[0]
        found = None
        for ext in ['.png', '.jpg', '.jpeg', '.webp']:
            if stem + ext in existing_files:
                found = stem + ext
                break
        if found:
            missing.append((card["name"], f"WRONG EXT in db: {filename} -> actual: {found}"))
        else:
            missing.append((card["name"], f"MISSING: {filename}"))

print(f"\nOK: {len(ok)}")
for name, fn in ok:
    print(f"  {name}: {fn}")

print(f"\nISSUES: {len(missing)}")
for name, issue in missing:
    print(f"  {name}: {issue}")
