export type AssetType='STOCK'|'MF';
export type TxType='BUY'|'SELL';
export type Transaction={id:string;asset_type:AssetType;symbol:string;name:string;isin?:string|null;exchange?:'NSE'|'BSE'|null;tx_type:TxType;quantity:number;price:number;fees:number;trade_date:string;notes?:string|null};
export type Quote={symbol:string;price:number;change:number;changePct:number;source:string;asOf:string};
export type Goal={id:string;name:string;target:number;target_date:string;starting_value:number};
