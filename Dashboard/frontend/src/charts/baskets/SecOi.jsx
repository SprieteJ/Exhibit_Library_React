import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Platform %26 Exchange Tokens,AI %26 Big Data,Gaming %26 Metaverse';
export default function SecOi({ from, to }) {
  return <SectorLineChart url={`/api/sector-oi?sectors=${ALL}&from=${from}&to=${to}`} title="Sector Open Interest" source="Source: Binance + Bybit" />;
}
