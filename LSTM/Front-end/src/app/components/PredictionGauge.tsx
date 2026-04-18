import { useState, useEffect, useRef } from 'react';

interface PredictionGaugeProps {
  prediction: string;
  confidence: number;
  loading?: boolean;
}

export function PredictionGauge({ prediction, confidence, loading }: PredictionGaugeProps) {
  // Convert prediction + confidence into a single 0-100 gauge position:
  //   BULLISH 80% → gaugePos 80 (needle right, toward BUY)
  //   BEARISH 59% → gaugePos 41 (needle left, toward SELL)
  //   Neutral zone: gaugePos 45-55
  const gaugePosition = prediction === 'BULLISH' ? confidence : (100 - confidence);

  const [animatedConfidence, setAnimatedConfidence] = useState(50);
  const [animatedNeedle, setAnimatedNeedle] = useState(50);
  const prevGaugePos = useRef(50);

  // Smooth animation when gauge position changes
  useEffect(() => {
    const start = prevGaugePos.current;
    const end = gaugePosition;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      setAnimatedConfidence(Math.round(current));
      setAnimatedNeedle(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevGaugePos.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [gaugePosition]);

  const isBullish = animatedConfidence > 55;
  const isBearish = animatedConfidence < 45;
  const isNeutral = !isBullish && !isBearish;

  // Map gauge position 0-100 to angle -90 to +90 degrees
  const needleAngle = ((animatedNeedle / 100) * 180) - 90;

  // SVG arc parameters
  const cx = 160;
  const cy = 140;
  const r = 110;

  // Generate arc path
  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = ((angleDeg - 180) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  // Needle endpoint
  const needleLength = 85;
  const needleRad = ((needleAngle - 90) * Math.PI) / 180;
  const needleX = cx + needleLength * Math.cos(needleRad);
  const needleY = cy + needleLength * Math.sin(needleRad);

  // Determine status color
  const getStatusColor = () => {
    if (isNeutral) return { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' };
    if (isBullish) return { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' };
    return { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' };
  };

  const statusColor = getStatusColor();
  const statusLabel = isNeutral ? 'NEUTRAL' : (isBullish ? 'BULLISH' : 'BEARISH');

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8))',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: '16px',
        padding: '28px 24px 20px',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${statusColor.glow}, transparent 70%)`,
          opacity: loading ? 0.1 : 0.4,
          transition: 'all 1.2s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: loading ? '#64748b' : statusColor.primary,
            boxShadow: loading ? 'none' : `0 0 8px ${statusColor.primary}`,
            transition: 'all 0.6s ease',
          }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'Inter, sans-serif' }}>
            AI Market Prediction
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
          LSTM v1
        </span>
      </div>

      {/* SVG Gauge */}
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <svg width="320" height="170" viewBox="0 0 320 170">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="needleGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="arcGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track background */}
          <path
            d={describeArc(0, 180)}
            fill="none"
            stroke="rgba(51, 65, 85, 0.4)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Gradient arc */}
          <path
            d={describeArc(0, 180)}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#arcGlow)"
            opacity="0.85"
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * 180;
            const inner = polarToCartesian(cx, cy, r - 18, angle);
            const outer = polarToCartesian(cx, cy, r - 10, angle);
            return (
              <line key={tick} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1.5" />
            );
          })}

          {/* Tick labels */}
          {[
            { tick: 0, label: 'SELL' },
            { tick: 50, label: '50' },
            { tick: 100, label: 'BUY' },
          ].map(({ tick, label }) => {
            const angle = (tick / 100) * 180;
            const pos = polarToCartesian(cx, cy, r - 28, angle);
            return (
              <text key={tick} x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="middle"
                fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="500">
                {label}
              </text>
            );
          })}

          {/* Needle */}
          <line
            x1={cx} y1={cy}
            x2={needleX} y2={needleY}
            stroke={statusColor.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#needleGlow)"
            style={{ transition: 'all 0.1s linear' }}
          />

          {/* Center hub */}
          <circle cx={cx} cy={cy} r="8" fill="#0f172a" stroke={statusColor.primary} strokeWidth="2" />
          <circle cx={cx} cy={cy} r="3" fill={statusColor.primary} />

          {/* Center percentage — show the original API confidence */}
          <text x={cx} y={cy - 28} textAnchor="middle" dominantBaseline="middle"
            fill="#f1f5f9" fontSize="36" fontWeight="700" fontFamily="Inter, sans-serif">
            {loading ? '—' : `${confidence}`}
          </text>
          <text x={cx + 24} y={cy - 38} textAnchor="start" dominantBaseline="middle"
            fill="#64748b" fontSize="14" fontWeight="500" fontFamily="Inter, sans-serif">
            %
          </text>
        </svg>
      </div>

      {/* Status label */}
      <div style={{ textAlign: 'center', marginTop: '-10px', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 20px',
          borderRadius: '999px',
          backgroundColor: `${statusColor.primary}15`,
          border: `1px solid ${statusColor.primary}30`,
        }}>
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: statusColor.primary,
            letterSpacing: '2px',
            fontFamily: 'Inter, sans-serif',
          }}>
            {loading ? 'ANALYZING...' : statusLabel}
          </span>
        </div>

        <div style={{ fontSize: '11px', color: '#475569', marginTop: '10px', fontFamily: 'Inter, sans-serif' }}>
          {loading ? 'Loading market data...' : `${confidence}% ${statusLabel.toLowerCase()} confidence · Based on LSTM analysis`}
        </div>
      </div>
    </div>
  );
}
