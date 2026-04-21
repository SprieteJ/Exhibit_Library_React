import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Platform %26 Exchange Tokens,AI %26 Big Data,Gaming %26 Metaverse,Infrastructure %26 Scaling';
export default function SecEqual({ from, to }) {
  return <SectorLineChart url={`/api/sector-price?sectors=${ALL}&from=${from}&to=${to}`} title="Equal-Weighted Sector Index" source="Source: CoinGecko Pro · rebased to 100" />;
}
