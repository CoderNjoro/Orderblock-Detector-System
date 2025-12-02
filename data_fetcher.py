import requests
import pandas as pd
from config import TWELVE_DATA_API_KEY

def fetch_historical_1h(symbol: str):
    base, quote = symbol.split("/")
    full_symbol = f"{base}/{quote}"

    print(f"[API] Fetching 1H historical data for {full_symbol}...")

    url = f"https://api.twelvedata.com/time_series?symbol={full_symbol}&interval=1h&outputsize=5000&apikey={TWELVE_DATA_API_KEY}"

    response = requests.get(url)
    data = response.json()

    if "status" in data and data["status"] == "error":
        raise Exception(f"Twelve Data API error: {data.get('message')}")

    df = pd.DataFrame(data["values"])
    df.columns = [c.lower() for c in df.columns]
    df["timestamp"] = pd.to_datetime(df["datetime"])
    df = df.sort_values("timestamp")

    # Convert numeric columns
    for col in ["open", "high", "low", "close"]:
        df[col] = pd.to_numeric(df[col])

    return df
