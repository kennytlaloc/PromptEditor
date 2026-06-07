import React, { useState, useRef, useEffect } from 'react'
import { SSMLConfig, SSMLSnippet, BUILT_IN_SSML_TAGS, PollyEngineType, ALL_POLLY_ENGINES } from '../config'

const ENGINE_FILTER_LABELS: Record<PollyEngineType, string> = {
  standard:    'Standard',
  neural:      'Neural',
  'long-form': 'Long-form',
  generative:  'Generative',
}

interface Props {
  config: SSMLConfig
  onChange: (s: SSMLConfig) => void
  dark: boolean
}

function makeId() {
  return 'custom_' + Math.random().toString(36).slice(2)
}

const EMPTY_SNIPPET: Omit<SSMLSnippet, 'id'> = { label: '', tag: '', description: '' }

interface SnippetFormProps {
  draft: Omit<SSMLSnippet, 'id'>
  onDraftChange: (d: Omit<SSMLSnippet, 'id'>) => void
  onSave: () => void
  onCancel: () => void
  dark: boolean
}

function SnippetForm({ draft, onDraftChange, onSave, onCancel, dark }: SnippetFormProps) {
  const innerBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  // Derive tag type from whether the tag contains the wrapping placeholder
  const isWrapping = draft.tag.includes('…')

  const setWrapping = (wrap: boolean) => {
    if (wrap === isWrapping) return
    let tag = draft.tag.trim()
    if (wrap) {
      // Convert self-closing to wrapping: find tag name and build open+close
      // e.g. <break time="300ms"/> → <break time="300ms">…</break>
      const selfClosingMatch = tag.match(/^<([a-zA-Z][a-zA-Z0-9:-]*)(\s[^>]*)?\/>$/)
      if (selfClosingMatch) {
        const name = selfClosingMatch[1]
        const attrs = selfClosingMatch[2] ?? ''
        tag = `<${name}${attrs}>…</${name}>`
      } else {
        // Already has some structure — just append placeholder if missing
        tag = tag + '…'
      }
    } else {
      // Convert wrapping to self-closing: strip >…</tagname> → />
      const wrappingMatch = tag.match(/^(<[a-zA-Z][^>]*)>…<\/[a-zA-Z][a-zA-Z0-9:-]*>$/)
      if (wrappingMatch) {
        const open = wrappingMatch[1].replace(/\s*\/$/, '')
        tag = `${open}/>`
      } else {
        tag = tag.replace('…', '')
      }
    }
    onDraftChange({ ...draft, tag })
  }

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${innerBg}`}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>Label</label>
          <input
            className={`w-full text-xs px-2 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputCls}`}
            placeholder="Short pause"
            value={draft.label}
            onChange={e => onDraftChange({ ...draft, label: e.target.value })}
          />
        </div>
        <div>
          <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>Description</label>
          <input
            className={`w-full text-xs px-2 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputCls}`}
            placeholder="What it does"
            value={draft.description}
            onChange={e => onDraftChange({ ...draft, description: e.target.value })}
          />
        </div>
      </div>

      {/* Tag type toggle */}
      <div>
        <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>Tag type</label>
        <div className={`flex rounded-lg border overflow-hidden text-xs font-medium ${dark ? 'border-gray-600' : 'border-gray-200'}`}>
          {([false, true] as const).map(wrap => (
            <button
              key={String(wrap)}
              type="button"
              onClick={() => setWrapping(wrap)}
              className={`flex-1 py-1.5 transition-colors ${
                isWrapping === wrap
                  ? wrap ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  : dark ? 'bg-gray-800 text-gray-400 hover:text-gray-200' : 'bg-white text-gray-500 hover:text-gray-700'
              }`}
            >
              {wrap ? 'Wrapping' : 'Self-closing'}
            </button>
          ))}
        </div>
        <p className={`mt-1 text-xs ${mutedCls}`}>
          {isWrapping
            ? 'Tag wraps selected text. Use … as the content placeholder.'
            : 'Tag inserts at cursor with no closing tag.'}
        </p>
      </div>

      <div>
        <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>SSML Tag</label>
        <input
          className={`w-full text-xs px-2 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${inputCls}`}
          placeholder={isWrapping ? '<tag attr="value">…</tag>' : '<break time="500ms"/>'}
          value={draft.tag}
          onChange={e => onDraftChange({ ...draft, tag: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className={`text-xs px-3 py-1.5 rounded border ${
            dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Cancel
        </button>
        <button
          disabled={!draft.label.trim() || !draft.tag.trim()}
          onClick={onSave}
          className="text-xs px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium"
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default function SSMLSection({ config, onChange, dark }: Props) {
  const [expandedBuiltIn, setExpandedBuiltIn] = useState(false)
  const [expandedCustom, setExpandedCustom] = useState(false)
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null)
  const [engineFilter, setEngineFilter] = useState<PollyEngineType | 'all'>('all')
  const [builtInSearch, setBuiltInSearch] = useState('')

  const favourites = config.favourites ?? []
  const toggleFavourite = (id: string) => {
    const next = favourites.includes(id)
      ? favourites.filter(f => f !== id)
      : [...favourites, id]
    onChange({ ...config, favourites: next })
  }
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<SSMLSnippet, 'id'>>(EMPTY_SNIPPET)
  const [showAddForm, setShowAddForm] = useState(false)
  const [copyingBuiltInId, setCopyingBuiltInId] = useState<string | null>(null)
  const [copyDraft, setCopyDraft] = useState<Omit<SSMLSnippet, 'id'>>(EMPTY_SNIPPET)
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())
  const [justAddedId, setJustAddedId] = useState<string | null>(null)
  const justAddedRef = useRef<HTMLDivElement | null>(null)

  // Scroll to newly copied custom tag after it renders
  useEffect(() => {
    if (justAddedId && justAddedRef.current) {
      justAddedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setJustAddedId(null)
    }
  }, [justAddedId, config.snippets])

  const cardBg = dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
  const innerBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textCls = dark ? 'text-gray-100' : 'text-gray-900'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  const codeCls = dark ? 'bg-gray-700 text-indigo-300' : 'bg-gray-100 text-indigo-700'
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const tagBadge = dark ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-50 text-indigo-700'

  const updateSnippets = (snippets: SSMLSnippet[]) => onChange({ ...config, snippets })

  const startEdit = (s: SSMLSnippet) => {
    setEditingId(s.id)
    setDraft({ label: s.label, tag: s.tag, description: s.description })
    setShowAddForm(false)
  }

  const saveEdit = () => {
    if (!editingId || !draft.label.trim() || !draft.tag.trim()) return
    updateSnippets(config.snippets.map(s =>
      s.id === editingId ? { ...s, ...draft } : s
    ))
    setEditingId(null)
  }

  const deleteSnippet = (id: string) => {
    updateSnippets(config.snippets.filter(s => s.id !== id))
  }

  const addSnippet = () => {
    if (!draft.label.trim() || !draft.tag.trim()) return
    updateSnippets([...config.snippets, { id: makeId(), ...draft }])
    setDraft(EMPTY_SNIPPET)
    setShowAddForm(false)
  }


  return (
    <div className={`rounded-lg border p-5 space-y-4 ${cardBg}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${mutedCls}`}>SSML Tags</h3>
        <button
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
            config.enabled ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
          title="Enable SSML"
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            config.enabled ? 'translate-x-4' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      <p className={`text-xs ${mutedCls}`}>
        SSML (Speech Synthesis Markup Language) lets you control pauses, emphasis, speed, and more.
        {!config.enabled && <span className={`ml-1 font-medium ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>Enable the toggle to activate.</span>}
      </p>

      {/* Built-in tag reference */}
      <div className={`rounded-lg border overflow-hidden ${innerBg}`}>
        <button
          onClick={() => setExpandedBuiltIn(e => !e)}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium ${textCls}`}
        >
          <div className="flex-1 text-left">
            <span>Built-in tag reference</span>
          </div>
          <span className={mutedCls}>{expandedBuiltIn ? '▲' : '▼'}</span>
        </button>

        {expandedBuiltIn && (
          <>
            {/* Engine type filter */}
            <div className={`px-3 py-2 border-t flex items-center gap-2 ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
              <span className={`text-xs shrink-0 ${mutedCls}`}>Filter by engine:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setEngineFilter('all')}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    engineFilter === 'all'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : dark ? 'border-gray-600 text-gray-400 hover:border-indigo-400 hover:text-indigo-300' : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600'
                  }`}
                >
                  All
                </button>
                {ALL_POLLY_ENGINES.map(eng => (
                  <button
                    key={eng}
                    onClick={() => setEngineFilter(eng)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      engineFilter === eng
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : dark ? 'border-gray-600 text-gray-400 hover:border-indigo-400 hover:text-indigo-300' : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {ENGINE_FILTER_LABELS[eng]}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className={`px-3 pb-2 border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="relative mt-2">
                <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${mutedCls}`}>🔍</span>
                <input
                  type="text"
                  placeholder="Search tags…"
                  value={builtInSearch}
                  onChange={e => setBuiltInSearch(e.target.value)}
                  className={`w-full text-xs pl-7 pr-8 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    dark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
                {builtInSearch && (
                  <button
                    onClick={() => setBuiltInSearch('')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${mutedCls} hover:text-red-400`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

          {(() => {
              const q = builtInSearch.trim().toLowerCase()
              const filtered = BUILT_IN_SSML_TAGS
                .filter(tag =>
                  (engineFilter === 'all' || !tag.engines || tag.engines.includes(engineFilter)) &&
                  (!q || tag.label.toLowerCase().includes(q) || tag.description.toLowerCase().includes(q) || tag.tag.toLowerCase().includes(q))
                )
                .sort((a, b) => (favourites.includes(a.id) ? 0 : 1) - (favourites.includes(b.id) ? 0 : 1))
              return (
                <div className={`border-t divide-y ${dark ? 'border-gray-700 divide-gray-700' : 'border-gray-200 divide-gray-100'}`}>
                  {filtered.length === 0
                    ? <p className={`text-xs text-center py-4 ${mutedCls}`}>No tags match "{builtInSearch}".</p>
                    : filtered.map(tag => {
              const isOpen = expandedTagId === tag.id
              const isFav = favourites.includes(tag.id)
              return (
                <div key={tag.id}>
                  <div className={`flex items-start transition-colors ${
                    isOpen
                      ? dark ? 'bg-gray-700' : 'bg-indigo-50'
                      : dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  }`}>
                    {/* Star button */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavourite(tag.id) }}
                      title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                      className={`px-2 pt-2.5 shrink-0 transition-colors ${
                        isFav
                          ? 'text-yellow-400 hover:text-yellow-500'
                          : dark ? 'text-gray-600 hover:text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      {isFav ? '★' : '☆'}
                    </button>
                    {/* Expand row */}
                    <button
                      onClick={() => setExpandedTagId(isOpen ? null : tag.id)}
                      className="flex-1 flex items-start gap-3 pr-3 py-2 text-left min-w-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${isOpen ? (dark ? 'text-indigo-300' : 'text-indigo-700') : textCls}`}>
                          {tag.label}
                        </p>
                        {!isOpen && (
                          <p className={`text-xs ${mutedCls}`}>{tag.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <code className={`text-xs px-1.5 py-0.5 rounded font-mono ${codeCls}`}>
                          {tag.tag.length > 28 ? tag.tag.slice(0, 28) + '…' : tag.tag}
                        </code>
                        <span className={`text-xs ${mutedCls}`}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>
                  </div>

                  {isOpen && (
                    <div className={`px-3 pb-3 pt-1 space-y-2 ${dark ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                      <p className={`text-xs ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{tag.description}</p>
                      <div>
                        <p className={`text-xs font-medium mb-1 ${mutedCls}`}>Full tag</p>
                        <code className={`block text-xs px-2 py-1.5 rounded font-mono break-all ${dark ? 'bg-gray-800 text-indigo-300' : 'bg-white text-indigo-700 border border-indigo-100'}`}>
                          {tag.tag}
                        </code>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            tag.tag.includes('…')
                              ? dark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
                              : dark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {tag.tag.includes('…') ? 'Wrapping' : 'Self-closing'}
                          </span>
                        </div>
                        {copiedIds.has(tag.id) ? (
                          <span className={`text-xs px-2 py-0.5 rounded ${dark ? 'text-green-300' : 'text-green-600'}`}>
                            ✓ Copied to custom tags
                          </span>
                        ) : copyingBuiltInId === tag.id ? null : (
                          <button
                            onClick={() => {
                              setCopyingBuiltInId(tag.id)
                              setCopyDraft({ label: tag.label, tag: tag.tag, description: tag.description })
                              setExpandedCustom(true)
                            }}
                            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                          >
                            Edit →
                          </button>
                        )}
                      </div>

                      {/* Inline edit form — saved as a new custom tag */}
                      {copyingBuiltInId === tag.id && (
                        <div className={`mt-2 rounded-lg border p-3 space-y-2 ${dark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                          <p className={`text-xs font-medium ${mutedCls}`}>Customise and save as a custom tag</p>
                          <SnippetForm
                            draft={copyDraft}
                            onDraftChange={setCopyDraft}
                            onSave={() => {
                              if (!copyDraft.label.trim() || !copyDraft.tag.trim()) return
                              const newId = makeId()
                              const newSnippet = { id: newId, ...copyDraft }
                              onChange({ ...config, snippets: [...config.snippets, newSnippet] })
                              setCopiedIds(prev => new Set([...prev, tag.id]))
                              setCopyingBuiltInId(null)
                              setExpandedCustom(true)
                              setJustAddedId(newId)
                            }}
                            onCancel={() => setCopyingBuiltInId(null)}
                            dark={dark}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* Custom tags */}
      <div className={`rounded-lg border overflow-hidden ${innerBg}`}>
        {/* Collapsible header */}
        <div className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium ${textCls}`}>
          <button
            onClick={() => setExpandedCustom(e => !e)}
            className="flex-1 flex items-center gap-2 text-left"
          >
            <span>Custom tags</span>
            {config.snippets.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                {config.snippets.length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-3">
            {expandedCustom && !showAddForm && editingId === null && (
              <button
                onClick={() => { setShowAddForm(true); setDraft(EMPTY_SNIPPET) }}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
              >
                + Add tag
              </button>
            )}
            <button onClick={() => setExpandedCustom(e => !e)} className={mutedCls}>
              {expandedCustom ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {expandedCustom && (
          <div className={`border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
            {showAddForm && (
              <div className="p-3">
                <SnippetForm
                  draft={draft}
                  onDraftChange={setDraft}
                  onSave={addSnippet}
                  onCancel={() => { setShowAddForm(false); setDraft(EMPTY_SNIPPET) }}
                  dark={dark}
                />
              </div>
            )}

            {config.snippets.length === 0 && !showAddForm && (
              <div className="px-3 py-4 flex flex-col items-center gap-2">
                <p className={`text-xs text-center ${mutedCls}`}>No custom tags yet.</p>
                <button
                  onClick={() => { setShowAddForm(true); setDraft(EMPTY_SNIPPET) }}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                >
                  + Add tag
                </button>
              </div>
            )}

            <div className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {[...config.snippets].sort((a, b) => {
                const aFav = favourites.includes(a.id) ? 0 : 1
                const bFav = favourites.includes(b.id) ? 0 : 1
                return aFav - bFav
              }).map(s => (
                <div key={s.id} ref={s.id === justAddedId ? justAddedRef : undefined}>
                  {editingId === s.id ? (
                    <div className="p-3">
                      <SnippetForm
                        draft={draft}
                        onDraftChange={setDraft}
                        onSave={saveEdit}
                        onCancel={() => setEditingId(null)}
                        dark={dark}
                      />
                    </div>
                  ) : (
                    <div className={`group flex items-start transition-colors ${
                      s.id === justAddedId
                        ? dark ? 'bg-indigo-900/40' : 'bg-indigo-50'
                        : dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}>
                      {/* Star button */}
                      {(() => {
                        const isFav = favourites.includes(s.id)
                        return (
                          <button
                            onClick={() => toggleFavourite(s.id)}
                            title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                            className={`px-2 pt-2.5 shrink-0 transition-colors ${
                              isFav
                                ? 'text-yellow-400 hover:text-yellow-500'
                                : dark ? 'text-gray-600 hover:text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            {isFav ? '★' : '☆'}
                          </button>
                        )
                      })()}
                      <div className="flex-1 min-w-0 py-2 pr-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-medium ${textCls}`}>{s.label}</span>
                              {s.description && (
                                <span className={`text-xs ${mutedCls}`}>— {s.description}</span>
                              )}
                            </div>
                            <code className={`text-xs px-1.5 py-0.5 mt-1 inline-block rounded font-mono ${tagBadge}`}>
                              {s.tag}
                            </code>
                          </div>
                          <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
                            <button
                              onClick={() => startEdit(s)}
                              className={`text-xs ${mutedCls} hover:text-indigo-500`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteSnippet(s.id)}
                              className={`text-xs ${mutedCls} hover:text-red-500`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Docs link */}
      <p className={`text-xs ${mutedCls}`}>
        Reference:{' '}
        <a href="https://www.w3.org/TR/speech-synthesis11/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
          W3C SSML 1.1 spec ↗
        </a>
        {' · '}
        <a href="https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
          Amazon Polly tags ↗
        </a>
        {' · '}
        <a href="https://cloud.google.com/text-to-speech/docs/ssml" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
          Google Cloud SSML ↗
        </a>
      </p>
    </div>
  )
}
