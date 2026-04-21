import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

const REGIMES = [
  { name: 'Risk-on expansion', tag: 'bullish alts', color: '#3B6D11', bgColor: '#EAF3DE',
    indicators: [
      { label: 'BTC dominance falling', ck: 'btc-dom-ma', rm: 'dominance falling', fb: '30d z < -1.0' },
      { label: 'Altseason elevated', ck: 'alt-altseason', rm: 'altseason > 75', fb: '> 75% alts outperforming BTC' },
      { label: 'Funding rate positive', ck: 'btc-funding', rm: 'funding positive', fb: '> 0.01% avg' },
      { label: 'ETH/BTC ratio rising', ck: 'eth-btc-ratio', rm: 'eth/btc rising', fb: '30d > +5%' },
      { label: 'Alt intracorrelation rising', ck: 'am-intracorr', rm: 'correlation rising', fb: 'Rising > +0.10' },
    ]},
  { name: 'BTC flight-to-quality', tag: 'btc dominance', color: '#185FA5', bgColor: '#E6F1FB',
    indicators: [
      { label: 'BTC dominance rising', ck: 'btc-dom-ma', rm: 'dominance rising', fb: 'z > +1.0' },
      { label: 'ETH/BTC ratio falling', ck: 'eth-btc-ratio', rm: 'falling sharply', fb: '30d < -10%' },
      { label: 'Alt share declining', ck: 'am-dominance', rm: 'alt share', fb: 'Alt mcap vs total' },
      { label: 'BTC ETF inflows, ETH flat', ck: null, rm: null, fb: 'ETF flow divergence' },
      { label: 'Alt correlated + falling', ck: 'am-intracorr', rm: 'correlated and alts falling', fb: 'Corr > 0.4 AND alts down' },
    ]},
  { name: 'Deleveraging', tag: 'crisis', color: '#A32D2D', bgColor: '#FCEBEB',
    indicators: [
      { label: 'Funding flips negative', ck: 'btc-funding', rm: 'negative streak', fb: '5+ consecutive negative days' },
      { label: 'Open interest dropping', ck: null, rm: null, fb: '> 15% drop in 7 days' },
      { label: 'Realized vol spiking', ck: null, rm: null, fb: '> 80% annualized' },
      { label: 'BTC-SPY correlation spiking', ck: null, rm: null, fb: '> 0.6' },
      { label: 'BTC drawdown velocity', ck: null, rm: null, fb: '> 10% drop in 7 days' },
    ]},
  { name: 'Consolidation', tag: 'sideways', color: '#5F5E5A', bgColor: '#F1EFE8',
    indicators: [
      { label: 'Realized vol low', ck: null, rm: null, fb: '< 35% annualized' },
      { label: 'BTC drawdown mild', ck: null, rm: null, fb: 'Between -5% and -20%' },
      { label: 'Funding near zero', ck: null, rm: null, fb: '< 0.005%' },
      { label: 'Stablecoin supply growing', ck: null, rm: null, fb: 'Or stable' },
      { label: 'DVOL low', ck: null, rm: null, fb: '< 50' },
    ]},
  { name: 'Macro risk-off', tag: 'external shock', color: '#854F0B', bgColor: '#FAEEDA',
    indicators: [
      { label: 'SPY/QQQ falling', ck: null, rm: null, fb: '30d return < -5%' },
      { label: 'DXY strengthening', ck: null, rm: null, fb: 'Rising trend' },
      { label: 'BTC-SPY correlation high', ck: null, rm: null, fb: '> 0.5 sustained' },
      { label: 'ETF outflows', ck: null, rm: null, fb: 'Net negative' },
      { label: 'VIX elevated', ck: null, rm: null, fb: '> 25' },
    ]},
];

const CYCLE_STEPS = [
  [1, 'Liquidity conditions improve', 'Monetary policy easing. DXY weakening, real yields falling.'],
  [2, 'VCs raise capital', 'New fund raises, deployment into crypto startups accelerates.'],
  [3, 'Speculation demand increases', 'DEX activity, DeFi loans, stablecoin supply expanding.'],
  [4, 'Media covers crypto', 'Mainstream financial media running crypto stories regularly.'],
  [5, 'FOMO builds', 'New speculators. More builders. More VC capital. More DeFi demand.'],
  [6, 'DeFi boosts yields', 'Projects compete for TVL by boosting yields.'],
  [7, 'Rotation into alts', 'Asset prices rise, investors chase beta.'],
  [8, 'New products & capital markets', 'ETFs, IPOs, ICOs, VC investments, M&A surges.'],
  [9, 'Leverage builds', 'Funding elevated, OI/mcap high, vol compressed. Everyone is long.'],
  [10, 'Liquidity rolls over', 'Markets sell off. DXY reverses. Next crypto winter begins.'],
];

