import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { MACRO_COLORS, PAL, XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

const SYMBOLS = 'SPY,QQQ,GLD,TLT,DX-Y.NYB,BNO';

export default function MacroBtcCorr({ from, to, window: win }) {
  const url = `/api/macro-btc-corr?symbols=${SYMBOLS}&from=${from}&to=${to}&window=${win || '30'}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.assets && Object.keys(data.assets).length) {
    const allDates = new Set();
    for (const a of Object.values(data.assets)) a.dates.forEach(d => allDates.add(d));
    const dates = [...allDates].sort();
    const datasets = [];
    for (const [sym, a] of Object.entries(data.assets)) {
      const dateMap = {};
      a.dates.forEach((d, i) => dateMap[d] = a.corr[i]);
      datasets.push({
        label: a.label,
        data: dates.map(d => dateMap[d] !== undefined ? dateMap[d] : null),
        borderColor: MACRO_COLORS[sym] || PAL[datasets.length % PAL.length],
        backgroundColor: 'transparent',
        borderWidth: 1.4, pointRadius: 0, tension: 0.1, spanGaps: true,
      });
    }
    chartData = { labels: dates, datasets };

    const sorted = Object.entries(data.assets)
      .map(([sym, a]) => ({ sym, label: a.label, current: a.current, color: MACRO_COLORS[sym] || '#888' }))
      .filter(a => a.current != null)
      .sort((a, b) => b.current - a.current);
    summary = sorted.map(a => (
      <div className="perf-item" key={a.sym}>
        <span style={{ color: a.color, fontWeight: 600 }}>{a.label}</span>{' '}
        <span>{a.current > 0 ? '+' : ''}{a.current.toFixed(2)}</span>
      </div>
    ));
  }

  return (
    <ChartPanel
      title={`Rolling ${data?.window || win || 30}d Correlation vs BTC`}
      source="Source: CoinGecko + Yahoo Finance · log-return correlation"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(chartData?.labels || []),
          y: { min: -1, max: 1, ticks: { ...YTICK, callback: v => v.toFixed(1) }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
