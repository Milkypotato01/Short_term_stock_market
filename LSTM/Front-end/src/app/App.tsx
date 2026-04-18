import { Activity, TrendingUp, BarChart3, Zap, Target, Layers, Newspaper, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CandlestickChart } from './components/CandlestickChart';
import { IndicatorPanel } from './components/IndicatorPanel';
import { PredictionGauge } from './components/PredictionGauge';
import { StockHeader } from './components/StockHeader';
import { MarketSummary } from './components/MarketSummary';
import { NewsPanel } from './components/NewsPanel';

const REFRESH_INTERVAL = 30_000; // 30 seconds

const AVAILABLE_STOCKS = [
  'TCS.NS', 'INFY.NS', 'RELIANCE.NS', 'HDFCBANK.NS',
  'AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN',
];

const emptySummary = {
  open: 0, high: 0, low: 0, close: 0, volume: 0,
  fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0, marketCap: 0,
};

const initialStockData = {
  name: 'Loading...',
  exchange: '—',
  price: 0,
  change: '+0.00%',
  candleData: [] as any[],
  summary: { ...emptySummary },
  indicators: {
    rsi: { value: '—', status: 'Neutral' as const },
    macd: { value: '—', status: 'Neutral' as const },
    volume: { value: '—', status: 'Neutral' as const },
    momentum: { value: '—', status: 'Neutral' as const },
    bb: { value: '—', status: 'Neutral' as const },
    stoch: { value: '—', status: 'Neutral' as const },
  },
  prediction: { type: 'BULLISH' as const, confidence: 50 },
  lastUpdated: null as string | null,
};

