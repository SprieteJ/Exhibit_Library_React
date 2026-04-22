import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

function ScoreBar({ score, label, color }) {
  const bg = score > 60 ? 'rgba(236,91,91,0.12)' : score > 30 ? 'rgba(225,200,126,0.12)' : 'rgba(0,214,74,0.12)';
  const fg = score > 60 ? '#EC5B5B' : score > 30 ? '#E1C87E' : '#00D64A';
  const tag = score > 60 ? 'YES' : score > 30 ? 'MODERATE' : 'NO';

  return (
    <div style={{ marginBottom: 8 }}>
      {label && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--mono)' }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 28, background: 'var(--input-bg)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            width: Math.max(score, 2) + '%', height: '100%',
            background: `linear-gradient(90deg, ${fg}40, ${fg}90)`,
            borderRadius: 6, transition: 'width 0.6s ease',
          }} />
          {/* Tick marks at 30 and 60 */}
          <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
          <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: fg, minWidth: 40, textAlign: 'right' }}>
          {score != null ? score.toFixed(0) : '—'}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          background: bg, color: fg, minWidth: 55, textAlign: 'center',
        }}>{tag}</div>
      </div>
    </div>
  );
}

function SubScore({ label, value, detail, color }) {
  const pct = Math.min(100, Math.max(0, (Math.abs(value || 0) / 3) * 100)); // z of 3 = full bar
  const fg = color || 'var(--muted)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid rgba(128,128,128,0.06)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: fg, flexShrink: 0 }} />
      <div style={{ fontSize: 12, color: 'var(--graphite)', flex: 1 }}>{label}</div>
      <div style={{ width: 120, height: 14, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: pct + '%', height: '100%', background: fg + '80', borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: fg, minWidth: 70, textAlign: 'right' }}>{detail}</div>
    </div>
  );
}

export default function CCQuestions() {
  const { data, loading, error } = useChartData('/api/macro-sensitivity?window=168');

  let content = null;

  if (data?.current) {
    const c = data.current;
    const score = c.score;

    content = (
      <div style={{ overflow: 'auto', padding: '20px 24px', height: '100%' }}>
        {/* Main question */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--graphite)', marginBottom: 4 }}>
            Is macro driving the crypto market?
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Measures whether BTC is responding to macro factors (DXY, 10Y yield) using hourly correlation z-scored against available history. 7-day rolling window.
          </div>

          {/* Main score bar */}
          <ScoreBar score={score} />

          {/* Sub-components */}
          <div style={{ marginTop: 16, padding: '12px 16px', border: '0.5px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Components</div>

            <SubScore
              label="BTC vs US Dollar (DXY)"
              value={c.DXY?.zscore}
              detail={`ρ ${c.DXY?.corr?.toFixed(2)} · z ${c.DXY?.zscore?.toFixed(1)}`}
              color="#C084FC"
            />
            <SubScore
              label="BTC vs 10Y Treasury Yield"
              value={c['10Y']?.zscore}
              detail={`ρ ${c['10Y']?.corr?.toFixed(2)} · z ${c['10Y']?.zscore?.toFixed(1)}`}
              color="#ED9B9B"
            />
          </div>

          {/* Score history mini-chart reference */}
          {data.dates?.length > 5 && (
            <div style={{ marginTop: 16, padding: '12px 16px', border: '0.5px solid var(--border)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Score history</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 60 }}>
                {data.score.slice(-60).map((s, i) => {
                  const fg = s > 60 ? '#EC5B5B' : s > 30 ? '#E1C87E' : '#00D64A';
                  return (
                    <div key={i} style={{
                      flex: 1, minWidth: 2,
                      height: Math.max(2, s * 0.6) + '%',
                      background: fg + '90', borderRadius: '2px 2px 0 0',
                    }} />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  {data.dates[Math.max(0, data.dates.length - 60)]}
                </span>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  {data.dates[data.dates.length - 1]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Placeholder for future questions */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Coming next</div>
          {[
            'Is retail or institutional flow driving?',
            'Is the market leveraged?',
            'Are alts decoupling from BTC?',
            'Is volatility compressed (breakout imminent)?',
          ].map((q, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '0.5px solid rgba(128,128,128,0.06)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{q}</div>
              <div style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--tag-bg)', color: 'var(--muted)' }}>soon</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ChartPanel
      title="Market Questions"
      source={data ? `Hourly data · ${data.window_hours}h rolling window · ${data.dates?.length || 0} days` : ''}
      loading={loading} error={error} chartType="line" chartData={null}
    >{content}</ChartPanel>
  );
}
