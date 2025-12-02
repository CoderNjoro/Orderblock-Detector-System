# historical_data.py
import requests
import pandas as pd
from config import TWELVE_DATA_API_KEY

def fetch_historical_1h(symbol: str):
    url = "https://api.twelvedata.com/time_series"
    params = {
        "symbol": symbol,
        "interval": "1h",
        "outputsize": 720,  # ~30 days of 1H data
        "apikey": TWELVE_DATA_API_KEY
    }

    response = requests.get(url, params=params)

    try:
        data = response.json()
    except Exception:
        print("❌ Could not decode JSON. Here's the raw response:")
        print(response.text)  # helpful for debugging
        raise Exception("Invalid response from Twelve Data")

    if "status" in data and data["status"] == "error":
        raise Exception(f"Twelve Data API error: {data.get('message', 'Unknown')}")

    if "values" not in data:
        raise Exception("No historical data returned. Please check symbol format.")

    df = pd.DataFrame(data["values"])
    df['datetime'] = pd.to_datetime(df['datetime'])
    df.rename(columns={
        'datetime': 'timestamp',
        'open': 'open',
        'high': 'high',
        'low': 'low',
        'close': 'close',
    }, inplace=True)

    df = df[['timestamp', 'open', 'high', 'low', 'close']]
    df = df.sort_values('timestamp')

    # Convert to float
    for col in ['open', 'high', 'low', 'close']:
        df[col] = df[col].astype(float)

    return df
