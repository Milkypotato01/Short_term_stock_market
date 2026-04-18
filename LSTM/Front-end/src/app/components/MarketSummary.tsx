interface MarketSummaryProps {
  summary: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    marketCap: number;
  };
  loading: boolean;
}

const formatNumber = (n: number) => {
  if (!n) return '—';
  if (n >= 1e12) return `₹${(n / 1e7 / 1e5).toFixed(2)}L Cr`;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatVolume = (v: number) => {
  if (!v) return '—';
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toString();
};

export function MarketSummary({ summary, loading }: MarketSummaryProps) {
  const stats = [
    { label: 'Open', value: summary.open ? `₹${formatNumber(summary.open)}` : '—' },
    { label: 'High', value: summary.high ? `₹${formatNumber(summary.high)}` : '—' },
    { label: 'Low', value: summary.low ? `₹${formatNumber(summary.low)}` : '—' },
    { label: 'Close', value: summary.close ? `₹${formatNumber(summary.close)}` : '—' },
    { label: 'Volume', value: formatVolume(summary.volume) },
    { label: '52W High', value: summary.fiftyTwoWeekHigh ? `₹${formatNumber(summary.fiftyTwoWeekHigh)}` : '—' },
    { label: '52W Low', value: summary.fiftyTwoWeekLow ? `₹${formatNumber(summary.fiftyTwoWeekLow)}` : '—' },
    { label: 'Mkt Cap', value: summary.marketCap ? formatNumber(summary.marketCap) : '—' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85))',
      border: '1px solid rgba(148, 163, 184, 0.08)',
      borderRadius: '12px',
      padding: '14px 20px',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '4px',
      flexWrap: 'wrap',
      opacity: loading ? 0.6 : 1,
      transition: 'opacity 0.4s ease',
    }}>
      {stats.map((stat, i) => (
        <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 500, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.8px',
              fontFamily: 'Inter, sans-serif', marginBottom: '3px',
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '13px', fontWeight: 600, color: '#e2e8f0',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {stat.value}
            </div>
          </div>
          {i < stats.length - 1 && (
            <div style={{
              width: '1px', height: '28px',
              backgroundColor: 'rgba(148, 163, 184, 0.08)',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}
