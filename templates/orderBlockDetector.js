// order_block_detector.js - Precise Order Block Detection (Last Candle Before CHOCH)
export function detectOrderBlocks(data) {
  console.log('detectOrderBlocks: Called with data length:', data ? data.length : 'null');
  
  if (!data || data.length < 20) {
    console.warn('detectOrderBlocks: Insufficient data for order block detection:', data.length);
    return { bullish: [], bearish: [] };
  }

  const orderBlocks = { bullish: [], bearish: [] };
  const maxOrderBlocks = 8; // Allow more since we're being more precise

  // First, identify Change of Character (CHOCH) points
  const chochPoints = identifyChangeOfCharacter(data);
  
  console.log('CHOCH points identified:', chochPoints.length);

  // For each CHOCH, find the last opposite candle before it
  chochPoints.forEach(choch => {
    if (choch.type === 'bullish') {
      // For bullish CHOCH, find the last bearish candle before it
      const bullishOB = findLastBearishCandleBeforeCHOCH(data, choch.index);
      if (bullishOB && orderBlocks.bullish.length < maxOrderBlocks) {
        orderBlocks.bullish.push(bullishOB);
      }
    } else if (choch.type === 'bearish') {
      // For bearish CHOCH, find the last bullish candle before it
      const bearishOB = findLastBullishCandleBeforeCHOCH(data, choch.index);
      if (bearishOB && orderBlocks.bearish.length < maxOrderBlocks) {
        orderBlocks.bearish.push(bearishOB);
      }
    }
  });

  // Remove overlapping order blocks and keep the most recent ones
  orderBlocks.bullish = filterOverlappingOrderBlocks(orderBlocks.bullish);
  orderBlocks.bearish = filterOverlappingOrderBlocks(orderBlocks.bearish);

  console.log('detectOrderBlocks: Order Blocks detected:', {
    bullish: orderBlocks.bullish.length,
    bearish: orderBlocks.bearish.length
  });
  
  return orderBlocks;
}

// Identify Change of Character (CHOCH) points in the data
function identifyChangeOfCharacter(data) {
  const chochPoints = [];
  const swingLength = 5; // Number of candles to confirm swing high/low
  
  // Find swing highs and lows first
  const swings = [];
  
  for (let i = swingLength; i < data.length - swingLength; i++) {
    const candle = data[i];
    
    // Check for swing high
    let isSwingHigh = true;
    for (let j = i - swingLength; j <= i + swingLength; j++) {
      if (j !== i && data[j].high >= candle.high) {
        isSwingHigh = false;
        break;
      }
    }
    
    // Check for swing low
    let isSwingLow = true;
    for (let j = i - swingLength; j <= i + swingLength; j++) {
      if (j !== i && data[j].low <= candle.low) {
        isSwingLow = false;
        break;
      }
    }
    
    if (isSwingHigh) {
      swings.push({ index: i, type: 'high', price: candle.high, time: candle.time });
    } else if (isSwingLow) {
      swings.push({ index: i, type: 'low', price: candle.low, time: candle.time });
    }
  }
  
  // Identify CHOCH by looking for breaks in market structure
  for (let i = 2; i < swings.length; i++) {
    const currentSwing = swings[i];
    const prevSwing = swings[i - 1];
    const prevPrevSwing = swings[i - 2];
    
    // Bullish CHOCH: Break above previous swing high after making lower lows
    if (currentSwing.type === 'high' && prevSwing.type === 'low' && prevPrevSwing.type === 'high') {
      if (currentSwing.price > prevPrevSwing.price) {
        chochPoints.push({
          index: currentSwing.index,
          type: 'bullish',
          price: currentSwing.price,
          time: currentSwing.time,
          breakLevel: prevPrevSwing.price
        });
      }
    }
    
    // Bearish CHOCH: Break below previous swing low after making higher highs
    if (currentSwing.type === 'low' && prevSwing.type === 'high' && prevPrevSwing.type === 'low') {
      if (currentSwing.price < prevPrevSwing.price) {
        chochPoints.push({
          index: currentSwing.index,
          type: 'bearish',
          price: currentSwing.price,
          time: currentSwing.time,
          breakLevel: prevPrevSwing.price
        });
      }
    }
  }
  
  return chochPoints;
}

