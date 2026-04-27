import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Blockchain Utilities %26 Tools,Media%2C Arts %26 Entertainment,Decentralized Physical Infrastructure,Centralized Finance,Currency Networks';
export default function SecEqual({ from, to }) {
  return <SectorLineChart url={`/api/sector-price?sectors=${ALL}&from=${from}&to=${to}`} title="Equal-Weighted Sector Index" source="Source: CoinGecko Pro · rebased to 100" />;
}
