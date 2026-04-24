import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, xAxisConfig } from '../constants';

export default function BtcSessionReturns({ from, to }) {
  const url = `/api/btc-session-returns?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        {
          label: 'US',
          data: data.us,
          borderColor: '#2471CC',
          backgroundColor: 'transparent',
          borderWidth: 1.8, pointRadius: 0, tension: 0.1,
        },
        {
          label: 'EU',
          data: data.eu,
          borderColor: '#C084FC',
          backgroundColor: 'transparent',
          borderWidth: 1.8, pointRadius: 0, tension: 0.1,
        },
        {
          label: 'APAC',
          data: data.apac,
          borderColor: '#F7931A',
          backgroundColor: 'transparent',
          borderWidth: 1.8, pointRadius: 0, tension: 0.1,
        },
      ],
    };

    const s = data.summary;
    if (s) {
      summary = (
        <>
          <div className="perf-item">
            <span style={{ color: '#2471CC', fontWeight: 600 }}>US</span>{' '}
            <span className={s.us >= 0 ? 'pos' : 'neg'}>{s.us >= 0 ? '+' : ''}{s.us.toFixed(1)}%</span>
          </div>
          <div className="perf-item">
            <span style={{ color: '#C084FC', fontWeight: 600 }}>EU</span>{' '}
            <span className={s.eu >= 0 ? 'pos' : 'neg'}>{s.eu >= 0 ? '+' : ''}{s.eu.toFixed(1)}%</span>
          </div>
          <div className="perf-item">
            <span style={{ color: '#F7931A', fontWeight: 600 }}>APAC</span>{' '}
            <span className={s.apac >= 0 ? 'pos' : 'neg'}>{s.apac >= 0 ? '+' : ''}{s.apac.toFixed(1)}%</span>
          </div>
        </>
      );
    }
  }

  return (
    <ChartPanel
      title="BTC Cumulative Return By Session"
      source="Source: CoinGecko · APAC 00-08 UTC · EU 08-16 UTC · US 16-00 UTC"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y: {
            ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' },
            grid: {
              ...YGRID,
              color: ctx => ctx.tick.value === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
            },
          },
        },
        plugins: {
          legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } },
        },
      }}
      summary={summary}
    />
  );
}
