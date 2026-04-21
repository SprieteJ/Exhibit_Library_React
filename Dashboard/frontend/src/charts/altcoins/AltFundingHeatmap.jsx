import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

function fundColor(v) {
  if (v == null) return 'transparent';
  const ann = v * 3 * 365 * 100;
  if (ann > 30) return 'rgba(0,214,74,0.7)';
  if (ann > 10) return 'rgba(0,214,74,0.4)';
  if (ann > 0) return 'rgba(0,214,74,0.15)';
  if (ann > -10) return 'rgba(236,91,91,0.15)';
  if (ann > -30) return 'rgba(236,91,91,0.4)';
  return 'rgba(236,91,91,0.7)';
}

export default function AltFundingHeatmap({ from, to }) {
  const symbols = 'BTC,ETH,SOL,XRP,BNB,ADA,AVAX,DOT,LINK,DOGE';
  const url = `/api/alt-funding-heatmap?symbols=${symbols}&from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);
  let content = null;
  if (data?.symbols?.length && data?.dates?.length) {
    const step = Math.max(1, Math.floor(data.dates.length / 30));
    const showDates = data.dates.filter((_, i) => i % step === 0);
    content = (
      <div style={{ overflow: 'auto', padding: '8px 0' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: 'var(--mono)' }}>
          <thead><tr><th style={{ padding: '4px 8px' }}></th>{showDates.map(d => <th key={d} style={{ padding: '4px 4px', color: 'var(--muted)', fontSize: 9, writingMode: 'vertical-lr' }}>{d.slice(5)}</th>)}</tr></thead>
          <tbody>{data.symbols.map(sym => {
            const vals = data.matrix[sym] || [];
            return (
              <tr key={sym}><td style={{ padding: '4px 8px', fontWeight: 600, color: 'var(--graphite)' }}>{sym}</td>
                {showDates.map(d => { const i = data.dates.indexOf(d); const v = vals[i]; return <td key={d} style={{ padding: '4px 4px', background: fundColor(v), textAlign: 'center', minWidth: 18 }}></td>; })}
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    );
  }
  return <ChartPanel title="Funding Rate Heatmap" source="Source: Binance + Bybit" loading={loading} error={error} chartType="line" chartData={null}>{content}</ChartPanel>;
}
