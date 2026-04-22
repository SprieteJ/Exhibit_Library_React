import { useState } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

function ScoreBar({ score }) {
  const fg = score > 60 ? '#EC5B5B' : score > 30 ? '#E1C87E' : '#00D64A';
  const tag = score > 60 ? 'YES' : score > 30 ? 'MODERATE' : 'NO';
  const bg = fg + '14';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 28, background: 'var(--input-bg)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: Math.max(score, 2) + '%', height: '100%',
          background: `linear-gradient(90deg, ${fg}40, ${fg}90)`,
          borderRadius: 6, transition: 'width 0.6s ease',
        }} />
        <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
        <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: fg, minWidth: 40, textAlign: 'right' }}>
        {score != null ? score.toFixed(0) : '—'}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: bg, color: fg, minWidth: 55, textAlign: 'center' }}>
        {tag}
      </div>
    </div>
  );
}

function SubScore({ label, value, detail, color }) {
  const pct = Math.min(100, Math.max(0, (Math.abs(value || 0) / 3) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid rgba(128,128,128,0.06)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color || 'var(--muted)', flexShrink: 0 }} />
      <div style={{ fontSize: 12, color: 'var(--graphite)', flex: 1 }}>{label}</div>
      <div style={{ width: 120, height: 14, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: pct + '%', height: '100%', background: (color || '#888') + '80', borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: color || '#888', minWidth: 80, textAlign: 'right' }}>{detail}</div>
    </div>
  );
}

function QuestionBlock({ title, description, score, expanded, onToggle, onNavigate, children }) {
  return (
    <div style={{ marginBottom: 16, border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Header — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}
        onClick={onToggle}>
        {/* Expand arrow */}
        <span style={{ fontSize: 11, color: 'var(--muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>▶</span>
        {/* Title — clickable to navigate */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={e => { e.stopPropagation(); if (onNavigate) onNavigate(); }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--graphite)', cursor: onNavigate ? 'pointer' : 'default' }}>
            {title}
            {onNavigate && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>→ view chart</span>}
          </div>
          {!expanded && description && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{description}</div>
          )}
        </div>
        {/* Score badge */}
        {score != null && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, flexShrink: 0,
            color: score > 60 ? '#EC5B5B' : score > 30 ? '#E1C87E' : '#00D64A',
          }}>{score.toFixed(0)}</div>
        )}
      </div>

      {/* Expandable body */}
      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {description && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{description}</div>}
          <ScoreBar score={score} />
          <div style={{ marginTop: 12 }}>{children}</div>
        </div>
      )}
    </div>
  );
}

export default function CCQuestions({ onNavigate }) {
  const { data, loading, error } = useChartData('/api/macro-sensitivity?window=168');
  const [expanded, setExpanded] = useState({ macro: true });

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const goTo = (chartKey) => {
    if (onNavigate) onNavigate(chartKey);
  };

  let content = null;

  if (data?.current) {
    const c = data.current;

    content = (
      <div style={{ overflow: 'auto', padding: '16px 20px', height: '100%' }}>
        {/* Active questions */}
        <QuestionBlock
          title="Is macro driving the crypto market?"
          description="Measures whether BTC is responding to macro factors in real time. Each component computes the hourly rolling correlation over a 7-day window, then z-scores it against all available hourly history. A high absolute z-score means the current correlation is unusual, signalling a macro-driven regime."
          score={c.score}
          expanded={expanded.macro}
          onToggle={() => toggle('macro')}
          onNavigate={() => goTo('mac-sensitivity')}
        >
          {/* Component 1: DXY */}
          <SubScore label="BTC vs US Dollar (DXY)" value={c.DXY?.zscore}
            detail={`ρ ${c.DXY?.corr?.toFixed(2)} · z ${c.DXY?.zscore?.toFixed(1)}`} color="#C084FC" />
          <div style={{ padding: '4px 0 12px 16px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--graphite)' }}>Why:</strong> When global dollar liquidity tightens (DXY up), risk assets sell off. When the dollar weakens, liquidity flows into risk. If BTC is tracking this, it is behaving as a macro liquidity instrument, not trading on crypto-native flows.
            <br />
            <strong style={{ color: 'var(--graphite)' }}>Calculation:</strong> Hourly log returns of BTC vs hourly log returns of DXY. 7-day (168h) rolling Pearson correlation, z-scored against all available hourly history.
          </div>

          {/* Component 2: 10Y */}
          <SubScore label="BTC vs 10Y Treasury Yield" value={c['10Y']?.zscore}
            detail={`ρ ${c['10Y']?.corr?.toFixed(2)} · z ${c['10Y']?.zscore?.toFixed(1)}`} color="#ED9B9B" />
          <div style={{ padding: '4px 0 12px 16px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--graphite)' }}>Why:</strong> The 10Y yield is the price of money. When yields rise, duration assets and risk assets reprice lower. If BTC responds to yield moves, it is being treated by the market as a rate-sensitive asset, meaning macro is setting the price.
            <br />
            <strong style={{ color: 'var(--graphite)' }}>Calculation:</strong> Hourly log returns of BTC vs hourly first differences in 10Y yield (yield changes in bps, not log returns, because yields can approach zero). Same 7-day rolling correlation, z-scored.
          </div>

          {/* Sparkline */}
          {data.dates?.length > 5 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--mono)' }}>Score history</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 40 }}>
                {data.score.slice(-60).map((s, i) => {
                  const fg = s > 60 ? '#EC5B5B' : s > 30 ? '#E1C87E' : '#00D64A';
                  return <div key={i} style={{ flex: 1, minWidth: 2, height: Math.max(2, s * 0.6) + '%', background: fg + '90', borderRadius: '2px 2px 0 0' }} />;
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{data.dates[Math.max(0, data.dates.length - 60)]}</span>
                <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{data.dates[data.dates.length - 1]}</span>
              </div>
            </div>
          )}
        </QuestionBlock>

        {/* Future questions — collapsed, no data yet */}
        {[
          { key: 'retail', title: 'Is retail or institutional flow driving?',
            desc: 'Compares ETF inflow patterns (institutional) vs exchange deposit volumes and small transaction counts (retail). When ETF flows dominate price action, institutions are driving. When exchange deposits and funding rate spikes lead, retail is in control.' },
          { key: 'leverage', title: 'Is the market leveraged?',
            desc: 'Combines open interest relative to spot volume, funding rate extremes, and liquidation clustering. High OI/volume ratio with elevated funding signals a leveraged market vulnerable to squeezes.' },
          { key: 'altdec', title: 'Are alts decoupling from BTC?',
            desc: 'Tracks rolling BTC dominance trend, alt/BTC correlation breakdown, and sector rotation breadth. When alt/BTC correlations drop and sector dispersion rises, alts are trading on their own narratives rather than following BTC.' },
          { key: 'volcomp', title: 'Is volatility compressed (breakout imminent)?',
            desc: 'Measures realized vol vs implied vol (DVOL), Bollinger bandwidth percentile, and ATR compression relative to its 90-day range. Sustained compression below historical norms precedes large directional moves.' },
        ].map(q => (
          <QuestionBlock key={q.key} title={q.title} description={q.desc} score={null}
            expanded={expanded[q.key]} onToggle={() => toggle(q.key)}>
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>Coming soon</div>
          </QuestionBlock>
        ))}
      </div>
    );
  }

  return (
    <ChartPanel
      title="Market Questions"
      source={data ? `Hourly · ${data.window_hours}h window · ${data.dates?.length || 0} data points` : ''}
      loading={loading} error={error} chartType="line" chartData={null}
    >{content}</ChartPanel>
  );
}
