import React, { useState, useEffect, useRef } from 'react'
import { usePrompts } from './usePrompts'
import { useSpeech } from './useSpeech'
import { AppConfig, DEFAULT_CONFIG } from './config'
import { synthesizeSpeech, synthesizeSpeechWav, POLLY_VOICES, getEngineForVoice } from './polly'
import { computeDiff } from './diff'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import PlaybackPanel from './components/PlaybackPanel'
import ImportModal, { ParsedPrompt } from './components/ImportModal'
import ConfigPanel from './components/ConfigPanel'

const CONFIG_KEY = 'prompt-editor-config'

function loadConfig(): AppConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}')
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      speechEngine: {
        ...DEFAULT_CONFIG.speechEngine,
        ...(saved.speechEngine ?? {}),
        enabledEngines: saved.speechEngine?.enabledEngines ?? DEFAULT_CONFIG.speechEngine.enabledEngines,
        amazon: { ...DEFAULT_CONFIG.speechEngine.amazon, ...(saved.speechEngine?.amazon ?? {}), language: saved.speechEngine?.amazon?.language ?? DEFAULT_CONFIG.speechEngine.amazon.language, engineType: saved.speechEngine?.amazon?.engineType ?? DEFAULT_CONFIG.speechEngine.amazon.engineType },
        google: { ...DEFAULT_CONFIG.speechEngine.google, ...(saved.speechEngine?.google ?? {}) },
        elevenlabs: { ...DEFAULT_CONFIG.speechEngine.elevenlabs, ...(saved.speechEngine?.elevenlabs ?? {}) },
      },
      ssml: { ...DEFAULT_CONFIG.ssml, ...(saved.ssml ?? {}), favourites: saved.ssml?.favourites ?? [] },
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

type Tab = 'editor' | 'config'

