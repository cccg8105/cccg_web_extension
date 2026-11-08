import Papa from "papaparse"
import type { DataRecord } from "~types/workflow"

export interface RecordsParseResult {
  ok: boolean
  records?: DataRecord[]
  message: string
}

export function extractColumnsFromRecords(
  records: DataRecord[] | undefined
): string[] {
  if (!records || records.length === 0) return []
  const keySet = new Set<string>()
  records.forEach((row) => {
    Object.keys(row).forEach((k) => keySet.add(k))
  })
  return Array.from(keySet)
}

export function parseRecordsFromFile(file: File): Promise<RecordsParseResult> {
  if (file.name.endsWith(".json")) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result))
          if (Array.isArray(parsed)) {
            resolve({
              ok: true,
              records: parsed,
              message: `Se cargaron ${parsed.length} registros desde ${file.name}`
            })
          } else {
            resolve({
              ok: false,
              message: "El archivo JSON debe contener un arreglo de objetos."
            })
          }
        } catch {
          resolve({
            ok: false,
            message: "Error al leer el archivo JSON."
          })
        }
      }
      reader.onerror = () => {
        resolve({
          ok: false,
          message: "Error al leer el archivo JSON."
        })
      }
      reader.readAsText(file)
    })
  }

  return new Promise((resolve) => {
    Papa.parse<DataRecord>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          resolve({
            ok: true,
            records: results.data,
            message: `Se cargaron ${results.data.length} registros desde ${file.name}`
          })
        } else {
          resolve({
            ok: false,
            message: "No se encontraron filas válidas en el CSV."
          })
        }
      },
      error: (err) => {
        resolve({
          ok: false,
          message: `Error leyendo CSV: ${err.message}`
        })
      }
    })
  })
}

export function parseRecordsFromRawText(rawText: string): RecordsParseResult {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return {
      ok: false,
      message: "Ingresa contenido CSV o JSON antes de cargar."
    }
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      return {
        ok: true,
        records: list,
        message: `Se cargaron ${list.length} registros desde JSON.`
      }
    } catch {
      return {
        ok: false,
        message: "JSON inválido. Verifica el formato."
      }
    }
  }

  const csvResult = Papa.parse<DataRecord>(trimmed, {
    header: true,
    skipEmptyLines: true
  })

  if (csvResult.data && csvResult.data.length > 0) {
    return {
      ok: true,
      records: csvResult.data,
      message: `Se cargaron ${csvResult.data.length} registros desde CSV.`
    }
  }

  return {
    ok: false,
    message:
      "No se pudieron extraer registros. Asegúrate de incluir encabezados."
  }
}
