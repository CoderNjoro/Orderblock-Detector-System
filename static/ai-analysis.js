// AI Chart Analysis Module
class AIAnalysisManager {
    constructor() {
        this.isAnalyzing = false;
        this.lastAnalysis = null;
        this.initializeUI();
    }

    initializeUI() {
        // Add AI analysis panel to the page
        this.createAIPanel();
        this.setupEventListeners();
    }

    createAIPanel() {
        const aiPanelHTML = `
            <div id="aiAnalysisPanel" class="analysis-panel" style="margin-top: 24px;">
                <div class="analysis-header">
                    <h3>🤖 AI Chart Analysis</h3>
                    <div class="ai-controls">
                        <button id="runAIAnalysis" class="btn btn-primary">
                            <span id="aiAnalysisText">Analyze with AI</span>
                            <span id="aiAnalysisSpinner" class="spinner" style="display: none;">⏳</span>
                        </button>
                        <button id="quickInsights" class="btn btn-secondary">Quick Insights</button>
                    </div>
                </div>
                
                <div id="aiAnalysisContent" class="ai-content" style="display: none;">
                    <!-- AI Insights Section -->
                    <div class="ai-section">
                        <h4>💡 AI Trading Insights</h4>
                        <div id="aiInsights" class="ai-insights">
                            <div class="insight-card">
                                <div class="insight-header">
                                    <span class="insight-icon">🎯</span>
                                    <span class="insight-title">AI Recommendation</span>
                                    <span id="confidenceScore" class="confidence-badge">--</span>
                                </div>
                                <div id="aiRecommendation" class="insight-text">
                                    Click "Analyze with AI" to get intelligent trading insights
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ChatGPT Analysis Section -->
                    <div class="ai-section">
                        <h4>🧠 ChatGPT Advanced Analysis</h4>
                        <div class="ai-controls">
                            <button id="runChatGPTAnalysis" class="btn btn-success">
                                <span id="chatgptAnalysisText">Analyze with ChatGPT</span>
                                <span id="chatgptAnalysisSpinner" class="spinner" style="display: none;">⏳</span>
                            </button>
                        </div>
                        <div id="chatgptAnalysis" class="chatgpt-analysis">
                            <p>Click "Analyze with ChatGPT" to get advanced trading insights powered by OpenAI's ChatGPT</p>
                        </div>
                    </div>

                    <!-- Technical Analysis Section -->
                    <div class="ai-section">
                        <h4>📊 Technical Analysis</h4>
                        <div class="tech-analysis-grid">
                            <div class="tech-card">
                                <div class="tech-label">Trend</div>
                                <div id="aiTrend" class="tech-value">--</div>
                            </div>
                            <div class="tech-card">
                                <div class="tech-label">RSI</div>
                                <div id="aiRSI" class="tech-value">--</div>
                            </div>
                            <div class="tech-card">
                                <div class="tech-label">Support</div>
                                <div id="aiSupport" class="tech-value">--</div>
                            </div>
                            <div class="tech-card">
                                <div class="tech-label">Resistance</div>
                                <div id="aiResistance" class="tech-value">--</div>
                            </div>
                        </div>
                    </div>

                    <!-- Pattern Recognition Section -->
                    <div class="ai-section">
                        <h4>🔍 Pattern Recognition</h4>
                        <div id="aiPatterns" class="patterns-list">
                            <div class="pattern-item">No patterns detected yet</div>
                        </div>
                    </div>

                    <!-- Quick Stats Section -->
                    <div class="ai-section">
                        <h4>⚡ Quick Stats</h4>
                        <div class="quick-stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Price Change</span>
                                <span id="priceChange" class="stat-value">--</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Volatility</span>
                                <span id="volatility" class="stat-value">--</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Recommendation</span>
                                <span id="quickRecommendation" class="stat-value recommendation">--</span>
                            </div>
                        </div>
                    </div>

                    <!-- Market Sentiment Section -->
                    <div class="ai-section">
                        <h4>📈 Market Sentiment</h4>
                        <div class="sentiment-input">
                            <textarea id="sentimentText" placeholder="Paste market news or analysis text here for sentiment analysis..." rows="3"></textarea>
                            <button id="analyzeSentiment" class="btn btn-small">Analyze Sentiment</button>
                        </div>
                        <div id="sentimentResult" class="sentiment-result" style="display: none;">
                            <div class="sentiment-score">
                                <span id="sentimentLabel">Neutral</span>
                                <span id="sentimentConfidence">50%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="aiError" class="error-message" style="display: none;"></div>
            </div>
        `;

        // Insert AI panel after the existing analysis panel
        const analysisPanel = document.querySelector('.analysis-panel');
        if (analysisPanel) {
            analysisPanel.insertAdjacentHTML('afterend', aiPanelHTML);
        } else {
            // Fallback: add to main container
            const container = document.querySelector('.container');
            container.insertAdjacentHTML('beforeend', aiPanelHTML);
        }

        // Add CSS styles
        this.addAIStyles();
    }

    addAIStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-content {
                display: grid;
                gap: 20px;
                margin-top: 16px;
            }

            .ai-section {
                background: var(--card-bg, #f8f9fa);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid var(--border-color, #e0e0e0);
            }

            .ai-section h4 {
                margin: 0 0 12px 0;
                color: var(--accent-color, #3742fa);
                font-size: 1.1em;
            }

            .ai-controls {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .insight-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
                padding: 16px;
            }

            .insight-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .insight-icon {
                font-size: 1.2em;
            }

            .insight-title {
                font-weight: 600;
                flex: 1;
            }

            .confidence-badge {
                background: rgba(255,255,255,0.2);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.85em;
            }

            .insight-text {
                line-height: 1.5;
                opacity: 0.95;
            }

            .tech-analysis-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 12px;
            }

            .tech-card {
                text-align: center;
                padding: 12px;
                background: var(--bg-secondary, white);
                border-radius: 6px;
                border: 1px solid var(--border-light, #f0f0f0);
            }

            .tech-label {
                font-size: 0.85em;
                color: var(--text-secondary, #666);
                margin-bottom: 4px;
            }

            .tech-value {
                font-weight: 600;
                color: var(--text-primary, #333);
            }

            .patterns-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .pattern-item {
                background: var(--accent-light, #e3f2fd);
                color: var(--accent-color, #1976d2);
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 0.9em;
                font-weight: 500;
            }

            .quick-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 12px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid var(--border-light, #f0f0f0);
            }

            .stat-label {
                font-size: 0.9em;
                color: var(--text-secondary, #666);
            }

            .stat-value {
                font-weight: 600;
            }

            .stat-value.recommendation.buy {
                color: #4caf50;
            }

            .stat-value.recommendation.sell {
                color: #f44336;
            }

            .stat-value.recommendation.hold {
                color: #ff9800;
            }

            .sentiment-input {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .sentiment-input textarea {
                resize: vertical;
                padding: 8px;
                border: 1px solid var(--border-color, #ddd);
                border-radius: 4px;
                font-family: inherit;
            }

            .sentiment-result {
                margin-top: 12px;
                padding: 12px;
                background: var(--bg-secondary, #f8f9fa);
                border-radius: 6px;
            }

            .sentiment-score {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .spinner {
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .error-message {
                background: #ffebee;
                color: #c62828;
                padding: 12px;
                border-radius: 6px;
                border-left: 4px solid #f44336;
                margin-top: 12px;
            }

            .btn-small {
                padding: 6px 12px;
                font-size: 0.85em;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Main AI analysis button
        document.getElementById('runAIAnalysis').addEventListener('click', () => {
            this.runFullAnalysis();
        });

        // Quick insights button
        document.getElementById('quickInsights').addEventListener('click', () => {
            this.getQuickInsights();
        });

        // ChatGPT analysis button
        document.getElementById('runChatGPTAnalysis').addEventListener('click', () => {
            this.runChatGPTAnalysis();
        });

        // Sentiment analysis button
        document.getElementById('analyzeSentiment').addEventListener('click', () => {
            this.analyzeSentiment();
        });
    }

    async runFullAnalysis() {
        if (this.isAnalyzing) return;

        const symbol = document.getElementById('symbol').value || 'EUR/USD';
        this.setAnalyzing(true);
        this.hideError();

        try {
            const response = await fetch(`/api/ai-analysis?symbol=${symbol}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.displayAnalysis(data);
            this.lastAnalysis = data;
            
        } catch (error) {
            this.showError(`Analysis failed: ${error.message}`);
        } finally {
            this.setAnalyzing(false);
        }
    }

    async getQuickInsights() {
        const symbol = document.getElementById('symbol').value || 'EUR/USD';
        
        try {
            const response = await fetch(`/api/quick-insights?symbol=${symbol}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.displayQuickInsights(data);
            
        } catch (error) {
            this.showError(`Quick insights failed: ${error.message}`);
        }
    }

    async analyzeSentiment() {
        const text = document.getElementById('sentimentText').value.trim();
        if (!text) {
            this.showError('Please enter some text for sentiment analysis');
            return;
        }

        try {
            const response = await fetch(`/api/market-sentiment?text=${encodeURIComponent(text)}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.displaySentiment(data);
            
        } catch (error) {
            this.showError(`Sentiment analysis failed: ${error.message}`);
        }
    }

    runChatGPTAnalysis() {
        // Get current symbol
        const symbol = document.getElementById('symbol').value;
        
        // Show loading state
        const chatgptButton = document.getElementById('runChatGPTAnalysis');
        const chatgptText = document.getElementById('chatgptAnalysisText');
        const chatgptSpinner = document.getElementById('chatgptAnalysisSpinner');
        
        chatgptText.style.display = 'none';
        chatgptSpinner.style.display = 'inline';
        chatgptButton.disabled = true;
        
        // Make API call to get ChatGPT analysis
        fetch(`/api/chatgpt-analysis?symbol=${encodeURIComponent(symbol)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Display ChatGPT analysis
                this.displayChatGPTAnalysis(data);
            })
            .catch(error => {
                console.error('Error fetching ChatGPT analysis:', error);
                document.getElementById('chatgptAnalysis').innerHTML = `
                    <div class="error-message">
                        <p>Error fetching ChatGPT analysis: ${error.message}</p>
                        <p>Make sure your OpenAI API key is set in the environment variables.</p>
                    </div>
                `;
            })
            .finally(() => {
                // Reset button state
                chatgptText.style.display = 'inline';
                chatgptSpinner.style.display = 'none';
                chatgptButton.disabled = false;
            });
    }
    
    displayChatGPTAnalysis(data) {
        const chatgptAnalysisElement = document.getElementById('chatgptAnalysis');
        
        if (data.error) {
            chatgptAnalysisElement.innerHTML = `
                <div class="error-message">
                    <p>${data.error}</p>
                </div>
            `;
            return;
        }
        
        // Get ChatGPT analysis from response
        const chatgptData = data.chatgpt_analysis;
        
        if (chatgptData.error) {
            chatgptAnalysisElement.innerHTML = `
                <div class="error-message">
                    <p>${chatgptData.error}</p>
                </div>
            `;
            return;
        }
        
        // Format and display the ChatGPT analysis
        const analysisText = chatgptData.chatgpt_analysis || "No analysis available";
        
        // Convert line breaks to HTML and format numbered lists
        const formattedAnalysis = analysisText
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n([0-9]+\.)/g, '<br>$1')
            .replace(/\n/g, '<br>');
        
        chatgptAnalysisElement.innerHTML = `
            <div class="chatgpt-content">
                <p>${formattedAnalysis}</p>
            </div>
        `;
        
        // Show the AI analysis panel if it's hidden
        document.getElementById('aiAnalysisContent').style.display = 'block';
    }

    displayAnalysis(data) {
        const { analysis, insights } = data;

        // Show the content panel
        document.getElementById('aiAnalysisContent').style.display = 'block';

        // Update AI recommendation
        const confidence = Math.round((insights.confidence_score || 0.5) * 100);
        document.getElementById('aiRecommendation').textContent = 
            insights.ai_insight || 'No specific insights available';
        document.getElementById('confidenceScore').textContent = `${confidence}%`;

        // Update technical indicators
        const tech = analysis.technical_indicators || {};
        document.getElementById('aiTrend').textContent = analysis.trend || '--';
        document.getElementById('aiRSI').textContent = 
            tech.rsi ? tech.rsi.toFixed(1) : '--';
        
        const sr = analysis.support_resistance || {};
        document.getElementById('aiSupport').textContent = 
            sr.support ? sr.support.toFixed(5) : '--';
        document.getElementById('aiResistance').textContent = 
            sr.resistance ? sr.resistance.toFixed(5) : '--';

        // Update patterns
        const patterns = analysis.patterns || [];
        const patternsContainer = document.getElementById('aiPatterns');
        if (patterns.length > 0) {
            patternsContainer.innerHTML = patterns
                .map(pattern => `<div class="pattern-item">${pattern}</div>`)
                .join('');
        } else {
            patternsContainer.innerHTML = '<div class="pattern-item">No patterns detected</div>';
        }

        // Update rule-based insights
        const ruleInsights = insights.rule_based_insights || [];
        if (ruleInsights.length > 0) {
            const insightText = document.getElementById('aiRecommendation');
            insightText.innerHTML += '<br><br><strong>Additional Insights:</strong><br>' + 
                ruleInsights.map(insight => `• ${insight}`).join('<br>');
        }
    }

    displayQuickInsights(data) {
        // Show the content panel
        document.getElementById('aiAnalysisContent').style.display = 'block';

        // Update quick stats
        const changePercent = data.price_change_pct || 0;
        const changeText = changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`;
        const changeColor = changePercent > 0 ? '#4caf50' : changePercent < 0 ? '#f44336' : '#666';
        
        const priceChangeEl = document.getElementById('priceChange');
        priceChangeEl.textContent = changeText;
        priceChangeEl.style.color = changeColor;

        // Update recommendation
        const recommendation = data.recommendation || 'Hold';
        const recEl = document.getElementById('quickRecommendation');
        recEl.textContent = recommendation;
        recEl.className = `stat-value recommendation ${recommendation.toLowerCase()}`;

        // Update RSI if available
        if (data.rsi) {
            document.getElementById('aiRSI').textContent = data.rsi;
        }

        // Update trend
        document.getElementById('aiTrend').textContent = data.trend || '--';
    }

    displaySentiment(data) {
        const resultDiv = document.getElementById('sentimentResult');
        const labelEl = document.getElementById('sentimentLabel');
        const confidenceEl = document.getElementById('sentimentConfidence');

        const sentiment = data.sentiment || 'neutral';
        const confidence = Math.round((data.confidence || 0.5) * 100);

        labelEl.textContent = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
        confidenceEl.textContent = `${confidence}%`;

        // Color coding
        const colors = {
            positive: '#4caf50',
            negative: '#f44336',
            neutral: '#ff9800'
        };
        labelEl.style.color = colors[sentiment] || colors.neutral;

        resultDiv.style.display = 'block';
    }

    setAnalyzing(analyzing) {
        this.isAnalyzing = analyzing;
        const button = document.getElementById('runAIAnalysis');
        const text = document.getElementById('aiAnalysisText');
        const spinner = document.getElementById('aiAnalysisSpinner');

        if (analyzing) {
            button.disabled = true;
            text.style.display = 'none';
            spinner.style.display = 'inline';
        } else {
            button.disabled = false;
            text.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('aiError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        document.getElementById('aiError').style.display = 'none';
    }
}

// Initialize AI Analysis Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiAnalysisManager = new AIAnalysisManager();
});

// Auto-analyze when new data is fetched (integrate with existing code)
if (typeof window !== 'undefined') {
    window.addEventListener('dataFetched', () => {
        if (window.aiAnalysisManager) {
            // Auto-run quick insights when new data is available
            setTimeout(() => {
                window.aiAnalysisManager.getQuickInsights();
            }, 1000);
        }
    });
}
