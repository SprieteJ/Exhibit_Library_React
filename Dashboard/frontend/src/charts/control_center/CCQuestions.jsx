import { useState } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

function Speedometer({ value, label, onClick, expanded }) {
  // value: 0-100
  if (value == null) return null;
  const pct = Math.round(value);
  const fg = pct > 70 ? '#00D64A' : pct > 40 ? '#E1C87E' : '#555';
  const tag = pct > 70 ? 'MACRO-DRIVEN' : pct > 40 ? 'MODERATE' : 'INDEPENDENT';

  // Arc: 180 degrees, from left to right
  const angle = -90 + (pct / 100) * 180; // -90 = left, 0 = top, 90 = right
  const r = 52;
  const cx = 60, cy = 58;
  const needleX = cx + r * 0.75 * Math.cos((angle - 90) * Math.PI / 180);
  const needleY = cy + r * 0.75 * Math.sin((angle - 90) * Math.PI / 180);

  return (
    <div onClick={onClick} style={{ cursor: 'pointer', textAlign: 'center', minWidth: 140, padding: '8px 4px' }}>
      <svg width="120" height="72" viewBox="0 0 120 72">
        {/* Background arc */}
        <path d="M 8 58 A 52 52 0 0 1 112 58" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
        {/* Colored arc segments */}
        <path d="M 8 58 A 52 52 0 0 1 36 12" fill="none" stroke="#555" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
        <path d="M 36 12 A 52 52 0 0 1 84 12" fill="none" stroke="#E1C87E" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
        <path d="M 84 12 A 52 52 0 0 1 112 58" fill="none" stroke="#00D64A" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
        {/* Active arc up to current value */}
        {pct > 0 && (
          <path
            d={describeArc(cx, cy, r, -90, angle)}
            fill="none" stroke={fg} strokeWidth="8" strokeLinecap="round"
          />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={fg} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={fg} />
        {/* Value */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="18" fontWeight="700" fontFamily="monospace" fill={fg}>{pct}%</text>
      </svg>
      <div style={{ fontSize: 9, fontWeight: 600, color: fg, letterSpacing: '.04em', marginTop: -2 }}>{tag}</div>
      {label && <div style={{ fontSize: 11, color: 'var(--graphite)', fontWeight: 500, marginTop: 4 }}>{label}</div>}
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{expanded ? '▲ collapse' : '▼ details'}</div>
    </div>
  );
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function CorrelationBar({ value, label, detail, chartKey, onNav }) {
  if (value == null) return null;
  const abs = Math.abs(value);
  const barWidth = Math.min(50, abs * 100);
  const isPositive = value >= 0;
  const barColor = isPositive ? '#00D64A' : '#EC5B5B';

  let statusFg, tag;
  if (abs > 0.3) { statusFg = barColor; tag = 'ACTIVE'; }
  else if (abs > 0.15) { statusFg = '#E1C87E'; tag = 'WEAK'; }
  else { statusFg = '#555'; tag = 'INACTIVE'; }

  return (
    <div style={{ padding: '10px 0', borderBottom: '0.5px solid rgba(128,128,128,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusFg, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--graphite)', flex: 1 }}>
          {label}
          {chartKey && onNav && (
            <span onClick={() => onNav(chartKey)} style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6, cursor: 'pointer' }}>&#8594; chart</span>
          )}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          background: statusFg + '18', color: statusFg, minWidth: 55, textAlign: 'center',
        }}>{tag}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: barColor, minWidth: 55, textAlign: 'right' }}>
          {value > 0 ? '+' : ''}{value.toFixed(2)}
        </div>
      </div>
      <div style={{ position: 'relative', height: 12, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden', marginLeft: 16 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--border)', zIndex: 2 }} />
        {isPositive ? (
          <div style={{ position: 'absolute', left: '50%', top: 0, height: '100%', width: barWidth + '%', background: barColor + '70', borderRadius: '0 3px 3px 0', transition: 'width 0.4s' }} />
        ) : (
          <div style={{ position: 'absolute', right: '50%', top: 0, height: '100%', width: barWidth + '%', background: barColor + '70', borderRadius: '3px 0 0 3px', transition: 'width 0.4s' }} />
        )}
        <span style={{ position: 'absolute', left: 4, top: -1, fontSize: 8, color: 'var(--muted)', opacity: 0.5 }}>-1</span>
        <span style={{ position: 'absolute', right: 4, top: -1, fontSize: 8, color: 'var(--muted)', opacity: 0.5 }}>+1</span>
      </div>
      {detail && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, marginLeft: 16 }}>{detail}</div>}
    </div>
  );
}

