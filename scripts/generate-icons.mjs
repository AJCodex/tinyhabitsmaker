// Generates PWA icons from public/icon.svg using @resvg/resvg-js (works on win32-arm64).
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const svgPath = resolve('public/icon.svg')
const svg = readFileSync(svgPath)

const targets = [
  { out: 'public/pwa-64x64.png', size: 64 },
  { out: 'public/pwa-192x192.png', size: 192 },
  { out: 'public/pwa-512x512.png', size: 512 },
  { out: 'public/maskable-icon-512x512.png', size: 512 },
  { out: 'public/apple-touch-icon-180x180.png', size: 180 },
  { out: 'public/favicon.ico', size: 48 }, // PNG-in-ICO accepted by browsers
]

for (const { out, size } of targets) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  })
  const png = resvg.render().asPng()
  writeFileSync(resolve(out), png)
  console.log(`✓ ${out} (${size}x${size})`)
}
