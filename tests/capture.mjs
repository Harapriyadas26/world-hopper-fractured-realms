import { chromium } from '@playwright/test';
const browser = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('world-hopper-settings',JSON.stringify({quality:'Low',muted:true,volume:0})));
await page.goto('http://127.0.0.1:5173');await page.waitForTimeout(3000);
await page.screenshot({path:'tests/screenshots/title.png'});
for(let realm=0;realm<4;realm++){
 await page.evaluate(async realm=>{const {useGame}=await import('/src/game/store.ts');const s=useGame.getState();useGame.setState({data:{...s.data,realm,xp:760},pos:[0,1,11],mode:'playing',weapon:realm,revision:s.revision+1});},realm);
 await page.waitForTimeout(1800);await page.screenshot({path:`tests/screenshots/atmosphere-${realm+1}.png`});
}
console.log(JSON.stringify({renderedRealms:4,uncaughtErrors:errors}));await browser.close();
