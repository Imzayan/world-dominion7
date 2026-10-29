/* BOX5 asset pipeline — V5 Boxing
   1) KHR_materials_pbrSpecularGlossiness → PBR metalRough (three r160 compatibility)
   2) weld/dedup/prune/resample (anim keys)
   3) textures → WebP (q=88) 1024
   4) quantize + meshopt compression (EXT_meshopt_compression, tiny self-contained decoder)
   Output: public/game/assets/box/{boxer,ring}.glb + metrics JSON for the final report */
import { NodeIO } from '@gltf-transform/core'
import { KHRMaterialsPBRSpecularGlossiness, KHRTextureTransform, KHRMaterialsUnlit, EXTMeshoptCompression, EXTTextureWebP } from '@gltf-transform/extensions'
import { metalRough, weld, dedup, prune, resample, textureCompress, quantize, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'
import fs from 'fs'

const OUT = '/home/z/my-project/public/game/assets/box'
fs.mkdirSync(OUT, { recursive: true })
await MeshoptEncoder.ready

const jobs = [
  { in: 'upload/cyborg_woman_boxing.glb', out: OUT + '/boxer.glb', specGloss: true, webp: true },
  { in: 'upload/boxing_ring.glb', out: OUT + '/ring.glb', specGloss: false, webp: true },
]

const metrics = []
for (const j of jobs) {
  const t0 = Date.now()
  const io = new NodeIO().registerExtensions([KHRMaterialsPBRSpecularGlossiness, KHRTextureTransform, KHRMaterialsUnlit, EXTTextureWebP, EXTMeshoptCompression]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptEncoder })
  const doc = await io.read(j.in)
  if (j.specGloss) await doc.transform(metalRough())
  await doc.transform(weld(), dedup(), prune(), resample())
  const texOps = { encoder: sharp, quality: 88 }
  if (j.webp) texOps.targetFormat = 'webp'
  await doc.transform(textureCompress(texOps))
  await doc.transform(quantize())
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }))
  await io.write(j.out, doc)
  const bytes = fs.statSync(j.out).size
  const inBytes = fs.statSync(j.in).size
  metrics.push({ file: j.out.split('/').pop(), inBytes, outBytes: bytes, ms: Date.now() - t0 })
  console.log(j.out.split('/').pop(), (inBytes / 1e6).toFixed(2) + 'MB →', (bytes / 1e6).toFixed(2) + 'MB', '(' + (100 - Math.round(bytes / inBytes * 100)) + '% smaller)')
}
fs.writeFileSync('/home/z/my-project/scripts/box-assets-metrics.json', JSON.stringify({ metrics, ts: Date.now() }, null, 2))
console.log('done')
