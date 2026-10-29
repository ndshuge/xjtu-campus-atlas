import { CampusWorld } from './world.js';
const home=CampusWorld.prototype.home;
CampusWorld.prototype.home=function(...args){const result=home.apply(this,args);window.__r14World=this;return result;};
await import('./app.js');
