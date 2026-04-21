import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function MacroRealYields({ from, to }) {
  const url = `/api/macro-real-yields?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: '10Y Yield (%)', data: data.yield_10y, borderColor: '#ED9B9B', backgroundColor: 'transparent', borderWidth: 1.4, pointRadius: 0, tension: 0.1, yAxisID: 'y', spanGaps: true },
        { label: 'BTC', data: data.btc, borderColor: '#F7931A', backgroundColor: 'transparent', borderWidth: 1.4, pointRadius: 0, tension: 0.1, yAxisID: 'y1', spanGaps: true },
      ],
    };
    const lastYield = data.yield_10y?.filter(v => v != null).slice(-1)[0];
    if (lastYield != null) {
      summary = (
        <div className="perf-item">
          <span style={{ color: '#ED9B9B', fontWeight: 600 }}>10Y Yield</span>{' '}
          <span>{lastYield.toFixed(2)}%</span>
        </div>
      );
    }
  }

  return (
    <ChartPanel
      title="10Y Treasury Yield vs BTC"
      source="Source: Yahoo Finance (^TNX) + CoinGecko"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y:  { position: 'left',  ticks: { ...YTICK, callback: v => v.toFixed(1) + '%' }, grid: YGRID, title: { display: true, text: 'Yield %', color: '#888', font: { size: 11 } } },
          y1: { position: 'right', ticks: { ...YTICK, callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) }, grid: { display: false } },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
