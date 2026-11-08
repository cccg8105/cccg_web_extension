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
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            Importar archivo CSV o JSON
          </span>
        </div>
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
          className="block w-full text-[11px] text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
        />
      </div>

      {/* Paste Raw CSV / JSON */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
        <label className="block font-semibold text-slate-200">
          O pega tus registros (CSV con encabezados o JSON):
        </label>
        <textarea
          rows={4}
          value={rawInputText}
          onChange={(e) => setRawInputText(e.target.value)}
          placeholder={`nombre,email,rol\nJuan Perez,juan@correo.com,Admin\nMaria Lopez,maria@correo.com,User`}
          className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex justify-between items-center gap-2">
          <button
            type="button"
            onClick={handleParseRawText}
            className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition">
            Cargar desde texto
          </button>
          <button
            type="button"
            onClick={() => {
              setRecords(SAMPLE_RECORDS)
              setParseFeedback("Datos de ejemplo restaurados.")
            }}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            Restaurar ejemplo
          </button>
        </div>
        {parseFeedback && (
          <p className="text-[11px] text-indigo-300 pt-1">{parseFeedback}</p>
        )}
      </div>

      {/* Preview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200">
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
          <div className="overflow-x-auto max-h-60 border border-slate-800 rounded">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950 text-slate-400 sticky top-0">
                <tr>
                  <th className="py-1.5 px-2 border-b border-slate-800">#</th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="py-1.5 px-2 border-b border-slate-800 font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 50).map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40">
                    <td className="py-1 px-2 text-slate-500">{idx + 1}</td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="py-1 px-2 text-slate-200 truncate max-w-[140px]">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 py-4 text-center">
            No hay registros cargados actualmente.
          </p>
        )}
      </div>
    </div>
  )
}
