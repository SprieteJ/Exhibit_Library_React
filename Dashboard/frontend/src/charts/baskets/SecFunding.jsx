import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Platform %26 Exchange Tokens,AI %26 Big Data,Gaming %26 Metaverse';
export default function SecFunding({ from, to }) {
  return <SectorLineChart url={`/api/sector-funding?sectors=${ALL}&from=${from}&to=${to}`} title="Sector Average Funding Rate" source="Source: Binance + Bybit" />;
}
