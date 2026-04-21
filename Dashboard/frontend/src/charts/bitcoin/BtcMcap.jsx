import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig , xAxisConfig } from '../constants';

export default function BtcMcap({ from, to }) {
  const url = `/api/btc-mcap?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    const ds = [{
      label: 'BTC Market Cap', data: data.mcap,
      borderColor: '#F7931A', backgroundColor: 'rgba(247,147,26,0.08)',
      borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true,
    }];
    // Add milestone lines
    if (data.milestones) {
      for (const m of data.milestones) {
        ds.push({
          label: m.label, data: data.dates.map(() => m.value),
          borderColor: 'rgba(136,139,136,0.3)', borderWidth: 1, pointRadius: 0,
          borderDash: [6, 4], backgroundColor: 'transparent',
        });
      }
    }
    chartData = { labels: data.dates, datasets: ds };

    const last = data.mcap[data.mcap.length - 1];
    if (last) summary = <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>Market Cap</span> ${fmtBig(last)}</div>;
  }

  return (
    <ChartPanel
      title="BTC Market Cap"
      source="Source: CoinGecko Pro"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data.dates),
          y: { ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12, filter: item => item.text !== 'BTC Market Cap' } } },
      }}
      summary={summary}
    />
  );
}
