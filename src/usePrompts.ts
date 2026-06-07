import { useState, useEffect, useCallback, useRef } from 'react'
import { Prompt } from './types'

const MAX_RECENT = 5

const STORAGE_KEY = 'prompt-editor-prompts'

function load(): Prompt[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function save(prompts: Prompt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
}

function makeId() {
  return crypto.randomUUID()
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>(load)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(prompts), 500)
  }, [prompts])

  const addPrompt = useCallback((title: string, content: string): Prompt => {
    const now = Date.now()
    const p: Prompt = { id: makeId(), title, content, createdAt: now, updatedAt: now, versions: [] }
    setPrompts(prev => [p, ...prev])
    return p
  }, [])

  const updatePrompt = useCallback((id: string, changes: Partial<Pick<Prompt, 'title' | 'content'>>) => {
    setPrompts(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        // Snapshot the current state before applying changes.
        // Always preserve index 0 (the initial version); keep up to MAX_RECENT others.
        const snapshot = { title: p.title, content: p.content, savedAt: p.updatedAt }
        const existing = p.versions ?? []
        let versions: typeof existing
        if (existing.length === 0) {
          versions = [snapshot]
        } else {
          const initial = existing[0]
          const recent = [...existing.slice(1), snapshot].slice(-MAX_RECENT)
          versions = [initial, ...recent]
        }
        return { ...p, ...changes, updatedAt: Date.now(), versions }
      })
    )
  }, [])

  const deletePrompt = useCallback((id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id))
  }, [])

  return { prompts, addPrompt, updatePrompt, deletePrompt }
}
