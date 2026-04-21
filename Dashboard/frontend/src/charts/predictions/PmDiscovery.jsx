import { useState, useEffect, useRef } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

const CAT_COLORS = {
  Crypto: '#F7931A', Politics: '#2471CC', Geopolitical: '#EC5B5B',
  Economics: '#00D64A', Sports: '#746BE6', Entertainment: '#DB33CB', Other: '#888',
};

function fmtVol(v) {
  if (!v) return '$0';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
  return '$' + v.toFixed(0);
}

export default function PmDiscovery() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('volume24hr');
  const [refreshKey, setRefreshKey] = useState(0);
  const searchDebounce = useRef(null);
  const [dSearch, setDSearch] = useState('');

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDSearch(search), 400);
    return () => clearTimeout(searchDebounce.current);
  }, [search]);

  const q = `category=${category}&sort=${sort}&limit=100${dSearch ? '&q=' + encodeURIComponent(dSearch) : ''}`;
  const { data, loading, error } = useChartData(`/api/pm-markets?${q}&_r=${refreshKey}`);
  const catData = useChartData('/api/pm-categories');
  const categories = catData.data?.categories || [];
  const markets = data?.markets || [];

  const toggleWatch = (m) => {
    const ep = m.watchlisted ? '/api/pm-watchlist-remove' : '/api/pm-watchlist-add';
    const p = `market_id=${m.id}&question=${encodeURIComponent(m.question)}&slug=${m.slug}&category=${m.category}&clob_token_id=${m.clob_token_id || ''}`;
    fetch(`${ep}?${p}`).then(() => setRefreshKey(k => k + 1));
  };

  const content = (
    <div style={{ overflow: 'auto', padding: '16px 20px', height: '100%' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className={`preset${category === 'all' ? ' active' : ''}`} onClick={() => setCategory('all')}>All</button>
        {categories.map(c => (
          <button key={c.name} className={`preset${category === c.name ? ' active' : ''}`} onClick={() => setCategory(c.name)}>
            {c.name} <span style={{ opacity: 0.5 }}>{c.count}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 10px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--graphite)', width: 180, outline: 'none' }} />
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 8px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--graphite)', outline: 'none' }}>
          <option value="volume24hr">Vol 24h</option>
          <option value="volumeNum">Vol Total</option>
          <option value="liquidityNum">Liquidity</option>
        </select>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['', 'Market', 'Category', 'Prob', 'Vol 24h', 'Total', 'Ends'].map((h, i) => (
              <th key={i} style={{ textAlign: i <= 1 ? 'left' : i === 2 ? 'center' : 'right', padding: '8px 8px', fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.05em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {markets.map(m => (
            <tr key={m.id} style={{ borderBottom: '0.5px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--tag-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '8px 6px', textAlign: 'center', width: 30 }}>
                <span onClick={() => toggleWatch(m)} style={{ cursor: 'pointer', fontSize: 14, color: m.watchlisted ? '#F7931A' : 'var(--border)' }}>
                  {m.watchlisted ? '★' : '☆'}
                </span>
              </td>
              <td style={{ padding: '8px 8px' }}>
                <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--graphite)', textDecoration: 'none', fontWeight: 500 }}>{m.question}</a>
              </td>
              <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: (CAT_COLORS[m.category] || '#888') + '18', color: CAT_COLORS[m.category] || '#888', fontWeight: 600 }}>{m.category}</span>
              </td>
              <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14, color: m.probability > 50 ? '#00D64A' : m.probability < 20 ? '#EC5B5B' : 'var(--graphite)' }}>
                {m.probability != null ? m.probability + '%' : '—'}
              </td>
              <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--graphite)' }}>{fmtVol(m.volume_24h)}</td>
              <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{fmtVol(m.volume_total)}</td>
              <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{m.end_date || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!markets.length && !loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No markets found.</div>}
    </div>
  );

  return (
    <ChartPanel title="Prediction Markets — Discovery" source={data?.cached_at ? `Live · ${data.cached_at} · ${data.count || 0} markets` : ''} loading={loading} error={error} chartType="line" chartData={null}>{content}</ChartPanel>
  );
}
