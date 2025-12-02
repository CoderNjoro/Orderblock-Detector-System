// Smart Money Concepts Detector - Adapted from TradingView Pine Script
// Implements precise CHOCH-based order block detection with institutional analysis

export class SmartMoneyDetector {
    constructor() {
        this.BULLISH = 1;
        this.BEARISH = -1;
        this.swingLength = 5;
        this.internalLength = 3;
        this.maxOrderBlocks = 10;
        this.atrPeriod = 14;
        this.volatilityThreshold = 2.0;
    }

    // Main detection function
    detectSmartMoneyConcepts(data) {
        if (!data || data.length < 50) {
            return {
                orderBlocks: { bullish: [], bearish: [] },
                structures: { bullish: [], bearish: [] },
                fairValueGaps: [],
                equalLevels: { highs: [], lows: [] }
            };
        }

        // Calculate ATR for volatility filtering
        const atr = this.calculateATR(data, this.atrPeriod);
        
        // Detect swing structure
        const swingStructure = this.detectSwingStructure(data, this.swingLength);
        
        // Detect internal structure
        const internalStructure = this.detectInternalStructure(data, this.internalLength);
        
        // Detect order blocks based on structure breaks
        const orderBlocks = this.detectOrderBlocks(data, swingStructure, atr);
        
        // Detect fair value gaps
        const fairValueGaps = this.detectFairValueGaps(data, atr);
        
        // Detect equal highs and lows
        const equalLevels = this.detectEqualHighsLows(data, atr);

        return {
            orderBlocks,
            structures: {
                swing: swingStructure,
                internal: internalStructure
            },
            fairValueGaps,
            equalLevels
        };
    }

    // Calculate ATR for volatility measurement
    calculateATR(data, period) {
        const trueRanges = [];
        
        for (let i = 1; i < data.length; i++) {
            const current = data[i];
            const previous = data[i - 1];
            
            const tr1 = current.high - current.low;
            const tr2 = Math.abs(current.high - previous.close);
            const tr3 = Math.abs(current.low - previous.close);
            
            trueRanges.push(Math.max(tr1, tr2, tr3));
        }
        
        // Calculate simple moving average of true ranges
        const atrValues = [];
        for (let i = period - 1; i < trueRanges.length; i++) {
            const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            atrValues.push(sum / period);
        }
        
        return atrValues;
    }

    // Detect swing structure (BOS/CHOCH)
    detectSwingStructure(data, length) {
        const structures = [];
        const pivots = this.identifySwingPivots(data, length);
        let currentTrend = 0; // 0 = neutral, 1 = bullish, -1 = bearish
        
        for (let i = 1; i < pivots.length; i++) {
            const currentPivot = pivots[i];
            const previousPivot = pivots[i - 1];
            
            if (currentPivot.type === 'high' && previousPivot.type === 'low') {
                // Potential bullish structure
                if (currentPivot.price > this.getLastSignificantHigh(pivots, i)) {
                    const structureType = currentTrend === this.BEARISH ? 'CHOCH' : 'BOS';
                    structures.push({
                        type: 'bullish',
                        structureType,
                        index: currentPivot.index,
                        price: currentPivot.price,
                        time: data[currentPivot.index].time,
                        pivot: currentPivot
                    });
                    currentTrend = this.BULLISH;
                }
            } else if (currentPivot.type === 'low' && previousPivot.type === 'high') {
                // Potential bearish structure
                if (currentPivot.price < this.getLastSignificantLow(pivots, i)) {
                    const structureType = currentTrend === this.BULLISH ? 'CHOCH' : 'BOS';
                    structures.push({
                        type: 'bearish',
                        structureType,
                        index: currentPivot.index,
                        price: currentPivot.price,
                        time: data[currentPivot.index].time,
                        pivot: currentPivot
                    });
                    currentTrend = this.BEARISH;
                }
            }
        }
        
        return structures;
    }

    // Detect internal structure (smaller timeframe)
    detectInternalStructure(data, length) {
        return this.detectSwingStructure(data, length);
    }

    // Identify swing pivots
    identifySwingPivots(data, length) {
        const pivots = [];
        
        for (let i = length; i < data.length - length; i++) {
            const current = data[i];
            
            // Check for pivot high
            let isHigh = true;
            for (let j = i - length; j <= i + length; j++) {
                if (j !== i && data[j].high >= current.high) {
                    isHigh = false;
                    break;
                }
            }
            
            if (isHigh) {
                pivots.push({
                    type: 'high',
                    index: i,
                    price: current.high,
                    candle: current
                });
            }
            
            // Check for pivot low
            let isLow = true;
            for (let j = i - length; j <= i + length; j++) {
                if (j !== i && data[j].low <= current.low) {
                    isLow = false;
                    break;
                }
            }
            
            if (isLow) {
                pivots.push({
                    type: 'low',
                    index: i,
                    price: current.low,
                    candle: current
                });
            }
        }
        
        return pivots.sort((a, b) => a.index - b.index);
    }

