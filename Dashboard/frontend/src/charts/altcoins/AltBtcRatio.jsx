import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function AltBtcRatio({ from, to }) {
  const url = `/api/btc-alt-ratio?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;
  if (data?.dates?.length) {
    chartData = { labels: data.dates, datasets: [{ label: 'BTC / Alt Mcap', data: data.ratio, borderColor: '#F7931A', backgroundColor: 'rgba(247,147,26,0.06)', borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true, spanGaps: true }] };
    const last = data.ratio?.filter(v => v != null).slice(-1)[0];
    if (last) summary = <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>Ratio</span> {last.toFixed(2)}x</div>;
  }
  return <ChartPanel title="BTC / Altcoin Market Cap Ratio" source="Source: CoinGecko Pro · rising = BTC dominance" loading={loading} error={error} chartType="line" chartData={chartData}
    chartOptions={{ scales: { x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0,7) : ''; } }, grid: XGRID }, y: { ticks: YTICK, grid: YGRID } }, plugins: { legend: { display: false } } }} summary={summary} />;
}