// Find the last bearish candle before a bullish CHOCH
function findLastBearishCandleBeforeCHOCH(data, chochIndex) {
  // Look back from CHOCH to find the last bearish candle
  for (let i = chochIndex - 1; i >= Math.max(0, chochIndex - 20); i--) {
    const candle = data[i];
    
    // Check if candle is bearish (close < open)
    if (candle.close < candle.open) {
      // Validate this is a significant bearish candle
      const bodySize = candle.open - candle.close;
      const totalRange = candle.high - candle.low;
      
      // Must have reasonable body size (not just a doji)
      if (bodySize > totalRange * 0.3) {
        // Check for mitigation
        const mitigationIndex = findMitigationPoint(data, i + 1, candle.high, candle.low, 'bullish');
        
        return {
          startTime: candle.time,
          endTime: mitigationIndex !== -1 ? data[mitigationIndex].time : data[data.length - 1].time,
          high: candle.high,
          low: candle.low,
          mitigated: mitigationIndex !== -1,
          fresh: mitigationIndex === -1,
          type: 'bullish',
          zoneType: 'Last Bearish Before CHOCH',
          strength: calculateCandleStrength(candle),
          time: candle.time,
          chochIndex: chochIndex
        };
      }
    }
  }
  
  return null;
}

// Find the last bullish candle before a bearish CHOCH
function findLastBullishCandleBeforeCHOCH(data, chochIndex) {
  // Look back from CHOCH to find the last bullish candle
  for (let i = chochIndex - 1; i >= Math.max(0, chochIndex - 20); i--) {
    const candle = data[i];
    
    // Check if candle is bullish (close > open)
    if (candle.close > candle.open) {
      // Validate this is a significant bullish candle
      const bodySize = candle.close - candle.open;
      const totalRange = candle.high - candle.low;
      
      // Must have reasonable body size (not just a doji)
      if (bodySize > totalRange * 0.3) {
        // Check for mitigation
        const mitigationIndex = findMitigationPoint(data, i + 1, candle.high, candle.low, 'bearish');
        
        return {
          startTime: candle.time,
          endTime: mitigationIndex !== -1 ? data[mitigationIndex].time : data[data.length - 1].time,
          high: candle.high,
          low: candle.low,
          mitigated: mitigationIndex !== -1,
          fresh: mitigationIndex === -1,
          type: 'bearish',
          zoneType: 'Last Bullish Before CHOCH',
          strength: calculateCandleStrength(candle),
          time: candle.time,
          chochIndex: chochIndex
        };
      }
    }
  }
  
  return null;
}

// Calculate strength of individual candle
function calculateCandleStrength(candle) {
  const bodySize = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  const bodyRatio = totalRange > 0 ? bodySize / totalRange : 0;
  
  // Strength based on body-to-range ratio and absolute size
  let strength = bodyRatio * 2; // 0-2 range
  
  // Bonus for larger ranges (institutional activity)
  if (totalRange > 0) {
    const rangeBonus = Math.min(totalRange / candle.close * 1000, 1); // Normalize range bonus
    strength += rangeBonus;
  }
  
  return Math.min(strength, 3); // Cap at 3
}

// Find mitigation point for an order block
function findMitigationPoint(data, startIndex, high, low, type) {
  if (!data || startIndex >= data.length) return -1;
  
  for (let i = startIndex; i < data.length; i++) {
    const candle = data[i];
    
    if (type === 'bullish') {
      // Bullish order block is mitigated when price goes below the low
      if (candle.low < low) {
        return i;
      }
    } else {
      // Bearish order block is mitigated when price goes above the high
      if (candle.high > high) {
        return i;
      }
    }
  }
  
  return -1; // Not mitigated
}



// Filter overlapping order blocks to keep the most recent ones
function filterOverlappingOrderBlocks(orderBlocks) {
  if (orderBlocks.length <= 1) return orderBlocks;
  
  // Sort by time (most recent first) for CHOCH-based order blocks
  orderBlocks.sort((a, b) => b.time - a.time);
  
  const filtered = [];
  
  for (const ob of orderBlocks) {
    let overlaps = false;
    
    for (const existing of filtered) {
      // Check for price overlap
      const priceOverlap = !(ob.high < existing.low || ob.low > existing.high);
      
      if (priceOverlap) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      filtered.push(ob);
    }
  }
  
  return filtered.slice(0, 8); // Allow more since we're being precise
}

// Legacy functions for compatibility
function detectPivotHigh(values, length) {
  if (values.length < length * 2 + 1) return false;
  const mid = Math.floor(values.length / 2);
  const midValue = values[mid];
  
  for (let i = 0; i < values.length; i++) {
    if (i !== mid && values[i] >= midValue) {
      return false;
    }
  }
  return true;
}

