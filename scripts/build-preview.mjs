/**
 * Gera um preview de ficheiro único a partir do build de produção.
 *
 *   npm run build && node scripts/build-preview.mjs
 *
 * O CSS e o JS são embutidos no HTML para a página funcionar sem qualquer
 * pedido externo. O registo do service worker é retirado — num preview
 * embebido não há PWA para instalar.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')
const OUT = process.argv[2] ?? resolve(ROOT, 'preview.html')

const html = readFileSync(resolve(DIST, 'index.html'), 'utf8')

const cssHref = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/)?.[1]
const jsSrc = html.match(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/)?.[1]
if (!cssHref || !jsSrc) throw new Error('Não encontrei os assets no dist/index.html.')

const read = (assetPath) => readFileSync(resolve(DIST, assetPath.replace(/^\//, '')), 'utf8')
// Um "</script>" dentro do bundle fecharia a tag mais cedo.
const safeJs = read(jsSrc).replace(/<\/script>/gi, '<\\/script>')

writeFileSync(
  OUT,
  `<title>Missões do Nicolas</title>
<style>
${read(cssHref)}
</style>
<div id="root"></div>
<script type="module">
${safeJs}
</script>
`,
)

console.log(`✓ ${OUT} (${(readFileSync(OUT).length / 1024).toFixed(0)} kB)`)
