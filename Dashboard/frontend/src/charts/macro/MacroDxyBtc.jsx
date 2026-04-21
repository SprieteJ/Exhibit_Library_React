import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function MacroDxyBtc({ from, to, window: win }) {
  const url = `/api/macro-dxy-btc?from=${from}&to=${to}&window=${win || '30'}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: 'DXY', data: data.dxy, borderColor: '#C084FC', backgroundColor: 'transparent', borderWidth: 1.4, pointRadius: 0, tension: 0.1, yAxisID: 'y', spanGaps: true },
        { label: 'BTC', data: data.btc, borderColor: '#F7931A', backgroundColor: 'transparent', borderWidth: 1.4, pointRadius: 0, tension: 0.1, yAxisID: 'y1', spanGaps: true },
        { label: 'Correlation', data: data.correlation, borderColor: '#00D64A', backgroundColor: 'rgba(0,214,74,0.05)', borderWidth: 1, pointRadius: 0, tension: 0.1, yAxisID: 'y2', fill: true, spanGaps: true },
      ],
    };
    const lastCorr = data.correlation?.filter(v => v != null).slice(-1)[0];
    if (lastCorr != null) {
      summary = (
        <div className="perf-item">
          <span style={{ color: '#00D64A', fontWeight: 600 }}>Correlation</span>{' '}
          <span>{lastCorr > 0 ? '+' : ''}{lastCorr.toFixed(2)}</span>
        </div>
      );
    }
  }

  return (
    <ChartPanel
      title={`DXY vs BTC (${win || 30}d correlation)`}
      source="Source: Yahoo Finance + CoinGecko · forward-filled"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data.dates),
          y:  { position: 'left',  ticks: { ...YTICK }, grid: YGRID, title: { display: true, text: 'DXY', color: '#888', font: { size: 11 } } },
          y1: { position: 'right', ticks: { ...YTICK, callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) }, grid: { display: false } },
          y2: { display: false, min: -1, max: 1 },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