function App() {
  const [selectedStock, setSelectedStock] = useState('TCS.NS');
  const [currentStock, setCurrentStock] = useState(initialStockData);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [newsOpen, setNewsOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const newsDropdownRef = useRef<HTMLDivElement>(null);
  const newsBtnRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        newsOpen &&
        newsDropdownRef.current &&
        !newsDropdownRef.current.contains(e.target as Node) &&
        newsBtnRef.current &&
        !newsBtnRef.current.contains(e.target as Node)
      ) {
        setNewsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [newsOpen]);

  const fetchStockData = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/analyze?ticker=${selectedStock}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setCurrentStock({
        ...data,
        summary: data.summary || emptySummary,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      });
      setRefreshCount((c) => c + 1);
    } catch (error) {
      console.error('Error fetching from API:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStock]);

  // Fetch on stock change
  useEffect(() => {
    setCurrentStock(initialStockData);
    fetchStockData(false);
  }, [fetchStockData]);

  // Auto-refresh every 30s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchStockData(true);
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStockData]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #020617 0%, #0a0e1a 40%, #0f172a 100%)',
      color: '#f1f5f9',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '20px 24px',
    }}>
      {/* Subtle background grid */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header row with News button */}
        <div style={{ position: 'relative' }}>
          <StockHeader
            name={currentStock.name}
            exchange={currentStock.exchange}
            price={currentStock.price}
            change={currentStock.change}
            ticker={selectedStock}
            lastUpdated={currentStock.lastUpdated}
            loading={loading}
            availableStocks={AVAILABLE_STOCKS}
            onStockChange={setSelectedStock}
          />

          {/* Floating News Button — top right corner */}
          <button
            ref={newsBtnRef}
            id="news-toggle-btn"
            onClick={() => setNewsOpen((v) => !v)}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 16px',
              borderRadius: '12px',
              border: newsOpen
                ? '1px solid rgba(99, 102, 241, 0.5)'
                : '1px solid rgba(148, 163, 184, 0.15)',
              background: newsOpen
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.10))'
                : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
              color: newsOpen ? '#a5b4fc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.5px',
              backdropFilter: 'blur(16px)',
              boxShadow: newsOpen
                ? '0 8px 32px rgba(99, 102, 241, 0.2)'
                : '0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 100,
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!newsOpen) {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.color = '#c7d2fe';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!newsOpen) {
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)';
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
              }
            }}
          >
            {newsOpen ? (
              <X style={{ width: '14px', height: '14px' }} />
            ) : (
              <Newspaper style={{ width: '14px', height: '14px' }} />
            )}
            <span>{newsOpen ? 'Close' : 'News'}</span>
            {!newsOpen && (
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#6366f1',
                boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
                animation: 'pulse-live 2s ease-in-out infinite',
              }} />
            )}
          </button>

          {/* News Dropdown Panel */}
          <div
            ref={newsDropdownRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: '-8px',
              width: '420px',
              maxHeight: newsOpen ? '520px' : '0px',
              opacity: newsOpen ? 1 : 0,
              transform: newsOpen ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
              transformOrigin: 'top right',
              overflow: 'hidden',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 99,
              pointerEvents: newsOpen ? 'auto' : 'none',
              borderRadius: '16px',
              boxShadow: newsOpen
                ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.08)'
                : 'none',
            }}
          >
            <div style={{ height: '500px' }}>
              <NewsPanel ticker={selectedStock} />
            </div>
          </div>
        </div>

        {/* Market Summary Bar */}
        <div style={{ marginTop: '14px' }}>
          <MarketSummary
            summary={currentStock.summary}
            loading={loading}
          />
        </div>

        {/* Main Grid: Chart + Gauge (left) | Indicators (right) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '16px',
          marginTop: '16px',
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Candlestick Chart */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85))',
              border: '1px solid rgba(148, 163, 184, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{ height: '420px' }}>
                {loading && currentStock.candleData.length === 0 ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', flexDirection: 'column', gap: '12px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', border: '3px solid rgba(99, 102, 241, 0.2)',
                      borderTopColor: '#6366f1', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span style={{ fontSize: '13px', color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      Fetching market data...
                    </span>
                  </div>
                ) : (
                  <CandlestickChart data={currentStock.candleData} />
                )}
              </div>
            </div>

            {/* Prediction Gauge */}
            <PredictionGauge
              prediction={currentStock.prediction.type}
              confidence={currentStock.prediction.confidence}
              loading={loading && currentStock.candleData.length === 0}
            />
          </div>

          {/* Right Column: Indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 600, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '1.2px',
              fontFamily: 'Inter, sans-serif',
              padding: '0 4px 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Technical Indicators</span>
              <span style={{
                fontSize: '10px', fontWeight: 400, color: '#475569',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {refreshCount > 0 ? `#${refreshCount}` : ''}
              </span>
            </div>

            <IndicatorPanel
              icon={Activity}
              label="RSI (14)"
              value={currentStock.indicators.rsi.value.toString()}
              status={currentStock.indicators.rsi.status}
            />
            <IndicatorPanel
              icon={TrendingUp}
              label="MACD"
              value={currentStock.indicators.macd.value.toString()}
              status={currentStock.indicators.macd.status}
            />
            <IndicatorPanel
              icon={BarChart3}
              label="Volume"
              value={currentStock.indicators.volume.value.toString()}
              status={currentStock.indicators.volume.status}
            />
            <IndicatorPanel
              icon={Zap}
              label="Momentum"
              value={currentStock.indicators.momentum.value.toString()}
              status={currentStock.indicators.momentum.status}
            />
            <IndicatorPanel
              icon={Target}
              label="Bollinger Bands"
              value={currentStock.indicators.bb.value.toString()}
              status={currentStock.indicators.bb.status}
            />
            <IndicatorPanel
              icon={Layers}
              label="Stochastic"
              value={currentStock.indicators.stoch.value.toString()}
              status={currentStock.indicators.stoch.status}
            />

          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px', padding: '14px 0',
          borderTop: '1px solid rgba(148, 163, 184, 0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: '11px', color: '#334155', fontFamily: 'Inter, sans-serif',
          }}>
            LSTM Market Intelligence · Auto-refresh every 30s
          </span>
          <span style={{
            fontSize: '11px', color: '#334155', fontFamily: 'JetBrains Mono, monospace',
          }}>
            Powered by LSTM Neural Network
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          /* Stack to single column on smaller screens */
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          margin: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.15);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.25);
        }
      `}</style>
    </div>
  );
}

export default App;