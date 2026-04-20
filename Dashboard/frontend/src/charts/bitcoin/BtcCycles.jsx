import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { PAL, XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function BtcCycles() {
  const url = '/api/btc-cycles?days=1000';
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
        borderWidth: label.includes('ongoing') ? 2 : 1.2, pointRadius: 0, tension: 0.1,
        borderDash: label.includes('ongoing') ? [] : [4, 3],
      });
      i++;
    }
    chartData = { datasets };

    summary = Object.entries(data).map(([label, c], idx) => {
      const minVal = Math.min(...c.values);
      return (
        <div className="perf-item" key={label}>
          <span style={{ color: PAL[idx % PAL.length], fontWeight: 600 }}>{label.split('(')[0].trim()}</span>{' '}
          <span className="neg">{(minVal - 100).toFixed(0)}%</span>
        </div>
      );
    });
  }

  return (
    <ChartPanel
      title="BTC Bear Market Cycles (indexed to peak)"
      source="Source: CoinGecko Pro · days since cycle peak"
      loading={loading} error={error}
      chartType="scatter" chartData={chartData}
      chartOptions={{
        showLine: true,
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Days since peak', color: '#888', font: { size: 11 } }, ticks: XTICK, grid: XGRID },
          y: { ticks: { ...YTICK, callback: v => v.toFixed(0) }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
