import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function BtcRvIv({ from, to }) {
  const url = `/api/btc-rv-iv?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: '30d RV', data: data.rv30, borderColor: '#F7931A', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
        { label: 'DVOL (IV)', data: data.dvol, borderColor: '#746BE6', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
        { label: 'Spread (IV-RV)', data: data.spread, borderColor: '#00D64A', backgroundColor: 'rgba(0,214,74,0.06)', borderWidth: 1, pointRadius: 0, tension: 0.1, fill: true },
      ],
    };
    const lastRv = data.rv30?.slice(-1)[0];
    const lastIv = data.dvol?.slice(-1)[0];
    const lastSpread = data.spread?.slice(-1)[0];
    summary = (
      <>
        {lastRv != null && <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>RV</span> {lastRv.toFixed(1)}%</div>}
        {lastIv != null && <div className="perf-item"><span style={{ color: '#746BE6', fontWeight: 600 }}>IV</span> {lastIv.toFixed(1)}%</div>}
        {lastSpread != null && <div className="perf-item"><span style={{ color: '#00D64A', fontWeight: 600 }}>Spread</span> {lastSpread > 0 ? '+' : ''}{lastSpread.toFixed(1)}pp</div>}
      </>
    );
  }

  return (
    <ChartPanel
      title="BTC Implied vs Realized Volatility"
      source="Source: Deribit DVOL + CoinGecko · 30d RV annualized"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data.dates),
          y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
