import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig , xAxisConfig } from '../constants';

export default function BtcMa({ from, to }) {
  const url = `/api/btc-ma?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    const ds = [
      { label: 'BTC', data: data.price, borderColor: '#F7931A', borderWidth: 1.6, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
      { label: '50d MA', data: data.ma50, borderColor: '#00D64A', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
      { label: '200d MA', data: data.ma200, borderColor: '#EC5B5B', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
    ];
    if (data.custom_ma?.length) {
      ds.push({ label: `${data.custom_window}d MA`, data: data.custom_ma, borderColor: '#746BE6', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [2, 2], backgroundColor: 'transparent', spanGaps: true });
    }
    chartData = { labels: data.dates, datasets: ds };

    const last = data.price[data.price.length - 1];
    const last50 = data.ma50?.filter(v => v != null).slice(-1)[0];
    const last200 = data.ma200?.filter(v => v != null).slice(-1)[0];
    summary = (
      <>
        <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>BTC</span> ${fmtBig(last)}</div>
        {last50 && <div className="perf-item"><span style={{ color: '#00D64A', fontWeight: 600 }}>50d</span> ${fmtBig(last50)}</div>}
        {last200 && <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>200d</span> ${fmtBig(last200)}</div>}
      </>
    );
  }

  return (
    <ChartPanel
      title="BTC Moving Averages"
      source="Source: CoinGecko Pro"
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
