import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import warnings
import re
warnings.filterwarnings('ignore')

class LightweightChartAnalyzer:
    def __init__(self):
        """Initialize the lightweight chart analyzer"""
        self.scaler = MinMaxScaler()
        print("✅ Lightweight AI analyzer initialized")
    
    def analyze_price_pattern(self, df):
        """Analyze price patterns and trends"""
        if df.empty or len(df) < 10:
            return {"error": "Insufficient data for analysis"}
        
        # Calculate technical indicators
        df = df.copy()
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['sma_50'] = df['close'].rolling(window=50).mean()
        df['rsi'] = self._calculate_rsi(df['close'])
        df['volatility'] = df['close'].rolling(window=20).std()
        
        # Pattern recognition
        patterns = self._detect_patterns(df)
        
        # Trend analysis
        trend = self._analyze_trend(df)
        
        # Support/Resistance levels
        support_resistance = self._find_support_resistance(df)
        
        return {
            "patterns": patterns,
            "trend": trend,
            "support_resistance": support_resistance,
            "technical_indicators": {
                "rsi": float(df['rsi'].iloc[-1]) if not pd.isna(df['rsi'].iloc[-1]) else None,
                "sma_20": float(df['sma_20'].iloc[-1]) if not pd.isna(df['sma_20'].iloc[-1]) else None,
                "sma_50": float(df['sma_50'].iloc[-1]) if not pd.isna(df['sma_50'].iloc[-1]) else None,
                "volatility": float(df['volatility'].iloc[-1]) if not pd.isna(df['volatility'].iloc[-1]) else None
            }
        }
    
    def generate_trading_insights(self, analysis_data):
        """Generate AI-powered trading insights using rule-based analysis"""
        try:
            # Rule-based insights
            rule_based_insights = self._generate_rule_based_insights(analysis_data)
            
            # Generate AI-style insight using pattern matching
            ai_insight = self._generate_ai_style_insight(analysis_data)
            
            return {
                "ai_insight": ai_insight,
                "rule_based_insights": rule_based_insights,
                "confidence_score": self._calculate_confidence(analysis_data)
            }
        except Exception as e:
            return {
                "ai_insight": f"Analysis error: {str(e)}",
                "rule_based_insights": ["Unable to generate insights due to error"],
                "confidence_score": 0.3
            }
    
    def analyze_market_sentiment(self, news_text=None):
        """Analyze market sentiment using keyword-based approach"""
        if not news_text:
            return {"sentiment": "neutral", "confidence": 0.5}
        
        try:
            sentiment_score = self._analyze_text_sentiment(news_text)
            
            if sentiment_score > 0.1:
                sentiment = "positive"
                confidence = min(0.5 + sentiment_score, 0.9)
            elif sentiment_score < -0.1:
                sentiment = "negative"
                confidence = min(0.5 + abs(sentiment_score), 0.9)
            else:
                sentiment = "neutral"
                confidence = 0.5
            
            return {
                "sentiment": sentiment,
                "confidence": confidence,
                "note": "Keyword-based analysis"
            }
        except Exception as e:
            return {"sentiment": "neutral", "confidence": 0.5, "error": str(e)}
    
    def _analyze_text_sentiment(self, text):
        """Simple keyword-based sentiment analysis"""
        text = text.lower()
        
        # Positive keywords
        positive_words = [
            'bullish', 'buy', 'long', 'up', 'rise', 'gain', 'profit', 'strong', 
            'support', 'breakout', 'rally', 'uptrend', 'positive', 'good', 
            'excellent', 'great', 'opportunity', 'momentum', 'surge'
        ]
        
        # Negative keywords
        negative_words = [
            'bearish', 'sell', 'short', 'down', 'fall', 'loss', 'weak', 
            'resistance', 'breakdown', 'crash', 'downtrend', 'negative', 'bad', 
            'poor', 'risk', 'decline', 'drop', 'plunge', 'correction'
        ]
        
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        
        total_words = len(text.split())
        if total_words == 0:
            return 0
        
        # Calculate sentiment score
        sentiment_score = (positive_count - negative_count) / max(total_words / 10, 1)
        return max(-1, min(1, sentiment_score))
    
    def _calculate_rsi(self, prices, period=14):
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _detect_patterns(self, df):
        """Detect chart patterns using technical analysis"""
        patterns = []
        
        if len(df) < 20:
            return ["Insufficient data for pattern detection"]
        
        # Get recent data for pattern analysis
        recent_data = df.tail(20)
        highs = recent_data['high']
        lows = recent_data['low']
        closes = recent_data['close']
        
        # Double Top/Bottom detection
        if self._detect_double_top(highs):
            patterns.append("Double Top Pattern")
        
        if self._detect_double_bottom(lows):
            patterns.append("Double Bottom Pattern")
        
        # Triangle patterns
        if self._detect_ascending_triangle(highs, lows):
            patterns.append("Ascending Triangle")
        elif self._detect_descending_triangle(highs, lows):
            patterns.append("Descending Triangle")
        
        # Head and Shoulders
        if self._detect_head_shoulders(highs):
            patterns.append("Head and Shoulders")
        
        # Support/Resistance breaks
        if self._detect_breakout(df):
            patterns.append("Breakout Pattern")
        
        return patterns if patterns else ["No clear patterns detected"]
    
    def _detect_double_top(self, highs):
        """Detect double top pattern"""
        if len(highs) < 10:
            return False
        
        peaks = []
        for i in range(1, len(highs) - 1):
            if highs.iloc[i] > highs.iloc[i-1] and highs.iloc[i] > highs.iloc[i+1]:
                peaks.append((i, highs.iloc[i]))
        
        if len(peaks) >= 2:
            # Check if last two peaks are similar in height
            last_two = peaks[-2:]
            height_diff = abs(last_two[0][1] - last_two[1][1])
            avg_height = (last_two[0][1] + last_two[1][1]) / 2
            return height_diff / avg_height < 0.02  # Within 2%
        
        return False
    
    def _detect_double_bottom(self, lows):
        """Detect double bottom pattern"""
        if len(lows) < 10:
            return False
        
        troughs = []
        for i in range(1, len(lows) - 1):
            if lows.iloc[i] < lows.iloc[i-1] and lows.iloc[i] < lows.iloc[i+1]:
                troughs.append((i, lows.iloc[i]))
        
        if len(troughs) >= 2:
            # Check if last two troughs are similar in depth
            last_two = troughs[-2:]
            height_diff = abs(last_two[0][1] - last_two[1][1])
            avg_height = (last_two[0][1] + last_two[1][1]) / 2
            return height_diff / avg_height < 0.02  # Within 2%
        
        return False
    
    def _detect_ascending_triangle(self, highs, lows):
        """Detect ascending triangle pattern"""
        if len(highs) < 10:
            return False
        
        # Check if highs are relatively flat (resistance)
        recent_highs = highs.tail(5)
        high_volatility = recent_highs.std() / recent_highs.mean()
        
        # Check if lows are ascending (support)
        recent_lows = lows.tail(5)
        low_trend = np.polyfit(range(len(recent_lows)), recent_lows, 1)[0]
        
        return high_volatility < 0.01 and low_trend > 0
    
    def _detect_descending_triangle(self, highs, lows):
        """Detect descending triangle pattern"""
        if len(highs) < 10:
            return False
        
        # Check if lows are relatively flat (support)
        recent_lows = lows.tail(5)
        low_volatility = recent_lows.std() / recent_lows.mean()
        
        # Check if highs are descending (resistance)
        recent_highs = highs.tail(5)
        high_trend = np.polyfit(range(len(recent_highs)), recent_highs, 1)[0]
        
        return low_volatility < 0.01 and high_trend < 0
    
    def _detect_head_shoulders(self, highs):
        """Detect head and shoulders pattern"""
        if len(highs) < 15:
            return False
        
        peaks = []
        for i in range(2, len(highs) - 2):
            if (highs.iloc[i] > highs.iloc[i-1] and highs.iloc[i] > highs.iloc[i+1] and
                highs.iloc[i] > highs.iloc[i-2] and highs.iloc[i] > highs.iloc[i+2]):
                peaks.append((i, highs.iloc[i]))
        
        if len(peaks) >= 3:
            # Check for head and shoulders pattern in last 3 peaks
            last_three = peaks[-3:]
            left_shoulder, head, right_shoulder = last_three
            
            # Head should be higher than shoulders
            if (head[1] > left_shoulder[1] and head[1] > right_shoulder[1] and
                abs(left_shoulder[1] - right_shoulder[1]) / head[1] < 0.05):
                return True
        
        return False
    
    def _detect_breakout(self, df):
        """Detect breakout patterns"""
        if len(df) < 20:
            return False
        
        recent_data = df.tail(10)
        older_data = df.tail(20).head(10)
        
        # Check for volume spike with price movement
        recent_volume = recent_data.get('volume', pd.Series([1] * len(recent_data)))
        older_volume = older_data.get('volume', pd.Series([1] * len(older_data)))
        
        volume_increase = recent_volume.mean() > older_volume.mean() * 1.5
        
        # Check for significant price movement
        price_change = abs(recent_data['close'].iloc[-1] - older_data['close'].iloc[-1])
        avg_price = (recent_data['close'].mean() + older_data['close'].mean()) / 2
        significant_move = price_change / avg_price > 0.02  # 2% move
        
        return volume_increase and significant_move
    
    def _analyze_trend(self, df):
        """Analyze price trend"""
        if len(df) < 20:
            return "Insufficient data"
        
        # Multiple timeframe analysis
        short_term = df['close'].tail(10)
        medium_term = df['close'].tail(20)
        
        short_slope = np.polyfit(range(len(short_term)), short_term, 1)[0]
        medium_slope = np.polyfit(range(len(medium_term)), medium_term, 1)[0]
        
        price_std = df['close'].std()
        
        # Determine trend strength
        if short_slope > price_std * 0.01 and medium_slope > 0:
            return "Strong Bullish"
        elif short_slope > 0 and medium_slope > 0:
            return "Bullish"
        elif short_slope < -price_std * 0.01 and medium_slope < 0:
            return "Strong Bearish"
        elif short_slope < 0 and medium_slope < 0:
            return "Bearish"
        else:
            return "Sideways"
    
    def _find_support_resistance(self, df):
        """Find support and resistance levels"""
        if len(df) < 20:
            return {"support": None, "resistance": None}
        
        # Use recent data for S/R calculation
        recent_data = df.tail(50) if len(df) >= 50 else df
        
        # Find pivot points
        highs = recent_data['high']
        lows = recent_data['low']
        
        # Calculate support and resistance using quantiles and pivot analysis
        resistance_levels = []
        support_levels = []
        
        # Quantile-based levels
        resistance_levels.append(highs.quantile(0.95))
        resistance_levels.append(highs.quantile(0.85))
        support_levels.append(lows.quantile(0.05))
        support_levels.append(lows.quantile(0.15))
        
        # Pivot-based levels
        for i in range(2, len(recent_data) - 2):
            # Resistance (pivot high)
            if (recent_data['high'].iloc[i] > recent_data['high'].iloc[i-1] and
                recent_data['high'].iloc[i] > recent_data['high'].iloc[i+1] and
                recent_data['high'].iloc[i] > recent_data['high'].iloc[i-2] and
                recent_data['high'].iloc[i] > recent_data['high'].iloc[i+2]):
                resistance_levels.append(recent_data['high'].iloc[i])
            
            # Support (pivot low)
            if (recent_data['low'].iloc[i] < recent_data['low'].iloc[i-1] and
                recent_data['low'].iloc[i] < recent_data['low'].iloc[i+1] and
                recent_data['low'].iloc[i] < recent_data['low'].iloc[i-2] and
                recent_data['low'].iloc[i] < recent_data['low'].iloc[i+2]):
                support_levels.append(recent_data['low'].iloc[i])
        
        # Get the most relevant levels
        current_price = df['close'].iloc[-1]
        
        # Find closest resistance above current price
        valid_resistance = [r for r in resistance_levels if r > current_price]
        resistance = min(valid_resistance) if valid_resistance else max(resistance_levels)
        
        # Find closest support below current price
        valid_support = [s for s in support_levels if s < current_price]
        support = max(valid_support) if valid_support else min(support_levels)
        
        return {
            "support": float(support),
            "resistance": float(resistance)
        }
    
    def _generate_ai_style_insight(self, analysis_data):
        """Generate AI-style trading insight"""
        trend = analysis_data.get('trend', 'Unknown')
        patterns = analysis_data.get('patterns', [])
        tech = analysis_data.get('technical_indicators', {})
        rsi = tech.get('rsi')
        
        insights = []
        
        # Trend-based insights
        if 'Strong Bullish' in trend:
            insights.append("Strong upward momentum detected with high probability of continuation.")
        elif 'Bullish' in trend:
            insights.append("Positive price action suggests potential upward movement.")
        elif 'Strong Bearish' in trend:
            insights.append("Strong downward pressure indicates potential further decline.")
        elif 'Bearish' in trend:
            insights.append("Negative sentiment may lead to continued downward movement.")
        else:
            insights.append("Market consolidation phase - waiting for directional breakout.")
        
        # RSI-based insights
        if rsi:
            if rsi > 70:
                insights.append("Overbought conditions suggest potential reversal or consolidation.")
            elif rsi < 30:
                insights.append("Oversold conditions indicate possible bounce or reversal opportunity.")
            elif 40 <= rsi <= 60:
                insights.append("RSI in neutral zone supports current trend continuation.")
        
        # Pattern-based insights
        for pattern in patterns:
            if 'Double Top' in pattern:
                insights.append("Double top formation suggests bearish reversal potential.")
            elif 'Double Bottom' in pattern:
                insights.append("Double bottom pattern indicates bullish reversal opportunity.")
            elif 'Triangle' in pattern:
                insights.append("Triangle consolidation pattern suggests impending breakout.")
            elif 'Head and Shoulders' in pattern:
                insights.append("Head and shoulders pattern indicates potential trend reversal.")
            elif 'Breakout' in pattern:
                insights.append("Breakout pattern confirmed - trend continuation likely.")
        
        return " ".join(insights) if insights else "Market conditions are neutral with mixed signals."
    
    def _generate_rule_based_insights(self, analysis_data):
        """Generate rule-based trading insights"""
        insights = []
        
        # RSI insights
        rsi = analysis_data.get('technical_indicators', {}).get('rsi')
        if rsi:
            if rsi > 70:
                insights.append("RSI indicates overbought conditions - consider taking profits")
            elif rsi < 30:
                insights.append("RSI shows oversold conditions - potential buying opportunity")
            elif rsi > 50:
                insights.append("RSI above 50 supports bullish momentum")
            else:
                insights.append("RSI below 50 suggests bearish pressure")
        
        # Trend insights
        trend = analysis_data.get('trend')
        if 'Bullish' in trend:
            insights.append("Uptrend confirmed - consider long positions on pullbacks")
        elif 'Bearish' in trend:
            insights.append("Downtrend active - look for short opportunities on rallies")
        elif trend == 'Sideways':
            insights.append("Range-bound market - trade between support and resistance")
        
        # Moving average insights
        tech = analysis_data.get('technical_indicators', {})
        sma_20 = tech.get('sma_20')
        sma_50 = tech.get('sma_50')
        
        if sma_20 and sma_50:
            if sma_20 > sma_50:
                insights.append("20-period SMA above 50-period SMA confirms bullish bias")
            else:
                insights.append("20-period SMA below 50-period SMA suggests bearish bias")
        
        # Pattern insights
        patterns = analysis_data.get('patterns', [])
        for pattern in patterns:
            if 'Ascending Triangle' in pattern:
                insights.append("Ascending triangle suggests bullish breakout potential")
            elif 'Descending Triangle' in pattern:
                insights.append("Descending triangle indicates bearish breakdown risk")
            elif 'Double Top' in pattern:
                insights.append("Double top formation warns of potential reversal")
            elif 'Double Bottom' in pattern:
                insights.append("Double bottom suggests strong support and reversal potential")
        
        return insights if insights else ["Market conditions are neutral - wait for clearer signals"]
    
    def _calculate_confidence(self, analysis_data):
        """Calculate confidence score for analysis"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence based on clear signals
        rsi = analysis_data.get('technical_indicators', {}).get('rsi')
        if rsi and (rsi > 70 or rsi < 30):
            confidence += 0.15
        
        trend = analysis_data.get('trend')
        if 'Strong' in trend:
            confidence += 0.2
        elif trend in ['Bullish', 'Bearish']:
            confidence += 0.1
        
        patterns = analysis_data.get('patterns', [])
        clear_patterns = [p for p in patterns if p != "No clear patterns detected"]
        if clear_patterns:
            confidence += 0.1 * min(len(clear_patterns), 2)
        
        # Check for conflicting signals (reduce confidence)
        if rsi and trend:
            if (rsi > 70 and 'Bullish' in trend) or (rsi < 30 and 'Bearish' in trend):
                confidence -= 0.1  # Conflicting signals
        
        return min(max(confidence, 0.2), 0.9)

# Initialize global analyzer instance
try:
    from transformers import pipeline
    # If transformers is available, use the full version
    from ai_chart_analyzer import HuggingFaceChartAnalyzer
    chart_analyzer = HuggingFaceChartAnalyzer()
    print("✅ Full AI analyzer loaded with Hugging Face models")
except ImportError:
    # Fallback to lightweight version
    chart_analyzer = LightweightChartAnalyzer()
    print("✅ Lightweight AI analyzer loaded (transformers not available)")
except Exception as e:
    # Ultimate fallback
    chart_analyzer = LightweightChartAnalyzer()
    print(f"⚠️ Using lightweight analyzer due to error: {e}")
