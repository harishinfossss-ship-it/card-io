import pandas as pd
import json

try:
    df = pd.read_excel("Ben_10_59_Card_Master (2).xlsx")
    print("COLUMNS:")
    print(list(df.columns))
    print("\nFIRST 3 ROWS:")
    print(json.dumps(df.head(3).to_dict('records'), indent=2))
except Exception as e:
    print("ERROR:", e)
