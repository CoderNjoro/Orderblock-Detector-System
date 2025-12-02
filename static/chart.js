let chart;
let candleSeries;
let volumeSeries;
let obLines = [];
let currentTheme = 'dark';
let isLoading = false;

// Enhanced chart configuration with TradingView styling
const chartConfig = {
  dark: {
    layout: {
      background: { color: '#131722' },
      textColor: '#d1d4dc',
    },
    grid: {
      vertLines: { color: '#363c4e' },
      horzLines: { color: '#363c4e' },
    },
    rightPriceScale: {
      borderColor: '#485c7b',
      textColor: '#d1d4dc',
    },
    timeScale: {
      borderColor: '#485c7b',
      textColor: '#d1d4dc',
      timeVisible: true,
      secondsVisible: false,
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: {
        color: '#758696',
        width: 1,
        style: LightweightCharts.LineStyle.Dashed,
      },
      horzLine: {
        color: '#758696',
        width: 1,
        style: LightweightCharts.LineStyle.Dashed,
      },
    },
  },
  light: {
    layout: {
      background: { color: '#ffffff' },
      textColor: '#191919',
    },
    grid: {
      vertLines: { color: '#f0f3fa' },
      horzLines: { color: '#f0f3fa' },
    },
    rightPriceScale: {
      borderColor: '#d6dcde',
      textColor: '#191919',
    },
    timeScale: {
      borderColor: '#d6dcde',
      textColor: '#191919',
      timeVisible: true,
      secondsVisible: false,
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: {
        color: '#9598a1',
        width: 1,
        style: LightweightCharts.LineStyle.Dashed,
      },
      horzLine: {
        color: '#9598a1',
        width: 1,
        style: LightweightCharts.LineStyle.Dashed,
      },
    },
  }
};

// Enhanced candlestick colors
const candleColors = {
  dark: {
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderUpColor: '#26a69a',
    borderDownColor: '#ef5350',
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  },
  light: {
    upColor: '#089981',
    downColor: '#f23645',
    borderUpColor: '#089981',
    borderDownColor: '#f23645',
    wickUpColor: '#089981',
    wickDownColor: '#f23645',
  }
};

function createChart() {
  if (chart) {
    chart.remove();
  }

  const container = document.getElementById('chart');
  const config = chartConfig[currentTheme];
  
  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: 600,
    ...config,
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: true,
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true,
    },
  });

  // Add candlestick series with enhanced styling
  candleSeries = chart.addCandlestickSeries({
    ...candleColors[currentTheme],
    priceFormat: {
      type: 'price',
      precision: 5,
      minMove: 0.00001,
    },
  });

  // Add volume series (placeholder for future enhancement)
  // volumeSeries = chart.addHistogramSeries({
  //   color: '#26a69a',
  //   priceFormat: {
  //     type: 'volume',
  //   },
  //   priceScaleId: 'volume',
  // });

  // Enhanced resize handling
  const resizeObserver = new ResizeObserver(entries => {
    if (entries.length === 0 || entries[0].target !== container) return;
    
    const { width, height } = entries[0].contentRect;
    chart.applyOptions({ width, height: Math.max(400, height) });
  });

  resizeObserver.observe(container);

  // Add mouse interaction feedback
  chart.subscribeCrosshairMove(param => {
    if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
      return;
    }

    const data = param.seriesData.get(candleSeries);
    if (data) {
      updatePriceDisplay(data);
    }
  });

  return chart;
}

function updatePriceDisplay(data) {
  // Update price display in UI (you can implement this based on your HTML structure)
  const priceElement = document.getElementById('currentPrice');
  if (priceElement && data) {
    priceElement.textContent = `O: ${data.open?.toFixed(5)} H: ${data.high?.toFixed(5)} L: ${data.low?.toFixed(5)} C: ${data.close?.toFixed(5)}`;
  }
}

