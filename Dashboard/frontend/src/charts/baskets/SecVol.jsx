import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Blockchain Utilities %26 Tools,Media%2C Arts %26 Entertainment,Decentralized Physical Infrastructure,Centralized Finance,Currency Networks';
export default function SecVol({ from, to, window: win }) {
  return <SectorLineChart url={`/api/sector-vol?sectors=${ALL}&from=${from}&to=${to}&window=${win||'30'}`} title={`Sector Realized Volatility (${win||30}d)`} source="Source: CoinGecko Pro · annualized" yFormat="%" />;
}
