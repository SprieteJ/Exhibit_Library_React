import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { MACRO_COLORS, PAL, XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

const WIN_LABELS = { '30': '1M', '90': '3M', '180': '6M', '365': '1Y', '730': '2Y', '1460': '4Y' };

export default function MacroSharpe({ from, to, window: win }) {
  const url = `/api/macro-sharpe?from=${from}&to=${to}&window=${win || '180'}`;
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
      a.dates.forEach((d, i) => dateMap[d] = a.sharpe[i]);
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
        <span className={a.current > 0 ? 'pos' : 'neg'}>{a.current > 0 ? '+' : ''}{a.current.toFixed(2)}</span>
      </div>
    ));
  }

  return (
    <ChartPanel
      title={`Rolling Sharpe Ratio (${WIN_LABELS[win] || win + 'd'})`}
      source="Source: CoinGecko + Yahoo Finance · annualised, risk-free = 0"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(dates),
          y: { ticks: { ...YTICK, callback: v => v.toFixed(1) }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
