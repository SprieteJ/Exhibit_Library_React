import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Platform %26 Exchange Tokens,AI %26 Big Data,Gaming %26 Metaverse,Infrastructure %26 Scaling';
export default function SecBreadth({ from, to }) {
  return <SectorLineChart url={`/api/sector-breadth?sectors=${ALL}&from=${from}&to=${to}`} title="Sector Breadth (% above 50d SMA)" source="Source: CoinGecko Pro" yFormat="%" yMin={0} yMax={100} />;
}
