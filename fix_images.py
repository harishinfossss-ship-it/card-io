import re

slug_map = {
    "Alien X": "alien_x", "Clockwork": "clockwork", "Ultimate Way Big": "ultimate_way_big",
    "Way Big": "way_big", "Gravattack": "gravattack", "Feedback": "feedback",
    "Ultimate Echo Echo": "ultimate_echo_echo", "Ultimate Humungousaur": "ultimate_humungousaur",
    "NRG": "nrg", "Ultimate Swampfire": "ultimate_swampfire", "Chromastone": "chromastone",
    "Ghostfreak": "ghostfreak", "Big Chill": "big_chill", "Jetray": "jetray",
    "Diamondhead": None, "Ultimate Big Chill": "ultimate_big_chill",
    "Ultimate Spider-Monkey": "ultimate_spider_monkey", "Eatle": "eatle",
    "Swampfire": "swampfire", "AmpFibian": "ampfibian", "Heatblast": "heatblast",
    "Four Arms": "four_arms", "Rath": "rath", "Ultimate Cannonbolt": "ultimate_cannonbolt",
    "Armodrillo": "armodrillo", "Upchuck": "upchuck", "Pesky Dust": "pesky_dust",
    "Lodestar": "lodestar", "Terraspin": "terraspin", "Shocksquatch": "shocksquatch",
    "Cannonbolt": "cannonbolt", "Echo Echo": "echo_echo", "Humungousaur": "humungousaur",
    "Frankenstrike": "frankenstrike", "Goop": "goop", "Upgrade": "upgrade",
    "XLR8": "xlr8", "Ultimate Wildmutt": "ultimate_wildmutt", "Bloxx": "bloxx",
    "Brainstorm": "brainstorm", "Jury Rigg": "jury_rigg", "Ball Weevil": "ball_weevil",
    "Wildvine": "wildvine", "Blitzwolfer": "blitzwolfer", "Water Hazard": "water_hazard",
    "Arctiguana": "arctiguana", "Crashhopper": "crashhopper", "Wildmutt": "wildmutt",
    "Snare-oh": "snare_oh", "Spider-Monkey": "spider_monkey", "Stinkfly": "stinkfly",
    "Fasttrack": "fasttrack", "ChamAlien": "chamalien", "Nanomech": "nanomech",
    "Ditto": "ditto", "Eye Guy": "eye_guy", "Grey Matter": "grey_matter",
    "Ripjaws": "ripjaws", "The Worst": "the_worst",
}

with open("mockDatabase.py", "r", encoding="utf-8") as f:
    content = f.read()

replaced = 0
for name, slug in slug_map.items():
    text_part = name.replace(" ", "+").replace("'", "")
    pattern = r'"image":\s*"https://via\.placeholder\.com/[^"]+text=' + re.escape(text_part) + r'"'
    if slug:
        replacement = '"image": "/images/aliens/' + slug + '.png"'
    else:
        replacement = '"image": "/images/aliens/placeholder.png"'
    new_content, n = re.subn(pattern, replacement, content)
    if n > 0:
        content = new_content
        replaced += n
        print(f"  Updated: {name} -> {slug}")
    else:
        print(f"  NOT FOUND: {name}")

with open("mockDatabase.py", "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nTotal replacements: {replaced}")
