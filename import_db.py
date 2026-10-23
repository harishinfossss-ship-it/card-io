import pandas as pd
import json

df = pd.read_excel('Ben_10_59_Card_Master_CORRECTED.xlsx')
records = df.to_dict('records')

ben10_cards = []
for r in records:
    card = {
        'rank': str(r.get('Rank', '00')),
        'series': str(r.get('Series', '')),
        'name': str(r.get('Alien Name', 'Unknown')),
        'type': str(r.get('Species / Type', '')),
        'attack': r.get('Attack /1000', 0),
        'strength': r.get('Strength /1000', 0),
        'speed': r.get('Speed /1000', 0),
        'durability': r.get('Durability /1000', 0),
        'description': str(r.get('Main Description', '')),
        'flavor': str(r.get('Flavor Quote', '')),
        'image': f"https://via.placeholder.com/450x650/000000/10b500?text={str(r.get('Alien Name', 'X')).replace(' ', '+')}"
    }
    
    for k in r.keys():
        if isinstance(k, str):
            k_upper = k.upper()
            if 'ABILITY' in k_upper and 'NAME' in k_upper: card['ability_name'] = str(r[k])
            elif 'ABILITY' in k_upper and 'EFFECT' in k_upper: card['ability_effect'] = str(r[k])
            elif 'SPECIAL' in k_upper and 'NAME' in k_upper: card['special_name'] = str(r[k])
            elif 'SPECIAL' in k_upper and 'EFFECT' in k_upper: card['special_effect'] = str(r[k])
            elif 'ULTIMATE' in k_upper and 'NAME' in k_upper: card['ultimate_name'] = str(r[k])
            elif 'ULTIMATE' in k_upper and 'EFFECT' in k_upper: card['ultimate_effect'] = str(r[k])
            
    ben10_cards.append(card)

import importlib
import mockDatabase
importlib.reload(mockDatabase)

original_db = getattr(mockDatabase, 'db', {})
original_db['ben10'] = ben10_cards

python_str = f"import copy\n\ndb = {json.dumps(original_db, indent=4)}\n\n"
python_str += """
def get_deck(concept):
    if concept in db:
        return copy.deepcopy(db[concept])
    return copy.deepcopy(db['ben10'])

def get_stats_keys(concept):
    if concept == 'ben10': return ['attack', 'strength', 'speed', 'durability']
    if concept == 'cricket': return ['batting', 'bowling', 'fielding']
    return ['strength', 'agility', 'weapons']
"""

with open('mockDatabase.py', 'w', encoding='utf-8') as f:
    f.write(python_str)
print("Extended DB Generated.")
