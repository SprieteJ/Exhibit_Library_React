import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function BtcFunding({ from, to }) {
  const url = `/api/btc-funding?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    const colors = data.values.map(v => v != null && v >= 0 ? 'rgba(0,214,74,0.5)' : 'rgba(236,91,91,0.5)');
    chartData = {
      labels: data.dates,
      datasets: [
        { label: 'Funding Rate', data: data.values, backgroundColor: colors, borderColor: colors, borderWidth: 0, type: 'bar' },
        { label: '7d MA', data: data.ma7, borderColor: '#F7931A', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent', type: 'line', spanGaps: true },
      ],
    };
    const last = data.ma7?.filter(v => v != null).slice(-1)[0];
    if (last != null) {
      const ann = (last * 3 * 365 * 100).toFixed(1);
      summary = (
        <div className="perf-item">
          <span style={{ color: last >= 0 ? '#00D64A' : '#EC5B5B', fontWeight: 600 }}>7d avg</span>{' '}
          <span>{ann}% ann.</span>
        </div>
      );
    }
  }

  return (
    <ChartPanel
      title="BTC Perpetual Funding Rate"
      source="Source: Binance + Bybit · 8h avg per day"
      loading={loading} error={error}
      chartType="bar" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data.dates),
          y: { ticks: { ...YTICK, callback: v => (v * 100).toFixed(3) + '%' }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
