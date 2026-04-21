import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function BtcRealvol({ from, to }) {
  const url = `/api/btc-realvol?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: '30d', data: data.vol_30d, borderColor: '#F7931A', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent', spanGaps: true },
        { label: '90d', data: data.vol_90d, borderColor: '#2471CC', borderWidth: 1.2, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent', spanGaps: true },
        { label: '180d', data: data.vol_180d, borderColor: '#746BE6', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
      ],
    };
    const last30 = data.vol_30d?.filter(v => v != null).slice(-1)[0];
    const last90 = data.vol_90d?.filter(v => v != null).slice(-1)[0];
    summary = (
      <>
        {last30 != null && <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>30d</span> {last30.toFixed(1)}%</div>}
        {last90 != null && <div className="perf-item"><span style={{ color: '#2471CC', fontWeight: 600 }}>90d</span> {last90.toFixed(1)}%</div>}
      </>
    );
  }

  return (
    <ChartPanel
      title="BTC Realized Volatility"
      source="Source: CoinGecko Pro · annualized log-return vol"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
