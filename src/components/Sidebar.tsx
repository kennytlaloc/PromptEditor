import React, { useState } from 'react'
import { Prompt } from '../types'

interface Props {
  prompts: Prompt[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  dark: boolean
  checkedIds: Set<string>
  onToggleChecked: (id: string) => void
  onToggleAll: (ids: string[], checked: boolean) => void
}

export default function Sidebar({ prompts, selectedId, onSelect, onDelete, dark, checkedIds, onToggleChecked, onToggleAll }: Props) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'date'>('date')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = prompts
    .filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.title.localeCompare(b.title)
        : b.updatedAt - a.updatedAt
    )

  const filteredIds = filtered.map(p => p.id)
  const allChecked = filteredIds.length > 0 && filteredIds.every(id => checkedIds.has(id))
  const someChecked = filteredIds.some(id => checkedIds.has(id))

  const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
  const itemBase = dark ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-100 border-gray-200'
  const itemSelected = dark ? 'bg-indigo-900 border-indigo-700' : 'bg-indigo-50 border-indigo-300'
  const inputCls = dark
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const textCls = dark ? 'text-gray-100' : 'text-gray-900'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  const headerBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'

  return (
    <aside className={`flex flex-col w-64 min-w-[200px] border-r h-full ${bg}`}>
      <div className="p-3 space-y-2 border-b border-inherit">
        <input
          className={`w-full text-sm px-2 py-1.5 rounded border ${inputCls} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          placeholder="Search prompts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {(['date', 'name'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`flex-1 text-xs py-1 rounded border transition-colors ${
                sort === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : dark
                    ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s === 'date' ? 'Recent' : 'A–Z'}
            </button>
          ))}
        </div>
      </div>

      {/* Select-all header */}
      <div className={`flex items-center gap-2 px-3 py-1.5 border-b text-xs font-medium ${mutedCls} ${headerBg}`}>
        <input
          type="checkbox"
          checked={allChecked}
          ref={el => { if (el) el.indeterminate = !allChecked && someChecked }}
          onChange={e => onToggleAll(filteredIds, e.target.checked)}
          className="accent-indigo-600 cursor-pointer"
        />
        <span>
          {checkedIds.size === 0 ? 'Select all' : `${checkedIds.size} selected`}
        </span>
      </div>

      <ul className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <li className={`px-3 py-4 text-sm text-center ${mutedCls}`}>
            {search ? 'No matches' : 'No prompts yet'}
          </li>
        )}
        {filtered.map(p => (
          <li
            key={p.id}
            className={`group flex items-start gap-2 px-3 py-2 border-b cursor-pointer transition-colors ${
              p.id === selectedId ? itemSelected : itemBase
            }`}
            onClick={() => onSelect(p.id)}
          >
            <input
              type="checkbox"
              checked={checkedIds.has(p.id)}
              onChange={e => { e.stopPropagation(); onToggleChecked(p.id) }}
              onClick={e => e.stopPropagation()}
              className="mt-0.5 accent-indigo-600 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${textCls}`}>{p.title}</p>
              <p className={`text-xs truncate ${mutedCls}`}>
                v{(p.versions ?? []).length} · {new Date(p.updatedAt).toLocaleDateString()}
              </p>
            </div>
            {confirmDelete === p.id ? (
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                  onClick={() => { onDelete(p.id); setConfirmDelete(null) }}
                >
                  Yes
                </button>
                <button
                  className={`text-xs ${mutedCls} hover:text-gray-700`}
                  onClick={() => setConfirmDelete(null)}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                className={`shrink-0 opacity-0 group-hover:opacity-100 text-xs ${mutedCls} hover:text-red-500 transition-opacity`}
                onClick={e => { e.stopPropagation(); setConfirmDelete(p.id) }}
                title="Delete"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}
