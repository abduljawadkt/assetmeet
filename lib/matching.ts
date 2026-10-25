export type Asset={id:string;name:string;district:string;type:string;area:number;price:number;transaction:string;construction:string;market:string;verification:string;parking:number;months:number;consent:boolean;source:string};
export type Requirement={id:string;name:string;district:string;type:string;minArea:number;maxArea:number;budget:number;transaction:string;parking:number;months:number};
export function match(a:Asset,r:Requirement){
 if(a.type!==r.type||a.transaction!==r.transaction||['Sold / leased'].includes(a.market))return null;
 const location=a.district===r.district?25:0;
 const area=a.area>=r.minArea&&a.area<=r.maxArea?20:Math.max(0,20*(1-Math.min(Math.abs(a.area-r.minArea),Math.abs(a.area-r.maxArea))/Math.max(r.maxArea,1)));
 const budget=a.price>0?Math.min(20,20*r.budget/a.price):0;
 const technical=a.parking>=r.parking?15:15*a.parking/Math.max(1,r.parking);
 const readiness=a.months<=r.months?10:0;
 const verification=a.verification==='Mandate signed'?10:a.verification==='Owner confirmed'?5:0;
 return {score:Math.round(location+area+budget+technical+readiness+verification),outreach:!a.consent||a.market!=='Available',reasons:[location?'Preferred district':'Outside preferred district',area===20?'Area within range':'Area outside target',budget===20?'Within budget':a.price?'Above budget':'Price unconfirmed',technical===15?'Parking suitable':'Parking shortfall',readiness?'Ready within timeline':'Possession needs review',a.consent?'Owner permission recorded':'Owner permission pending']};
}
