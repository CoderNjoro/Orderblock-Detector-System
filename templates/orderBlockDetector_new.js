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

console.log('CHOCH-based order_block_detector.js loaded');
