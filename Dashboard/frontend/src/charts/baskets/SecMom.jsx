import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Platform %26 Exchange Tokens,AI %26 Big Data,Gaming %26 Metaverse,Infrastructure %26 Scaling';
export default function SecMom({ from, to, window: win }) {
  return <SectorLineChart url={`/api/sector-momentum?sectors=${ALL}&from=${from}&to=${to}&window=${win||'30'}`} title={`Sector Rolling Return (${win||30}d)`} source="Source: CoinGecko Pro" yFormat="%" />;
}
