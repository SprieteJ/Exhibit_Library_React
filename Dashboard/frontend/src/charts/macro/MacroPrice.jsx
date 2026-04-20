import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { MACRO_COLORS, PAL, XTICK, YTICK, XGRID, YGRID } from '../constants';

const SYMBOLS = 'BTC,ETH,SPY,QQQ,GLD,TLT,BNO';

export default function MacroPrice({ from, to }) {
  const url = `/api/macro-price?symbols=${SYMBOLS}&from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data && Object.keys(data).length && !data.error) {
    const firstKey = Object.keys(data)[0];
    const dates = data[firstKey]?.dates || [];
    const datasets = [];
    for (const [sym, a] of Object.entries(data)) {
      if (!a.rebased) continue;
      datasets.push({
        label: sym,
        data: a.rebased,
        borderColor: MACRO_COLORS[sym] || PAL[datasets.length % PAL.length],
        backgroundColor: 'transparent',
        borderWidth: 1.4, pointRadius: 0, tension: 0.1, spanGaps: true,
      });
    }
    chartData = { labels: dates, datasets };

    const sorted = Object.entries(data)
      .filter(([, a]) => a.rebased?.length)
      .map(([sym, a]) => ({ sym, last: a.rebased[a.rebased.length - 1], color: MACRO_COLORS[sym] || '#888' }))
      .sort((a, b) => b.last - a.last);
    summary = sorted.map(a => (
      <div className="perf-item" key={a.sym}>
        <span style={{ color: a.color, fontWeight: 600 }}>{a.sym}</span>{' '}
        <span className={a.last >= 100 ? 'pos' : 'neg'}>{a.last >= 100 ? '+' : ''}{(a.last - 100).toFixed(1)}%</span>
      </div>
    ));
  }

  return (
    <ChartPanel
      title="Price Comparison (rebased to 100)"
      source="Source: CoinGecko + Yahoo Finance · rebased to 100 at start"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0, 7) : ''; } }, grid: XGRID },
          y: { ticks: { ...YTICK }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
