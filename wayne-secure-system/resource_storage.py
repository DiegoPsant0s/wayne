import json
from pathlib import Path

RESOURCES_FILE = Path("resources.json")

def load_resources():
    if RESOURCES_FILE.exists():
        with open(RESOURCES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_resources(resources):
    with open(RESOURCES_FILE, "w", encoding="utf-8") as f:
        json.dump(resources, f, ensure_ascii=False, indent=2)

