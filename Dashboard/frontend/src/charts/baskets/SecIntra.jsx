import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Platform %26 Exchange Tokens,AI %26 Big Data,Gaming %26 Metaverse';
export default function SecIntra({ from, to, window: win }) {
  return <SectorLineChart url={`/api/sector-intra-corr?sectors=${ALL}&from=${from}&to=${to}&window=${win||'30'}`} title={`Sector Intracorrelation (${win||30}d)`} source="Source: CoinGecko Pro · rolling Pearson" yFormat="corr" yMin={-1} yMax={1} />;
}