export default function CCQuestions({ onNavigate }) {
  const { data, loading, error } = useChartData('/api/macro-sensitivity?from=2023-04-01&window=30');
  const [expanded, setExpanded] = useState({});

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const goTo = (chartKey) => { if (onNavigate) onNavigate(chartKey); };

  let content = null;

  if (data?.current) {
    const c = data.current;
    const pct = c.percentile != null ? Math.round(c.percentile) : null;

    content = (
      <div style={{ overflow: 'auto', padding: '16px 20px', height: '100%' }}>
        {/* Speedometers row */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', flexWrap: 'wrap', marginBottom: 8 }}>
          <Speedometer value={pct} label="Is macro driving?" onClick={() => toggle('macro')} expanded={expanded.macro} />
          {/* Future question speedometers will go here */}
        </div>

        {/* Macro dropdown */}
        {expanded.macro && (
          <div style={{ border: '0.5px solid var(--border)', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--graphite)', flex: 1 }}>
                Is macro driving the crypto market?
                <span onClick={() => goTo('mac-sensitivity')} style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6, cursor: 'pointer' }}>&#8594; view chart</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16 }}>
              We measure the 30-day rolling correlation between BTC daily returns and three macro factors: the US Dollar (DXY), equity volatility (VIX), and the S&P 500 (SPY).
              When BTC is correlated with these assets, it is being moved by the same forces that move traditional markets. When correlations are near zero, crypto is trading on its own dynamics.
              The headline reading is the percentile of the average absolute correlation vs the last 3 years. Green bars indicate positive correlation, red bars indicate negative correlation.
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Individual factors</div>

            <CorrelationBar
              label="BTC vs US Dollar (DXY)" value={c.DXY?.corr}
              detail="Negative = BTC rises when dollar weakens (risk-on liquidity). Positive = BTC follows dollar strength. Near zero = BTC ignoring the dollar."
              chartKey="mac-btc-dxy-corr" onNav={goTo}
            />
            <CorrelationBar
              label="BTC vs Volatility (VIX)" value={c.VIX?.corr}
              detail="Negative = BTC sells when fear spikes (trading as risk asset). Positive = BTC rallies on fear (trading as a hedge). Near zero = BTC ignoring volatility."
              chartKey="mac-btc-vix-corr" onNav={goTo}
            />
            <CorrelationBar
              label="BTC vs Equities (SPY)" value={c.SPY?.corr}
              detail="Positive = BTC moving in lockstep with stocks (risk-on/risk-off). Negative = BTC diverging from equities. Near zero = BTC decoupled from equity markets."
              chartKey="mac-btc-spy-corr" onNav={goTo}
            />
          </div>
        )}

        {/* Future questions — speedometers above, dropdowns when clicked */}
        {/* Placeholders */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', flexWrap: 'wrap', marginBottom: 8 }}>
          {[
            { key: 'retail', label: 'Retail vs institutional?' },
            { key: 'leverage', label: 'Is market leveraged?' },
            { key: 'altdec', label: 'Alts decoupling?' },
            { key: 'volcomp', label: 'Vol compressed?' },
          ].map(q => (
            <div key={q.key} onClick={() => toggle(q.key)} style={{ cursor: 'pointer', textAlign: 'center', minWidth: 140, padding: '8px 4px', opacity: 0.35 }}>
              <svg width="120" height="72" viewBox="0 0 120 72">
                <path d="M 8 58 A 52 52 0 0 1 112 58" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
                <circle cx="60" cy="58" r="4" fill="var(--muted)" />
                <text x="60" y="50" textAnchor="middle" fontSize="14" fontWeight="700" fontFamily="monospace" fill="var(--muted)">--</text>
              </svg>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.04em', marginTop: -2 }}>COMING SOON</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginTop: 4 }}>{q.label}</div>
            </div>
          ))}
        </div>

        {/* Expanded dropdowns for future questions */}
        {['retail', 'leverage', 'altdec', 'volcomp'].map(key => {
          if (!expanded[key]) return null;
          const descs = {
            retail: 'Compares ETF inflow patterns (institutional) vs exchange deposit volumes and small transaction counts (retail). When ETF flows dominate price action, institutions are driving.',
            leverage: 'Combines open interest relative to spot volume, funding rate extremes, and liquidation clustering. High OI/volume ratio with elevated funding signals a leveraged market.',
            altdec: 'Tracks rolling BTC dominance trend, alt/BTC correlation breakdown, and sector rotation breadth. When alt/BTC correlations drop, alts are trading on their own narratives.',
            volcomp: 'Measures realized vol vs implied vol, Bollinger bandwidth percentile, and ATR compression. Sustained compression below historical norms precedes large directional moves.',
          };
          return (
            <div key={key} style={{ border: '0.5px solid var(--border)', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>{descs[key]}</div>
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>Coming soon</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ChartPanel
      title="Market Questions"
      source={data ? `${data.window}d daily rolling correlation · percentile vs last 3 years` : ''}
      loading={loading} error={error} chartType="line" chartData={null}
    >{content}</ChartPanel>
  );
}
