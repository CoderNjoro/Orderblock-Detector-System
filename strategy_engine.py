from ict_indicators import detect_market_structure, detect_fvg, detect_order_blocks

def basic_ict_strategy(df):
    df = detect_market_structure(df)
    df = detect_fvg(df)
    df = detect_order_blocks(df)

    df['signal'] = None
    for i in range(2, len(df)):
        if df['order_block_bullish'].iloc[i-1] and df['FVG'].iloc[i]:
            df.loc[df.index[i], 'signal'] = "BUY"
        elif df['order_block_bearish'].iloc[i-1] and df['FVG'].iloc[i]:
            df.loc[df.index[i], 'signal'] = "SELL"
    return df