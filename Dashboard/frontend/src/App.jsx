import { useState, lazy, Suspense } from 'react';
import TABS from './charts/registry';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Placeholder from './components/Placeholder';

const MacroSharpe = lazy(() => import('./charts/macro/MacroSharpe'));

const CHART_COMPONENTS = {
  'mac-sharpe': MacroSharpe,
};

function todayStr() { return new Date().toISOString().split('T')[0]; }
function monthsAgoStr(n) { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().split('T')[0]; }

export default function App() {
  const tabKeys = Object.keys(TABS);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('macro');
  const [activeChart, setActiveChart] = useState('mac-sharpe');
  const [from, setFrom] = useState('2013-01-01');
  const [to, setTo] = useState(todayStr());
  const [win, setWin] = useState('180');
  const [activePreset, setActivePreset] = useState('ALL');

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    const tab = TABS[tabKey];
    if (tab?.groups?.length && tab.groups[0].charts?.length) {
      setActiveChart(tab.groups[0].charts[0].key);
    }
  };

  const handleControlChange = (updates) => {
    if (updates.from !== undefined) setFrom(updates.from);
    if (updates.to !== undefined) setTo(updates.to);
    if (updates.window !== undefined) setWin(updates.window);
    if (updates.activePreset !== undefined) setActivePreset(updates.activePreset);
  };

  const ChartComponent = CHART_COMPONENTS[activeChart] || null;

  return (
    <>
      <header className="header">
        <svg viewBox="0 0 220 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 28, width: 'auto', flexShrink: 0 }}>
          <g stroke="var(--logo-color)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" fill="none">
            <polygon points="20,2 36,14 20,38 4,14" />
            <line x1="4" y1="14" x2="20" y2="20" /><line x1="36" y1="14" x2="20" y2="20" />
            <line x1="20" y1="2" x2="20" y2="20" /><line x1="20" y1="20" x2="20" y2="38" />
            <line x1="4" y1="14" x2="36" y2="14" />
            <line x1="4" y1="14" x2="12" y2="26" /><line x1="20" y1="20" x2="12" y2="26" />
            <line x1="36" y1="14" x2="28" y2="26" /><line x1="20" y1="20" x2="28" y2="26" />
          </g>
          <text x="48" y="28" fontFamily="DM Sans, Helvetica Neue, sans-serif" fontSize="18" fontWeight="600" letterSpacing="3" fill="var(--logo-color)">WINTERMUTE</text>
        </svg>
        <div className="header-divider" />
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{TABS[activeTab]?.label} / {CHART_COMPONENTS[activeChart] ? activeChart : '...'}</span>
        <div className="header-spacer" />
        <span className="header-pill">v2.0 React</span>
        <button className="dark-toggle" onClick={toggleDark}>
          <svg viewBox="0 0 24 24">
            {darkMode
              ? <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>
              : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />}
          </svg>
        </button>
      </header>

      <nav className="tabbar">
        {tabKeys.map(key => (
          <button key={key} className={`tab${activeTab === key ? ' active' : ''}`} onClick={() => handleTabChange(key)}>
            {TABS[key].label}
          </button>
        ))}
      </nav>

      <Sidebar activeTab={activeTab} activeChart={activeChart} onSelect={setActiveChart} />

      <Suspense fallback={<div className="main"><div className="chart-area"><div className="spinner-wrap on"><div className="spinner" /></div></div></div>}>
        {ChartComponent
          ? <ChartComponent from={from} to={to} window={win} />
          : <Placeholder chartKey={activeChart} />}
      </Suspense>

      <RightPanel from={from} to={to} window={win} activePreset={activePreset} onChange={handleControlChange} showWindow={!!CHART_COMPONENTS[activeChart]} />
    </>
  );
}
