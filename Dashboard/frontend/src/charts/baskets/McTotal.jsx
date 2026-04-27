import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Blockchain Utilities %26 Tools,Media%2C Arts %26 Entertainment,Decentralized Physical Infrastructure,Centralized Finance,Currency Networks';
export default function McTotal({ from, to }) {
  return <SectorLineChart url={`/api/sector-mcap-view?sectors=${ALL}&from=${from}&to=${to}&type=total`} title="Sector Total Market Cap" source="Source: CoinGecko Pro" />;
}
