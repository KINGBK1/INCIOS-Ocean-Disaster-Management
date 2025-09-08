from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
import requests
import json
from pymongo import MongoClient
from datetime import datetime
from contextlib import asynccontextmanager
import uvicorn

client = MongoClient("mongodb+srv://null_pointers_db:Bk14042005%40@cluster0.2vhx9q1.mongodb.net/")
db = client["INCIOS_DMS"]
alerts_collection = db["coastline_alerts"]

def fetch_and_store_data():
    try:
        # Fetch data from APIs
        hwassa_resp = requests.get("https://sarat.incois.gov.in/incoismobileappdata/rest/incois/hwassalatestdata")
        currents_resp = requests.get("https://samudra.incois.gov.in/incoismobileappdata/rest/incois/currentslatestdata")

        hwassa_data = hwassa_resp.json()
        currents_data = currents_resp.json()

        final_alerts = []

        # Parse HWASSA alerts
        if hwassa_data.get("LatestHWADate") != "None":
            final_alerts.extend(json.loads(hwassa_data["HWAJson"]))
        if hwassa_data.get("LatestSSADate") != "None":
            final_alerts.extend(json.loads(hwassa_data["SSAJson"]))

        # Parse Currents alerts
        if currents_data.get("LatestCurrentsDate") != "None":
            final_alerts.extend(json.loads(currents_data["CurrentsJson"]))

        # Add timestamp
        for alert in final_alerts:
            alert["fetched_at"] = datetime.utcnow()

        # Insert into MongoDB
        if final_alerts:
            alerts_collection.insert_many(final_alerts)
            print(f"✅ Inserted {len(final_alerts)} alerts at {datetime.utcnow()}")

    except Exception as e:
        print("❌ Error fetching alerts:", e)


scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting server, fetching initial data...")
    fetch_and_store_data()  # run once at startup
    scheduler.add_job(fetch_and_store_data, "interval", hours=6)
    scheduler.start()
    yield
    print("🛑 Shutting down scheduler...")
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)

@app.get("/alerts")
def get_alerts(limit: int = 50):
    """Fetch latest alerts from MongoDB"""
    return list(alerts_collection.find().sort("fetched_at", -1).limit(limit))


if __name__ == "__main__":
    uvicorn.run("scraper:app", host="0.0.0.0", port=8000, reload=True)