    // Get last significant high before current index
    getLastSignificantHigh(pivots, currentIndex) {
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (pivots[i].type === 'high') {
                return pivots[i].price;
            }
        }
        return 0;
    }

    // Get last significant low before current index
    getLastSignificantLow(pivots, currentIndex) {
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (pivots[i].type === 'low') {
                return pivots[i].price;
            }
        }
        return Infinity;
    }

    // Detect order blocks based on structure breaks
    detectOrderBlocks(data, structures, atr) {
        const orderBlocks = { bullish: [], bearish: [] };
        
        structures.forEach(structure => {
            if (structure.structureType === 'CHOCH') {
                if (structure.type === 'bullish') {
                    // Find last bearish candle before bullish CHOCH
                    const orderBlock = this.findLastBearishCandleBeforeCHOCH(data, structure.index, atr);
                    if (orderBlock && orderBlocks.bullish.length < this.maxOrderBlocks) {
                        orderBlocks.bullish.push(orderBlock);
                    }
                } else if (structure.type === 'bearish') {
                    // Find last bullish candle before bearish CHOCH
                    const orderBlock = this.findLastBullishCandleBeforeCHOCH(data, structure.index, atr);
                    if (orderBlock && orderBlocks.bearish.length < this.maxOrderBlocks) {
                        orderBlocks.bearish.push(orderBlock);
                    }
                }
            }
        });
        
        // Filter overlapping order blocks
        orderBlocks.bullish = this.filterOverlappingOrderBlocks(orderBlocks.bullish);
        orderBlocks.bearish = this.filterOverlappingOrderBlocks(orderBlocks.bearish);
        
        return orderBlocks;
    }

    // Find last bearish candle before bullish CHOCH
    findLastBearishCandleBeforeCHOCH(data, chochIndex, atr) {
        const lookbackLimit = Math.min(20, chochIndex);
        
        for (let i = chochIndex - 1; i >= chochIndex - lookbackLimit; i--) {
            const candle = data[i];
            
            // Check if candle is bearish and significant
            if (candle.close < candle.open) {
                const candleSize = candle.open - candle.close;
                const avgAtr = atr[Math.min(i, atr.length - 1)] || 0.001;
                
                // Filter out insignificant candles
                if (candleSize >= avgAtr * 0.5) {
                    const strength = this.calculateCandleStrength(candle);
                    const mitigation = this.findMitigationPoint(data, i, candle.high, candle.low, 'bullish');
                    
                    return {
                        index: i,
                        time: candle.time,
                        high: candle.high,
                        low: candle.low,
                        open: candle.open,
                        close: candle.close,
                        type: 'bullish',
                        strength,
                        fresh: !mitigation.mitigated,
                        mitigated: mitigation.mitigated,
                        mitigationIndex: mitigation.index,
                        chochIndex: chochIndex
                    };
                }
            }
        }
        
        return null;
    }

    // Find last bullish candle before bearish CHOCH
    findLastBullishCandleBeforeCHOCH(data, chochIndex, atr) {
        const lookbackLimit = Math.min(20, chochIndex);
        
        for (let i = chochIndex - 1; i >= chochIndex - lookbackLimit; i--) {
            const candle = data[i];
            
            // Check if candle is bullish and significant
            if (candle.close > candle.open) {
                const candleSize = candle.close - candle.open;
                const avgAtr = atr[Math.min(i, atr.length - 1)] || 0.001;
                
                // Filter out insignificant candles
                if (candleSize >= avgAtr * 0.5) {
                    const strength = this.calculateCandleStrength(candle);
                    const mitigation = this.findMitigationPoint(data, i, candle.high, candle.low, 'bearish');
                    
                    return {
                        index: i,
                        time: candle.time,
                        high: candle.high,
                        low: candle.low,
                        open: candle.open,
                        close: candle.close,
                        type: 'bearish',
                        strength,
                        fresh: !mitigation.mitigated,
                        mitigated: mitigation.mitigated,
                        mitigationIndex: mitigation.index,
                        chochIndex: chochIndex
                    };
                }
            }
        }
        
        return null;
    }

    // Calculate candle strength
    calculateCandleStrength(candle) {
        const body = Math.abs(candle.close - candle.open);
        const range = candle.high - candle.low;
        const upperWick = candle.high - Math.max(candle.open, candle.close);
        const lowerWick = Math.min(candle.open, candle.close) - candle.low;
        
        if (range === 0) return 0;
        
        const bodyRatio = body / range;
        const wickRatio = (upperWick + lowerWick) / range;
        
        return bodyRatio * (1 - wickRatio * 0.5);
    }

    // Find mitigation point for order block
    findMitigationPoint(data, startIndex, high, low, type) {
        for (let i = startIndex + 1; i < data.length; i++) {
            const candle = data[i];
            
            if (type === 'bullish') {
                // Bullish order block mitigated when price goes below the low
                if (candle.low <= low) {
                    return { mitigated: true, index: i };
                }
            } else {
                // Bearish order block mitigated when price goes above the high
                if (candle.high >= high) {
                    return { mitigated: true, index: i };
                }
            }
        }
        
        return { mitigated: false, index: null };
    }

    // Filter overlapping order blocks
    filterOverlappingOrderBlocks(orderBlocks) {
        if (orderBlocks.length <= 1) return orderBlocks;
        
        const filtered = [];
        
        orderBlocks.sort((a, b) => b.index - a.index); // Sort by most recent first
        
        for (const ob of orderBlocks) {
            let overlaps = false;
            
            for (const existing of filtered) {
                // Check for price overlap
                const overlapHigh = Math.min(ob.high, existing.high);
                const overlapLow = Math.max(ob.low, existing.low);
                
                if (overlapHigh > overlapLow) {
                    const overlapSize = overlapHigh - overlapLow;
                    const obSize = ob.high - ob.low;
                    const existingSize = existing.high - existing.low;
                    
                    // If overlap is significant (>50% of either block)
                    if (overlapSize > obSize * 0.5 || overlapSize > existingSize * 0.5) {
                        overlaps = true;
                        break;
                    }
                }
            }
            
            if (!overlaps) {
                filtered.push(ob);
            }
        }
        
        return filtered.slice(0, this.maxOrderBlocks);
    }

    // Detect Fair Value Gaps
    detectFairValueGaps(data, atr) {
        const gaps = [];
        
        for (let i = 2; i < data.length; i++) {
            const current = data[i];
            const previous = data[i - 1];
            const twoBarsAgo = data[i - 2];
            
            const avgAtr = atr[Math.min(i, atr.length - 1)] || 0.001;
            
            // Bullish FVG: current low > two bars ago high
            if (current.low > twoBarsAgo.high) {
                const gapSize = current.low - twoBarsAgo.high;
                if (gapSize >= avgAtr * 0.5) { // Filter small gaps
                    gaps.push({
                        type: 'bullish',
                        index: i,
                        time: current.time,
                        top: current.low,
                        bottom: twoBarsAgo.high,
                        size: gapSize,
                        filled: false
                    });
                }
            }
            
            // Bearish FVG: current high < two bars ago low
            if (current.high < twoBarsAgo.low) {
                const gapSize = twoBarsAgo.low - current.high;
                if (gapSize >= avgAtr * 0.5) { // Filter small gaps
                    gaps.push({
                        type: 'bearish',
                        index: i,
                        time: current.time,
                        top: twoBarsAgo.low,
                        bottom: current.high,
                        size: gapSize,
                        filled: false
                    });
                }
            }
        }
        
        return gaps;
    }

    // Detect Equal Highs and Lows
    detectEqualHighsLows(data, atr) {
        const equalLevels = { highs: [], lows: [] };
        const pivots = this.identifySwingPivots(data, this.swingLength);
        const threshold = 0.1; // Sensitivity threshold
        
        // Group pivots by type
        const highs = pivots.filter(p => p.type === 'high');
        const lows = pivots.filter(p => p.type === 'low');
        
        // Find equal highs
        for (let i = 1; i < highs.length; i++) {
            const current = highs[i];
            const previous = highs[i - 1];
            const avgAtr = atr[Math.min(current.index, atr.length - 1)] || 0.001;
            
            if (Math.abs(current.price - previous.price) < threshold * avgAtr) {
                equalLevels.highs.push({
                    price: (current.price + previous.price) / 2,
                    indices: [previous.index, current.index],
                    times: [data[previous.index].time, data[current.index].time]
                });
            }
        }
        
        // Find equal lows
        for (let i = 1; i < lows.length; i++) {
            const current = lows[i];
            const previous = lows[i - 1];
            const avgAtr = atr[Math.min(current.index, atr.length - 1)] || 0.001;
            
            if (Math.abs(current.price - previous.price) < threshold * avgAtr) {
                equalLevels.lows.push({
                    price: (current.price + previous.price) / 2,
                    indices: [previous.index, current.index],
                    times: [data[previous.index].time, data[current.index].time]
                });
            }
        }
        
        return equalLevels;
    }
}

// Export singleton instance
export const smartMoneyDetector = new SmartMoneyDetector();

console.log('Smart Money Concepts Detector loaded');
