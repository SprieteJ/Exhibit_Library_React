import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function Eth200dDev({ from, to }) {
  const url = `/api/eth-200d-dev?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    const colors = data.deviation.map(v => v != null && v >= 0 ? 'rgba(0,214,74,0.5)' : 'rgba(236,91,91,0.5)');
    chartData = {
      labels: data.dates,
      datasets: [{ label: 'Deviation %', data: data.deviation, backgroundColor: colors, borderColor: colors, borderWidth: 0, pointRadius: 0, type: 'bar' }],
    };
    const last = data.deviation?.filter(v => v != null).slice(-1)[0];
    if (last != null) {
      summary = (
        <div className="perf-item">
          <span style={{ color: last >= 0 ? '#00D64A' : '#EC5B5B', fontWeight: 600 }}>Deviation</span>{' '}
          <span className={last >= 0 ? 'pos' : 'neg'}>{last >= 0 ? '+' : ''}{last.toFixed(1)}%</span>
        </div>
      );
    }
  }

  return (
    <ChartPanel title="ETH 200-Week MA Deviation" source="Source: CoinGecko Pro · % above/below 1400d SMA"
      loading={loading} error={error} chartType="bar" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID },
        },
        plugins: { legend: { display: false } },
      }}
      summary={summary}
    />
  );
}