function detectPivotLow(values, length) {
  if (values.length < length * 2 + 1) return false;
  const mid = Math.floor(values.length / 2);
  const midValue = values[mid];
  
  for (let i = 0; i < values.length; i++) {
    if (i !== mid && values[i] <= midValue) {
      return false;
    }
  }
  return true;
}



// Check if price previously respected this level
function checkForPriceRespect(data, orderBlock, triggerIndex) {
  const lookbackPeriod = Math.min(50, triggerIndex);
  const tolerance = (orderBlock.high - orderBlock.low) * 0.1; // 10% tolerance
  let respectCount = 0;
  
  for (let i = triggerIndex - lookbackPeriod; i < triggerIndex - 1; i++) {
    if (i < 0) continue;
    
    const candle = data[i];
    
    // Check if price touched but didn't break the zone
    if (orderBlock.type === 'bullish') {
      if (candle.low <= orderBlock.high + tolerance && candle.low >= orderBlock.low - tolerance) {
        if (candle.close > orderBlock.low) {
          respectCount++;
        }
      }
    } else {
      if (candle.high >= orderBlock.low - tolerance && candle.high <= orderBlock.high + tolerance) {
        if (candle.close < orderBlock.high) {
          respectCount++;
        }
      }
    }
  }
  
  return respectCount >= 1; // At least one previous respect
}

// Check for clean breakout without immediate re-entry
function checkForCleanBreakout(data, orderBlock, triggerIndex) {
  const checkPeriod = Math.min(5, data.length - triggerIndex - 1);
  
  for (let i = triggerIndex + 1; i <= triggerIndex + checkPeriod; i++) {
    if (i >= data.length) break;
    
    const candle = data[i];
    
    if (orderBlock.type === 'bullish') {
      // For bullish OB, price shouldn't immediately fall back into the zone
      if (candle.close < orderBlock.high) {
        return false;
      }
    } else {
      // For bearish OB, price shouldn't immediately rise back into the zone
      if (candle.close > orderBlock.low) {
        return false;
      }
    }
  }
  
  return true;
}

// Check for significant price movement after order block formation
function checkForSignificantMove(data, orderBlock, triggerIndex) {
  const checkPeriod = Math.min(10, data.length - triggerIndex - 1);
  if (checkPeriod < 3) return false;
  
  const triggerCandle = data[triggerIndex];
  const endIndex = triggerIndex + checkPeriod;
  const endCandle = data[Math.min(endIndex, data.length - 1)];
  
  const zoneHeight = orderBlock.high - orderBlock.low;
  const priceMove = Math.abs(endCandle.close - triggerCandle.close);
  
  // Price movement should be at least 2x the order block height
  return priceMove >= zoneHeight * 2;
}

// Analyze demand zone characteristics for institutional buying pressure
function analyzeDemandZone(data, currentIndex, lookback) {
  if (currentIndex < lookback + 2) {
    return { isValidDemand: false, strength: 0 };
  }
  
  const currentCandle = data[currentIndex];
  const analysisWindow = data.slice(Math.max(0, currentIndex - lookback), currentIndex + 1);
  
  // 1. Check for accumulation pattern (multiple touches at similar lows)
  const accumulationScore = checkAccumulationPattern(analysisWindow, 'demand');
  
  // 2. Analyze volume characteristics (if available)
  const volumeScore = analyzeVolumeProfile(analysisWindow, 'demand');
  
  // 3. Check for rejection wicks (buyers stepping in)
  const rejectionScore = analyzeRejectionWicks(analysisWindow, 'demand');
  
  // 4. Look for spring action (false breakdown followed by recovery)
  const springScore = checkSpringAction(data, currentIndex, lookback);
  
  // 5. Analyze buying pressure through consecutive higher lows
  const buyingPressureScore = analyzeBuyingPressure(analysisWindow);
  
  // Calculate overall demand strength
  const totalScore = accumulationScore + volumeScore + rejectionScore + springScore + buyingPressureScore;
  const maxPossibleScore = 5.0; // Each component contributes max 1.0
  const strength = (totalScore / maxPossibleScore) * 3; // Scale to 0-3 range
  
  // Demand zone is valid if it shows institutional characteristics
  const isValidDemand = totalScore >= 2.5 && // At least 50% of criteria met
                       accumulationScore > 0.3 && // Must show some accumulation
                       rejectionScore > 0.2; // Must show buyer rejection
  
  return {
    isValidDemand,
    strength,
    components: {
      accumulation: accumulationScore,
      volume: volumeScore,
      rejection: rejectionScore,
      spring: springScore,
      buyingPressure: buyingPressureScore
    }
  };
}

