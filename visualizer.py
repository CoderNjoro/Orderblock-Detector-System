# visualizer.py
import plotly.graph_objects as go
import plotly.io as pio
import pandas as pd

# Set default renderer to browser for interactive zoom experience
pio.renderers.default = 'browser'

def plot_signals(df):
    df = df.copy()

    # Ensure timestamp is datetime
    if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
        df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Sort by time
    df.sort_values('timestamp', inplace=True)

    # Add simple moving average
    df['sma_20'] = df['close'].rolling(window=20).mean()

    # Create figure
    fig = go.Figure()

    # Candlestick chart
    fig.add_trace(go.Candlestick(
        x=df['timestamp'],
        open=df['open'],
        high=df['high'],
        low=df['low'],
        close=df['close'],
        increasing_line_color='green',
        decreasing_line_color='red',
        name='Candles'
    ))

    # SMA line
    fig.add_trace(go.Scatter(
        x=df['timestamp'],
        y=df['sma_20'],
        mode='lines',
        line=dict(color='orange', width=1.5),
        name='SMA 20'
    ))

    # Buy/Sell signals
    buy_signals = df[df['signal'] == 'BUY']
    sell_signals = df[df['signal'] == 'SELL']
    fig.add_trace(go.Scatter(
        x=buy_signals['timestamp'],
        y=buy_signals['low'] * 0.999,
        mode='markers',
        marker=dict(symbol='triangle-up', size=10, color='green'),
        name='Buy Signals'
    ))
    fig.add_trace(go.Scatter(
        x=sell_signals['timestamp'],
        y=sell_signals['high'] * 1.001,
        mode='markers',
        marker=dict(symbol='triangle-down', size=10, color='red'),
        name='Sell Signals'
    ))

    # Order blocks
    bullish_obs = df[df['order_block_bullish'] & df['ob_high'].notna() & df['ob_low'].notna()]
    bearish_obs = df[df['order_block_bearish'] & df['ob_high'].notna() & df['ob_low'].notna()]
    for _, row in bullish_obs.iterrows():
        fig.add_shape(
            type='rect',
            x0=row['timestamp'],
            x1=df['timestamp'].max(),
            y0=row['ob_low'],
            y1=row['ob_high'],
            fillcolor='rgba(0, 255, 0, 0.2)',
            line=dict(width=0),
            layer='below',
            name='Bullish OB'
        )
    for _, row in bearish_obs.iterrows():
        fig.add_shape(
            type='rect',
            x0=row['timestamp'],
            x1=df['timestamp'].max(),
            y0=row['ob_low'],
            y1=row['ob_high'],
            fillcolor='rgba(255, 0, 0, 0.2)',
            line=dict(width=0),
            layer='below',
            name='Bearish OB'
        )

    # Layout with interactivity
    fig.update_layout(
        title='ICT Trading Chart (Interactive)',
        xaxis_title='Time',
        yaxis_title='Price',
        xaxis_rangeslider_visible=False,
        template='plotly_dark',
        height=700,
        margin=dict(l=40, r=40, t=50, b=40),
        hovermode='x unified',
        dragmode='pan',
        updatemenus=[{
            "buttons": [
                {
                    "label": "1W",
                    "method": "relayout",
                    "args": [{"xaxis.range": [df['timestamp'].max() - pd.Timedelta(days=7), df['timestamp'].max()]}],
                },
                {
                    "label": "1M",
                    "method": "relayout",
                    "args": [{"xaxis.range": [df['timestamp'].max() - pd.Timedelta(days=30), df['timestamp'].max()]}],
                },
                {
                    "label": "All",
                    "method": "relayout",
                    "args": [{"xaxis.autorange": True}],
                },
            ],
            "direction": "right",
            "type": "buttons",
            "showactive": True,
            "x": 0.1,
            "xanchor": "left",
            "y": 1.15,
            "yanchor": "top",
        }]
    )

    fig.show(config={
        'scrollZoom': True,
        'displaylogo': False,
        'responsive': True,
        'modeBarButtonsToRemove': ['select2d', 'lasso2d'],
        'displayModeBar': True
    })