# ict_indicators.py
import pandas as pd

def detect_market_structure(df: pd.DataFrame):
    """Label swing highs/lows to track BOS/CHOCH."""
    df['swing_high'] = (df['high'].shift(1) < df['high']) & (df['high'].shift(-1) < df['high'])
    df['swing_low'] = (df['low'].shift(1) > df['low']) & (df['low'].shift(-1) > df['low'])
    return df

def detect_fvg(df: pd.DataFrame):
    """Detect fair value gaps in price action."""
    df['FVG'] = (
        (df['low'].shift(-1) > df['high'])  # Bullish FVG
        | (df['high'].shift(-1) < df['low'])  # Bearish FVG
    )
    return df

def detect_order_blocks(df: pd.DataFrame):
    """Detect ICT order blocks based on BOS/CHOCH."""
    df = detect_market_structure(df)  # Ensure swing highs/lows are calculated
    df['order_block_bullish'] = False
    df['order_block_bearish'] = False
    df['ob_high'] = None
    df['ob_low'] = None

    for i in range(2, len(df) - 1):
        # Bullish OB: Last bearish candle before impulsive move up (BOS/CHOCH)
        if (
            df['close'].iloc[i] < df['open'].iloc[i]  # Bearish candle
            and df['close'].iloc[i + 1] > df['high'].iloc[i]  # Next candle breaks high
            and df['swing_high'].iloc[i - 1:i + 2].any()  # Recent swing high (CHOCH)
        ):
            df.loc[df.index[i], 'order_block_bullish'] = True
            df.loc[df.index[i], 'ob_high'] = df['high'].iloc[i]
            df.loc[df.index[i], 'ob_low'] = df['low'].iloc[i]

        # Bearish OB: Last bullish candle before impulsive move down (BOS/CHOCH)
        if (
            df['close'].iloc[i] > df['open'].iloc[i]  # Bullish candle
            and df['close'].iloc[i + 1] < df['low'].iloc[i]  # Next candle breaks low
            and df['swing_low'].iloc[i - 1:i + 2].any()  # Recent swing low (CHOCH)
        ):
            df.loc[df.index[i], 'order_block_bearish'] = True
            df.loc[df.index[i], 'ob_high'] = df['high'].iloc[i]
            df.loc[df.index[i], 'ob_low'] = df['low'].iloc[i]

    return df
