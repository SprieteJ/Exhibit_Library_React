import { useState } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, xAxisConfig } from '../constants';

const INTERVALS = [
  { label: '1D', value: '1d' }, { label: '1W', value: '1w' },
  { label: '1M', value: '1m' }, { label: 'All', value: 'max' },
];

export default function PmHistory({ tokenId, question }) {
  const [interval, setInterval] = useState('max');
  const url = tokenId ? `/api/pm-history?token_id=${tokenId}&interval=${interval}&fidelity=300` : null;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'Probability', data: data.probability,
        borderColor: '#00D64A', backgroundColor: 'rgba(0,214,74,0.08)',
        borderWidth: 1.6, pointRadius: 0, tension: 0.1, fill: true,
      }],
    };
    const last = data.probability[data.probability.length - 1];
    const first = data.probability[0];
    if (last != null && first != null) {
      const change = last - first;
      summary = (
        <>
          <div className="perf-item"><span style={{ color: '#00D64A', fontWeight: 600 }}>Now</span> {last}%</div>
          <div className="perf-item">
            <span style={{ color: change >= 0 ? '#00D64A' : '#EC5B5B', fontWeight: 600 }}>Change</span>{' '}
            <span className={change >= 0 ? 'pos' : 'neg'}>{change >= 0 ? '+' : ''}{change.toFixed(1)}pp</span>
          </div>
        </>
      );
    }
  }

  if (!tokenId) {
    return (
      <ChartPanel title="Market History" source="" loading={false} error={null} chartType="line" chartData={null}>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Select a market to view probability history.</div>
      </ChartPanel>
    );
  }

  return (
    <ChartPanel
      title={question || 'Probability History'}
      source={data?.live ? 'Live from Polymarket CLOB' : ''}
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y: { min: 0, max: 100, ticks: { ...YTICK, callback: v => v + '%' }, grid: YGRID },
        },
        plugins: { legend: { display: false } },
      }}
      summary={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {summary}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
            {INTERVALS.map(i => (
              <button key={i.value} className={`preset${interval === i.value ? ' active' : ''}`}
                onClick={() => setInterval(i.value)}>{i.label}</button>
            ))}
          </div>
        </div>
      }
    />
  );
}
