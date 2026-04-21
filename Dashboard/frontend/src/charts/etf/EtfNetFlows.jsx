import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function EtfNetFlows({ from, to, window: win }) {
  const url = `/api/etf-flows?from=${from}&to=${to}&window=${win || '7'}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;
  if (data?.assets) {
    const datasets = [];
    const allDates = new Set();
    for (const [asset, v] of Object.entries(data.assets)) {
      v.dates.forEach(d => allDates.add(d));
    }
    const dates = [...allDates].sort();
    for (const [asset, v] of Object.entries(data.assets)) {
      const dateMap = {};
      v.dates.forEach((d, i) => dateMap[d] = v.rolling[i]);
      const color = asset === 'BTC' ? '#F7931A' : '#627EEA';
      datasets.push({ label: `${asset} (${data.window}d trailing)`, data: dates.map(d => dateMap[d] ?? null), borderColor: color, backgroundColor: 'transparent', borderWidth: 1.4, pointRadius: 0, tension: 0.1, spanGaps: true });
    }
    if (datasets.length) chartData = { labels: dates, datasets };

    summary = Object.entries(data.assets).map(([asset, v]) => {
      const last = v.current_rolling;
      const color = asset === 'BTC' ? '#F7931A' : '#627EEA';
      return last != null ? <div className="perf-item" key={asset}><span style={{ color, fontWeight: 600 }}>{asset}</span> <span className={last >= 0 ? 'pos' : 'neg'}>{last >= 0 ? '+' : ''}{last.toFixed(1)}M</span></div> : null;
    });
  }
  return <ChartPanel title={`Spot ETF Net Flows (${data?.window || win || 7}d trailing)`} source="Source: Farside Investors" loading={loading} error={error} chartType="line" chartData={chartData}
    chartOptions={{ scales: { x: xAxisConfig(dates), y: { ticks: { ...YTICK, callback: v => '$' + v.toFixed(0) + 'M' }, grid: YGRID } }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } } }} summary={summary} />;
}
