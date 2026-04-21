import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function EtfTotalAum({ from, to }) {
  const url = `/api/etf-aum?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;
  if (data?.assets) {
    const allDates = new Set();
    for (const v of Object.values(data.assets)) v.dates.forEach(d => allDates.add(d));
    const dates = [...allDates].sort();
    const datasets = [];
    for (const [asset, v] of Object.entries(data.assets)) {
      const dateMap = {};
      v.dates.forEach((d, i) => dateMap[d] = v.aum[i]);
      const color = asset === 'BTC' ? '#F7931A' : '#627EEA';
      datasets.push({ label: asset, data: dates.map(d => dateMap[d] ?? null), borderColor: color, backgroundColor: color + '33', borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true, spanGaps: true });
    }
    if (datasets.length) chartData = { labels: dates, datasets };
    summary = Object.entries(data.assets).map(([asset, v]) => {
      const last = v.aum[v.aum.length - 1];
      const color = asset === 'BTC' ? '#F7931A' : '#627EEA';
      return last != null ? <div className="perf-item" key={asset}><span style={{ color, fontWeight: 600 }}>{asset}</span> ${last.toFixed(1)}B</div> : null;
    });
  }
  return <ChartPanel title="Spot ETF Total AuM" source="Source: Farside Investors" loading={loading} error={error} chartType="line" chartData={chartData}
    chartOptions={{ scales: { x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0,7) : ''; } }, grid: XGRID }, y: { ticks: { ...YTICK, callback: v => '$' + v.toFixed(0) + 'B' }, grid: YGRID } }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } } }} summary={summary} />;
}
