import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

const TICKER_LABELS = {
  'SPY': 'S&P 500', 'QQQ': 'Nasdaq', 'GLD': 'Gold', 'DX-Y.NYB': 'DXY',
  '^VIX': 'VIX', '^TNX': '10Y Yield', 'TLT': 'Treasuries', 'BNO': 'Brent',
};

function corrColor(v) {
  if (v == null) return 'var(--surface)';
  const r = Math.max(-1, Math.min(1, v));
  if (r >= 0) return `rgba(0, 214, 74, ${r * 0.7})`;
  return `rgba(236, 91, 91, ${-r * 0.7})`;
}

export default function MacroMatrix({ from, to, window: win }) {
  const url = `/api/macro-matrix?from=${from}&to=${to}&window=${win || '30'}`;
  const { data, loading, error } = useChartData(url);

  let content = null;

  if (data?.matrix && data.macro_tickers?.length && data.crypto_sectors?.length) {
    content = (
      <div style={{ overflow: 'auto', padding: '12px 0' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--mono)', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--muted)', fontSize: 11 }}></th>
              {data.crypto_sectors.map(s => (
                <th key={s} style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--muted)', fontSize: 10, fontWeight: 600, letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.macro_tickers.map((t, ri) => (
              <tr key={t}>
                <td style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--graphite)', whiteSpace: 'nowrap' }}>{TICKER_LABELS[t] || t}</td>
                {data.matrix[ri].map((v, ci) => (
                  <td key={ci} style={{
                    padding: '6px 8px', textAlign: 'center',
                    background: corrColor(v), color: 'var(--graphite)',
                    borderRadius: 3, fontWeight: 500,
                  }}>
                    {v != null ? v.toFixed(2) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <ChartPanel
      title={`Macro vs Crypto Correlation (${win || 30}d)`}
      source="Source: Yahoo Finance + CoinGecko · sector EW indices"
      loading={loading} error={error}
      chartType="line" chartData={null}
    >
      {content}
    </ChartPanel>
  );
}
