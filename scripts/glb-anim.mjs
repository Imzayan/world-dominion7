// list animation names + scene bounds + node names
import fs from 'fs';
function inspect(path) {
  const buf = fs.readFileSync(path);
  const clen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + clen).toString('utf8'));
  console.log('=====', path.split('/').pop(), '=====');
  // bounds from POSITION accessors of all prims
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of (json.meshes || []).flatMap(m => m.primitives)) {
    const a = json.accessors[p.attributes.POSITION];
    if (a.min) for (let i = 0; i < 3; i++) mn[i] = Math.min(mn[i], a.min[i]);
    if (a.max) for (let i = 0; i < 3; i++) mx[i] = Math.max(mx[i], a.max[i]);
  }
  console.log('mesh-space bounds min', mn.map(v => v.toFixed(2)), 'max', mx.map(v => v.toFixed(2)));
  console.log('--- animations (' + (json.animations || []).length + ') ---');
  (json.animations || []).forEach((a, i) => {
    const dur = a.samplers.reduce((mx2, s) => Math.max(mx2, json.accessors[s.input].max[0]), 0);
    console.log(i, JSON.stringify(a.name), 'dur=' + dur.toFixed(2) + 's', 'ch=' + a.channels.length);
  });
  console.log('--- top-level scene nodes ---');
  const scene = json.scenes[json.scene || 0];
  for (const ni of scene.nodes) {
    const n = json.nodes[ni];
    console.log('node', ni, JSON.stringify(n.name), 'mesh=' + n.mesh, 'children=' + (n.children || []).length, 'scale=' + (n.scale || ''), 'rot=' + (n.rotation || ''));
  }
}
inspect('/home/z/my-project/upload/cyborg_woman_boxing.glb');
inspect('/home/z/my-project/upload/boxing_ring.glb');
