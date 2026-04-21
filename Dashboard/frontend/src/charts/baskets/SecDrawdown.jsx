import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Platform %26 Exchange Tokens,AI %26 Big Data,Gaming %26 Metaverse,Infrastructure %26 Scaling';
export default function SecDrawdown({ from, to }) {
  return <SectorLineChart url={`/api/sector-drawdown?sectors=${ALL}&from=${from}&to=${to}`} title="Sector Drawdown from Peak" source="Source: CoinGecko Pro" yFormat="%" yMax={0} />;
}
