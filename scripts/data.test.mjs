import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync(new URL('../docs/data.json',import.meta.url)));
test('six contiguous dates and five hotel nights with Datong continuous stay',()=>{assert.deepEqual(d.days.map(x=>x.date),['10.01','10.02','10.03','10.04','10.05','10.06']);assert.equal(d.stays.reduce((a,s)=>a+s.nights,0),5);assert.equal(d.days[3].hotel,d.days[4].hotel);assert.equal(d.days[5].hotel,null);});
test('every travel day carries child rest, charging and fallback instructions',()=>{for(const day of d.days){for(const k of ['rest','charge','fallback'])assert.ok(day[k].length>0);assert.ok(day.events.length>=4);assert.ok(day.places.length>0);}});
test('hotel candidates and sources have usable source identifiers',()=>{for(const s of d.stays)for(const h of s.options)assert.match(h.id,/^\d+$/);for(const s of [...d.sources,...d.chargers])assert.equal(new URL(s[1]).protocol,'https:');});
test('published files omit private departure location and itinerary signature',()=>{for(const f of ['data.json','index.html','app.js']){const text=readFileSync(new URL('../docs/'+f,import.meta.url),'utf8');assert.doesNotMatch(text,/四季青|signature=|tripsign|188897430/);}});
