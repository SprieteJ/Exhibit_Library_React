import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function AltAltseason({ from, to, window: win }) {
  const url = `/api/alt-altseason?from=${from}&to=${to}&window=${win || '90'}&topn=50`;
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;
  if (data?.dates?.length) {
    chartData = { labels: data.dates, datasets: [
      { label: '% Outperforming BTC', data: data.values, borderColor: '#00D64A', backgroundColor: 'rgba(0,214,74,0.08)', borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true, yAxisID: 'y' },
      ...(data.btc_dominance ? [{ label: 'BTC Dominance', data: data.btc_dominance, borderColor: '#F7931A', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4,3], backgroundColor: 'transparent', yAxisID: 'y1', spanGaps: true }] : []),
    ]};
    const last = data.values[data.values.length - 1];
    if (last != null) summary = <div className="perf-item"><span style={{ color: last > 50 ? '#00D64A' : '#EC5B5B', fontWeight: 600 }}>{last > 50 ? 'Altseason' : 'BTC Season'}</span> {last.toFixed(0)}% beating BTC</div>;
  }
  return <ChartPanel title={`Altseason Indicator (${win || 90}d)`} source="Source: CoinGecko Pro · top 50 alts ex-stables" loading={loading} error={error} chartType="line" chartData={chartData}
    chartOptions={{ scales: { x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0,7) : ''; } }, grid: XGRID }, y: { position: 'left', min: 0, max: 100, ticks: { ...YTICK, callback: v => v + '%' }, grid: YGRID }, y1: { position: 'right', ticks: { ...YTICK, callback: v => v?.toFixed(0) + '%' }, grid: { display: false } } }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } } }} summary={summary} />;
}
