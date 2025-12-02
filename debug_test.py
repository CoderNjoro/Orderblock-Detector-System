#!/usr/bin/env python3
"""Debug script to test AI analysis functionality"""

import sys
import traceback

try:
    print("Testing imports...")
    from data_fetcher import fetch_historical_1h
    from ai_chart_analyzer_ascii import chart_analyzer
    import pandas as pd
    print("[OK] All imports successful")
    
    print("\nTesting data fetch...")
    df = fetch_historical_1h("XAU/USD")
    print(f"[OK] Data fetched successfully: {len(df)} rows")
    print(f"[OK] Columns: {list(df.columns)}")
    
    print("\nTesting AI analysis...")
    analysis = chart_analyzer.analyze_price_pattern(df)
    print(f"[OK] Analysis completed: {type(analysis)}")
    print(f"[OK] Analysis keys: {list(analysis.keys()) if isinstance(analysis, dict) else 'Not a dict'}")
    
    print("\nTesting insights generation...")
    insights = chart_analyzer.generate_trading_insights(analysis)
    print(f"[OK] Insights generated: {type(insights)}")
    print(f"[OK] Insights keys: {list(insights.keys()) if isinstance(insights, dict) else 'Not a dict'}")
    
    print("\n[OK] All tests passed!")
    
except Exception as e:
    print(f"\n[ERROR] Error occurred:")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print(f"\nFull traceback:")
    traceback.print_exc()
