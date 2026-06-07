import React, { useState } from 'react'
import { SSMLConfig, SSMLSnippet, BUILT_IN_SSML_TAGS } from '../config'

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
      <div>
        <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>SSML Tag</label>
        <input
          className={`w-full text-xs px-2 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${inputCls}`}
          placeholder='<break time="500ms"/>'
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
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<SSMLSnippet, 'id'>>(EMPTY_SNIPPET)
  const [showAddForm, setShowAddForm] = useState(false)

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
          <span>Built-in tag reference ({BUILT_IN_SSML_TAGS.length} tags)</span>
          <span className={mutedCls}>{expandedBuiltIn ? '▲' : '▼'}</span>
        </button>

        {expandedBuiltIn && (
          <div className={`border-t divide-y ${dark ? 'border-gray-700 divide-gray-700' : 'border-gray-200 divide-gray-100'}`}>
            {BUILT_IN_SSML_TAGS.map(tag => {
              const isOpen = expandedTagId === tag.id
              return (
                <div key={tag.id}>
                  <button
                    onClick={() => setExpandedTagId(isOpen ? null : tag.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors ${
                      isOpen
                        ? dark ? 'bg-gray-700' : 'bg-indigo-50'
                        : dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
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

                  {isOpen && (
                    <div className={`px-3 pb-3 pt-1 space-y-2 ${dark ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                      <p className={`text-xs ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{tag.description}</p>
                      <div>
                        <p className={`text-xs font-medium mb-1 ${mutedCls}`}>Full tag</p>
                        <code className={`block text-xs px-2 py-1.5 rounded font-mono break-all ${dark ? 'bg-gray-800 text-indigo-300' : 'bg-white text-indigo-700 border border-indigo-100'}`}>
                          {tag.tag}
                        </code>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          tag.tag.includes('…')
                            ? dark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
                            : dark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {tag.tag.includes('…') ? 'Wrapping' : 'Self-closing'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Custom snippets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-medium ${textCls}`}>Custom snippets</p>
          {!showAddForm && editingId === null && (
            <button
              onClick={() => { setShowAddForm(true); setDraft(EMPTY_SNIPPET) }}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              + Add snippet
            </button>
          )}
        </div>

        <div className="space-y-2">
          {showAddForm && (
            <SnippetForm
              draft={draft}
              onDraftChange={setDraft}
              onSave={addSnippet}
              onCancel={() => { setShowAddForm(false); setDraft(EMPTY_SNIPPET) }}
              dark={dark}
            />
          )}

          {config.snippets.length === 0 && !showAddForm && (
            <p className={`text-xs text-center py-3 ${mutedCls}`}>
              No custom snippets yet. Add one above.
            </p>
          )}

          {config.snippets.map(s => (
            <div key={s.id}>
              {editingId === s.id ? (
                <SnippetForm
                  draft={draft}
                  onDraftChange={setDraft}
                  onSave={saveEdit}
                  onCancel={() => setEditingId(null)}
                  dark={dark}
                />
              ) : (
                <div className={`group flex items-start gap-3 rounded-lg border px-3 py-2 ${innerBg}`}>
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
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
              )}
            </div>
          ))}
        </div>
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
