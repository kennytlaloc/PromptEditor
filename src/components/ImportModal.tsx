import React, { useRef, useState } from 'react'

export interface ParsedPrompt {
  title: string
  content: string
}

interface Props {
  onImport: (prompts: ParsedPrompt[]) => void
  onClose: () => void
  dark: boolean
}

const SAMPLE_CSV =
  `Prompt Name,Prompt Text\r\n` +
  `"Welcome Email","Write a warm welcome email for a new customer who just signed up for our service."\r\n` +
  `"Product Description","Write a concise product description for a wireless noise-cancelling headphone aimed at remote workers."\r\n`

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample-prompts.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/** Minimal CSV parser that handles quoted fields and escaped double-quotes. */
function parseCSVRow(row: string): string[] {
  const cells: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { cur += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { cells.push(cur); cur = '' }
      else { cur += ch }
    }
  }
  cells.push(cur)
  return cells
}

function parseCSV(raw: string): ParsedPrompt[] | null {
  const lines = raw.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return null

  const headers = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase())

  // Prefer exact matches first, then partial — ensures "Prompt Name" and "Prompt Text"
  // don't both resolve to index 0 via the shared word "prompt".
  const nameIdx = headers.findIndex(h => h === 'prompt name' || h === 'name' || h === 'title')
    !== -1
    ? headers.findIndex(h => h === 'prompt name' || h === 'name' || h === 'title')
    : headers.findIndex(h => h.includes('name') || h.includes('title'))

  const textIdx = headers.findIndex(h => h === 'prompt text' || h === 'text' || h === 'content')
    !== -1
    ? headers.findIndex(h => h === 'prompt text' || h === 'text' || h === 'content')
    : headers.findIndex(h => h.includes('text') || h.includes('content'))

  if (nameIdx === -1 || textIdx === -1 || nameIdx === textIdx) return null

  return lines.slice(1).map((line, i) => {
    const cells = parseCSVRow(line)
    return {
      title: cells[nameIdx]?.trim() || `Prompt ${i + 1}`,
      content: cells[textIdx]?.trim() || '',
    }
  }).filter(p => p.content)
}

export default function ImportModal({ onImport, onClose, dark }: Props) {
  const [pasteText, setPasteText] = useState('')
  const [pasteTitle, setPasteTitle] = useState('')
  const [parsedPrompts, setParsedPrompts] = useState<ParsedPrompt[] | null>(null)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const bg = dark ? 'bg-gray-800' : 'bg-white'
  const overlay = dark ? 'bg-black/60' : 'bg-black/40'
  const textCls = dark ? 'text-gray-100' : 'text-gray-900'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
  const badgeCls = dark ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-50 text-indigo-700'

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const raw = ev.target?.result as string
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(raw)
          const content = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
          setParsedPrompts([{ title: file.name.replace(/\.[^.]+$/, ''), content }])
        } catch {
          setParsedPrompts([{ title: file.name.replace(/\.[^.]+$/, ''), content: raw }])
        }
      } else if (file.name.endsWith('.csv')) {
        const multi = parseCSV(raw)
        if (multi && multi.length > 0) {
          setParsedPrompts(multi)
        } else {
          // Fallback: treat each line as content under one prompt
          const lines = raw.split(/\r?\n/).filter(l => l.trim())
          setParsedPrompts([{ title: file.name.replace(/\.[^.]+$/, ''), content: lines.join('\n') }])
        }
      } else {
        setParsedPrompts([{ title: file.name.replace(/\.[^.]+$/, ''), content: raw }])
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
    handleFile(fakeEvent)
  }

  const handleSubmit = () => {
    if (parsedPrompts && parsedPrompts.length > 0) {
      onImport(parsedPrompts)
    } else if (pasteText.trim()) {
      onImport([{ title: pasteTitle.trim() || `Prompt ${new Date().toLocaleString()}`, content: pasteText.trim() }])
    }
    onClose()
  }

  const canImport = (parsedPrompts && parsedPrompts.length > 0) || pasteText.trim().length > 0

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlay}`}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`${bg} rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className={`text-base font-semibold ${textCls}`}>Import Prompts</h2>
          <button onClick={onClose} className={`text-lg ${mutedCls} hover:text-red-500`}>✕</button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Drop zone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-medium ${mutedCls}`}>Upload file</label>
              <button
                onClick={downloadSample}
                className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
              >
                ↓ Download sample CSV
              </button>
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg py-6 text-center cursor-pointer transition-colors ${
                parsedPrompts
                  ? dark ? 'border-indigo-500 bg-indigo-900/20' : 'border-indigo-400 bg-indigo-50'
                  : dark
                    ? 'border-gray-600 hover:border-indigo-500 text-gray-400'
                    : 'border-gray-300 hover:border-indigo-400 text-gray-500'
              }`}
            >
              {parsedPrompts ? (
                <div>
                  <p className={`text-sm font-medium ${dark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    ✓ {fileName}
                  </p>
                  <p className={`text-xs mt-1 ${mutedCls}`}>
                    {parsedPrompts.length} prompt{parsedPrompts.length !== 1 ? 's' : ''} ready to import
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); setParsedPrompts(null); setFileName('') }}
                    className={`text-xs mt-2 ${mutedCls} hover:text-red-500`}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm">Drop a <strong>.txt</strong>, <strong>.json</strong>, or <strong>.csv</strong> file here</p>
                  <p className="text-xs mt-1">or click to browse</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".txt,.json,.csv" className="hidden" onChange={handleFile} />
            </div>
          </div>

          {/* Parsed preview */}
          {parsedPrompts && parsedPrompts.length > 1 && (
            <div className={`rounded-lg border p-3 space-y-1 ${dark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <p className={`text-xs font-medium mb-2 ${mutedCls}`}>Preview ({parsedPrompts.length} prompts)</p>
              {parsedPrompts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono shrink-0 ${badgeCls}`}>{i + 1}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${textCls}`}>{p.title}</p>
                    <p className={`text-xs truncate ${mutedCls}`}>{p.content.slice(0, 80)}{p.content.length > 80 ? '…' : ''}</p>
                  </div>
                </div>
              ))}
              {parsedPrompts.length > 5 && (
                <p className={`text-xs ${mutedCls}`}>…and {parsedPrompts.length - 5} more</p>
              )}
            </div>
          )}

          {/* Divider */}
          {!parsedPrompts && (
            <div className="flex items-center gap-3">
              <div className={`flex-1 border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`} />
              <span className={`text-xs ${mutedCls}`}>or paste text</span>
              <div className={`flex-1 border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`} />
            </div>
          )}

          {/* Paste area — hidden once file loaded */}
          {!parsedPrompts && (
            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>Title (optional)</label>
                <input
                  className={`w-full text-sm px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputCls}`}
                  placeholder="My Prompt"
                  value={pasteTitle}
                  onChange={e => setPasteTitle(e.target.value)}
                />
              </div>
              <textarea
                className={`w-full text-sm px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${inputCls}`}
                rows={5}
                placeholder="Paste your prompt text here…"
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className={`text-xs ${mutedCls}`}>
            CSV format: <code className="font-mono">Prompt Name, Prompt Text</code>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`text-sm px-4 py-2 rounded border ${
                dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              disabled={!canImport}
              onClick={handleSubmit}
              className="text-sm px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium"
            >
              Import{parsedPrompts && parsedPrompts.length > 1 ? ` ${parsedPrompts.length}` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
