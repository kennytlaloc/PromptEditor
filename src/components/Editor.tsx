import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Prompt, PromptVersion } from '../types'
import { SSMLConfig, BUILT_IN_SSML_TAGS, SSMLSnippet } from '../config'

interface Props {
  prompt: Prompt | null
  activeSentence: number
  onUpdate: (id: string, changes: { title?: string; content?: string }) => void
  onPlayContent: (content: string) => void
  dark: boolean
  ssml: SSMLConfig
}

interface EnclosingTag {
  tagName: string
  fullOpenTag: string   // e.g. <prosody rate="slow">
  openTagStart: number
  openTagEnd: number
  closeTagStart: number
  closeTagEnd: number
}

interface ContextMenu {
  x: number
  y: number
  selectionStart: number
  selectionEnd: number
  hasSelection: boolean
  enclosing: EnclosingTag | null
}

/**
 * Find the innermost SSML tag that fully encloses [selStart, selEnd].
 * Looks for the closest opening tag before selStart whose matching close tag is after selEnd.
 */
function findEnclosingTag(content: string, selStart: number, selEnd: number): EnclosingTag | null {
  if (selStart >= selEnd) return null
  const openTagRe = /<([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>/g
  let match: RegExpExecArray | null
  let best: EnclosingTag | null = null

  while ((match = openTagRe.exec(content)) !== null) {
    const openStart = match.index
    const openEnd = match.index + match[0].length
    // Only consider opening tags that end at or before selStart
    if (openEnd > selStart) break

    const tagName = match[1]
    const closeStr = `</${tagName}>`
    // Search from openEnd (not selEnd) so a selection that touches the close-tag boundary still matches.
    // Then verify the close tag is at or after selEnd (innermost wins).
    let searchFrom = openEnd
    while (true) {
      const closeStart = content.indexOf(closeStr, searchFrom)
      if (closeStart === -1) break
      const closeEnd = closeStart + closeStr.length
      if (closeStart >= selEnd) {
        // This pair fully encloses the selection — prefer the innermost opening tag
        if (!best || openStart > best.openTagStart) {
          best = {
            tagName,
            fullOpenTag: match[0],
            openTagStart: openStart,
            openTagEnd: openEnd,
            closeTagStart: closeStart,
            closeTagEnd: closeEnd,
          }
        }
        break
      }
      // Close tag is before selEnd — skip it and keep searching for the matching one
      searchFrom = closeEnd
    }
  }
  return best
}

/** Remove the enclosing open + close tags, keeping the content between them. */
function removeEnclosingTag(content: string, enc: EnclosingTag): { newContent: string; caretPos: number } {
  const inner = content.slice(enc.openTagEnd, enc.closeTagStart)
  const newContent = content.slice(0, enc.openTagStart) + inner + content.slice(enc.closeTagEnd)
  return { newContent, caretPos: enc.openTagStart + inner.length }
}

/** A tag is "wrapping" if it contains the … placeholder, meaning it needs content between open/close tags. */
function isWrapping(tag: string): boolean {
  return tag.includes('…')
}

/** Extract { openTag, closeTag } from a wrapping template like "<emphasis level="moderate">…</emphasis>" */
function splitWrappingTag(tag: string): { openTag: string; closeTag: string } {
  const [openTag, rest] = tag.split('…')
  return { openTag: openTag.trim(), closeTag: rest?.trim() ?? '' }
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]*/g) || [text]
}

function applyTagToContent(
  content: string,
  tag: string,
  selStart: number,
  selEnd: number,
): { newContent: string; caretPos: number } {
  if (isWrapping(tag)) {
    // Wrap selection: insert open tag before, close tag after
    const { openTag, closeTag } = splitWrappingTag(tag)
    const selected = content.slice(selStart, selEnd)
    const newContent =
      content.slice(0, selStart) + openTag + selected + closeTag + content.slice(selEnd)
    // Place caret after the closing tag
    return { newContent, caretPos: selStart + openTag.length + selected.length + closeTag.length }
  } else {
    // Self-closing: insert at cursor position
    const newContent = content.slice(0, selStart) + tag + content.slice(selEnd)
    return { newContent, caretPos: selStart + tag.length }
  }
}

