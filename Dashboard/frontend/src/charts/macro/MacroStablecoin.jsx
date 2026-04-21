import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig , xAxisConfig } from '../constants';

export default function MacroStablecoin({ from, to }) {
  const url = `/api/macro-stablecoin?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'Stablecoin Mcap',
        data: data.values,
        borderColor: '#26A17B',
        backgroundColor: 'rgba(38,161,123,0.08)',
        borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true, spanGaps: true,
      }],
    };
    const last = data.values[data.values.length - 1];
    if (last != null) {
      summary = (
        <div className="perf-item">
          <span style={{ color: '#26A17B', fontWeight: 600 }}>Total</span>{' '}
          <span>${fmtBig(last)}</span>
        </div>
      );
    }
  }

  return (
    <ChartPanel
      title="Stablecoin Total Market Cap"
      source="Source: CoinGecko Pro · aggregated stablecoin sector"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data.dates),
          y: { ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID },
        },
        plugins: { legend: { display: false } },
      }}
      summary={summary}
    />
  );
}
