import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Blockchain Utilities %26 Tools,Media%2C Arts %26 Entertainment,Decentralized Physical Infrastructure,Centralized Finance,Currency Networks';
export default function SecDrawdown({ from, to }) {
  return <SectorLineChart url={`/api/sector-drawdown?sectors=${ALL}&from=${from}&to=${to}`} title="Sector Drawdown from Peak" source="Source: CoinGecko Pro" yFormat="%" yMax={0} />;
}