function drawOrderBlocks(data) {
  // Clear existing order blocks efficiently
  obLines.forEach(line => {
    try {
      chart.removeSeries(line);
    } catch (e) {
      // Ignore errors for already removed series
    }
  });
  obLines = [];

  if (data.length < 50) return; // Not enough data for analysis

  const recentCandles = data.slice(-Math.min(200, data.length));
  const obColor = currentTheme === 'dark' ? 
    { bullish: '#26a69a40', bearish: '#ef535040' } : 
    { bullish: '#08998140', bearish: '#f2364540' };

  for (let i = 1; i < recentCandles.length - 2; i++) {
    const curr = recentCandles[i];
    const next = recentCandles[i + 1];
    const prev = recentCandles[i - 1];

    // Enhanced Bullish Order Block Detection
    if (isBullishOB(prev, curr, next)) {
      const rectangle = createOrderBlockRectangle(curr, data[data.length - 1], obColor.bullish, 'bullish');
      if (rectangle) obLines.push(rectangle);
    }

    // Enhanced Bearish Order Block Detection
    if (isBearishOB(prev, curr, next)) {
      const rectangle = createOrderBlockRectangle(curr, data[data.length - 1], obColor.bearish, 'bearish');
      if (rectangle) obLines.push(rectangle);
    }
  }
}

function isBullishOB(prev, curr, next) {
  return curr.close < curr.open && // Current candle is bearish
         next.close > curr.high && // Next candle breaks above current high
         curr.low < prev.low; // Current candle makes a lower low
}

function isBearishOB(prev, curr, next) {
  return curr.close > curr.open && // Current candle is bullish
         next.close < curr.low && // Next candle breaks below current low
         curr.high > prev.high; // Current candle makes a higher high
}

function createOrderBlockRectangle(candle, lastCandle, color, type) {
  try {
    // Create a more sophisticated order block visualization
    const topLine = chart.addLineSeries({
      color: type === 'bullish' ? '#26a69a' : '#ef5350',
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      crosshairMarkerVisible: false,
    });

    const bottomLine = chart.addLineSeries({
      color: type === 'bullish' ? '#26a69a' : '#ef5350',
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      crosshairMarkerVisible: false,
    });

    topLine.setData([
      { time: candle.time, value: candle.high },
      { time: lastCandle.time, value: candle.high }
    ]);

    bottomLine.setData([
      { time: candle.time, value: candle.low },
      { time: lastCandle.time, value: candle.low }
    ]);

    return [topLine, bottomLine];
  } catch (error) {
    console.warn('Error creating order block:', error);
    return null;
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  loadChart(); // Recreate chart with new theme
}

function setLoading(loading) {
  isLoading = loading;
  const loadingElement = document.getElementById('loadingIndicator');
  if (loadingElement) {
    loadingElement.style.display = loading ? 'block' : 'none';
  }
}

async function loadChart() {
  if (isLoading) return;
  
  const input = document.getElementById('symbolInput').value || 'EUR/USD';
  const symbol = input.toUpperCase().trim();
  
  setLoading(true);
  createChart();

  try {
    const response = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&timeframe=1h`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data received for the requested symbol');
    }

    const formattedData = data.map(d => ({
      time: Math.floor(d.time / 1000),
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
    })).filter(d => 
      !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close)
    );

    if (formattedData.length === 0) {
      throw new Error('No valid data after formatting');
    }

    candleSeries.setData(formattedData);
    
    // Smart fitting - show recent data with some context
    chart.timeScale().fitContent();
    
    // Draw order blocks with debouncing for performance
    setTimeout(() => drawOrderBlocks(formattedData), 100);
    
    // Update symbol display
    updateSymbolDisplay(symbol);
    
  } catch (err) {
    console.error('Chart loading error:', err);
    showError(`Failed to load chart data: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

function updateSymbolDisplay(symbol) {
  const symbolElement = document.getElementById('currentSymbol');
  if (symbolElement) {
    symbolElement.textContent = symbol;
  }
}

function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}

// Enhanced initialization
window.onload = () => {
  const symbolInput = document.getElementById('symbolInput');
  if (symbolInput) {
    symbolInput.value = 'EUR/USD';
    
    // Add enter key support
    symbolInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadChart();
      }
    });
  }

  // Add theme toggle button functionality
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Initial load
  loadChart();
};

// Add global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  setLoading(false);
});

// Performance optimization: debounce resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (chart) {
      chart.applyOptions({
        width: document.getElementById('chart').clientWidth,
      });
    }
  }, 250);
});