import pandas as pd
import numpy as np
from transformers import pipeline, AutoTokenizer, AutoModel
import torch
from sklearn.preprocessing import MinMaxScaler
import google.generativeai as genai
import os
import warnings
warnings.filterwarnings('ignore')

class HuggingFaceChartAnalyzer:
    def __init__(self):
        """Initialize the AI chart analyzer with Hugging Face models and Gemini"""
        self.sentiment_analyzer = None
        self.text_generator = None
        self.scaler = MinMaxScaler()
        # Set API key directly for immediate use
        self.gemini_api_key = "enter your gemini api key"
        self.use_gemini = True
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize Hugging Face models and Gemini for analysis"""
        try:
            # Initialize Gemini if API key is available
            if self.use_gemini:
                # Configure Gemini API
                genai.configure(api_key=self.gemini_api_key)
                print("✅ Gemini integration enabled")
            else:
                print("⚠️ Gemini integration disabled (no API key found)")
            
            # Start with basic sentiment analysis model (lighter)
            self.sentiment_analyzer = pipeline("sentiment-analysis")
            print("✅ Basic AI models loaded successfully")
            
            # Try to load financial-specific model if available
            try:
                self.financial_sentiment = pipeline(
                    "sentiment-analysis",
                    model="ProsusAI/finbert"
                )
                print("✅ Financial sentiment model loaded")
            except Exception as fe:
                print(f"⚠️ Financial model not available: {fe}")
                self.financial_sentiment = None
            
        except Exception as e:
            print(f"⚠️ AI model loading error: {e}")
            print("📊 Falling back to rule-based analysis only")
            self.sentiment_analyzer = None
            self.financial_sentiment = None
    
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
        """Generate AI-powered trading insights"""
        try:
            # Create context for AI analysis
            context = self._create_analysis_context(analysis_data)
            
            # Generate insights using AI
            if self.text_generator:
                prompt = f"Trading Analysis: {context}. Key insights:"
                insights = self.text_generator(prompt, max_length=100, do_sample=True)
                ai_insight = insights[0]['generated_text'].replace(prompt, "").strip()
            else:
                ai_insight = "AI model unavailable - using rule-based analysis"
            
            # Rule-based insights as backup
            rule_based_insights = self._generate_rule_based_insights(analysis_data)
            
            return {
                "ai_insight": ai_insight,
                "rule_based_insights": rule_based_insights,
                "confidence_score": self._calculate_confidence(analysis_data)
            }
        except Exception as e:
            return {
                "ai_insight": f"Analysis error: {str(e)}",
                "rule_based_insights": self._generate_rule_based_insights(analysis_data),
                "confidence_score": 0.5
            }
    
    def analyze_market_sentiment(self, news_text=None):
        """Analyze market sentiment from text"""
        if not news_text:
            return {"sentiment": "neutral", "confidence": 0.5}
        
        # Try financial model first, then basic model, then fallback
        analyzer = self.financial_sentiment or self.sentiment_analyzer
        
        if not analyzer:
            return {"sentiment": "neutral", "confidence": 0.5, "note": "AI models not available"}
        
        try:
            results = analyzer(news_text)
            
            # Handle different result formats
            if isinstance(results, list) and len(results) > 0:
                result = results[0]
                if isinstance(result, dict):
                    label = result.get('label', 'NEUTRAL').lower()
                    score = result.get('score', 0.5)
                    
                    # Normalize labels
                    if 'pos' in label or label == 'positive':
                        sentiment = 'positive'
                    elif 'neg' in label or label == 'negative':
                        sentiment = 'negative'
                    else:
                        sentiment = 'neutral'
                    
                    return {
                        "sentiment": sentiment,
                        "confidence": float(score),
                        "raw_label": result.get('label', 'NEUTRAL')
                    }
            
            return {"sentiment": "neutral", "confidence": 0.5}
            
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return {"sentiment": "neutral", "confidence": 0.5, "error": str(e)}
    
    def _calculate_rsi(self, prices, period=14):
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _detect_patterns(self, df):
        """Detect chart patterns"""
        patterns = []
        
        # Simple pattern detection
        recent_highs = df['high'].tail(10)
        recent_lows = df['low'].tail(10)
        
        # Ascending triangle
        if recent_lows.is_monotonic_increasing and len(recent_highs.unique()) <= 3:
            patterns.append("Ascending Triangle")
        
        # Descending triangle
        if recent_highs.is_monotonic_decreasing and len(recent_lows.unique()) <= 3:
            patterns.append("Descending Triangle")
        
        # Double top/bottom
        if len(df) >= 20:
            highs = df['high'].tail(20)
            if len(highs.nlargest(2)) == 2 and abs(highs.nlargest(2).iloc[0] - highs.nlargest(2).iloc[1]) < highs.std() * 0.5:
                patterns.append("Potential Double Top")
        
        return patterns if patterns else ["No clear patterns detected"]
    
    def _analyze_trend(self, df):
        """Analyze price trend"""
        if len(df) < 20:
            return "Insufficient data"
        
        recent_closes = df['close'].tail(20)
        slope = np.polyfit(range(len(recent_closes)), recent_closes, 1)[0]
        
        if slope > df['close'].std() * 0.01:
            return "Bullish"
        elif slope < -df['close'].std() * 0.01:
            return "Bearish"
        else:
            return "Sideways"
    
    def _find_support_resistance(self, df):
        """Find support and resistance levels"""
        if len(df) < 20:
            return {"support": None, "resistance": None}
        
        # Simple support/resistance using recent highs and lows
        recent_data = df.tail(50)
        resistance = recent_data['high'].quantile(0.95)
        support = recent_data['low'].quantile(0.05)
        
        return {
            "support": float(support),
            "resistance": float(resistance)
        }
    
    def _create_analysis_context(self, analysis_data):
        """Create context string for AI analysis"""
        trend = analysis_data.get('trend', 'Unknown')
        patterns = ', '.join(analysis_data.get('patterns', []))
        rsi = analysis_data.get('technical_indicators', {}).get('rsi')
        
        context = f"Trend: {trend}"
        if patterns:
            context += f", Patterns: {patterns}"
        if rsi:
            context += f", RSI: {rsi:.1f}"
        
        return context
    
    def _generate_rule_based_insights(self, analysis_data):
        """Generate rule-based trading insights"""
        insights = []
        
        # RSI insights
        rsi = analysis_data.get('technical_indicators', {}).get('rsi')
        if rsi:
            if rsi > 70:
                insights.append("RSI indicates overbought conditions - consider selling")
            elif rsi < 30:
                insights.append("RSI indicates oversold conditions - consider buying")
        
        # Trend insights
        trend = analysis_data.get('trend')
        if trend == 'Bullish':
            insights.append("Strong upward trend - consider long positions")
        elif trend == 'Bearish':
            insights.append("Strong downward trend - consider short positions")
        
        # Pattern insights
        patterns = analysis_data.get('patterns', [])
        if 'Ascending Triangle' in patterns:
            insights.append("Ascending triangle pattern suggests potential breakout upward")
        elif 'Descending Triangle' in patterns:
            insights.append("Descending triangle pattern suggests potential breakdown")
        
        return insights if insights else ["Market conditions are neutral"]
    
    def analyze_with_gemini(self, df, analysis_data=None):
        """Analyze chart data using Gemini"""
        if not self.use_gemini:
            return {"error": "Gemini integration not available (API key not set)"}
        
        try:
            # Prepare data for Gemini
            recent_data = df.tail(20).copy()
            
            # Format the data for the prompt
            price_data = "\n".join([
                f"Date: {row['timestamp'].strftime('%Y-%m-%d %H:%M')} | Open: {row['open']:.5f} | High: {row['high']:.5f} | Low: {row['low']:.5f} | Close: {row['close']:.5f}"
                for _, row in recent_data.iterrows()
            ])
            
            # Include technical indicators if available
            indicators = ""
            if analysis_data:
                tech_indicators = analysis_data.get('technical_indicators', {})
                indicators = f"""
                RSI: {tech_indicators.get('rsi', 'N/A')}
                SMA 20: {tech_indicators.get('sma_20', 'N/A')}
                SMA 50: {tech_indicators.get('sma_50', 'N/A')}
                Volatility: {tech_indicators.get('volatility', 'N/A')}
                """
                
                # Add trend and patterns
                trend = analysis_data.get('trend', 'Unknown')
                patterns = ', '.join(analysis_data.get('patterns', ['None detected']))
                indicators += f"\nTrend: {trend}\nPatterns: {patterns}"
                
                # Add support/resistance
                sr = analysis_data.get('support_resistance', {})
                indicators += f"\nSupport: {sr.get('support', 'N/A')}\nResistance: {sr.get('resistance', 'N/A')}"
            
            # Create the prompt for Gemini
            prompt = f"""
            You are an expert financial chart analyst. Analyze the following price data and provide trading insights:
            
            PRICE DATA (most recent 20 candles):
            {price_data}
            
            TECHNICAL INDICATORS:
            {indicators}
            
            Please provide:
            1. A concise market analysis
            2. Key support and resistance levels
            3. Potential trade setups with entry, stop loss, and take profit levels
            4. Risk assessment (Low/Medium/High)
            5. Overall market sentiment and bias
            """
            
            # Call Gemini API
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            # Extract and return the analysis
            analysis = response.text
            
            return {
                "gemini_analysis": analysis,
                "timestamp": pd.Timestamp.now().isoformat()
            }
            
        except Exception as e:
            print(f"Gemini analysis error: {e}")
            return {"error": f"Gemini analysis failed: {str(e)}"}
    
    def _calculate_confidence(self, analysis_data):
        """Calculate confidence score for analysis"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence based on clear signals
        rsi = analysis_data.get('technical_indicators', {}).get('rsi')
        if rsi and (rsi > 70 or rsi < 30):
            confidence += 0.2
        
        trend = analysis_data.get('trend')
        if trend in ['Bullish', 'Bearish']:
            confidence += 0.2
        
        patterns = analysis_data.get('patterns', [])
        if any(p != "No clear patterns detected" for p in patterns):
            confidence += 0.1
        
        return min(confidence, 1.0)

# Initialize global analyzer instance
chart_analyzer = HuggingFaceChartAnalyzer()
