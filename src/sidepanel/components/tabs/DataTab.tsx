import { FileSpreadsheet } from "lucide-react"
import { useMemo, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import {
  extractColumnsFromRecords,
  parseRecordsFromFile,
  parseRecordsFromRawText
} from "~sidepanel/utils/records-parser"
import {
  SAMPLE_RECORDS,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type { DataRecord } from "~types/workflow"

export function DataTab() {
  const [records, setRecords] = useStorage<DataRecord[]>(
    {
      key: STORAGE_KEYS.RECORDS,
      instance: workflowStorage
    },
    SAMPLE_RECORDS
  )

  const [rawInputText, setRawInputText] = useState<string>("")
  const [parseFeedback, setParseFeedback] = useState<string | null>(null)

  const columns = useMemo(() => extractColumnsFromRecords(records), [records])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await parseRecordsFromFile(file)
    if (result.ok && result.records) {
      setRecords(result.records)
    }
    setParseFeedback(result.message)
  }

  const handleParseRawText = () => {
    if (!rawInputText.trim()) return
    const result = parseRecordsFromRawText(rawInputText)
    if (result.ok && result.records) {
      setRecords(result.records)
    }
    setParseFeedback(result.message)
  }

  return (
    <div className="space-y-3">
      {/* Upload CSV / JSON file */}
      <div className="bg-ember border border-rim rounded-lg p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-parchment flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-coral-shimmer" />
            Importar archivo CSV o JSON
          </span>
        </div>
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
          className="block w-full text-[11px] text-ash file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-forest-deep file:text-parchment hover:file:bg-forest-deep/90 cursor-pointer"
        />
      </div>

      {/* Paste Raw CSV / JSON */}
      <div className="bg-ember border border-rim rounded-lg p-3 space-y-2">
        <label className="block font-semibold text-parchment">
          O pega tus registros (CSV con encabezados o JSON):
        </label>
        <textarea
          rows={4}
          value={rawInputText}
          onChange={(e) => setRawInputText(e.target.value)}
          placeholder={`nombre,email,rol\nJuan Perez,juan@correo.com,Admin\nMaria Lopez,maria@correo.com,User`}
          className="w-full bg-void-black border border-rim rounded p-2 font-mono text-[11px] text-parchment placeholder:text-ash/60 focus:outline-none focus:border-coral-shimmer"
        />
        <div className="flex justify-between items-center gap-2">
          <button
            type="button"
            onClick={handleParseRawText}
            className="px-3 py-1.5 rounded bg-forest-deep hover:bg-forest-deep/90 text-parchment font-medium transition shadow-sm">
            Cargar desde texto
          </button>
          <button
            type="button"
            onClick={() => {
              setRecords(SAMPLE_RECORDS)
              setParseFeedback("Datos de ejemplo restaurados.")
            }}
            className="px-2.5 py-1.5 rounded bg-void-black hover:bg-obsidian border border-rim text-ash hover:text-parchment transition">
            Restaurar ejemplo
          </button>
        </div>
        {parseFeedback && (
          <p className="text-[11px] text-coral-shimmer pt-1">{parseFeedback}</p>
        )}
      </div>

      {/* Preview Table */}
      <div className="bg-ember border border-rim rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-parchment">
            Vista previa ({records?.length ?? 0} registros)
          </span>
          {records && records.length > 0 && (
            <button
              type="button"
              onClick={() => setRecords([])}
              className="text-[11px] text-rose-400 hover:underline">
              Vaciar lista
            </button>
          )}
        </div>

        {records && records.length > 0 ? (
          <div className="overflow-x-auto max-h-60 border border-rim rounded">
            <table className="w-full text-left border-collapse">
              <thead className="bg-void-black text-ash font-mono sticky top-0">
                <tr>
                  <th className="py-1.5 px-2 border-b border-rim">#</th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="py-1.5 px-2 border-b border-rim font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 50).map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-rim/40 hover:bg-obsidian">
                    <td className="py-1 px-2 text-copper font-mono">{idx + 1}</td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="py-1 px-2 text-parchment font-mono text-[11px] truncate max-w-[140px]">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-ash/60 py-4 text-center">
            No hay registros cargados actualmente.
          </p>
        )}
      </div>
    </div>
  )
}
