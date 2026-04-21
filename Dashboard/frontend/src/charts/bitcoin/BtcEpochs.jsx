import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { PAL, XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function BtcEpochs() {
  const url = '/api/btc-epochs?days=1400';
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data && Object.keys(data).length && !data.error) {
    const datasets = [];
    let i = 0;
    for (const [label, ep] of Object.entries(data)) {
      datasets.push({
        label, data: ep.days.map((d, j) => ({ x: d, y: ep.values[j] })),
        borderColor: PAL[i % PAL.length], backgroundColor: 'transparent',
        borderWidth: label.includes('2024') ? 2 : 1.2, pointRadius: 0, tension: 0.1,
        borderDash: label.includes('ongoing') || label.includes('2024') ? [] : [4, 3],
      });
      i++;
    }
    chartData = { datasets };

    summary = Object.entries(data).map(([label, ep], idx) => (
      <div className="perf-item" key={label}>
        <span style={{ color: PAL[idx % PAL.length], fontWeight: 600 }}>{label.split('(')[0].trim()}</span>{' '}
        <span>{ep.values[ep.values.length - 1]?.toFixed(1)}x</span>
      </div>
    ));
  }

  return (
    <ChartPanel
      title="BTC Halving Epochs (x-fold from halving)"
      source="Source: CoinGecko Pro · days since halving"
      loading={loading} error={error}
      chartType="scatter" chartData={chartData}
      chartOptions={{
        showLine: true,
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Days since halving', color: '#888', font: { size: 11 } }, ticks: XTICK, grid: XGRID },
          y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => v + 'x' }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