// Analyze supply zone characteristics for institutional selling pressure
function analyzeSupplyZone(data, currentIndex, lookback) {
  if (currentIndex < lookback + 2) {
    return { isValidSupply: false, strength: 0 };
  }
  
  const currentCandle = data[currentIndex];
  const analysisWindow = data.slice(Math.max(0, currentIndex - lookback), currentIndex + 1);
  
  // 1. Check for distribution pattern (multiple touches at similar highs)
  const distributionScore = checkAccumulationPattern(analysisWindow, 'supply');
  
  // 2. Analyze volume characteristics (if available)
  const volumeScore = analyzeVolumeProfile(analysisWindow, 'supply');
  
  // 3. Check for rejection wicks (sellers stepping in)
  const rejectionScore = analyzeRejectionWicks(analysisWindow, 'supply');
  
  // 4. Look for upthrust action (false breakout followed by decline)
  const upthrustScore = checkUpthrustAction(data, currentIndex, lookback);
  
  // 5. Analyze selling pressure through consecutive lower highs
  const sellingPressureScore = analyzeSellingPressure(analysisWindow);
  
  // Calculate overall supply strength
  const totalScore = distributionScore + volumeScore + rejectionScore + upthrustScore + sellingPressureScore;
  const maxPossibleScore = 5.0; // Each component contributes max 1.0
  const strength = (totalScore / maxPossibleScore) * 3; // Scale to 0-3 range
  
  // Supply zone is valid if it shows institutional characteristics
  const isValidSupply = totalScore >= 2.5 && // At least 50% of criteria met
                       distributionScore > 0.3 && // Must show some distribution
                       rejectionScore > 0.2; // Must show seller rejection
  
  return {
    isValidSupply,
    strength,
    components: {
      distribution: distributionScore,
      volume: volumeScore,
      rejection: rejectionScore,
      upthrust: upthrustScore,
      sellingPressure: sellingPressureScore
    }
  };
}

// Check for accumulation/distribution patterns
function checkAccumulationPattern(window, type) {
  if (window.length < 3) return 0;
  
  let touchCount = 0;
  let priceLevel;
  const tolerance = 0.001; // 0.1% tolerance
  
  if (type === 'demand') {
    // Find the lowest low in the window
    priceLevel = Math.min(...window.map(c => c.low));
    
    // Count how many candles touched this level
    window.forEach(candle => {
      if (Math.abs(candle.low - priceLevel) / priceLevel <= tolerance) {
        touchCount++;
      }
    });
  } else {
    // Find the highest high in the window
    priceLevel = Math.max(...window.map(c => c.high));
    
    // Count how many candles touched this level
    window.forEach(candle => {
      if (Math.abs(candle.high - priceLevel) / priceLevel <= tolerance) {
        touchCount++;
      }
    });
  }
  
  // Score based on number of touches (more touches = stronger accumulation/distribution)
  return Math.min(touchCount / 3, 1.0); // Max score of 1.0 for 3+ touches
}

// Analyze volume profile for institutional activity
function analyzeVolumeProfile(window, type) {
  if (window.length < 2) return 0;
  
  // If volume data is not available, use price action as proxy
  let volumeScore = 0;
  const avgRange = window.reduce((sum, c) => sum + (c.high - c.low), 0) / window.length;
  
  window.forEach((candle, index) => {
    const range = candle.high - candle.low;
    const bodySize = Math.abs(candle.close - candle.open);
    
    if (type === 'demand') {
      // Look for buying volume characteristics
      if (candle.close > candle.open && range > avgRange * 1.2 && bodySize > range * 0.6) {
        volumeScore += 0.2;
      }
    } else {
      // Look for selling volume characteristics
      if (candle.close < candle.open && range > avgRange * 1.2 && bodySize > range * 0.6) {
        volumeScore += 0.2;
      }
    }
  });
  
  return Math.min(volumeScore, 1.0);
}

