import pandas as pd
import numpy as np
import warnings
import re
warnings.filterwarnings('ignore')

class ASCIIChartAnalyzer:
    def __init__(self):
        """Initialize the ASCII-safe chart analyzer with no external dependencies"""
        print("[OK] ASCII-safe AI analyzer initialized")
    
    def analyze_price_pattern(self, df):
        """Analyze price patterns and trends"""
        if df.empty or len(df) < 10:
            return {"error": "Insufficient data for analysis"}
        
        try:
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
        except Exception as e:
            return {"error": f"Analysis error: {str(e)}"}
    
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
            'excellent', 'great', 'opportunity', 'momentum', 'surge', 'bull',
            'higher', 'increase', 'growth', 'optimistic', 'confident'
        ]
        
        # Negative keywords
        negative_words = [
            'bearish', 'sell', 'short', 'down', 'fall', 'loss', 'weak', 
            'resistance', 'breakdown', 'crash', 'downtrend', 'negative', 'bad', 
            'poor', 'risk', 'decline', 'drop', 'plunge', 'correction', 'bear',
            'lower', 'decrease', 'pessimistic', 'worried', 'concern'
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
        
        try:
            # Get recent data for pattern analysis
            recent_data = df.tail(20)
            highs = recent_data['high']
            lows = recent_data['low']
            closes = recent_data['close']
            
            # Simple pattern detection
            if self._detect_double_top(highs):
                patterns.append("Double Top Pattern")
            
            if self._detect_double_bottom(lows):
                patterns.append("Double Bottom Pattern")
            
            # Triangle patterns
            if self._detect_triangle_pattern(highs, lows):
                patterns.append("Triangle Consolidation")
            
            # Breakout detection
            if self._detect_breakout(df):
                patterns.append("Breakout Pattern")
            
            # Reversal patterns
            if self._detect_reversal_pattern(df):
                patterns.append("Potential Reversal")
            
            return patterns if patterns else ["No clear patterns detected"]
        except Exception as e:
            return ["Pattern detection error"]
    
    def _detect_double_top(self, highs):
        """Simple double top detection"""
        try:
            if len(highs) < 10:
                return False
            
            # Find local maxima
            peaks = []
            for i in range(1, len(highs) - 1):
                if highs.iloc[i] > highs.iloc[i-1] and highs.iloc[i] > highs.iloc[i+1]:
                    peaks.append(highs.iloc[i])
            
            if len(peaks) >= 2:
                # Check if last two peaks are similar
                last_two = peaks[-2:]
                return abs(last_two[0] - last_two[1]) / max(last_two) < 0.02
            
            return False
        except:
            return False
    
    def _detect_double_bottom(self, lows):
        """Simple double bottom detection"""
        try:
            if len(lows) < 10:
                return False
            
            # Find local minima
            troughs = []
            for i in range(1, len(lows) - 1):
                if lows.iloc[i] < lows.iloc[i-1] and lows.iloc[i] < lows.iloc[i+1]:
                    troughs.append(lows.iloc[i])
            
            if len(troughs) >= 2:
                # Check if last two troughs are similar
                last_two = troughs[-2:]
                return abs(last_two[0] - last_two[1]) / max(last_two) < 0.02
            
            return False
        except:
            return False
    
    def _detect_triangle_pattern(self, highs, lows):
        """Detect triangle consolidation patterns"""
        try:
            if len(highs) < 10:
                return False
            
            # Check for converging highs and lows
            recent_highs = highs.tail(5)
            recent_lows = lows.tail(5)
            
            # Simple trend calculation
            high_trend = (recent_highs.iloc[-1] - recent_highs.iloc[0]) / len(recent_highs)
            low_trend = (recent_lows.iloc[-1] - recent_lows.iloc[0]) / len(recent_lows)
            
            # Converging if trends are opposite or both flat
            return abs(high_trend + low_trend) < abs(high_trend - low_trend) * 0.5
        except:
            return False
    
    def _detect_breakout(self, df):
        """Detect breakout patterns"""
        try:
            if len(df) < 20:
                return False
            
            recent = df.tail(5)
            previous = df.tail(15).head(10)
            
            # Check for significant price movement
            recent_range = recent['high'].max() - recent['low'].min()
            previous_range = previous['high'].max() - previous['low'].min()
            
            # Breakout if recent range is significantly larger
            return recent_range > previous_range * 1.5
        except:
            return False
    
    def _detect_reversal_pattern(self, df):
        """Detect potential reversal patterns"""
        try:
            if len(df) < 15:
                return False
            
            recent = df.tail(5)
            previous = df.tail(10).head(5)
            
            # Check for trend change
            recent_trend = recent['close'].iloc[-1] - recent['close'].iloc[0]
            previous_trend = previous['close'].iloc[-1] - previous['close'].iloc[0]
            
            # Reversal if trends are opposite and significant
            return (recent_trend * previous_trend < 0 and 
                    abs(recent_trend) > df['close'].std() * 0.5)
        except:
            return False
    
    def _analyze_trend(self, df):
        """Analyze price trend using multiple timeframes"""
        try:
            if len(df) < 20:
                return "Insufficient data"
            
            # Short-term trend (last 10 periods)
            short_term = df['close'].tail(10)
            short_change = (short_term.iloc[-1] - short_term.iloc[0]) / short_term.iloc[0]
            
            # Medium-term trend (last 20 periods)
            medium_term = df['close'].tail(20)
            medium_change = (medium_term.iloc[-1] - medium_term.iloc[0]) / medium_term.iloc[0]
            
            # Determine trend strength
            if short_change > 0.02 and medium_change > 0.01:
                return "Strong Bullish"
            elif short_change > 0.005 and medium_change > 0:
                return "Bullish"
            elif short_change < -0.02 and medium_change < -0.01:
                return "Strong Bearish"
            elif short_change < -0.005 and medium_change < 0:
                return "Bearish"
            else:
                return "Sideways"
        except:
            return "Unknown"
    
    def _find_support_resistance(self, df):
        """Find support and resistance levels"""
        try:
            if len(df) < 20:
                return {"support": None, "resistance": None}
            
            # Use recent data
            recent_data = df.tail(50) if len(df) >= 50 else df
            
            # Simple support/resistance using quantiles
            resistance = recent_data['high'].quantile(0.9)
            support = recent_data['low'].quantile(0.1)
            
            # Refine using pivot points
            current_price = df['close'].iloc[-1]
            
            # Find pivot highs (resistance)
            pivot_highs = []
            for i in range(2, len(recent_data) - 2):
                if (recent_data['high'].iloc[i] > recent_data['high'].iloc[i-1] and
                    recent_data['high'].iloc[i] > recent_data['high'].iloc[i+1] and
                    recent_data['high'].iloc[i] > recent_data['high'].iloc[i-2] and
                    recent_data['high'].iloc[i] > recent_data['high'].iloc[i+2]):
                    pivot_highs.append(recent_data['high'].iloc[i])
            
            # Find pivot lows (support)
            pivot_lows = []
            for i in range(2, len(recent_data) - 2):
                if (recent_data['low'].iloc[i] < recent_data['low'].iloc[i-1] and
                    recent_data['low'].iloc[i] < recent_data['low'].iloc[i+1] and
                    recent_data['low'].iloc[i] < recent_data['low'].iloc[i-2] and
                    recent_data['low'].iloc[i] < recent_data['low'].iloc[i+2]):
                    pivot_lows.append(recent_data['low'].iloc[i])
            
            # Use pivot points if available
            if pivot_highs:
                nearby_resistance = [r for r in pivot_highs if r > current_price]
                if nearby_resistance:
                    resistance = min(nearby_resistance)
            
            if pivot_lows:
                nearby_support = [s for s in pivot_lows if s < current_price]
                if nearby_support:
                    support = max(nearby_support)
            
            return {
                "support": float(support),
                "resistance": float(resistance)
            }
        except:
            return {"support": None, "resistance": None}
    
    def _generate_ai_style_insight(self, analysis_data):
        """Generate AI-style trading insight"""
        try:
            trend = analysis_data.get('trend', 'Unknown')
            patterns = analysis_data.get('patterns', [])
            tech = analysis_data.get('technical_indicators', {})
            rsi = tech.get('rsi')
            sr = analysis_data.get('support_resistance', {})
            
            insights = []
            
            # Market structure analysis
            if 'Strong Bullish' in trend:
                insights.append("Strong bullish momentum with high probability of continuation.")
                insights.append("Consider long positions on any pullbacks to support levels.")
            elif 'Bullish' in trend:
                insights.append("Positive price action suggests upward bias.")
                insights.append("Look for buying opportunities near key support zones.")
            elif 'Strong Bearish' in trend:
                insights.append("Strong bearish pressure indicates potential further decline.")
                insights.append("Short positions may be favorable on any rallies to resistance.")
            elif 'Bearish' in trend:
                insights.append("Negative sentiment suggests downward pressure.")
                insights.append("Exercise caution with long positions in current environment.")
            else:
                insights.append("Market in consolidation phase - range-bound trading expected.")
                insights.append("Wait for clear directional breakout before taking positions.")
            
            # RSI analysis
            if rsi:
                if rsi > 75:
                    insights.append("Extremely overbought conditions warn of potential reversal.")
                elif rsi > 70:
                    insights.append("Overbought territory suggests caution for new longs.")
                elif rsi < 25:
                    insights.append("Extremely oversold conditions present buying opportunity.")
                elif rsi < 30:
                    insights.append("Oversold levels indicate potential bounce ahead.")
                elif 45 <= rsi <= 55:
                    insights.append("RSI in equilibrium supports trend continuation.")
            
            # Pattern analysis
            pattern_insights = {
                'Double Top': "Double top formation suggests bearish reversal potential - consider profit-taking.",
                'Double Bottom': "Double bottom pattern indicates strong support and bullish reversal opportunity.",
                'Triangle': "Triangle consolidation suggests building pressure for significant breakout.",
                'Breakout': "Confirmed breakout pattern indicates strong directional momentum.",
                'Reversal': "Reversal pattern detected - trend change may be underway."
            }
            
            for pattern in patterns:
                for key, insight in pattern_insights.items():
                    if key in pattern:
                        insights.append(insight)
                        break
            
            # Support/Resistance analysis
            if sr.get('support') and sr.get('resistance'):
                insights.append(f"Key levels: Support at {sr['support']:.5f}, Resistance at {sr['resistance']:.5f}.")
            
            return " ".join(insights) if insights else "Market conditions present mixed signals - maintain cautious approach with proper risk management."
        except Exception as e:
            return "Unable to generate AI insights due to analysis error."
    
    def _generate_rule_based_insights(self, analysis_data):
        """Generate rule-based trading insights"""
        try:
            insights = []
            
            # RSI insights
            rsi = analysis_data.get('technical_indicators', {}).get('rsi')
            if rsi:
                if rsi > 70:
                    insights.append("RSI overbought (>70) - consider profit-taking or short positions")
                elif rsi < 30:
                    insights.append("RSI oversold (<30) - potential buying opportunity")
                elif rsi > 50:
                    insights.append("RSI above 50 - bullish momentum favored")
                else:
                    insights.append("RSI below 50 - bearish pressure present")
            
            # Trend insights
            trend = analysis_data.get('trend')
            if 'Strong Bullish' in trend:
                insights.append("Strong uptrend - buy dips and hold positions")
            elif 'Bullish' in trend:
                insights.append("Uptrend active - favor long positions")
            elif 'Strong Bearish' in trend:
                insights.append("Strong downtrend - sell rallies and consider shorts")
            elif 'Bearish' in trend:
                insights.append("Downtrend present - avoid new longs")
            elif trend == 'Sideways':
                insights.append("Range-bound market - trade between support/resistance")
            
            # Moving average insights
            tech = analysis_data.get('technical_indicators', {})
            sma_20 = tech.get('sma_20')
            sma_50 = tech.get('sma_50')
            
            if sma_20 and sma_50:
                if sma_20 > sma_50:
                    insights.append("20-SMA > 50-SMA confirms bullish structure")
                else:
                    insights.append("20-SMA < 50-SMA indicates bearish structure")
            
            # Support/Resistance insights
            sr = analysis_data.get('support_resistance', {})
            if sr.get('support') and sr.get('resistance'):
                insights.append(f"Trade between support ({sr['support']:.5f}) and resistance ({sr['resistance']:.5f})")
            
            # Pattern-specific insights
            patterns = analysis_data.get('patterns', [])
            pattern_rules = {
                'Double Top': "Double top warns of reversal - set stop above recent high",
                'Double Bottom': "Double bottom suggests reversal - target resistance break",
                'Triangle': "Triangle breakout imminent - prepare for directional move",
                'Breakout': "Breakout confirmed - follow momentum with tight stops",
                'Reversal': "Reversal pattern active - consider counter-trend positions"
            }
            
            for pattern in patterns:
                for key, rule in pattern_rules.items():
                    if key in pattern:
                        insights.append(rule)
                        break
            
            return insights if insights else ["No clear trading signals - wait for better setup"]
        except Exception as e:
            return ["Unable to generate rule-based insights due to error"]
    
    def _calculate_confidence(self, analysis_data):
        """Calculate confidence score for analysis"""
        try:
            confidence = 0.5  # Base confidence
            
            # RSI confidence boost
            rsi = analysis_data.get('technical_indicators', {}).get('rsi')
            if rsi:
                if rsi > 70 or rsi < 30:
                    confidence += 0.15  # Strong RSI signals
                elif 40 <= rsi <= 60:
                    confidence += 0.05  # Neutral RSI
            
            # Trend confidence
            trend = analysis_data.get('trend')
            if 'Strong' in trend:
                confidence += 0.2
            elif trend in ['Bullish', 'Bearish']:
                confidence += 0.1
            elif trend == 'Sideways':
                confidence += 0.05
            
            # Pattern confidence
            patterns = analysis_data.get('patterns', [])
            clear_patterns = [p for p in patterns if p != "No clear patterns detected"]
            if clear_patterns:
                confidence += 0.1 * min(len(clear_patterns), 2)
            
            # Technical alignment check
            tech = analysis_data.get('technical_indicators', {})
            sma_20 = tech.get('sma_20')
            sma_50 = tech.get('sma_50')
            
            if sma_20 and sma_50 and rsi:
                # Check for alignment between indicators
                sma_bullish = sma_20 > sma_50
                rsi_bullish = rsi > 50
                trend_bullish = 'Bullish' in trend
                
                aligned_signals = sum([sma_bullish, rsi_bullish, trend_bullish])
                if aligned_signals >= 2:
                    confidence += 0.1
                elif aligned_signals == 0:  # All bearish
                    confidence += 0.1
            
            # Volatility adjustment
            volatility = tech.get('volatility')
            if volatility:
                # Lower confidence in high volatility environments
                if volatility > tech.get('sma_20', 1) * 0.02:
                    confidence -= 0.05
            
            return min(max(confidence, 0.2), 0.9)
        except:
            return 0.5

# Initialize global analyzer instance
chart_analyzer = ASCIIChartAnalyzer()
