# main.py

from historical_data import fetch_historical_1h
from strategy_engine import basic_ict_strategy
from visualizer import plot_signals

def run():
    print("📈 Welcome to ICT Trading System")
    user_input = input("Enter currency pair (e.g., EUR/USD): ").upper().strip()

    if not user_input:
        print("⚠️ No input provided. Defaulting to EUR/USD.")
        user_input = "EUR/USD"

    if "/" not in user_input or len(user_input.split("/")) != 2:
        print("❌ Invalid format. Please use format like EUR/USD")
        return

    base, quote = user_input.split("/")
    symbol = f"{base}/{quote}"

    try:
        print(f"📡 Fetching 1H historical data for {symbol}...\n")
        df = fetch_historical_1h(symbol)

        if df.empty or len(df) < 10:
            print("⚠️ Not enough data to generate a meaningful chart.")
            return

        print(f"✅ Data fetched: {len(df)} rows. Analyzing...\n")

        df = basic_ict_strategy(df)

        print("📊 Plotting chart...\n")
        plot_signals(df)

        input("✅ Done. Press Enter to exit...")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