// Analyze rejection wicks for institutional intervention
function analyzeRejectionWicks(window, type) {
  if (window.length < 2) return 0;
  
  let rejectionScore = 0;
  
  window.forEach(candle => {
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    
    if (type === 'demand') {
      // Look for lower wicks (buyers stepping in)
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;
      const upperWick = candle.high - Math.max(candle.open, candle.close);
      
      if (lowerWick > bodySize * 1.5 && lowerWick > upperWick * 2) {
        rejectionScore += 0.3;
      }
    } else {
      // Look for upper wicks (sellers stepping in)
      const upperWick = candle.high - Math.max(candle.open, candle.close);
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;
      
      if (upperWick > bodySize * 1.5 && upperWick > lowerWick * 2) {
        rejectionScore += 0.3;
      }
    }
  });
  
  return Math.min(rejectionScore, 1.0);
}

// Check for spring action (false breakdown followed by recovery)
function checkSpringAction(data, currentIndex, lookback) {
  if (currentIndex < lookback + 5) return 0;
  
  const window = data.slice(currentIndex - lookback - 5, currentIndex + 1);
  let springScore = 0;
  
  // Look for a pattern where price breaks below a support level then quickly recovers
  for (let i = 5; i < window.length - 2; i++) {
    const supportLevel = Math.min(...window.slice(0, i).map(c => c.low));
    const breakdownCandle = window[i];
    const recoveryCandle = window[i + 1];
    
    // Check for breakdown below support
    if (breakdownCandle.low < supportLevel * 0.999) {
      // Check for quick recovery
      if (recoveryCandle.close > supportLevel && recoveryCandle.close > breakdownCandle.open) {
        springScore += 0.5;
      }
    }
  }
  
  return Math.min(springScore, 1.0);
}

// Check for upthrust action (false breakout followed by decline)
function checkUpthrustAction(data, currentIndex, lookback) {
  if (currentIndex < lookback + 5) return 0;
  
  const window = data.slice(currentIndex - lookback - 5, currentIndex + 1);
  let upthrustScore = 0;
  
  // Look for a pattern where price breaks above resistance then quickly declines
  for (let i = 5; i < window.length - 2; i++) {
    const resistanceLevel = Math.max(...window.slice(0, i).map(c => c.high));
    const breakoutCandle = window[i];
    const declineCandle = window[i + 1];
    
    // Check for breakout above resistance
    if (breakoutCandle.high > resistanceLevel * 1.001) {
      // Check for quick decline
      if (declineCandle.close < resistanceLevel && declineCandle.close < breakoutCandle.open) {
        upthrustScore += 0.5;
      }
    }
  }
  
  return Math.min(upthrustScore, 1.0);
}

// Analyze buying pressure through consecutive higher lows
function analyzeBuyingPressure(window) {
  if (window.length < 3) return 0;
  
  let higherLowCount = 0;
  let totalComparisons = 0;
  
  for (let i = 1; i < window.length; i++) {
    if (window[i].low > window[i - 1].low) {
      higherLowCount++;
    }
    totalComparisons++;
  }
  
  // Score based on percentage of higher lows
  return totalComparisons > 0 ? higherLowCount / totalComparisons : 0;
}

// Analyze selling pressure through consecutive lower highs
function analyzeSellingPressure(window) {
  if (window.length < 3) return 0;
  
  let lowerHighCount = 0;
  let totalComparisons = 0;
  
  for (let i = 1; i < window.length; i++) {
    if (window[i].high < window[i - 1].high) {
      lowerHighCount++;
    }
    totalComparisons++;
  }
  
  // Score based on percentage of lower highs
  return totalComparisons > 0 ? lowerHighCount / totalComparisons : 0;
}

function detectPivotHigh(values, length) {
  if (values.length < length * 2 + 1) return false;
  const mid = Math.floor(values.length / 2);
  const midValue = values[mid];
  for (let i = 0; i < values.length; i++) {
    if (i !== mid && values[i] > midValue) {
      return false;
    }
  }
  return true;
}

function findMitigationPoint(data, startTime, high, low, type) {
  const startIndex = data.findIndex(d => d.time === startTime);
  if (startIndex === -1) return -1;
  const maxLookAhead = Math.min(50, data.length - startIndex - 1);
  for (let i = startIndex + 1; i <= startIndex + maxLookAhead; i++) {
    const c = data[i];
    if (type === 'bullish') {
      if (c.low <= high && c.high >= low) {
        return i;
      }
    } else if (type === 'bearish') {
      if (c.high >= low && c.low <= high) {
        return i;
      }
    }
  }
  return -1;
}

console.log('order_block_detector.js loaded');