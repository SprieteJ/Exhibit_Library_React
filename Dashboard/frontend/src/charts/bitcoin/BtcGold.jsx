import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig , xAxisConfig } from '../constants';

export default function BtcGold({ from, to }) {
  const url = `/api/btc-gold?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: 'BTC', data: data.btc_prices, borderColor: '#F7931A', backgroundColor: 'transparent', borderWidth: 1.4, pointRadius: 0, tension: 0.1, yAxisID: 'y', spanGaps: true },
        { label: 'Gold (GLD)', data: data.gold_prices, borderColor: '#E1C87E', backgroundColor: 'transparent', borderWidth: 1.4, pointRadius: 0, tension: 0.1, yAxisID: 'y1', spanGaps: true },
      ],
    };
  }

  return (
    <ChartPanel
      title="Bitcoin vs Gold"
      source="Source: CoinGecko + Yahoo Finance (GLD)"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y:  { position: 'left',  ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID, title: { display: true, text: 'BTC', color: '#888', font: { size: 11 } } },
          y1: { position: 'right', ticks: { ...YTICK, callback: v => '$' + v.toFixed(0) }, grid: { display: false }, title: { display: true, text: 'GLD', color: '#888', font: { size: 11 } } },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
    />
  );
}
