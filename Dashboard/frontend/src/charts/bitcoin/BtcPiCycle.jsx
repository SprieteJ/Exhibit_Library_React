import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig , xAxisConfig } from '../constants';

export default function BtcPiCycle({ from, to }) {
  const url = `/api/btc-pi-cycle?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: 'BTC', data: data.price, borderColor: '#F7931A', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
        { label: '111d MA', data: data.ma111, borderColor: '#00D64A', borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
        { label: '2× 350d MA', data: data.ma350x2, borderColor: '#EC5B5B', borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
      ],
    };
    const last111 = data.ma111?.filter(v => v != null).slice(-1)[0];
    const last350 = data.ma350x2?.filter(v => v != null).slice(-1)[0];
    if (last111 != null && last350 != null) {
      const gap = ((last111 / last350 - 1) * 100).toFixed(1);
      summary = (
        <div className="perf-item">
          <span style={{ color: Number(gap) >= 0 ? '#EC5B5B' : '#00D64A', fontWeight: 600 }}>
            {Number(gap) >= 0 ? 'WARNING — 111d above 2×350d' : 'Safe'}
          </span>{' '}
          <span>Gap: {gap}%</span>
        </div>
      );
    }
  }

  return (
    <ChartPanel
      title="Pi Cycle Top Indicator"
      source="Source: CoinGecko Pro · 111d MA vs 2× 350d MA — cross = cycle top"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data.dates),
          y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
