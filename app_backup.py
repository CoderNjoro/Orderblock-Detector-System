from flask import Flask, render_template, jsonify, request
from data_fetcher import fetch_historical_1h
from ai_chart_analyzer_ascii import chart_analyzer
import pandas as pd

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/lightweight_chart')
def lightweight_chart():
    return render_template('lightweight_chart.html')

@app.route('/api/candles')
def get_candles():
    symbol = request.args.get('symbol', 'EUR/USD')
    try:
        df = fetch_historical_1h(symbol)

        # Ensure datetime and float values
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.dropna()

        data = [
            {
                'time': int(row['timestamp'].timestamp()),
                'open': float(row['open']),
                'high': float(row['high']),
                'low': float(row['low']),
                'close': float(row['close'])
            }
            for _, row in df.iterrows()
        ]
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai-analysis')
def get_ai_analysis():
    """Get AI-powered chart analysis"""
    symbol = request.args.get('symbol', 'EUR/USD')
    try:
        # Fetch historical data
        df = fetch_historical_1h(symbol)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.dropna()
        
        if df.empty:
            return jsonify({'error': 'No data available'}), 400
        
        # Perform AI analysis
        analysis = chart_analyzer.analyze_price_pattern(df)
        insights = chart_analyzer.generate_trading_insights(analysis)
        
        return jsonify({
            'symbol': symbol,
            'analysis': analysis,
            'insights': insights,
            'timestamp': pd.Timestamp.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/gemini-analysis')
def get_gemini_analysis():
    """Get Gemini-powered chart analysis"""
    symbol = request.args.get('symbol', 'EUR/USD')
    try:
        # Fetch historical data
        df = fetch_historical_1h(symbol)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.dropna()
        
        if df.empty:
            return jsonify({'error': 'No data available'}), 400
        
        # First perform standard AI analysis
        analysis = chart_analyzer.analyze_price_pattern(df)
        
        # Then get Gemini analysis
        gemini_results = chart_analyzer.analyze_with_gemini(df, analysis)
        
        return jsonify({
            'symbol': symbol,
            'standard_analysis': analysis,
            'gemini_analysis': gemini_results,
            'timestamp': pd.Timestamp.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/market-sentiment')
def get_market_sentiment():
    """Analyze market sentiment from provided text"""
    text = request.args.get('text', '')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        sentiment = chart_analyzer.analyze_market_sentiment(text)
        return jsonify(sentiment)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quick-insights')
def get_quick_insights():
    """Get quick AI insights for a symbol"""
    symbol = request.args.get('symbol', 'EUR/USD')
    try:
        df = fetch_historical_1h(symbol)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.dropna()
        
        if len(df) < 10:
            return jsonify({'error': 'Insufficient data'}), 400
        
        # Quick analysis
        latest_price = float(df['close'].iloc[-1])
        price_change = float(df['close'].iloc[-1] - df['close'].iloc[-2])
        price_change_pct = (price_change / df['close'].iloc[-2]) * 100
        
        # Simple trend
        trend = "Bullish" if price_change > 0 else "Bearish" if price_change < 0 else "Neutral"
        
        # Quick RSI
        rsi = chart_analyzer._calculate_rsi(df['close']).iloc[-1]
        
        return jsonify({
            'symbol': symbol,
            'latest_price': latest_price,
            'price_change': price_change,
            'price_change_pct': round(price_change_pct, 2),
            'trend': trend,
            'rsi': round(float(rsi), 2) if not pd.isna(rsi) else None,
            'recommendation': 'Buy' if rsi < 30 else 'Sell' if rsi > 70 else 'Hold'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
