import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Blockchain Utilities %26 Tools,Media%2C Arts %26 Entertainment,Decentralized Physical Infrastructure,Centralized Finance,Currency Networks';
export default function SecBreadth({ from, to }) {
  return <SectorLineChart url={`/api/sector-breadth?sectors=${ALL}&from=${from}&to=${to}`} title="Sector Breadth (% above 50d SMA)" source="Source: CoinGecko Pro" yFormat="%" yMin={0} yMax={100} />;
}
