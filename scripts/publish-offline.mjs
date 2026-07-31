import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const playDir = 'play'
const built =
  ['app.html', 'index.html']
    .map((name) => join(playDir, name))
    .find((path) => existsSync(path)) ?? null

if (!built) {
  const files = existsSync(playDir) ? readdirSync(playDir).join(', ') : '(missing play/)'
  console.error(`Could not find offline HTML in play/. Found: ${files}`)
  process.exit(1)
}

let html = readFileSync(built, 'utf8')

// Prefer a stable local favicon name for file:// opens
const hashedIcon = readdirSync(playDir).find((f) => /^favicon.*\.svg$/i.test(f))
if (hashedIcon) {
  copyFileSync(join(playDir, hashedIcon), 'favicon.svg')
  copyFileSync(join(playDir, hashedIcon), join(playDir, 'favicon.svg'))
  html = html.replace(/href="\.\/favicon[^"]*\.svg"/g, 'href="./favicon.svg"')
} else if (existsSync('public/favicon.svg')) {
  copyFileSync('public/favicon.svg', 'favicon.svg')
}

const targets = ['index.html', 'CyberKith.html', join(playDir, 'index.html')]
for (const target of targets) {
  writeFileSync(target, html)
  console.log(`Wrote ${target} (${html.length} bytes)`)
}

console.log('Offline Cyber Kith is ready — double-click index.html or CyberKith.html')
console.log(`Icon: ${basename('favicon.svg')}`)