export default function App() {
  const { prompts, addPrompt, updatePrompt, deletePrompt } = usePrompts()
  const speech = useSpeech()

  const [config, setConfig] = useState<AppConfig>(loadConfig)
  const [dark, setDark] = useState(config.defaultDark)
  const [tab, setTab] = useState<Tab>('editor')
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const stored = JSON.parse(localStorage.getItem('prompt-editor-prompts') || '[]')
    return stored[0]?.id ?? null
  })
  const [showImport, setShowImport] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    const stored: any[] = JSON.parse(localStorage.getItem('prompt-editor-prompts') || '[]')
    const firstId = stored[0]?.id
    return firstId ? new Set([firstId]) : new Set()
  })
  // Tab order tracks the display order of checked prompt tabs
  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    const stored: any[] = JSON.parse(localStorage.getItem('prompt-editor-prompts') || '[]')
    return stored[0]?.id ? [stored[0].id] : []
  })
  const dragTabRef = useRef<string | null>(null)

  // Polly playback state
  const pollyAudioRef = useRef<HTMLAudioElement | null>(null)
  const [pollyPlayState, setPollyPlayState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [pollyError, setPollyError] = useState<string | null>(null)
  const [downloadState, setDownloadState] = useState<'idle' | 'loading'>('idle')
  const [playAllState, setPlayAllState] = useState<'idle' | 'playing'>('idle')
  const [playAllIndex, setPlayAllIndex] = useState<number>(0)
  const stopAllRef = useRef(false)

  // Variable substitutions set by the Editor's Variables panel
  const [editorVarValues, setEditorVarValues] = useState<Record<string, string>>({})
  const [editorVarSkipped, setEditorVarSkipped] = useState<Record<string, boolean>>({})

  /** Apply $variable → assigned value substitution (honours skip switches) */
  const applyEditorVars = (content: string): string =>
    content.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) =>
      (!editorVarSkipped[name] && editorVarValues[name]) ? editorVarValues[name] : match
    )

  const playPolly = async (text: string) => {
    const { accessKeyId, secretAccessKey, region, voiceId } = config.speechEngine.amazon
    if (!accessKeyId || !secretAccessKey) {
      setPollyError('Amazon Polly credentials are not configured. Go to Configuration → Speech Engine.')
      return
    }
    setPollyError(null)
    setPollyPlayState('playing')
    try {
      const voice = POLLY_VOICES.find(v => v.id === voiceId)
      const engine = voice ? getEngineForVoice(voice, region) : 'standard'
      const audioBuffer = await synthesizeSpeech({ text, voiceId, engine, region, accessKeyId, secretAccessKey })
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      pollyAudioRef.current = audio
      audio.onended = () => { setPollyPlayState('idle'); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPollyPlayState('idle'); URL.revokeObjectURL(url) }
      await audio.play()
    } catch (err: any) {
      setPollyPlayState('idle')
      setPollyError(err.message ?? 'Polly playback failed.')
    }
  }

  const stopPolly = () => {
    if (pollyAudioRef.current) { pollyAudioRef.current.pause(); pollyAudioRef.current = null }
    setPollyPlayState('idle')
  }

  const pausePolly = () => {
    pollyAudioRef.current?.pause()
    setPollyPlayState('paused')
  }

  const resumePolly = () => {
    pollyAudioRef.current?.play()
    setPollyPlayState('playing')
  }

  const downloadWav = async () => {
    if (!selectedPrompt?.content) return
    const { accessKeyId, secretAccessKey, region, voiceId } = config.speechEngine.amazon
    if (!accessKeyId || !secretAccessKey) {
      setPollyError('Amazon Polly credentials are not configured. Go to Configuration → Speech Engine.')
      return
    }
    setDownloadState('loading')
    setPollyError(null)
    try {
      const voice = POLLY_VOICES.find(v => v.id === voiceId)
      const engine = voice ? getEngineForVoice(voice, region) : 'standard'
      const text = getPlaybackContent(applyEditorVars(selectedPrompt.content), 'amazon')
      const wavBuffer = await synthesizeSpeechWav({ text, voiceId, engine, region, accessKeyId, secretAccessKey })
      const blob = new Blob([wavBuffer], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedPrompt.title.replace(/[^a-z0-9_-]/gi, '_') || 'prompt'}.wav`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setPollyError(err.message ?? 'WAV download failed.')
    } finally {
      setDownloadState('idle')
    }
  }

  const playAll = async () => {
    const orderedIds = tabOrder.filter(id => checkedIds.has(id))
    const orderedPrompts = orderedIds.map(id => prompts.find(p => p.id === id)).filter(Boolean) as typeof prompts
    if (orderedPrompts.length < 2) return

    stopAllRef.current = false
    setPlayAllState('playing')
    setPollyError(null)

    for (let i = 0; i < orderedPrompts.length; i++) {
      if (stopAllRef.current) break
      const p = orderedPrompts[i]
      setSelectedId(p.id)
      setPlayAllIndex(i)

      const engine = config.speechEngine.engine
      const content = getPlaybackContent(applyEditorVars(p.content), engine)

      await new Promise<void>(resolve => {
        if (engine === 'amazon') {
          const { accessKeyId, secretAccessKey, region, voiceId } = config.speechEngine.amazon
          if (!accessKeyId || !secretAccessKey) { resolve(); return }
          const voice = POLLY_VOICES.find(v => v.id === voiceId)
          const engineType = voice ? getEngineForVoice(voice, region) : 'standard'
          setPollyPlayState('playing')
          synthesizeSpeech({ text: content, voiceId, engine: engineType, region, accessKeyId, secretAccessKey })
            .then(buf => {
              if (stopAllRef.current) { resolve(); return }
              const blob = new Blob([buf], { type: 'audio/mpeg' })
              const url = URL.createObjectURL(blob)
              const audio = new Audio(url)
              pollyAudioRef.current = audio
              audio.onended = () => { setPollyPlayState('idle'); URL.revokeObjectURL(url); resolve() }
              audio.onerror = () => { setPollyPlayState('idle'); URL.revokeObjectURL(url); resolve() }
              audio.play()
            })
            .catch(() => { setPollyPlayState('idle'); resolve() })
        } else {
          speech.play(content)
          // Browser TTS: estimate completion or wait briefly, then move on
          const words = content.split(/\s+/).length
          const ms = Math.max(1500, words * 400)
          setTimeout(resolve, ms)
        }
      })

      if (stopAllRef.current) break
    }

    setPlayAllState('idle')
    setPollyPlayState('idle')
  }

  const stopAll = () => {
    stopAllRef.current = true
    if (pollyAudioRef.current) { pollyAudioRef.current.pause(); pollyAudioRef.current = null }
    speech.stop()
    setPollyPlayState('idle')
    setPlayAllState('idle')
  }

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  }, [config])

  const handleConfigChange = (changes: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...changes }))
    if ('defaultDark' in changes) setDark(!!changes.defaultDark)
    if ('defaultRate' in changes) speech.setRate(changes.defaultRate!)
    if ('defaultPitch' in changes) speech.setPitch(changes.defaultPitch!)
    if ('defaultVoice' in changes) speech.setSelectedVoice(changes.defaultVoice!)
  }

  const selectedPrompt = prompts.find(p => p.id === selectedId) ?? null

  // Prepare content for playback: wrap in <speak> when SSML is enabled (Polly/cloud engines),
  // or strip SSML tags for browser TTS which doesn't support them.
  const getPlaybackContent = (raw: string, engine: string): string => {
    if (!config.ssml.enabled) return raw
    if (engine === 'browser') {
      // Strip all XML tags so Web Speech API gets clean text
      return raw.replace(/<[^>]+>/g, '')
    }
    // Cloud engines: wrap in <speak> if not already wrapped
    const trimmed = raw.trim()
    if (trimmed.startsWith('<speak>') && trimmed.endsWith('</speak>')) return trimmed
    return `<speak>${trimmed}</speak>`
  }

  const handleSelect = (id: string) => {
    speech.stop()
    setSelectedId(id)
    setCheckedIds(prev => { const next = new Set(prev); next.add(id); return next })
    setTabOrder(o => o.includes(id) ? o : [...o, id])
  }

  const handleDelete = (id: string) => {
    deletePrompt(id)
    if (selectedId === id) {
      setSelectedId(prompts.filter(p => p.id !== id)[0]?.id ?? null)
    }
  }

  const handleImport = (prompts: ParsedPrompt[]) => {
    let lastId: string | null = null
    for (const { title, content } of prompts) {
      const p = addPrompt(title, content)
      lastId = p.id
    }
    if (lastId) setSelectedId(lastId)
    setTab('editor')
  }

  const appBg = dark ? 'bg-gray-900' : 'bg-white'
  const headerBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textCls = dark ? 'text-gray-100' : 'text-gray-900'

  const navTab = (id: Tab, label: string) => {
    const active = tab === id
    return (
      <button
        key={id}
        onClick={() => setTab(id)}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          active
            ? 'border-indigo-600 text-indigo-600'
            : dark
              ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className={`flex flex-col h-screen ${appBg}`}>
      <header className={`flex items-center px-4 border-b shrink-0 ${headerBg}`}>
        <h1 className={`text-base font-bold tracking-tight mr-6 py-2 ${textCls}`}>
          Prompt<span className="text-indigo-600">Editor</span>
        </h1>
        <nav className="flex items-end gap-1 h-full">
          {navTab('editor', 'Editor')}
          {navTab('config', 'Configuration')}
        </nav>
        <div className="flex items-center gap-2 ml-auto py-2">
          {tab === 'editor' && (
            <>
              <button
                onClick={() => setShowImport(true)}
                className="text-sm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors"
              >
                + Import
              </button>
              <button
                disabled={checkedIds.size === 0}
                onClick={() => {
                  const escapeCsv = (s: string) => `"${s.replace(/"/g, '""')}"`
                  const header = 'Prompt Name,Prompt Text,Previous Version,Differences'
                  const rows = prompts
                    .filter(p => checkedIds.has(p.id))
                    .map(p => {
                      const v1Content = (p.versions ?? [])[0]?.content ?? ''
                      const diff = v1Content ? computeDiff(v1Content, p.content) : '(no previous version)'
                      return [p.title, p.content, v1Content, diff].map(escapeCsv).join(',')
                    })
                  const csv = `${header}\n${rows.join('\n')}`
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = checkedIds.size === 1
                    ? `${prompts.find(p => checkedIds.has(p.id))?.title.replace(/[^a-z0-9_-]/gi, '_') || 'prompt'}.csv`
                    : 'prompts.csv'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className={`text-sm px-3 py-1.5 rounded border font-medium transition-colors disabled:opacity-40 ${
                  dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                ↓ Export
              </button>
            </>
          )}
          <button
            onClick={() => { const d = !dark; setDark(d); setConfig(c => ({ ...c, defaultDark: d })) }}
            className={`text-sm px-3 py-1.5 rounded border transition-colors ${
              dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {dark ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
      </header>

      {tab === 'editor' ? (
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar
            prompts={prompts} selectedId={selectedId}
            onSelect={handleSelect} onDelete={handleDelete} dark={dark}
            checkedIds={checkedIds}
            onToggleChecked={id => {
              setCheckedIds(prev => {
                const next = new Set(prev)
                if (next.has(id)) {
                  next.delete(id)
                  setTabOrder(o => o.filter(x => x !== id))
                } else {
                  next.add(id)
                  setTabOrder(o => o.includes(id) ? o : [...o, id])
                }
                return next
              })
            }}
            onToggleAll={(ids, checked) => {
              setCheckedIds(prev => {
                const next = new Set(prev)
                ids.forEach(id => checked ? next.add(id) : next.delete(id))
                return next
              })
              if (checked) {
                setTabOrder(o => {
                  const existing = new Set(o)
                  return [...o, ...ids.filter(id => !existing.has(id))]
                })
              } else {
                const removing = new Set(ids)
                setTabOrder(o => o.filter(id => !removing.has(id)))
              }
            }}
          />
          {/* Editor area with tabs for each checked prompt */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Tab bar — only shown when more than one prompt is checked */}
            {checkedIds.size > 1 && (
              <div className={`flex items-end gap-0 border-b overflow-x-auto shrink-0 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                {tabOrder
                  .filter(id => checkedIds.has(id))
                  .map(id => {
                    const p = prompts.find(x => x.id === id)
                    if (!p) return null
                    const isActive = p.id === selectedId
                    return (
                      <button
                        key={p.id}
                        draggable
                        onDragStart={() => { dragTabRef.current = p.id }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault()
                          const from = dragTabRef.current
                          if (!from || from === p.id) return
                          setTabOrder(o => {
                            const next = [...o]
                            const fi = next.indexOf(from)
                            const ti = next.indexOf(p.id)
                            if (fi === -1 || ti === -1) return o
                            next.splice(fi, 1)
                            next.splice(ti, 0, from)
                            return next
                          })
                          dragTabRef.current = null
                        }}
                        onClick={() => handleSelect(p.id)}
                        title={`${p.title} — drag to reorder`}
                        className={`relative flex items-center gap-2 px-4 py-2 text-xs font-medium whitespace-nowrap border-r transition-colors max-w-[180px] cursor-grab active:cursor-grabbing select-none ${
                          dark ? 'border-gray-700' : 'border-gray-200'
                        } ${
                          isActive
                            ? dark
                              ? 'bg-gray-900 text-gray-100 border-b-2 border-b-indigo-500'
                              : 'bg-white text-gray-900 border-b-2 border-b-indigo-600'
                            : dark
                              ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        <span className="truncate">{p.title}</span>
                        <span className={`shrink-0 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                          v{(p.versions ?? []).length}
                        </span>
                      </button>
                    )
                  })}
              </div>
            )}
            <Editor
              prompt={selectedPrompt}
              activeSentence={speech.activeSentence}
              onUpdate={updatePrompt}
              onPlayContent={content => {
                const engine = config.speechEngine.engine
                const prepared = getPlaybackContent(applyEditorVars(content), engine)
                if (engine === 'amazon') playPolly(prepared)
                else speech.play(prepared)
              }}
              onVarsChange={(values, skipped) => {
                setEditorVarValues(values)
                setEditorVarSkipped(skipped)
              }}
              dark={dark}
              ssml={config.ssml}
            />
          </div>
          {pollyError && (
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 max-w-md w-full mx-4 px-4 py-3 rounded-lg shadow-lg text-sm z-50 ${dark ? 'bg-red-900 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <div className="flex items-start gap-2">
                <span className="shrink-0">⚠</span>
                <span className="flex-1">{pollyError}</span>
                <button onClick={() => setPollyError(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
              </div>
            </div>
          )}
          <PlaybackPanel
            supported={speech.supported} voices={speech.voices}
            selectedVoice={speech.selectedVoice} onVoiceChange={speech.setSelectedVoice}
            playState={config.speechEngine.engine === 'amazon' ? pollyPlayState : speech.playState}
            onPlay={() => {
              if (!selectedPrompt?.content) return
              const engine = config.speechEngine.engine
              const content = getPlaybackContent(applyEditorVars(selectedPrompt.content), engine)
              if (engine === 'amazon') playPolly(content)
              else speech.play(content)
            }}
            onPause={config.speechEngine.engine === 'amazon' ? pausePolly : speech.pause}
            onResume={config.speechEngine.engine === 'amazon' ? resumePolly : speech.resume}
            onStop={config.speechEngine.engine === 'amazon' ? stopPolly : speech.stop}
            hasContent={!!selectedPrompt?.content} dark={dark}
            activeEngine={config.speechEngine.engine}
            activeEngineVoiceLabel={
              config.speechEngine.engine === 'amazon' ? config.speechEngine.amazon.voiceId :
              config.speechEngine.engine === 'google' ? config.speechEngine.google.voiceName :
              config.speechEngine.engine === 'elevenlabs' ? config.speechEngine.elevenlabs.voiceId :
              ''
            }
            engineDetails={(() => {
              const eng = config.speechEngine.engine
              if (eng === 'amazon') {
                const { region, voiceId, language, engineType } = config.speechEngine.amazon
                const voice = POLLY_VOICES.find(v => v.id === voiceId)
                return {
                  region,
                  language,
                  engineType: engineType ? engineType.charAt(0).toUpperCase() + engineType.slice(1) : undefined,
                  voice: voice ? `${voice.name} (${voice.gender === 'Female' ? '♀' : '♂'})` : voiceId,
                }
              }
              if (eng === 'google') return { voice: config.speechEngine.google.voiceName, language: config.speechEngine.google.languageCode }
              if (eng === 'elevenlabs') return { voice: config.speechEngine.elevenlabs.voiceId }
              return {}
            })()}
            onGoToSettings={() => setTab('config')}
            onDownload={config.speechEngine.engine === 'amazon' ? downloadWav : undefined}
            downloadState={downloadState}
            tabCount={tabOrder.filter(id => checkedIds.has(id)).length}
            onPlayAll={playAll}
            onStopAll={stopAll}
            playAllState={playAllState}
            playAllIndex={playAllIndex}
          />
        </div>
      ) : (
        <ConfigPanel config={config} voices={speech.voices} onChange={handleConfigChange} dark={dark} />
      )}

      {showImport && (
        <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} dark={dark} />
      )}
    </div>
  )
}
