import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { PAL, XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function BtcBull() {
  const url = '/api/btc-bull?days=1000';
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data && Object.keys(data).length && !data.error) {
    const datasets = [];
    let i = 0;
    for (const [label, c] of Object.entries(data)) {
      datasets.push({
        label, data: c.days.map((d, j) => ({ x: d, y: c.values[j] })),
        borderColor: PAL[i % PAL.length], backgroundColor: 'transparent',
        borderWidth: label.includes('2022') ? 2 : 1.2, pointRadius: 0, tension: 0.1,
        borderDash: label.includes('2022') ? [] : [4, 3],
      });
      i++;
    }
    chartData = { datasets };

    summary = Object.entries(data).map(([label, c], idx) => {
      const maxVal = Math.max(...c.values);
      return (
        <div className="perf-item" key={label}>
          <span style={{ color: PAL[idx % PAL.length], fontWeight: 600 }}>{label.split('(')[0].trim()}</span>{' '}
          <span className="pos">+{(maxVal - 100).toFixed(0)}%</span>
        </div>
      );
    });
  }

  return (
    <ChartPanel
      title="BTC Bull Cycles (indexed to trough)"
      source="Source: CoinGecko Pro · days since cycle trough"
      loading={loading} error={error}
      chartType="scatter" chartData={chartData}
      chartOptions={{
        showLine: true,
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Days since trough', color: '#888', font: { size: 11 } }, ticks: XTICK, grid: XGRID },
          y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => v.toFixed(0) }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
