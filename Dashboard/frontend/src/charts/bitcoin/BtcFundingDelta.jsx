import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function BtcFundingDelta({ from, to, window: win }) {
  const url = `/api/btc-funding-delta?from=${from}&to=${to}&window=${win || '30'}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: 'Funding Δ (bps)', data: data.funding_delta, borderColor: '#746BE6', backgroundColor: 'transparent', borderWidth: 1.4, pointRadius: 0, tension: 0.1, yAxisID: 'y' },
        { label: 'Price Δ (%)', data: data.price_delta, borderColor: '#F7931A', backgroundColor: 'transparent', borderWidth: 1.2, pointRadius: 0, tension: 0.1, yAxisID: 'y1' },
      ],
    };
  }

  return (
    <ChartPanel
      title={`Funding Delta vs Price Return (${data?.window || win || 30}d)`}
      source="Source: Binance/Bybit + CoinGecko"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data.dates),
          y:  { position: 'left',  ticks: { ...YTICK, callback: v => v.toFixed(0) + ' bps' }, grid: YGRID, title: { display: true, text: 'Funding Δ', color: '#888', font: { size: 11 } } },
          y1: { position: 'right', ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: { display: false }, title: { display: true, text: 'Price Δ', color: '#888', font: { size: 11 } } },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
    />
  );
}
