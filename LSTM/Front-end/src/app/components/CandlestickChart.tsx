import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandleData[];
}

const CustomCandle = (props: any) => {
  const { x, y, width, height, payload, index } = props;

  if (!payload || typeof payload.open === 'undefined') {
    return null;
  }

  const { open, close, high, low } = payload;

  const isGreen = close > open;
  const color = isGreen ? '#10b981' : '#ef4444';

  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const bodyHeight = Math.abs(close - open);

  const yScale = height / (payload.high - payload.low);
  const wickX = x + width / 2;
  const highY = y;
  const lowY = y + height;
  const bodyY = y + (high - bodyTop) * yScale;

  return (
    <g key={`candle-${index}`}>
      {/* Wick */}
      <line
        key={`wick-${index}`}
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
        opacity={0.7}
      />
      {/* Body */}
      <rect
        key={`body-${index}`}
        x={x + 1}
        y={bodyY}
        width={Math.max(width - 2, 2)}
        height={Math.max(bodyHeight * yScale, 1)}
        fill={color}
        stroke={color}
        strokeWidth={0.5}
        rx={1}
        ry={1}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const isGreen = data.close > data.open;

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(148, 163, 184, 0.15)',
      borderRadius: '10px',
      padding: '12px 16px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
        {data.date}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
        {[
          { label: 'Open', val: data.open },
          { label: 'High', val: data.high },
          { label: 'Low', val: data.low },
          { label: 'Close', val: data.close },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.label}</span>
            <span style={{
              fontSize: '11px', fontWeight: 600,
              color: item.label === 'Close' ? (isGreen ? '#10b981' : '#ef4444') : '#e2e8f0',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              ₹{item.val?.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function CandlestickChart({ data }: CandlestickChartProps) {
  const chartData = data.map((candle, index) => ({
    ...candle,
    range: [candle.low, candle.high],
    value: candle.low,
    height: candle.high - candle.low,
    index,
  }));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Chart label */}
      <div style={{
        position: 'absolute', top: '8px', left: '12px', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: 500, color: '#64748b',
          fontFamily: 'Inter, sans-serif', textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}>
          Price Chart — 1M
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(51, 65, 85, 0.3)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="transparent"
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 10', 'dataMax + 10']}
            tickFormatter={(v: number) => `₹${v.toFixed(0)}`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(148, 163, 184, 0.15)', strokeWidth: 1 }}
          />
          <Bar
            dataKey="height"
            fill="#10b981"
            shape={<CustomCandle />}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}