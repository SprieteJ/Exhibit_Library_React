import SectorLineChart from './SectorLineChart';
const ALL = 'General Purpose Blockchain Networks,Decentralized Finance,Meme,Platform %26 Exchange Tokens,AI %26 Big Data,Gaming %26 Metaverse';
export default function SecVsBtc({ from, to, window: win }) {
  return <SectorLineChart url={`/api/sector-btc-corr?sectors=${ALL}&from=${from}&to=${to}&window=${win||'30'}`} title={`Sector vs BTC Correlation (${win||30}d)`} source="Source: CoinGecko Pro · rolling Pearson" yFormat="corr" yMin={-1} yMax={1} />;
}
