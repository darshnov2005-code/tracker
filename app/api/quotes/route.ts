import {NextRequest,NextResponse} from 'next/server';
export const dynamic='force-dynamic';
async function nse(symbol:string){
 const url='https://www.nseindia.com/api/quote-equity?symbol='+encodeURIComponent(symbol);
 const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36','Accept':'application/json,text/plain,*/*','Referer':'https://www.nseindia.com/','Accept-Language':'en-US,en;q=0.9'},cache:'no-store'});
 if(!r.ok)throw new Error('NSE '+r.status);const d=await r.json();const p=d?.priceInfo;return {symbol,price:Number(p?.lastPrice),change:Number(p?.change||0),changePct:Number(p?.pChange||0),source:'NSE',asOf:new Date().toISOString()};
}
export async function GET(req:NextRequest){const symbols=(req.nextUrl.searchParams.get('symbols')||'').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);const out:any={};await Promise.all(symbols.map(async s=>{try{out[s]=await nse(s)}catch{}}));return NextResponse.json(out,{headers:{'Cache-Control':'no-store'}})}
