import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function AltMcapGap({ from, to }) {
  const url = `/api/alt-mcap-gap?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;
  if (data?.dates?.length) {
    const colors = data.gap.map(v => v != null && v >= 0 ? 'rgba(0,214,74,0.6)' : 'rgba(236,91,91,0.6)');
    chartData = { labels: data.dates, datasets: [{ label: 'MA Gap %', data: data.gap, backgroundColor: colors, borderColor: colors, borderWidth: 0, pointRadius: 0, type: 'bar' }] };
    const last = data.gap?.filter(v => v != null).slice(-1)[0];
    if (last != null) summary = <div className="perf-item"><span style={{ color: last >= 0 ? '#00D64A' : '#EC5B5B', fontWeight: 600 }}>{last >= 0 ? 'Golden' : 'Death'} Cross</span> <span className={last >= 0 ? 'pos' : 'neg'}>{last >= 0 ? '+' : ''}{last.toFixed(1)}%</span></div>;
  }
  return <ChartPanel title="Altcoin Mcap 50d / 200d MA Gap" source="Source: CoinGecko Pro" loading={loading} error={error} chartType="bar" chartData={chartData}
    chartOptions={{ scales: { x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0,7) : ''; } }, grid: XGRID }, y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID } }, plugins: { legend: { display: false } } }} summary={summary} />;
}