export default function Editor({ prompt, activeSentence, onUpdate, onPlayContent, dark, ssml }: Props) {
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [tagSearch, setTagSearch] = useState('')
  const [enclosingMode, setEnclosingMode] = useState<'inside' | 'around'>('inside')
  const [showVersions, setShowVersions] = useState(false)
  const [expandedVersionIdx, setExpandedVersionIdx] = useState<number | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Reset draft when switching prompts
  useEffect(() => {
    setDraftTitle(prompt?.title ?? '')
    setDraftContent(prompt?.content ?? '')
    setEditingTitle(false)
    setContextMenu(null)
  }, [prompt?.id])

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus()
  }, [editingTitle])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
        setTagSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [contextMenu])

  // Close on Escape
  useEffect(() => {
    if (!contextMenu) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setContextMenu(null); setTagSearch('') }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [contextMenu])

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!ssml.enabled) return
    e.preventDefault()
    const ta = textareaRef.current!
    const selStart = ta.selectionStart
    const selEnd = ta.selectionEnd
    const hasSelection = selEnd > selStart
    const enclosing = hasSelection ? findEnclosingTag(draftContent, selStart, selEnd) : null
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      selectionStart: selStart,
      selectionEnd: selEnd,
      hasSelection,
      enclosing,
    })
    setTagSearch('')
    setEnclosingMode('inside') // default action is always Insert inside
  }, [ssml.enabled, draftContent])

  const applyTag = useCallback((tag: string) => {
    if (!contextMenu || !prompt) return

    let selStart = contextMenu.selectionStart
    let selEnd = contextMenu.selectionEnd

    // "Wrap around" mode: expand selection bounds to cover the entire enclosing tag
    if (enclosingMode === 'around' && contextMenu.enclosing) {
      selStart = contextMenu.enclosing.openTagStart
      selEnd = contextMenu.enclosing.closeTagEnd
    }

    const { newContent, caretPos } = applyTagToContent(draftContent, tag, selStart, selEnd)
    setDraftContent(newContent)
    setContextMenu(null)
    setTagSearch('')
    setEnclosingMode('inside')
    setTimeout(() => {
      const ta = textareaRef.current
      if (!ta) return
      ta.focus()
      ta.setSelectionRange(caretPos, caretPos)
    }, 0)
  }, [contextMenu, draftContent, prompt, enclosingMode])

  const handleRemoveEnclosing = useCallback(() => {
    if (!contextMenu?.enclosing || !prompt) return
    const { newContent, caretPos } = removeEnclosingTag(draftContent, contextMenu.enclosing)
    setDraftContent(newContent)
    setContextMenu(null)
    setTagSearch('')
    setTimeout(() => {
      const ta = textareaRef.current
      if (!ta) return
      ta.focus()
      ta.setSelectionRange(caretPos, caretPos)
    }, 0)
  }, [contextMenu, draftContent, prompt])

  const isDirty = prompt !== null && (draftTitle !== prompt.title || draftContent !== prompt.content)

  const handleSave = () => {
    if (!prompt) return
    onUpdate(prompt.id, { title: draftTitle, content: draftContent })
    setEditingTitle(false)
  }

  const handleCancel = () => {
    if (!prompt) return
    setDraftTitle(prompt.title)
    setDraftContent(prompt.content)
    setEditingTitle(false)
  }

  const favourites = ssml.favourites ?? []
  // Favourites float to the top; within each group preserve original order
  const sortByFav = (tags: SSMLSnippet[]) => [
    ...tags.filter(t => favourites.includes(t.id)),
    ...tags.filter(t => !favourites.includes(t.id)),
  ]
  // Filter by mode: no selection → self-closing only; selection → wrapping only
  const allTags: SSMLSnippet[] = sortByFav([...ssml.snippets, ...BUILT_IN_SSML_TAGS])
  const modeFilteredTags = contextMenu
    ? allTags.filter(t => contextMenu.hasSelection ? isWrapping(t.tag) : !isWrapping(t.tag))
    : allTags
  const filteredTags = tagSearch.trim()
    ? modeFilteredTags.filter(t =>
        t.label.toLowerCase().includes(tagSearch.toLowerCase()) ||
        t.tag.toLowerCase().includes(tagSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(tagSearch.toLowerCase())
      )
    : modeFilteredTags

  // Styles
  const bg = dark ? 'bg-gray-800' : 'bg-white'
  const textCls = dark ? 'text-gray-100' : 'text-gray-900'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  const borderCls = dark ? 'border-gray-700' : 'border-gray-200'
  const areaCls = dark
    ? 'bg-gray-900 text-gray-100 placeholder-gray-500'
    : 'bg-gray-50 text-gray-900 placeholder-gray-400'
  const menuBg = dark ? 'bg-gray-800 border-gray-600 shadow-xl' : 'bg-white border-gray-200 shadow-xl'
  const menuItemHover = dark ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'
  const codeCls = dark ? 'bg-gray-700 text-indigo-300' : 'bg-gray-100 text-indigo-600'
  const searchCls = dark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'

  if (!prompt) {
    return (
      <div className={`flex-1 flex items-center justify-center ${bg}`}>
        <p className={`text-sm ${mutedCls}`}>Select or import a prompt to get started</p>
      </div>
    )
  }

  const sentences = splitSentences(draftContent)
  const charCount = draftContent.length
  const tokenCount = Math.ceil(charCount / 4)

  return (
    <div className={`flex-1 flex flex-col ${bg} overflow-hidden relative`}>
      {/* Title bar */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${borderCls}`}>
        {editingTitle ? (
          <input
            ref={titleRef}
            className={`flex-1 text-lg font-semibold px-2 py-0.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
            }`}
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false) }}
          />
        ) : (
          <h2
            className={`flex-1 text-lg font-semibold cursor-text truncate ${textCls} ${isDirty ? 'italic' : ''}`}
            onClick={() => setEditingTitle(true)}
            title="Click to rename"
          >
            {draftTitle || <span className={mutedCls}>Untitled</span>}
          </h2>
        )}
        <span className={`text-xs shrink-0 ${mutedCls}`}>
          {charCount} chars · ~{tokenCount} tokens
        </span>
        {ssml.enabled && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${dark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
            SSML
          </span>
        )}
        {isDirty && (
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>Unsaved changes</span>
            <button
              onClick={handleCancel}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Hint when SSML enabled */}
      {ssml.enabled && (
        <div className={`px-4 py-1.5 text-xs border-b ${borderCls} ${dark ? 'text-indigo-300 bg-indigo-900/20' : 'text-indigo-600 bg-indigo-50'}`}>
          Right-click at cursor to insert a self-closing tag · Select text then right-click to wrap with a tag
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className={`flex-1 w-full p-4 text-sm leading-relaxed resize-none focus:outline-none border-0 font-mono ${areaCls}`}
        value={draftContent}
        onChange={e => setDraftContent(e.target.value)}
        onContextMenu={handleContextMenu}
        placeholder="Enter your prompt here…"
        spellCheck
      />

      {/* Playback highlight bar */}
      {activeSentence >= 0 && (
        <div className={`px-4 py-3 border-t ${borderCls} text-sm leading-relaxed overflow-y-auto max-h-32`}>
          <p className={`text-xs font-medium mb-1 ${mutedCls}`}>Now reading:</p>
          <span className={dark ? 'text-gray-100' : 'text-gray-900'}>
            {sentences.map((s, i) => (
              <span key={i} className={i === activeSentence ? 'highlight-sentence' : ''}>{s}</span>
            ))}
          </span>
        </div>
      )}

      {/* Version history panel */}
      {(prompt.versions ?? []).length > 0 && (
        <div className={`border-t ${borderCls}`}>
          <button
            onClick={() => { setShowVersions(v => !v); setExpandedVersionIdx(null) }}
            className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${
              dark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="font-medium">
              Version history ({prompt.versions.length} {prompt.versions.length === 1 ? 'version' : 'versions'})
            </span>
            <span>{showVersions ? '▲' : '▼'}</span>
          </button>

          {showVersions && (
            <div className={`max-h-72 overflow-y-auto divide-y ${dark ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {[...prompt.versions].reverse().map((v: PromptVersion, idx: number) => {
                const realIdx = prompt.versions.length - 1 - idx
                const isOpen = expandedVersionIdx === realIdx
                const date = new Date(v.savedAt)
                const label = date.toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })
                return (
                  <div key={realIdx}>
                    <button
                      onClick={() => setExpandedVersionIdx(isOpen ? null : realIdx)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-xs text-left transition-colors ${
                        isOpen
                          ? dark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                          : dark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                          v{realIdx}
                        </span>
                        {v.title !== prompt.title && (
                          <span className="truncate font-medium">{v.title}</span>
                        )}
                        <span className={`truncate ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {v.content.replace(/<[^>]+>/g, '').slice(0, 60)}
                          {v.content.length > 60 ? '…' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className={dark ? 'text-gray-600' : 'text-gray-400'}>{label}</span>
                        <span>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className={`px-4 pb-3 space-y-2 ${dark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
                        <pre className={`text-xs font-mono whitespace-pre-wrap rounded p-3 max-h-40 overflow-y-auto ${
                          dark ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700 border border-gray-200'
                        }`}>
                          {v.content || <span className={dark ? 'text-gray-600' : 'text-gray-400'}>(empty)</span>}
                        </pre>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => onPlayContent(v.content)}
                            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                              dark
                                ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            ▶ Play
                          </button>
                          <button
                            onClick={() => {
                              setDraftContent(v.content)
                              setDraftTitle(v.title)
                              setExpandedVersionIdx(null)
                            }}
                            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                              dark
                                ? 'border-indigo-600 text-indigo-300 hover:bg-indigo-900'
                                : 'border-indigo-300 text-indigo-600 hover:bg-indigo-100'
                            }`}
                          >
                            Restore this version
                          </button>
                          <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                            (click Save to apply)
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
      )}

      {/* SSML Context Menu */}
      {contextMenu && ssml.enabled && (
        <div
          ref={menuRef}
          className={`fixed z-50 rounded-xl border overflow-hidden flex flex-col ${menuBg}`}
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 340),
            top: Math.min(contextMenu.y, window.innerHeight - 420),
            width: 320,
            maxHeight: 400,
          }}
        >
          {/* Menu header */}
          {/* Header */}
          <div className={`flex items-center justify-between px-3 py-2 border-b ${dark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
            <div>
              <span className={`text-xs font-semibold uppercase tracking-wide ${mutedCls}`}>
                {contextMenu?.hasSelection ? 'Wrap selection with tag' : 'Insert tag at cursor'}
              </span>
              <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                {contextMenu?.hasSelection
                  ? 'Open + close tags inserted around your selection'
                  : 'Self-closing tag inserted at cursor position'}
              </p>
            </div>
            <button onClick={() => { setContextMenu(null); setTagSearch('') }} className={`text-xs ${mutedCls} hover:text-red-500 ml-2 shrink-0`}>✕</button>
          </div>

          {/* Enclosing-tag banner */}
          {contextMenu?.enclosing && (
            <div className={`border-b px-3 py-2 space-y-2 ${dark ? 'border-gray-700 bg-yellow-900/20' : 'border-yellow-100 bg-yellow-50'}`}>
              <p className={`text-xs font-medium ${dark ? 'text-yellow-300' : 'text-yellow-800'}`}>
                Selection is inside{' '}
                <code className={`font-mono px-1 rounded ${dark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                  {contextMenu.enclosing.fullOpenTag}
                </code>
              </p>
              <div className="flex gap-1.5">
                {/* Remove */}
                <button
                  onClick={handleRemoveEnclosing}
                  className={`flex-1 text-xs py-1.5 rounded border font-medium transition-colors ${
                    dark ? 'border-red-700 text-red-400 hover:bg-red-900/40' : 'border-red-300 text-red-600 hover:bg-red-50'
                  }`}
                >
                  ✕ Remove
                </button>
                {/* Insert inside — default, active by default */}
                <button
                  onClick={() => setEnclosingMode('inside')}
                  className={`flex-1 text-xs py-1.5 rounded border font-medium transition-colors ${
                    enclosingMode === 'inside'
                      ? dark ? 'border-indigo-500 bg-indigo-900 text-indigo-200' : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ↓ Insert inside
                </button>
                {/* Wrap around */}
                <button
                  onClick={() => setEnclosingMode('around')}
                  className={`flex-1 text-xs py-1.5 rounded border font-medium transition-colors ${
                    enclosingMode === 'around'
                      ? dark ? 'border-indigo-500 bg-indigo-900 text-indigo-200' : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ↑ Wrap around
                </button>
              </div>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                {enclosingMode === 'inside'
                  ? 'Pick a tag below to nest it inside the existing tag'
                  : 'Pick a tag below to wrap it around the entire existing tag'}
              </p>
            </div>
          )}

          {/* Search */}
          <div className={`px-2 py-2 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
            <input
              autoFocus
              className={`w-full text-xs px-2 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${searchCls}`}
              placeholder="Search tags…"
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
            />
          </div>

          {/* Custom snippets section header */}
          {!tagSearch && ssml.snippets.length > 0 && (
            <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${mutedCls} ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              Custom
            </div>
          )}

          {/* Tag list */}
          <div className="overflow-y-auto flex-1">
            {filteredTags.length === 0 && (
              <p className={`text-xs text-center py-4 ${mutedCls}`}>No tags match "{tagSearch}"</p>
            )}

            {/* Separator between custom and built-in when not searching */}
            {!tagSearch && ssml.snippets.length > 0 && (() => {
              const customItems = filteredTags.filter(t => ssml.snippets.some(s => s.id === t.id))
              const builtInItems = filteredTags.filter(t => !ssml.snippets.some(s => s.id === t.id))
              return (
                <>
                  {customItems.map(tag => <TagRow key={tag.id} tag={tag} onApply={applyTag} dark={dark} menuItemHover={menuItemHover} codeCls={codeCls} textCls={textCls} mutedCls={mutedCls} isFav={favourites.includes(tag.id)} />)}
                  {builtInItems.length > 0 && (
                    <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${mutedCls} ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                      Built-in
                    </div>
                  )}
                  {builtInItems.map(tag => <TagRow key={tag.id} tag={tag} onApply={applyTag} dark={dark} menuItemHover={menuItemHover} codeCls={codeCls} textCls={textCls} mutedCls={mutedCls} isFav={favourites.includes(tag.id)} />)}
                </>
              )
            })()}

            {/* When searching or no custom snippets, flat list */}
            {(tagSearch || ssml.snippets.length === 0) && filteredTags.map(tag => (
              <TagRow key={tag.id} tag={tag} onApply={applyTag} dark={dark} menuItemHover={menuItemHover} codeCls={codeCls} textCls={textCls} mutedCls={mutedCls} isFav={favourites.includes(tag.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TagRow({ tag, onApply, dark, menuItemHover, codeCls, textCls, mutedCls, isFav }: {
  tag: SSMLSnippet
  onApply: (tag: string) => void
  dark: boolean
  menuItemHover: string
  codeCls: string
  textCls: string
  mutedCls: string
  isFav?: boolean
}) {
  return (
    <button
      key={tag.id}
      onClick={() => onApply(tag.tag)}
      className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors ${menuItemHover}`}
    >
      {isFav && <span className="text-yellow-400 shrink-0 text-xs mt-0.5">★</span>}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${textCls}`}>{tag.label}</p>
        {tag.description && <p className={`text-xs ${mutedCls} truncate`}>{tag.description}</p>}
      </div>
      <code className={`text-xs px-1.5 py-0.5 rounded font-mono shrink-0 max-w-[120px] truncate ${codeCls}`}>
        {tag.tag}
      </code>
    </button>
  )
}
