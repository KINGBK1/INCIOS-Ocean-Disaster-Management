from fastapi import FastAPI
import requests
import json
from pymongo import MongoClient
from datetime import datetime
import uvicorn
import urllib3
import time

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

client = MongoClient("mongodb+srv://null_pointers_db:Bk14042005%40@cluster0.2vhx9q1.mongodb.net/")
db = client["INCIOS_DMS"]

alerts_collection = db["coastline_alerts"]
past90days_collection = db["past90days_alerts"]
geo_cache = db["geo_cache"]

# -------------------
# Helper: Geocode + cache
# -------------------
def get_coordinates(place_name: str):
    """Return (lat, lng) for a place, using cache or Nominatim API"""
    if not place_name:
        return None, None

    cached = geo_cache.find_one({"place": place_name})
    if cached:
        return cached["lat"], cached["lng"]

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": place_name, "format": "json", "limit": 1}
        resp = requests.get(url, params=params, headers={"User-Agent": "INCIOS-App"}, timeout=10)

        if resp.status_code == 200 and resp.json():
            lat = float(resp.json()[0]["lat"])
            lng = float(resp.json()[0]["lon"])
            geo_cache.insert_one({"place": place_name, "lat": lat, "lng": lng})
            time.sleep(1)  # Nominatim rate limit: 1 request/sec
            return lat, lng
    except Exception as e:
        print(f"Geocoding failed for {place_name}: {e}")

    return None, None


# -------------------
# Fetch Functions
# -------------------
def fetch_coastline_alerts():
    final_alerts = []
    try:
        hwassa_resp = requests.get("https://sarat.incois.gov.in/incoismobileappdata/rest/incois/hwassalatestdata", timeout=10)
        currents_resp = requests.get("https://samudra.incois.gov.in/incoismobileappdata/rest/incois/currentslatestdata", timeout=10)

        hwassa_data = hwassa_resp.json()
        currents_data = currents_resp.json()

        if hwassa_data.get("LatestHWADate") != "None":
            final_alerts.extend(json.loads(hwassa_data["HWAJson"]))
        if hwassa_data.get("LatestSSADate") != "None":
            final_alerts.extend(json.loads(hwassa_data["SSAJson"]))
        if currents_data.get("LatestCurrentsDate") != "None":
            final_alerts.extend(json.loads(currents_data["CurrentsJson"]))

        for alert in final_alerts:
            alert["fetched_at"] = datetime.utcnow()

            # Geocode: prefer District → fallback to STATE
            place = alert.get("District") or alert.get("STATE")
            lat, lng = get_coordinates(place)
            if lat and lng:
                alert["lat"] = lat
                alert["lng"] = lng

        if final_alerts:
            alerts_collection.insert_many(final_alerts)
            print(f"Inserted {len(final_alerts)} coastline alerts at {datetime.utcnow()}")

    except Exception as e:
        print("Error fetching coastline alerts:", e)

    return final_alerts


def fetch_past90days_alerts():
    resolved_alerts = []
    try:
        resp = requests.get("https://tsunami.incois.gov.in/itews/DSSProducts/OPR/past90days.json", timeout=15, verify=False)
        data = resp.json()

        if isinstance(data, dict) and "datasets" in data:
            alerts = data["datasets"]
        elif isinstance(data, list) and len(data) > 0:
            alerts = data
        else:
            return []

        for alert in alerts:
            if "detail" in alert and isinstance(alert["detail"], str):
                try:
                    nested_resp = requests.get(alert["detail"], timeout=10, verify=False)
                    nested_data = nested_resp.json()
                    alert["detail_data"] = nested_data
                    del alert["detail"]
                except Exception as nested_err:
                    alert["detail_error"] = str(nested_err)

            alert["fetched_at"] = datetime.utcnow()

            # Try to geocode based on available info
            place = alert.get("area") or alert.get("region") or alert.get("locationName")
            lat, lng = get_coordinates(place)
            if lat and lng:
                alert["lat"] = lat
                alert["lng"] = lng

            resolved_alerts.append(alert)

        if resolved_alerts:
            past90days_collection.insert_many(resolved_alerts)
            print(f"Inserted {len(resolved_alerts)} past90days alerts at {datetime.utcnow()}")

    except Exception as e:
        print("Error fetching past90days alerts:", e)

    return resolved_alerts


# -------------------
# FastAPI Endpoints
# -------------------
app = FastAPI()

@app.get("/alerts")
def get_alerts(limit: int = 50):
    fetch_coastline_alerts()
    alerts = list(alerts_collection.find().sort("fetched_at", -1).limit(limit))
    for alert in alerts:
        alert["_id"] = str(alert["_id"])
    return alerts

@app.get("/past90daysalerts")
def get_past90days_alerts(limit: int = 50):
    fetch_past90days_alerts()
    alerts = list(past90days_collection.find().sort("fetched_at", -1).limit(limit))
    for alert in alerts:
        alert["_id"] = str(alert["_id"])
    return alerts


if __name__ == "__main__":
    uvicorn.run("scraper:app", host="0.0.0.0", port=8000, reload=True)
