import * as Astronomy from 'astronomy-engine';
const DEG = Math.PI/180, norm = x => ((x%360)+360)%360;
const aya = d => 23.85675 + (50.2888/3600)*((d.getTime()-Date.UTC(2000,0,1,12))/(365.2425*86400e3));
const meanNode = d => norm(125.04452 - 0.05295377*((d.getTime()-Date.UTC(2000,0,1,12))/86400e3));
const trop = (b,d) => Astronomy.Ecliptic(Astronomy.GeoVector(b,d,true)).elon;
const asc = (d,lat,lon) => {
  const ramc = norm(Astronomy.SiderealTime(d)*15+lon)*DEG, eps=23.4367*DEG, phi=lat*DEG;
  return norm(Math.atan2(Math.cos(ramc), -(Math.sin(ramc)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps)))/DEG);
};
const truth = JSON.parse(process.argv[2]);
const B = Astronomy.Body;
const map = {Sun:B.Sun,Moon:B.Moon,Mars:B.Mars,Mercury:B.Mercury,Jupiter:B.Jupiter,Venus:B.Venus,Saturn:B.Saturn};
let worst = {planet:0, asc:0};
for (const c of truth) {
  const d = new Date(c.iso); const a = aya(d);
  for (const [name, body] of Object.entries(map)) {
    const mine = norm(trop(body,d)-a);
    const diff = Math.min(norm(mine-c.bodies[name]), norm(c.bodies[name]-mine));
    if (diff > worst.planet) worst.planet = diff;
    if (diff > 0.5) console.log(`DRIFT ${c.iso} ${name}: mine=${mine.toFixed(3)} swe=${c.bodies[name]} diff=${diff.toFixed(3)}`);
  }
  const rahuMine = norm(meanNode(d)-a);
  const rd = Math.min(norm(rahuMine-c.bodies.Rahu), norm(c.bodies.Rahu-rahuMine));
  if (rd > worst.planet) worst.planet = rd;
  const am = norm(asc(d,c.lat,c.lon)-a);
  const ad = Math.min(norm(am-c.asc), norm(c.asc-am));
  if (ad > worst.asc) worst.asc = ad;
  console.log(`${c.iso}: asc mine=${am.toFixed(3)} swe=${c.asc} diff=${ad.toFixed(3)}  rahu diff=${rd.toFixed(3)}`);
}
console.log(`WORST planet drift: ${worst.planet.toFixed(3)}°  asc drift: ${worst.asc.toFixed(3)}°`);
