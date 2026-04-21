import { useState, lazy, Suspense } from 'react';
import TABS from './charts/registry';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Placeholder from './components/Placeholder';

// ── Macro ────────────────────────────────────────────────────────────────────
const MacroPrice      = lazy(() => import('./charts/macro/MacroPrice'));
const MacroSharpe     = lazy(() => import('./charts/macro/MacroSharpe'));
const MacroBtcCorr    = lazy(() => import('./charts/macro/MacroBtcCorr'));
const MacroMatrix     = lazy(() => import('./charts/macro/MacroMatrix'));
const MacroDxyBtc     = lazy(() => import('./charts/macro/MacroDxyBtc'));
const MacroIgvBtc     = lazy(() => import('./charts/macro/MacroIgvBtc'));
const MacroRisk       = lazy(() => import('./charts/macro/MacroRisk'));
const MacroRealYields = lazy(() => import('./charts/macro/MacroRealYields'));
const MacroStablecoin = lazy(() => import('./charts/macro/MacroStablecoin'));

// ── Bitcoin ──────────────────────────────────────────────────────────────────
const BtcMa           = lazy(() => import('./charts/bitcoin/BtcMa'));
const BtcMaGap        = lazy(() => import('./charts/bitcoin/BtcMaGap'));
const Btc200wFloor    = lazy(() => import('./charts/bitcoin/Btc200wFloor'));
const Btc200dDev      = lazy(() => import('./charts/bitcoin/Btc200dDev'));
const BtcPiCycle      = lazy(() => import('./charts/bitcoin/BtcPiCycle'));
const BtcRealvol      = lazy(() => import('./charts/bitcoin/BtcRealvol'));
const BtcRvIv         = lazy(() => import('./charts/bitcoin/BtcRvIv'));
const BtcDrawdown     = lazy(() => import('./charts/bitcoin/BtcDrawdown'));
const BtcMcap         = lazy(() => import('./charts/bitcoin/BtcMcap'));
const BtcDominance    = lazy(() => import('./charts/bitcoin/BtcDominance'));
const BtcFunding      = lazy(() => import('./charts/bitcoin/BtcFunding'));
const BtcOi           = lazy(() => import('./charts/bitcoin/BtcOi'));
const BtcFundingDelta = lazy(() => import('./charts/bitcoin/BtcFundingDelta'));
const BtcEpochs       = lazy(() => import('./charts/bitcoin/BtcEpochs'));
const BtcCycles       = lazy(() => import('./charts/bitcoin/BtcCycles'));
const BtcBull         = lazy(() => import('./charts/bitcoin/BtcBull'));
const BtcGold         = lazy(() => import('./charts/bitcoin/BtcGold'));
const BtcGoldRatio    = lazy(() => import('./charts/bitcoin/BtcGoldRatio'));

// ── Ethereum ─────────────────────────────────────────────────────────────────
const EthMa           = lazy(() => import('./charts/ethereum/EthMa'));
const EthMaGap        = lazy(() => import('./charts/ethereum/EthMaGap'));
const Eth200dDev      = lazy(() => import('./charts/ethereum/Eth200dDev'));
const EthDrawdown     = lazy(() => import('./charts/ethereum/EthDrawdown'));
const EthMcap         = lazy(() => import('./charts/ethereum/EthMcap'));
const EthBtcRatio     = lazy(() => import('./charts/ethereum/EthBtcRatio'));

// ── Altcoins ─────────────────────────────────────────────────────────────────
const AltMcap          = lazy(() => import('./charts/altcoins/AltMcap'));
const AltMcapGap       = lazy(() => import('./charts/altcoins/AltMcapGap'));
const AltMcapDev       = lazy(() => import('./charts/altcoins/AltMcapDev'));
const AltDominance     = lazy(() => import('./charts/altcoins/AltDominance'));
const AltRelShare      = lazy(() => import('./charts/altcoins/AltRelShare'));
const AltBtcRatio      = lazy(() => import('./charts/altcoins/AltBtcRatio'));
const AltScatter       = lazy(() => import('./charts/altcoins/AltScatter'));
const AltAltseason     = lazy(() => import('./charts/altcoins/AltAltseason'));
const AltBeta          = lazy(() => import('./charts/altcoins/AltBeta'));
const AltHeatmap       = lazy(() => import('./charts/altcoins/AltHeatmap'));
const AltIntracorr     = lazy(() => import('./charts/altcoins/AltIntracorr'));
const AltAthDrawdown   = lazy(() => import('./charts/altcoins/AltAthDrawdown'));
const AltDrawdownTs    = lazy(() => import('./charts/altcoins/AltDrawdownTs'));
const AltFundingHeatmap = lazy(() => import('./charts/altcoins/AltFundingHeatmap'));

// ── Baskets ──────────────────────────────────────────────────────────────────
const SecEqual      = lazy(() => import('./charts/baskets/SecEqual'));
const SecMcapW      = lazy(() => import('./charts/baskets/SecMcapW'));
const McTotal       = lazy(() => import('./charts/baskets/McTotal'));
const McMedian      = lazy(() => import('./charts/baskets/McMedian'));
const SecDominance  = lazy(() => import('./charts/baskets/SecDominance'));
const SecIntra      = lazy(() => import('./charts/baskets/SecIntra'));
const SecVsBtc      = lazy(() => import('./charts/baskets/SecVsBtc'));
const SecXheatmap   = lazy(() => import('./charts/baskets/SecXheatmap'));
const SecMom        = lazy(() => import('./charts/baskets/SecMom'));
const SecZscore     = lazy(() => import('./charts/baskets/SecZscore'));
const SecCumulative = lazy(() => import('./charts/baskets/SecCumulative'));
const SecVol        = lazy(() => import('./charts/baskets/SecVol'));
const SecDrawdown   = lazy(() => import('./charts/baskets/SecDrawdown'));
const SecBreadth    = lazy(() => import('./charts/baskets/SecBreadth'));
const SecFunding    = lazy(() => import('./charts/baskets/SecFunding'));
const SecOi         = lazy(() => import('./charts/baskets/SecOi'));
const SecRrg        = lazy(() => import('./charts/baskets/SecRrg'));
const AnaBubble     = lazy(() => import('./charts/baskets/AnaBubble'));
const SecSharpe     = lazy(() => import('./charts/baskets/SecSharpe'));

