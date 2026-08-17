/**
 * Gera os ícones PNG da PWA sem dependências externas.
 *
 *   node scripts/generate-icons.mjs
 *
 * Desenha o mesmo símbolo do favicon.svg: quadrado arredondado com gradiente
 * azul e uma estrela dourada ao centro. A rasterização usa supersampling 3x
 * para as arestas ficarem suaves.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(HERE, '../public/icons')

const BG_FROM = [0x6f, 0x7d, 0xff]
const BG_TO = [0x3a, 0x45, 0xb4]
const STAR = [0xff, 0xc6, 0x3d]
const SS = 3 // supersampling

function starPolygon(cx, cy, outer, inner, points = 5) {
  const vertices = []
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (Math.PI * i) / points - Math.PI / 2
    vertices.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
  }
  return vertices
}

function insidePolygon(x, y, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function insideRoundedRect(x, y, size, radius) {
  if (x < 0 || y < 0 || x > size || y > size) return false
  const cx = Math.min(Math.max(x, radius), size - radius)
  const cy = Math.min(Math.max(y, radius), size - radius)
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= radius * radius
}

function renderIcon(size, { maskable = false } = {}) {
  const big = size * SS
  const radius = maskable ? 0 : big * 0.22
  const starOuter = big * (maskable ? 0.3 : 0.34)
  const starInner = starOuter * 0.42
  const polygon = starPolygon(big / 2, big / 2 + big * 0.015, starOuter, starInner)

  // Acumuladores para o downsample (RGBA por pixel final).
  const pixels = new Float32Array(size * size * 4)

  for (let y = 0; y < big; y += 1) {
    for (let x = 0; x < big; x += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0

      if (insideRoundedRect(x + 0.5, y + 0.5, big, radius)) {
        const t = (x / big + y / big) / 2
        r = BG_FROM[0] + (BG_TO[0] - BG_FROM[0]) * t
        g = BG_FROM[1] + (BG_TO[1] - BG_FROM[1]) * t
        b = BG_FROM[2] + (BG_TO[2] - BG_FROM[2]) * t
        a = 255
      }

      if (insidePolygon(x + 0.5, y + 0.5, polygon)) {
        r = STAR[0]
        g = STAR[1]
        b = STAR[2]
        a = 255
      }

      const index = (Math.floor(y / SS) * size + Math.floor(x / SS)) * 4
      pixels[index] += r
      pixels[index + 1] += g
      pixels[index + 2] += b
      pixels[index + 3] += a
    }
  }

  const samples = SS * SS
  const rgba = Buffer.alloc(size * size * 4)
  for (let i = 0; i < pixels.length; i += 1) {
    rgba[i] = Math.round(pixels[i] / samples)
  }
  return rgba
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(rgba, size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0 // filtro "None"
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // profundidade
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT_DIR, { recursive: true })

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-512-maskable.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const target of targets) {
  const rgba = renderIcon(target.size, { maskable: target.maskable })
  writeFileSync(resolve(OUT_DIR, target.file), encodePng(rgba, target.size))
  console.log(`✓ ${target.file} (${target.size}×${target.size})`)
}
