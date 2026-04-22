import { useState } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

function CorrelationBar({ value, label, detail, chartKey, onNav }) {
  if (value == null) return null;
  const abs = Math.abs(value);
  const pct = Math.min(100, abs * 200); // 0.5 corr = full bar

  // Green = high absolute correlation (macro driving)
  // White/grey = low correlation (independent)
  // Direction shown by +/-
  let fg, tag;
  if (abs > 0.3) {
    fg = '#00D64A';
    tag = 'ACTIVE';
  } else if (abs > 0.15) {
    fg = '#E1C87E';
    tag = 'WEAK';
  } else {
    fg = '#555';
    tag = 'INACTIVE';
  }

  return (
    <div style={{ padding: '10px 0', borderBottom: '0.5px solid rgba(128,128,128,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: fg, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--graphite)', flex: 1 }}>
          {label}
          {chartKey && onNav && (
            <span onClick={() => onNav(chartKey)} style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6, cursor: 'pointer' }}>&#8594; chart</span>
          )}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          background: fg + '18', color: fg, minWidth: 55, textAlign: 'center',
        }}>{tag}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: fg, minWidth: 55, textAlign: 'right' }}>
          {value > 0 ? '+' : ''}{value.toFixed(2)}
        </div>
      </div>
      <div style={{ height: 10, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden', marginLeft: 16 }}>
        <div style={{ width: pct + '%', height: '100%', background: fg + '70', borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      {detail && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, marginLeft: 16 }}>{detail}</div>}
    </div>
  );
}

function ScoreBar({ value, percentile }) {
  if (percentile == null) return null;
  const pct = Math.round(percentile);
  let fg, tag;
  if (pct > 70) {
    fg = '#00D64A';
    tag = 'MACRO-DRIVEN';
  } else if (pct > 40) {
    fg = '#E1C87E';
    tag = 'MODERATE';
  } else {
    fg = '#555';
    tag = 'INDEPENDENT';
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ flex: 1, height: 32, background: 'var(--input-bg)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            width: Math.max(pct, 3) + '%', height: '100%',
            background: `linear-gradient(90deg, ${fg}40, ${fg}90)`,
            borderRadius: 6, transition: 'width 0.6s ease',
          }} />
          <div style={{ position: 'absolute', left: '40%', top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
          <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: fg, minWidth: 50, textAlign: 'right' }}>
          {pct}%
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 4,
          background: fg + '18', color: fg, minWidth: 70, textAlign: 'center',
        }}>{tag}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
        Current macro sensitivity is stronger than {pct}% of all 30-day periods over the last 3 years.
      </div>
    </div>
  );
}

function QuestionBlock({ title, description, expanded, onToggle, onNavigate, children, headerRight }) {
  return (
    <div style={{ marginBottom: 16, border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}
        onClick={onToggle}>
        <span style={{ fontSize: 11, color: 'var(--muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>&#9654;</span>
        <div style={{ flex: 1, minWidth: 0 }} onClick={e => { e.stopPropagation(); if (onNavigate) onNavigate(); }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--graphite)', cursor: onNavigate ? 'pointer' : 'default' }}>
            {title}
            {onNavigate && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>&#8594; view chart</span>}
          </div>
        </div>
        {headerRight}
      </div>
      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {description && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16 }}>{description}</div>}
          {children}
        </div>
      )}
    </div>
  );
}

export default function CCQuestions({ onNavigate }) {
  const { data, loading, error } = useChartData('/api/macro-sensitivity?from=2023-04-01&window=30');
  const [expanded, setExpanded] = useState({ macro: true });

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const goTo = (chartKey) => { if (onNavigate) onNavigate(chartKey); };

  let content = null;

  if (data?.current) {
    const c = data.current;

    const headerBadge = c.percentile != null ? (
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, flexShrink: 0,
        color: c.percentile > 70 ? '#00D64A' : c.percentile > 40 ? '#E1C87E' : '#555',
      }}>{Math.round(c.percentile)}%</div>
    ) : null;

    content = (
      <div style={{ overflow: 'auto', padding: '16px 20px', height: '100%' }}>

        <QuestionBlock
          title="Is macro driving the crypto market?"
          description={
            'We measure the 30-day rolling correlation between BTC daily returns and three macro factors: the US Dollar (DXY), equity volatility (VIX), and the S&P 500 (SPY). '
            + 'When BTC is correlated with these assets, it is being moved by the same forces that move traditional markets. When correlations are near zero, crypto is trading on its own dynamics. '
            + 'The headline reading is the average of the absolute correlations across all three. A higher number means more macro entanglement, regardless of direction. '
            + 'The direction of each individual correlation (positive or negative) tells you how BTC is reacting: positive SPY correlation means BTC rallies with equities, negative VIX correlation means BTC sells when fear rises.'
          }
          expanded={expanded.macro}
          onToggle={() => toggle('macro')}
          onNavigate={() => goTo('mac-sensitivity')}
          headerRight={headerBadge}
        >
          {/* Main score */}
          <ScoreBar value={c.abs_avg} percentile={c.percentile} />

          {/* Individual components */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Individual factors</div>

            <CorrelationBar
              label="BTC vs US Dollar (DXY)"
              value={c.DXY?.corr}
              detail="Negative = BTC rises when dollar weakens (risk-on liquidity). Positive = BTC follows dollar strength. Near zero = BTC ignoring the dollar."
              chartKey="mac-btc-dxy-corr"
              onNav={goTo}
            />
            <CorrelationBar
              label="BTC vs Volatility (VIX)"
              value={c.VIX?.corr}
              detail="Negative = BTC sells when fear spikes (trading as risk asset). Positive = BTC rallies on fear (trading as a hedge). Near zero = BTC ignoring volatility."
              chartKey="mac-btc-vix-corr"
              onNav={goTo}
            />
            <CorrelationBar
              label="BTC vs Equities (SPY)"
              value={c.SPY?.corr}
              detail="Positive = BTC moving in lockstep with stocks (risk-on/risk-off). Negative = BTC diverging from equities. Near zero = BTC decoupled from equity markets."
              chartKey="mac-btc-spy-corr"
              onNav={goTo}
            />
          </div>
        </QuestionBlock>

        {/* Future questions */}
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
      source={data ? `${data.window}d daily rolling correlation · ${data.dates?.length || 0} data points` : ''}
      loading={loading} error={error} chartType="line" chartData={null}
    >{content}</ChartPanel>
  );
}
