import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Blockchain Utilities %26 Tools,Media%2C Arts %26 Entertainment,Decentralized Physical Infrastructure,Centralized Finance,Currency Networks';
export default function SecZscore({ from, to, window: win }) {
  return <SectorLineChart url={`/api/sector-zscore?sectors=${ALL}&from=${from}&to=${to}&window=${win||'30'}`} title={`Sector Z-Score (${win||30}d)`} source="Source: CoinGecko Pro" />;
}
