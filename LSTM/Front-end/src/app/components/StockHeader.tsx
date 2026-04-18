interface StockHeaderProps {
  name: string;
  exchange: string;
  price: number;
  change: string;
  ticker: string;
  lastUpdated: string | null;
  loading: boolean;
  availableStocks: string[];
  onStockChange: (ticker: string) => void;
}

export function StockHeader({
  name, exchange, price, change, ticker,
  lastUpdated, loading, availableStocks, onStockChange
}: StockHeaderProps) {
  const isPositive = change.startsWith('+');

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.92))',
      border: '1px solid rgba(148, 163, 184, 0.08)',
      borderRadius: '16px',
      padding: '20px 28px',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
    }}>
      {/* Left: Brand + Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 800, color: '#fff',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
          }}>
            LM
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px' }}>
              LSTM Market Intelligence
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
              AI-POWERED ANALYSIS
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '36px', backgroundColor: 'rgba(148, 163, 184, 0.1)' }} />

        {/* Stock Selector */}
        <select
          id="stock-selector"
          value={ticker}
          onChange={(e) => onStockChange(e.target.value)}
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '10px',
            padding: '8px 36px 8px 14px',
            color: '#e2e8f0',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'JetBrains Mono, monospace',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(148, 163, 184, 0.15)')}
        >
          {availableStocks.map((s) => (
            <option key={s} value={s} style={{ backgroundColor: '#1e293b' }}>{s}</option>
          ))}
        </select>
      </div>

      {/* Center: Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <span style={{
          fontSize: '28px', fontWeight: 800, color: '#f1f5f9',
          fontFamily: 'Inter, sans-serif', letterSpacing: '-1px',
        }}>
          {price > 0 ? `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
        </span>
        <span style={{
          fontSize: '14px', fontWeight: 600,
          color: isPositive ? '#10b981' : '#ef4444',
          fontFamily: 'JetBrains Mono, monospace',
          padding: '3px 10px',
          borderRadius: '6px',
          backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        }}>
          {change}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
            {name}
          </span>
          <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
            {exchange}
          </span>
        </div>
      </div>

      {/* Right: Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            backgroundColor: loading ? '#f59e0b' : '#10b981',
            boxShadow: loading ? '0 0 8px rgba(245, 158, 11, 0.5)' : '0 0 8px rgba(16, 185, 129, 0.5)',
            animation: loading ? 'none' : 'pulse-live 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            {loading ? 'FETCHING' : 'LIVE'}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
          {formatTime(lastUpdated)}
        </div>
      </div>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </header>
  );
}
