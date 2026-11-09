const fs = require("fs")
const path = require("path")

const buildDirs = [
  path.resolve(__dirname, "..", "build", "chrome-mv3-prod"),
  path.resolve(__dirname, "..", "build", "chrome-mv3-dev")
]

for (const dir of buildDirs) {
  const manifestPath = path.join(dir, "manifest.json")
  if (!fs.existsSync(manifestPath)) continue

  try {
    const raw = fs.readFileSync(manifestPath, "utf8")
    const manifest = JSON.parse(raw)
    let modified = false

    // 1. Limpiar web_accessible_resources inexistentes
    if (Array.isArray(manifest.web_accessible_resources)) {
      manifest.web_accessible_resources = manifest.web_accessible_resources
        .map((entry) => {
          if (!Array.isArray(entry.resources)) return null
          const existing = entry.resources.filter((res) =>
            fs.existsSync(path.join(dir, res))
          )
          if (existing.length === 0) return null
          return { ...entry, resources: existing }
        })
        .filter(Boolean)

      if (manifest.web_accessible_resources.length === 0) {
        delete manifest.web_accessible_resources
      }
      modified = true
    }

    // 2. Limpiar arreglos vacíos de css en content_scripts
    if (Array.isArray(manifest.content_scripts)) {
      for (const cs of manifest.content_scripts) {
        if (Array.isArray(cs.css) && cs.css.length === 0) {
          delete cs.css
          modified = true
        }
      }
    }

    if (modified) {
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8")
      console.log(`[clean-manifest] Limpiado manifest en: ${manifestPath}`)
    }
  } catch (err) {
    console.error(`[clean-manifest] Error procesando ${manifestPath}:`, err)
  }
}
