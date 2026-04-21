const PRESETS = [
  { label: '1M', months: 1 }, { label: '3M', months: 3 }, { label: '6M', months: 6 },
  { label: '1Y', months: 12 }, { label: '2Y', months: 24 }, { label: '3Y', months: 36 },
  { label: 'ALL', months: null },
];
const WIN_PRESETS = [
  { label: '1M', value: '30' }, { label: '3M', value: '90' }, { label: '6M', value: '180' },
  { label: '1Y', value: '365' }, { label: '2Y', value: '730' }, { label: '4Y', value: '1460' },
];

function today() { return new Date().toISOString().split('T')[0]; }
function monthsAgo(n) { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().split('T')[0]; }

export default function RightPanel({ from, to, window: win, activePreset, onChange, showWindow = true }) {
  const handlePreset = (p) => {
    const newTo = today();
    const newFrom = p.months ? monthsAgo(p.months) : '2013-01-01';
    onChange({ from: newFrom, to: newTo, activePreset: p.label });
  };

  return (
    <div className="right-panel">
      <div className="rp-block">
        <div className="rp-label">Date Range</div>
        <div className="date-grid">
          <div><label>From</label><input type="date" value={from} onChange={e => onChange({ from: e.target.value })} /></div>
          <div><label>To</label><input type="date" value={to} onChange={e => onChange({ to: e.target.value })} /></div>
        </div>
        <div className="presets">
          {PRESETS.map(p => (
            <button key={p.label} className={`preset${activePreset === p.label ? ' active' : ''}`} onClick={() => handlePreset(p)}>{p.label}</button>
          ))}
        </div>
      </div>
      {showWindow && (
        <div className="rp-block">
          <div className="rp-label">Window</div>
          <div className="presets">
            {WIN_PRESETS.map(p => (
              <button key={p.value} className={`preset${win === p.value ? ' active' : ''}`} onClick={() => onChange({ window: p.value })}>{p.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
