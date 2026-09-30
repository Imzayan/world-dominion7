// GLB inspector — prints JSON chunk summary: meshes, prims, tris, materials, textures, animations, skins
import fs from 'fs';
function inspect(path) {
  const buf = fs.readFileSync(path);
  const magic = buf.readUInt32LE(0);
  const ver = buf.readUInt32LE(4);
  const len = buf.readUInt32LE(8);
  if (magic !== 0x46546c67) { console.log(path, 'not glb'); return; }
  const clen = buf.readUInt32LE(12);
  const ctype = buf.readUInt32LE(16);
  const json = JSON.parse(buf.slice(20, 20 + clen).toString('utf8'));
  console.log('=====', path.split('/').pop(), '=====');
  console.log('glb size:', len, 'bytes; version', ver, '| json chunk', clen);
  // accessors → triangle count per primitive
  const accCount = (a) => (json.accessors[a] ? json.accessors[a].count : 0);
  let totalTris = 0, totalVerts = 0;
  const meshTris = (json.meshes || []).map((m, mi) => {
    let tris = 0, verts = 0, mats = new Set(), prims = m.primitives.length;
    for (const p of m.primitives) {
      const mode = p.mode === undefined ? 4 : p.mode;
      const ic = p.indices !== undefined ? accCount(p.indices) : accCount(p.attributes.POSITION);
      verts += accCount(p.attributes.POSITION);
      if (mode === 4) tris += ic / 3;
      else if (mode === 6) tris += ic / 3; // fan approx
      else tris += ic / 2; // strips rough
      if (p.material !== undefined) mats.add(p.material);
    }
    totalTris += tris; totalVerts += verts;
    return { name: m.name || ('mesh' + mi), tris: Math.round(tris), verts, prims, mats: [...mats].map(i => json.materials[i].name || i) };
  });
  console.log('TOTAL tris:', Math.round(totalTris), 'verts:', totalVerts, 'meshes:', meshTris.length);
  for (const m of meshTris) if (m.tris > 0) console.log('  mesh', JSON.stringify(m.name), 'tris=' + m.tris, 'prims=' + m.prims, 'mats=' + m.mats.join(','));
  console.log('materials:', (json.materials || []).map(m => m.name + (m.extensions && m.extensions.KHR_materials_unlit ? ' [unlit]' : '')).join(' | '));
  console.log('textures:', (json.textures || []).length, 'images:', (json.images || []).map(im => ({ name: im.name, mime: im.mimeType, size: im.bufferView !== undefined ? 'embedded' : im.uri })).slice(0, 30));
  // image sizes from bufferViews
  if (json.images) for (const im of json.images) {
    if (im.bufferView !== undefined && json.bufferViews[im.bufferView]) console.log('  img', im.name || im.mimeType, 'bytes=', json.bufferViews[im.bufferView].byteLength);
  }
  console.log('animations:', (json.animations || []).map(a => a.name + ' (ch=' + a.channels.length + ')').join(' | ') || 'NONE');
  console.log('skins:', (json.skins || []).map(s => s.name + ' (joints=' + s.joints.length + ')').join(' | ') || 'NONE');
  console.log('nodes:', (json.nodes || []).length, 'extensionsUsed:', (json.extensionsUsed || []).join(','));
  const scenes = (json.scenes || []).map(s => s.name);
  console.log('scenes:', scenes.join('|'));
}
inspect('/home/z/my-project/upload/boxing_ring.glb');
inspect('/home/z/my-project/upload/cyborg_woman_boxing.glb');
