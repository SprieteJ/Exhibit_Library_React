import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig , xAxisConfig } from '../constants';

export default function Btc200wFloor({ from, to }) {
  const url = `/api/btc-200w-floor?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: 'BTC', data: data.price, borderColor: '#F7931A', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
        { label: '200w MA', data: data.ma200w, borderColor: '#EC5B5B', borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
      ],
    };
    const lastMult = data.multiplier?.filter(v => v != null).slice(-1)[0];
    const lastMa = data.ma200w?.filter(v => v != null).slice(-1)[0];
    summary = (
      <>
        {lastMa && <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>200w MA</span> ${fmtBig(lastMa)}</div>}
        {lastMult && <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>Multiple</span> {lastMult.toFixed(2)}x</div>}
      </>
    );
  }

  return (
    <ChartPanel
      title="BTC 200-Week Moving Average"
      source="Source: CoinGecko Pro · 1400-day SMA as macro floor"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