function buildCCLookup(charts) {
  const lookup = {};
  for (const ch of charts) {
    if (!lookup[ch.chart_key]) lookup[ch.chart_key] = [];
    for (const ru of ch.rules || []) {
      lookup[ch.chart_key].push({
        name: ru.name, active: ru.active, detail: ru.detail || '',
        context: ru.context || '', weight: ru.weight || '', type: ru.type || '',
      });
    }
  }
  return lookup;
}

function findRule(lookup, chartKey, sub, onlyActive) {
  const arr = lookup[chartKey] || [];
  for (const r of arr) {
    if (r.name.toLowerCase().includes(sub.toLowerCase())) {
      if (onlyActive && !r.active) continue;
      return r;
    }
  }
  return null;
}

export default function CCRegime() {
  const { data, loading, error } = useChartData('/api/control-center');

  let content = null;

  if (data?.charts) {
    const lookup = buildCCLookup(data.charts);

    // Regime colors for active/inactive states
    const green = 'var(--graphite)';
    const greenActive = '#5DCAA5';
    const red = '#A32D2D';

    content = (
      <div style={{ overflow: 'auto', padding: '20px 24px' }}>
        {/* Regime header */}
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
          Market regime
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          Each regime confirmed when 3 of 5 indicators align. Green = wired + active. Grey = wired but inactive. Red = not yet wired.
        </div>

        {/* Regimes */}
        {REGIMES.map((reg) => {
          let liveCount = 0;
          const indicators = reg.indicators.map((ind) => {
            const isWired = !!(ind.ck && ind.rm);
            let isLive = false;
            let det = ind.fb;

            if (ind.ck && ind.rm) {
              const activeRule = findRule(lookup, ind.ck, ind.rm, true);
              if (activeRule) {
                isLive = true;
                det = activeRule.detail;
                liveCount++;
              } else {
                const anyRule = findRule(lookup, ind.ck, ind.rm, false);
                if (anyRule) det = anyRule.detail;
              }
            }

            const ic = isLive ? greenActive : (isWired ? '#888' : red);
            const dot = isLive ? '✓' : (isWired ? '●' : '✗');

            return (
              <div key={ind.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid rgba(128,128,128,0.06)' }}>
                <span style={{ fontSize: 12, color: ic, width: 16, textAlign: 'center' }}>{dot}</span>
                <span style={{ fontSize: 12, color: isLive ? greenActive : 'var(--graphite)', fontWeight: isLive ? 600 : 400 }}>{ind.label}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginLeft: 'auto', maxWidth: '50%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{det}</span>
              </div>
            );
          });

          const confirmed = liveCount >= 3;

          return (
            <div key={reg.name} style={{
              marginBottom: 16, border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden',
              ...(confirmed ? { borderColor: greenActive } : {}),
            }}>
              {/* Regime header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                background: confirmed ? 'rgba(93,202,165,0.06)' : 'rgba(128,128,128,0.02)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--graphite)' }}>{reg.name}</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: reg.bgColor, color: reg.color }}>{reg.tag}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                  color: liveCount >= 3 ? greenActive : (liveCount > 0 ? '#E1C87E' : red),
                }}>{liveCount}/5</span>
                {confirmed && (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(93,202,165,0.06)', color: greenActive, fontWeight: 600 }}>CONFIRMED</span>
                )}
              </div>
              {/* Indicators */}
              <div style={{ padding: '8px 16px 12px' }}>{indicators}</div>
            </div>
          );
        })}

        {/* Cycle blueprint */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
            Crypto cycle blueprint
          </div>
          {CYCLE_STEPS.map(([num, title, desc]) => (
            <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'rgba(163,45,45,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, color: '#A32D2D', flexShrink: 0,
              }}>{num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#A32D2D' }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ChartPanel
      title="Market Regime & Cycle Position"
      source={data?.updated ? `Live scoring from ${data.charts?.length || 0} indicators · ${data.updated}` : ''}
      loading={loading} error={error}
      chartType="line" chartData={null}
    >
      {content}
    </ChartPanel>
  );
}
