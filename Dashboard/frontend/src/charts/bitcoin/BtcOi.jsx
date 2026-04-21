import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig , xAxisConfig } from '../constants';

export default function BtcOi({ from, to }) {
  const url = `/api/btc-oi?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: 'Open Interest', data: data.oi_values, borderColor: '#2471CC', backgroundColor: 'rgba(36,113,204,0.08)', borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true, yAxisID: 'y' },
        { label: 'BTC', data: data.btc_prices, borderColor: '#F7931A', backgroundColor: 'transparent', borderWidth: 1.2, pointRadius: 0, tension: 0.1, yAxisID: 'y1', spanGaps: true },
      ],
    };
    const lastOi = data.oi_values[data.oi_values.length - 1];
    if (lastOi) summary = <div className="perf-item"><span style={{ color: '#2471CC', fontWeight: 600 }}>OI</span> ${fmtBig(lastOi)}</div>;
  }

  return (
    <ChartPanel
      title="BTC Open Interest"
      source="Source: Binance + Bybit · aggregated USD OI"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y:  { position: 'left',  ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID },
          y1: { position: 'right', ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: { display: false } },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
