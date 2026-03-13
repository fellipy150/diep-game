import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = process.argv[2] || process.cwd()

const JS_EXT = [".js", ".mjs", ".jsx"]

const importRegex =
  /import\s+(?:[\w*\s{},]*)\s*from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g

async function walk(dir) {
  const files = []

  const items = await fs.readdir(dir, { withFileTypes: true })

  for (const item of items) {
    const full = path.join(dir, item.name)

    if (item.isDirectory()) {
      if (item.name === "node_modules" || item.name.startsWith(".")) continue
      files.push(...await walk(full))
    } else {
      if (JS_EXT.includes(path.extname(item.name))) {
        files.push(full)
      }
    }
  }

  return files
}

async function fileExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function resolveImport(baseFile, spec) {
  const baseDir = path.dirname(baseFile)
  const resolved = path.resolve(baseDir, spec)

  const tries = [
    resolved,
    ...JS_EXT.map(ext => resolved + ext),
    ...JS_EXT.map(ext => path.join(resolved, "index" + ext))
  ]

  for (const t of tries) {
    if (await fileExists(t)) return true
  }

  return false
}

async function analyze(file) {
  const content = await fs.readFile(file, "utf8")

  let match
  const errors = []

  while ((match = importRegex.exec(content))) {
    const spec = match[1] || match[2]

    if (!spec) continue

    // ignora imports de pacote
    if (!spec.startsWith(".")) continue

    const ok = await resolveImport(file, spec)

    if (!ok) {
      errors.push({
        file,
        import: spec
      })
    }
  }

  return errors
}

async function main() {
  const files = await walk(projectRoot)

  let broken = []

  for (const f of files) {
    const result = await analyze(f)
    broken.push(...result)
  }

  if (!broken.length) {
    console.log("✅ Nenhum import quebrado encontrado")
    return
  }

  console.log("❌ Imports quebrados:\n")

  for (const err of broken) {
    console.log(`Arquivo: ${err.file}`)
    console.log(`Import : ${err.import}`)
    console.log("")
  }

  console.log(`Total: ${broken.length}`)
}

main()
