// Bake world transforms (three.js) and print per-node world bboxes for anchoring
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import fs from 'fs'

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
for (const f of ['public/game/assets/box/ring.glb', 'public/game/assets/box/boxer.glb']) {
  const buf = fs.readFileSync(f)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const gltf = await loader.parseAsync(ab, '')
  const scene = gltf.scene
  scene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(scene)
  console.log('====', f, 'world bbox', box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2), '→', box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2))
  scene.traverse(o => {
    if (o.isMesh) {
      const b = new THREE.Box3().setFromObject(o)
      console.log('  mesh', o.name, 'y:', b.min.y.toFixed(2), '→', b.max.y.toFixed(2), ' x:', b.min.x.toFixed(2), '→', b.max.x.toFixed(2), ' z:', b.min.z.toFixed(2), '→', b.max.z.toFixed(2), 'tris:', o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3)
      if (o.isSkinnedMesh) console.log('    SKINNED, bones sample:', o.skeleton.bones.slice(0, 3).map(b => b.name).join(','))
    }
  })
  console.log('animations:', gltf.animations.map(a => a.name + ' dur=' + a.duration.toFixed(2)))
}
