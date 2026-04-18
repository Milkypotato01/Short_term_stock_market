import { LucideIcon } from 'lucide-react';

interface IndicatorPanelProps {
  icon: LucideIcon;
  label: string;
  status: 'Buy' | 'Sell' | 'Neutral';
  value: string;
}

export function IndicatorPanel({ icon: Icon, label, status, value }: IndicatorPanelProps) {
  const statusConfig = {
    Buy: {
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.15)',
      glow: 'rgba(16, 185, 129, 0.06)',
      label: 'BUY',
    },
    Sell: {
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.15)',
      glow: 'rgba(239, 68, 68, 0.06)',
      label: 'SELL',
    },
    Neutral: {
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.05)',
      border: 'rgba(148, 163, 184, 0.1)',
      glow: 'rgba(148, 163, 184, 0.03)',
      label: 'HOLD',
    },
  };

  const config = statusConfig[status];

  // Determine progress bar fill based on value
  const getProgressWidth = () => {
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return 50;
    if (label.includes('RSI')) return Math.min(numVal, 100);
    if (label.includes('Stoch')) return Math.min(numVal, 100);
    return 50;
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85))',
        border: `1px solid ${config.border}`,
        borderRadius: '14px',
        padding: '16px',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 25px ${config.glow}`;
        e.currentTarget.style.borderColor = config.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = config.border;
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', bottom: '0', left: '0', right: '0', height: '2px',
        background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
        opacity: 0.4,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: config.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon style={{ width: '16px', height: '16px', color: config.color }} />
          </div>
          <div>
            <div style={{
              fontSize: '11px', fontWeight: 500, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.8px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {label}
            </div>
          </div>
        </div>

        <span style={{
          fontSize: '10px', fontWeight: 600, color: config.color,
          padding: '3px 8px', borderRadius: '6px',
          backgroundColor: config.bg,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.5px',
        }}>
          {config.label}
        </span>
      </div>

      <div style={{
        fontSize: '22px', fontWeight: 700, color: '#f1f5f9',
        fontFamily: 'JetBrains Mono, monospace',
        marginBottom: '10px',
      }}>
        {value}
      </div>

      {/* Mini progress bar */}
      <div style={{
        height: '3px', backgroundColor: 'rgba(51, 65, 85, 0.5)',
        borderRadius: '999px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${getProgressWidth()}%`,
          backgroundColor: config.color,
          borderRadius: '999px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}
