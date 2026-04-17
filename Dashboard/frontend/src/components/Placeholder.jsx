import { getChartConfig } from '../charts/registry';

export default function Placeholder({ chartKey }) {
  const config = getChartConfig(chartKey);
  return (
    <div className="main">
      <div className="chart-hdr"><div><div className="chart-title">{config?.label || chartKey}</div><div className="chart-sub">{config?.sub || ''}</div></div></div>
      <div className="perf-row" />
      <div className="chart-area">
        <div className="empty" style={{ display: 'flex' }}>
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
          <p>Migration in progress</p>
          <p style={{ fontSize: 12 }}><code style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{chartKey}</code></p>
        </div>
      </div>
      <div className="chart-src">{config?.src || ''}</div>
    </div>
  );
}
