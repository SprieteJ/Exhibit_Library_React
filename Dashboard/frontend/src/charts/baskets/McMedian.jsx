import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Platform %26 Exchange Tokens,AI %26 Big Data,Gaming %26 Metaverse,Infrastructure %26 Scaling';
export default function McMedian({ from, to }) {
  return <SectorLineChart url={`/api/sector-mcap-view?sectors=${ALL}&from=${from}&to=${to}&type=median`} title="Sector Median Market Cap" source="Source: CoinGecko Pro" />;
}
