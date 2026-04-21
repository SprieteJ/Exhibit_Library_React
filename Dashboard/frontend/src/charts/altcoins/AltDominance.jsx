import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function AltDominance({ from, to }) {
  const url = `/api/dominance-shares?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;
  if (data?.dates?.length) {
    chartData = { labels: data.dates, datasets: [
      { label: 'BTC', data: data.btc_pct, borderColor: '#F7931A', backgroundColor: 'rgba(247,147,26,0.15)', borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true, spanGaps: true },
      { label: 'ETH', data: data.eth_pct, borderColor: '#627EEA', backgroundColor: 'rgba(98,126,234,0.15)', borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true, spanGaps: true },
      { label: 'Altcoins', data: data.alt_pct, borderColor: '#00D64A', backgroundColor: 'rgba(0,214,74,0.15)', borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true, spanGaps: true },
    ]};
    const lb = data.btc_pct?.filter(v => v != null).slice(-1)[0];
    const le = data.eth_pct?.filter(v => v != null).slice(-1)[0];
    const la = data.alt_pct?.filter(v => v != null).slice(-1)[0];
    summary = (<>
      {lb != null && <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>BTC</span> {lb.toFixed(1)}%</div>}
      {le != null && <div className="perf-item"><span style={{ color: '#627EEA', fontWeight: 600 }}>ETH</span> {le.toFixed(1)}%</div>}
      {la != null && <div className="perf-item"><span style={{ color: '#00D64A', fontWeight: 600 }}>Alts</span> {la.toFixed(1)}%</div>}
    </>);
  }
  return <ChartPanel title="Dominance Shares" source="Source: CoinGecko Pro" loading={loading} error={error} chartType="line" chartData={chartData}
    chartOptions={{ scales: { x: xAxisConfig(data?.dates || []), y: { stacked: true, max: 100, ticks: { ...YTICK, callback: v => v + '%' }, grid: YGRID } }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } } }} summary={summary} />;
}
