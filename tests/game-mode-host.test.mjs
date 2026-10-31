import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameModeHost} from '../src/game-mode-host.js';
test('explore to sandbox and back restores map state and disposes transient resources',async()=>{
 let selected=7,events=0,disposed=0,frames=0;
 const host=createGameModeHost({capture:()=>({selected}),restore:s=>{selected=s.selected}});
 host.registerMode({id:'test',onEnter:({onCleanup})=>{selected=-1;events++;onCleanup(()=>events--)},onTick:()=>frames++,onExit:()=>{},dispose:()=>disposed++});
 assert.equal((await host.enterMode('test')).mode,'test');
 host.tick(1/60);assert.equal(frames,1);assert.equal(events,1);
 assert.equal((await host.exitMode()).mode,'explore');
 assert.equal(selected,7);assert.equal(events,0);assert.equal(disposed,1);
 assert.equal((await host.exitMode()).mode,'explore');
});
test('failed mode enter and invalid ids do not trap camera or leak state',async()=>{
 let state=5;
 const host=createGameModeHost({capture:()=>state,restore:x=>{state=x}});
 host.registerMode({id:'broken',onEnter:()=>{state=10;throw Error('WebGL context lost')}});
 assert.equal((await host.enterMode('broken')).mode,'explore');
 assert.equal(state,5);
 assert.equal((await host.enterMode('no-such-mode')).mode,'explore');
 assert.throws(()=>host.registerMode({id:'broken',onEnter(){}}),/duplicate/);
});