// ── Crypto Market ────────────────────────────────────────────────────────────
const CmTotalMcap   = lazy(() => import('./charts/crypto_market/CmTotalMcap'));

// ── ETF ──────────────────────────────────────────────────────────────────────
const EtfNetFlows   = lazy(() => import('./charts/etf/EtfNetFlows'));
const EtfDailyBar   = lazy(() => import('./charts/etf/EtfDailyBar'));
const EtfWeeklyBar  = lazy(() => import('./charts/etf/EtfWeeklyBar'));
const EtfTotalAum   = lazy(() => import('./charts/etf/EtfTotalAum'));

const CHART_COMPONENTS = {
  // Macro
  'mac-price': MacroPrice, 'mac-sharpe': MacroSharpe, 'mac-btc-corr': MacroBtcCorr,
  'mac-matrix': MacroMatrix, 'mac-dxy-btc': MacroDxyBtc, 'mac-igv-btc': MacroIgvBtc,
  'mac-risk': MacroRisk, 'mac-real-yields': MacroRealYields, 'mac-stablecoin': MacroStablecoin,
  // Bitcoin
  'btc-ma': BtcMa, 'btc-ma-gap': BtcMaGap, 'btc-200w-floor': Btc200wFloor,
  'btc-200d-dev': Btc200dDev, 'btc-pi-cycle': BtcPiCycle, 'btc-realvol': BtcRealvol,
  'btc-rv-iv': BtcRvIv, 'btc-drawdown': BtcDrawdown, 'btc-mcap': BtcMcap,
  'btc-dominance': BtcDominance, 'btc-funding': BtcFunding, 'btc-oi': BtcOi,
  'btc-funding-delta': BtcFundingDelta, 'btc-epochs': BtcEpochs, 'btc-cycles': BtcCycles,
  'btc-bull': BtcBull, 'btc-gold': BtcGold, 'btc-gold-ratio': BtcGoldRatio,
  // Ethereum
  'eth-ma': EthMa, 'eth-ma-gap': EthMaGap, 'eth-200d-dev': Eth200dDev,
  'eth-drawdown': EthDrawdown, 'eth-mcap': EthMcap, 'eth-btc-ratio': EthBtcRatio,
  // Altcoins
  'am-mcap': AltMcap, 'am-mcap-gap': AltMcapGap, 'am-mcap-dev': AltMcapDev,
  'am-dominance': AltDominance, 'am-rel-share': AltRelShare, 'am-btc-ratio': AltBtcRatio,
  'alt-scatter': AltScatter, 'alt-altseason': AltAltseason, 'alt-beta': AltBeta,
  'alt-heatmap': AltHeatmap, 'am-intracorr': AltIntracorr,
  'alt-ath-drawdown': AltAthDrawdown, 'alt-drawdown-ts': AltDrawdownTs,
  'alt-funding-heatmap': AltFundingHeatmap,
  // Baskets
  'sec-equal': SecEqual, 'sec-mcap': SecMcapW, 'mc-total': McTotal, 'mc-median': McMedian,
  'sec-dominance': SecDominance, 'sec-intra': SecIntra, 'sec-vs': SecVsBtc,
  'sec-xheatmap': SecXheatmap, 'sec-mom': SecMom, 'sec-zscore': SecZscore,
  'sec-cumulative': SecCumulative, 'sec-vol': SecVol, 'sec-drawdown': SecDrawdown,
  'sec-breadth': SecBreadth, 'sec-funding': SecFunding, 'sec-oi': SecOi,
  'sec-rrg': SecRrg, 'ana-bubble': AnaBubble, 'sec-sharpe': SecSharpe,
  // Crypto Market
  'cm-total-mcap': CmTotalMcap,
  // ETF
  'etf-net-flows': EtfNetFlows, 'etf-daily-bar': EtfDailyBar,
  'etf-weekly-bar': EtfWeeklyBar, 'etf-total-aum': EtfTotalAum,
};

const WINDOW_CHARTS = new Set([
  'mac-sharpe', 'mac-btc-corr', 'mac-matrix', 'mac-dxy-btc', 'mac-igv-btc',
  'btc-funding-delta', 'alt-altseason', 'alt-beta', 'alt-heatmap',
  'sec-intra', 'sec-vs', 'sec-mom', 'sec-zscore', 'sec-vol',
  'sec-xheatmap', 'sec-rrg', 'ana-bubble', 'sec-sharpe', 'etf-net-flows',
]);

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function App() {
  const tabKeys = Object.keys(TABS);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('bitcoin');
  const [activeChart, setActiveChart] = useState('btc-ma');
  const [from, setFrom] = useState('2013-01-01');
  const [to, setTo] = useState(todayStr());
  const [win, setWin] = useState('30');
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

      <RightPanel from={from} to={to} window={win} activePreset={activePreset} onChange={handleControlChange} showWindow={WINDOW_CHARTS.has(activeChart)} />
    </>
  );
}
