const fs = require("fs")
const path = require("path")

const prodDir = path.resolve(__dirname, "..", "build", "chrome-mv3-prod")
const devDir = path.resolve(__dirname, "..", "build", "chrome-mv3-dev")

function cleanManifestInDir(dir) {
  const manifestPath = path.join(dir, "manifest.json")
  if (!fs.existsSync(manifestPath)) return

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

function syncProdToDevIfPresent() {
  if (!fs.existsSync(prodDir)) return

  try {
    if (fs.existsSync(devDir)) {
      fs.rmSync(devDir, { recursive: true, force: true })
    }
    fs.cpSync(prodDir, devDir, { recursive: true })

    const devManifestPath = path.join(devDir, "manifest.json")
    if (fs.existsSync(devManifestPath)) {
      const devManifest = JSON.parse(fs.readFileSync(devManifestPath, "utf8"))
      if (
        typeof devManifest.name === "string" &&
        !devManifest.name.startsWith("DEV |")
      ) {
        devManifest.name = `DEV | ${devManifest.name}`
      }
      fs.writeFileSync(
        devManifestPath,
        JSON.stringify(devManifest, null, 2),
        "utf8"
      )
    }
    console.log(
      `[clean-manifest] Sincronizado build actualizado hacia: ${devDir}`
    )
  } catch (err) {
    console.error(
      `[clean-manifest] Error sincronizando prod -> dev (${devDir}):`,
      err
    )
  }
}

cleanManifestInDir(prodDir)
syncProdToDevIfPresent()
cleanManifestInDir(devDir)
