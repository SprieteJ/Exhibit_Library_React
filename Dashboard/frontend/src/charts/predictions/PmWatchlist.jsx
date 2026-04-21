import { useState } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

const CAT_COLORS = {
  Crypto: '#F7931A', Politics: '#2471CC', Geopolitical: '#EC5B5B',
  Economics: '#00D64A', Sports: '#746BE6', Entertainment: '#DB33CB', Other: '#888',
};

export default function PmWatchlist() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useChartData(`/api/pm-watchlist?_r=${refreshKey}`);
  const items = data?.watchlist || [];

  const remove = (mid) => {
    fetch(`/api/pm-watchlist-remove?market_id=${mid}`).then(() => setRefreshKey(k => k + 1));
  };

  const content = (
    <div style={{ overflow: 'auto', padding: '16px 20px', height: '100%' }}>
      {items.length === 0 && !loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>No markets on your watchlist yet.</div>
          <div style={{ fontSize: 12 }}>Go to Discovery and click ☆ to add markets.</div>
        </div>
      )}
      {items.map(m => (
        <div key={m.id} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
          borderBottom: '0.5px solid var(--border)',
        }}>
          {/* Category dot */}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[m.category] || '#888', flexShrink: 0 }} />
          {/* Question */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--graphite)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {m.question}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {m.category} · added {m.added_at}
            </div>
          </div>
          {/* Probability */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: m.probability > 50 ? '#00D64A' : m.probability < 20 ? '#EC5B5B' : 'var(--graphite)', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
            {m.probability != null ? m.probability + '%' : '—'}
          </div>
          {/* Remove */}
          <button onClick={() => remove(m.id)} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '4px 8px', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)',
            transition: 'all 0.1s', flexShrink: 0,
          }} title="Remove from watchlist"
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#EC5B5B'; e.currentTarget.style.color = '#EC5B5B'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <ChartPanel title="Prediction Markets — Watchlist" source={data?.live ? 'Live probabilities from Polymarket' : ''} loading={loading} error={error} chartType="line" chartData={null}>{content}</ChartPanel>
  );
}
