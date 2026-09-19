import type {Transaction} from './types'
export function holdingsByAsset(txs:Transaction[]){
 const map=new Map<string,{symbol:string;name:string;asset_type:'STOCK'|'MF';exchange?:string|null;quantity:number;invested:number;avg:number}>()
 for(const t of [...txs].sort((a,b)=>a.trade_date.localeCompare(b.trade_date))){const k=`${t.asset_type}:${t.symbol}`;const x=map.get(k)||{symbol:t.symbol,name:t.name,asset_type:t.asset_type,exchange:t.exchange,quantity:0,invested:0,avg:0};
  if(t.tx_type==='BUY'){x.invested+=t.quantity*t.price+t.fees;x.quantity+=t.quantity;x.avg=x.quantity?x.invested/x.quantity:0}
  else {const avg=x.quantity?x.invested/x.quantity:0;x.invested=Math.max(0,x.invested-avg*t.quantity-t.fees);x.quantity=Math.max(0,x.quantity-t.quantity);x.avg=x.quantity?x.invested/x.quantity:0}
  map.set(k,x)
 }
 return [...map.values()].filter(x=>x.quantity>0)
}
export function realizedRows(txs:Transaction[]){
 const lots=new Map<string,{qty:number;cost:number}[]>();const rows:any[]=[]
 for(const t of [...txs].sort((a,b)=>a.trade_date.localeCompare(b.trade_date)||a.id.localeCompare(b.id))){const k=`${t.asset_type}:${t.symbol}`;const q=lots.get(k)||[]
  if(t.tx_type==='BUY')q.push({qty:t.quantity,cost:t.price+t.fees/t.quantity})
  else{let remaining=t.quantity,cost=0;while(remaining>0&&q.length){const lot=q[0];const used=Math.min(remaining,lot.qty);cost+=used*lot.cost;lot.qty-=used;remaining-=used;if(lot.qty<=1e-10)q.shift()}const proceeds=t.quantity*t.price-t.fees;rows.push({date:t.trade_date,name:t.name,symbol:t.symbol,quantity:t.quantity,sellPrice:t.price,costBasis:cost,proceeds,gain:proceeds-cost})}
  lots.set(k,q)
 }
 return rows.reverse()
}
export function realized(txs:Transaction[]){return realizedRows(txs).reduce((a,r)=>a+r.gain,0)}
