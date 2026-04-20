import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function MacroRisk({ from, to }) {
  const url = `/api/macro-risk?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        {
          label: 'Risk Score', data: data.score,
          borderColor: '#00D64A', backgroundColor: 'rgba(0,214,74,0.08)',
          borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true, yAxisID: 'y', spanGaps: true,
        },
        {
          label: 'BTC', data: data.btc,
          borderColor: '#F7931A', backgroundColor: 'transparent',
          borderWidth: 1.2, pointRadius: 0, tension: 0.1, yAxisID: 'y1', spanGaps: true,
        },
      ],
    };
    const lastScore = data.score?.filter(v => v != null).slice(-1)[0];
    if (lastScore != null) {
      const label = lastScore > 60 ? 'Risk-On' : lastScore < 40 ? 'Risk-Off' : 'Neutral';
      summary = (
        <div className="perf-item">
          <span style={{ color: lastScore > 60 ? '#00D64A' : lastScore < 40 ? '#EC5B5B' : '#888', fontWeight: 600 }}>{label}</span>{' '}
          <span>{lastScore.toFixed(0)}/100</span>
        </div>
      );
    }
  }

  return (
    <ChartPanel
      title="Risk-On / Risk-Off Score"
      source="Source: Yahoo Finance · VIX + DXY + HYG/LQD composite, 365d normalized"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0, 7) : ''; } }, grid: XGRID },
          y:  { position: 'left', min: 0, max: 100, ticks: { ...YTICK, callback: v => v + '%' }, grid: YGRID, title: { display: true, text: 'Score', color: '#888', font: { size: 11 } } },
          y1: { position: 'right', ticks: { ...YTICK, callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) }, grid: { display: false } },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
