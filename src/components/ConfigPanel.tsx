import React, { useState } from 'react'
import { AppConfig, SpeechEngineConfig, SSMLConfig, EngineId, VariableSyntaxConfig } from '../config'
import {
  POLLY_REGIONS, POLLY_VOICES, POLLY_LANGUAGES, POLLY_ENGINE_TYPES,
  getVoicesFiltered, getEngineForVoice, PollyEngine,
} from '../polly'

import SSMLSection from './SSMLSection'

interface Props {
  config: AppConfig
  voices: SpeechSynthesisVoice[]
  onChange: (c: Partial<AppConfig>) => void
  dark: boolean
}

type Engine = SpeechEngineConfig['engine']

const ENGINE_LABELS: Record<Engine, string> = {
  browser: 'Browser (Web Speech API)',
  amazon: 'Amazon Polly',
  google: 'Google Cloud TTS',
  elevenlabs: 'ElevenLabs',
}

const ENGINE_DESCRIPTIONS: Record<Engine, string> = {
  browser: 'Free, built-in, no API key required. Voice quality varies by OS.',
  amazon: 'High-quality neural voices via AWS Polly. Requires an AWS account.',
  google: 'Natural neural voices via Google Cloud Text-to-Speech.',
  elevenlabs: 'Ultra-realistic AI voices. Requires an ElevenLabs account.',
}

function MaskedInput({
  label, value, onChange, placeholder, dark,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; dark: boolean
}) {
  const [show, setShow] = useState(false)
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  return (
    <div>
      <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={`w-full text-sm px-3 py-1.5 pr-16 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${inputCls}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${mutedCls} hover:text-indigo-500`}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}

function PlainInput({
  label, value, onChange, placeholder, dark,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; dark: boolean
}) {
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  return (
    <div>
      <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>{label}</label>
      <input
        type="text"
        className={`w-full text-sm px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputCls}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default function ConfigPanel({ config, voices, onChange, dark }: Props) {
  const [amazonCredMode, setAmazonCredMode] = React.useState<'manual' | 'upload'>('manual')
  const [credExpanded, setCredExpanded] = React.useState(false)
  const [csvError, setCsvError] = React.useState<string | null>(null)
  const [csvSuccess, setCsvSuccess] = React.useState(false)

  // Draft state for Amazon Polly card (Save/Cancel flow)
  const [amazonDraft, setAmazonDraft] = React.useState(config.speechEngine.amazon)
  const [amazonDirty, setAmazonDirty] = React.useState(false)
  // Sync draft when config changes externally (e.g. CSV upload)
  React.useEffect(() => {
    if (!amazonDirty) setAmazonDraft(config.speechEngine.amazon)
  }, [config.speechEngine.amazon, amazonDirty])

  const patchDraft = (patch: Partial<typeof amazonDraft>) => {
    setAmazonDraft(d => ({ ...d, ...patch }))
    setAmazonDirty(true)
  }

  const saveAmazon = () => {
    updateAmazon(amazonDraft)
    setAmazonDirty(false)
  }

  const cancelAmazon = () => {
    setAmazonDraft(config.speechEngine.amazon)
    setAmazonDirty(false)
  }

  // Voice filter state — kept in draft so Save/Cancel apply to them too
  const voiceLang   = amazonDraft.language   ?? 'English (US)'
  const voiceEngine = (amazonDraft.engineType ?? 'neural') as PollyEngine
  const setVoiceLang   = (v: string)       => patchDraft({ language: v })
  const setVoiceEngine = (v: PollyEngine)  => patchDraft({ engineType: v })

  const handleCredentialsCsv = (file: File) => {
    setCsvError(null)
    setCsvSuccess(false)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) ?? ''
        const lines = text.trim().split(/\r?\n/)
        // Expect header row then one data row
        if (lines.length < 2) throw new Error('File must have a header row and at least one data row.')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const keyIdx = headers.findIndex(h => h.includes('access key id'))
        const secretIdx = headers.findIndex(h => h.includes('secret access key'))
        if (keyIdx === -1 || secretIdx === -1) throw new Error('Could not find "Access key ID" and "Secret access key" columns.')
        const values = lines[1].split(',').map(v => v.trim())
        const accessKeyId = values[keyIdx] ?? ''
        const secretAccessKey = values[secretIdx] ?? ''
        if (!accessKeyId || !secretAccessKey) throw new Error('Credentials row appears empty.')
        patchDraft({ accessKeyId, secretAccessKey })
        setCsvSuccess(true)
        setAmazonCredMode('manual')
      } catch (err: any) {
        setCsvError(err.message ?? 'Failed to parse credentials file.')
      }
    }
    reader.readAsText(file)
  }

  const bg = dark ? 'bg-gray-800' : 'bg-white'
  const cardBg = dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
  const textCls = dark ? 'text-gray-100' : 'text-gray-900'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-gray-100'
    : 'bg-white border-gray-300 text-gray-900'
  const selectCls = dark
    ? 'bg-gray-700 border-gray-600 text-gray-100'
    : 'bg-white border-gray-300 text-gray-900'

  const updateSSML = (patch: Partial<SSMLConfig>) => {
    onChange({ ssml: { ...config.ssml, ...patch } })
  }

  const updateEngine = (patch: Partial<SpeechEngineConfig>) => {
    onChange({ speechEngine: { ...config.speechEngine, ...patch } })
  }

  const toggleEngineEnabled = (id: EngineId) => {
    const current = config.speechEngine.enabledEngines
    const isEnabled = current.includes(id)
    // Must keep at least one engine enabled
    if (isEnabled && current.length === 1) return
    const next = isEnabled ? current.filter(e => e !== id) : [...current, id]
    // If we're disabling the active engine, switch to the first remaining enabled one
    const newActive =
      config.speechEngine.engine === id && isEnabled
        ? next[0]
        : config.speechEngine.engine
    updateEngine({ enabledEngines: next, engine: newActive })
  }

  const updateAmazon = (patch: Partial<SpeechEngineConfig['amazon']>) => {
    updateEngine({ amazon: { ...config.speechEngine.amazon, ...patch } })
  }

  const updateGoogle = (patch: Partial<SpeechEngineConfig['google']>) => {
    updateEngine({ google: { ...config.speechEngine.google, ...patch } })
  }

  const updateElevenLabs = (patch: Partial<SpeechEngineConfig['elevenlabs']>) => {
    updateEngine({ elevenlabs: { ...config.speechEngine.elevenlabs, ...patch } })
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className={`rounded-lg border p-5 space-y-4 ${cardBg}`}>
      <h3 className={`text-sm font-semibold uppercase tracking-wide ${mutedCls}`}>{title}</h3>
      {children}
    </div>
  )

  const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className={`text-sm font-medium ${textCls}`}>{label}</p>
        {hint && <p className={`text-xs mt-0.5 ${mutedCls}`}>{hint}</p>}
      </div>
      {children}
    </div>
  )

  const activeEngine = config.speechEngine.engine

  return (
    <div className={`flex-1 overflow-y-auto ${bg}`}>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className={`text-xl font-bold ${textCls}`}>Configuration</h2>
          <p className={`text-sm mt-1 ${mutedCls}`}>Adjust defaults and preferences. Changes are saved automatically.</p>
        </div>

        {/* Appearance */}
        <Section title="Appearance">
          <Row label="Dark mode" hint="Toggle the dark color scheme">
            <button
              onClick={() => onChange({ defaultDark: !config.defaultDark })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                config.defaultDark ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                config.defaultDark ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </Row>
        </Section>

        {/* Speech Engine */}
        <Section title="Speech Engine">
          {/* Engine cards with enable toggles */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ENGINE_LABELS) as Engine[]).map(e => {
              const isEnabled = config.speechEngine.enabledEngines.includes(e)
              const isActive = activeEngine === e
              const isOnlyEnabled = config.speechEngine.enabledEngines.length === 1 && isEnabled
              return (
                <div
                  key={e}
                  className={`rounded-lg border text-sm transition-colors ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : !isEnabled
                        ? dark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-100/60'
                        : dark ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  {/* Card header row: label + enable toggle */}
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1 gap-2">
                    <button
                      disabled={!isEnabled}
                      onClick={() => isEnabled && updateEngine({ engine: e })}
                      className={`flex items-center gap-2 flex-1 min-w-0 text-left ${
                        isActive
                          ? 'text-indigo-700'
                          : !isEnabled
                            ? dark ? 'text-gray-600' : 'text-gray-400'
                            : dark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive ? 'bg-indigo-500' : isEnabled ? dark ? 'bg-gray-500' : 'bg-gray-300' : 'bg-gray-200'
                      }`} />
                      <span className={`font-medium text-xs truncate ${!isEnabled ? 'line-through' : ''}`}>
                        {ENGINE_LABELS[e]}
                      </span>
                    </button>

                    {/* Enable/disable toggle */}
                    <button
                      onClick={() => toggleEngineEnabled(e)}
                      disabled={isOnlyEnabled}
                      title={isOnlyEnabled ? 'At least one engine must stay enabled' : isEnabled ? 'Disable engine' : 'Enable engine'}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 ${
                        isOnlyEnabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                      } ${isEnabled
                        ? isActive ? 'bg-indigo-500' : 'bg-gray-400'
                        : dark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                        isEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* "Set active" link shown only when enabled but not active */}
                  {isEnabled && !isActive && (
                    <button
                      onClick={() => updateEngine({ engine: e })}
                      className={`w-full text-left px-3 pb-2 text-xs ${dark ? 'text-gray-500 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-600'} transition-colors`}
                    >
                      Set as active →
                    </button>
                  )}
                  {isActive && (
                    <p className={`px-3 pb-2 text-xs ${dark ? 'text-indigo-400' : 'text-indigo-500'}`}>Active</p>
                  )}
                  {!isEnabled && (
                    <p className={`px-3 pb-2 text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Disabled</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Description */}
          <p className={`text-xs px-1 ${mutedCls}`}>{ENGINE_DESCRIPTIONS[activeEngine]}</p>

          {/* Browser — no extra config needed */}
          {activeEngine === 'browser' && (
            <div>
              <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>Default voice</label>
              <select
                className={`w-full text-sm px-2 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectCls}`}
                value={config.defaultVoice}
                onChange={e => onChange({ defaultVoice: e.target.value })}
              >
                {voices.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
          )}

          {/* Amazon Polly */}
          {activeEngine === 'amazon' && (
            <div className="space-y-4">

              {/* ── Credentials ─────────────────────────────────────────────── */}
              <div className={`rounded-lg border ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* Collapsible header */}
                <button
                  type="button"
                  onClick={() => setCredExpanded(e => !e)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors rounded-lg ${
                    dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${mutedCls}`}>Credentials</span>
                    {amazonDraft.accessKeyId && !credExpanded && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${dark ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-700'}`}>
                        ✓ configured
                      </span>
                    )}
                    {!amazonDraft.accessKeyId && !credExpanded && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${dark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
                        not set
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${mutedCls}`}>{credExpanded ? '▲' : '▼'}</span>
                </button>

                {credExpanded && (
                  <div className={`px-3 pb-3 space-y-3 border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="pt-3" />
                    {/* Credential mode toggle */}
                    <div className={`flex rounded-lg border overflow-hidden text-xs font-medium ${dark ? 'border-gray-600' : 'border-gray-200'}`}>
                      {(['manual', 'upload'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => { setAmazonCredMode(mode); setCsvError(null); setCsvSuccess(false) }}
                          className={`flex-1 py-1.5 transition-colors ${
                            amazonCredMode === mode
                              ? 'bg-indigo-600 text-white'
                              : dark ? 'bg-gray-800 text-gray-400 hover:text-gray-200' : 'bg-white text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {mode === 'manual' ? 'Manual entry' : 'Upload CSV'}
                        </button>
                      ))}
                    </div>

                    {amazonCredMode === 'upload' ? (
                      <div>
                        <label
                          className={`flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
                            dark ? 'border-gray-600 hover:border-indigo-500 text-gray-400' : 'border-gray-300 hover:border-indigo-400 text-gray-500'
                          }`}
                        >
                          <span className="text-2xl">📄</span>
                          <span className="text-xs text-center">
                            Drop your <strong>credentials.csv</strong> here or click to browse
                          </span>
                          <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                            AWS IAM → Users → Security credentials → Create access key → Download .csv
                          </span>
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            className="sr-only"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleCredentialsCsv(f) }}
                          />
                        </label>
                        {csvError && (
                          <p className="mt-2 text-xs text-red-500">{csvError}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        {csvSuccess && (
                          <p className={`text-xs px-3 py-2 rounded-lg ${dark ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-700'}`}>
                            ✓ Credentials loaded from CSV file.
                          </p>
                        )}
                        <MaskedInput
                          label="Access Key ID"
                          value={amazonDraft.accessKeyId}
                          onChange={v => patchDraft({ accessKeyId: v })}
                          placeholder="AKIAIOSFODNN7EXAMPLE"
                          dark={dark}
                        />
                        <MaskedInput
                          label="Secret Access Key"
                          value={amazonDraft.secretAccessKey}
                          onChange={v => patchDraft({ secretAccessKey: v })}
                          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                          dark={dark}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ── Voice Settings ───────────────────────────────────────────── */}
              <div className={`pt-3 border-t space-y-3 ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${mutedCls}`}>Voice Settings</p>

              {/* Region dropdown */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>AWS Region</label>
                <select
                  className={`w-full text-sm px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectCls}`}
                  value={amazonDraft.region}
                  onChange={e => {
                    const newRegion = e.target.value
                    const available = getVoicesFiltered(newRegion, voiceLang, voiceEngine)
                    const stillValid = available.some(v => v.id === amazonDraft.voiceId)
                    patchDraft({ region: newRegion, ...(stillValid ? {} : { voiceId: available[0]?.id ?? '' }) })
                  }}
                >
                  {POLLY_REGIONS.map(r => (
                    <option key={r.id} value={r.id}>{r.label} ({r.id})</option>
                  ))}
                </select>
              </div>

              {/* Language filter */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>Language</label>
                <select
                  className={`w-full text-sm px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectCls}`}
                  value={voiceLang}
                  onChange={e => {
                    const lang = e.target.value
                    let eng = voiceEngine
                    if (getVoicesFiltered(amazonDraft.region, lang, eng).length === 0) {
                      const fallback = POLLY_ENGINE_TYPES.find(et =>
                        getVoicesFiltered(amazonDraft.region, lang, et.id).length > 0
                      )
                      if (fallback) eng = fallback.id
                    }
                    const available = getVoicesFiltered(amazonDraft.region, lang, eng)
                    const keepCurrent = available.some(v => v.id === amazonDraft.voiceId)
                    patchDraft({
                      language: lang,
                      engineType: eng,
                      ...(keepCurrent ? {} : { voiceId: available[0]?.id ?? '' }),
                    })
                  }}
                >
                  {POLLY_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Engine type filter — only show types with voices available */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>Engine type</label>
                <select
                  className={`w-full text-sm px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectCls}`}
                  value={voiceEngine}
                  onChange={e => {
                    const eng = e.target.value as PollyEngine
                    const available = getVoicesFiltered(amazonDraft.region, voiceLang, eng)
                    const keepCurrent = available.some(v => v.id === amazonDraft.voiceId)
                    patchDraft({
                      engineType: eng,
                      ...(keepCurrent ? {} : { voiceId: available[0]?.id ?? '' }),
                    })
                  }}
                >
                  {POLLY_ENGINE_TYPES.filter(et =>
                    getVoicesFiltered(amazonDraft.region, voiceLang, et.id).length > 0
                  ).map(et => (
                    <option key={et.id} value={et.id}>{et.label} — {et.description}</option>
                  ))}
                </select>
              </div>

              {/* Voice dropdown filtered by language + engine */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedCls}`}>Voice</label>
                {(() => {
                  const voices = getVoicesFiltered(amazonDraft.region, voiceLang, voiceEngine)
                  if (voices.length === 0) {
                    return (
                      <p className={`text-xs px-3 py-2 rounded-lg ${dark ? 'bg-gray-800 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
                        No voices available for {voiceLang} with {voiceEngine} engine in this region.
                      </p>
                    )
                  }
                  return (
                    <>
                      <select
                        className={`w-full text-sm px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectCls}`}
                        value={amazonDraft.voiceId}
                        onChange={e => patchDraft({ voiceId: e.target.value })}
                      >
                        {voices.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.gender === 'Female' ? '♀' : '♂'})
                          </option>
                        ))}
                      </select>
                      <p className={`mt-1 text-xs ${mutedCls}`}>
                        {(() => {
                          const v = POLLY_VOICES.find(x => x.id === amazonDraft.voiceId)
                          const eng = v ? getEngineForVoice(v, amazonDraft.region, voiceEngine) : null
                          return v ? `${v.language} · ${v.gender} · ${eng} engine` : null
                        })()}
                      </p>
                    </>
                  )
                })()}
              </div>

              </div>{/* end Voice Settings */}

              {/* Save / Cancel */}
              <div className={`flex items-center justify-between pt-1 border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                <a
                  href="https://docs.aws.amazon.com/polly/latest/dg/voicelist.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-500 hover:underline"
                >
                  View all Polly voices ↗
                </a>
                <div className="flex gap-2">
                  <button
                    disabled={!amazonDirty}
                    onClick={cancelAmazon}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-30 ${
                      dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!amazonDirty}
                    onClick={saveAmazon}
                    className="text-xs px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white font-medium transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Google Cloud TTS */}
          {activeEngine === 'google' && (
            <div className="space-y-3">
              <MaskedInput
                label="API Key"
                value={config.speechEngine.google.apiKey}
                onChange={v => updateGoogle({ apiKey: v })}
                placeholder="AIzaSy…"
                dark={dark}
              />
              <PlainInput
                label="Language Code"
                value={config.speechEngine.google.languageCode}
                onChange={v => updateGoogle({ languageCode: v })}
                placeholder="en-US"
                dark={dark}
              />
              <PlainInput
                label="Voice Name"
                value={config.speechEngine.google.voiceName}
                onChange={v => updateGoogle({ voiceName: v })}
                placeholder="en-US-Neural2-F"
                dark={dark}
              />
              <a
                href="https://cloud.google.com/text-to-speech/docs/voices"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-indigo-500 hover:underline"
              >
                View available Google voices ↗
              </a>
            </div>
          )}

          {/* ElevenLabs */}
          {activeEngine === 'elevenlabs' && (
            <div className="space-y-3">
              <MaskedInput
                label="API Key"
                value={config.speechEngine.elevenlabs.apiKey}
                onChange={v => updateElevenLabs({ apiKey: v })}
                placeholder="sk_…"
                dark={dark}
              />
              <PlainInput
                label="Voice ID"
                value={config.speechEngine.elevenlabs.voiceId}
                onChange={v => updateElevenLabs({ voiceId: v })}
                placeholder="21m00Tcm4TlvDq8ikWAM"
                dark={dark}
              />
              <a
                href="https://elevenlabs.io/docs/api-reference/get-voices"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-indigo-500 hover:underline"
              >
                Find your Voice ID in ElevenLabs ↗
              </a>
            </div>
          )}

          {/* Warning for external engines */}
          {activeEngine !== 'browser' && (
            <div className={`flex gap-2 p-3 rounded-lg text-xs ${
              dark ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              <span className="shrink-0">⚠</span>
              <span>API keys are stored in your browser's local storage. Do not use production credentials in shared environments.</span>
            </div>
          )}
        </Section>

        {/* Playback defaults */}
        <Section title="Playback Defaults">
          <Row label="Default speed" hint={`${config.defaultRate.toFixed(1)}× playback rate`}>
            <div className="flex items-center gap-3 w-48 shrink-0">
              <input type="range" min={0.5} max={2} step={0.1}
                value={config.defaultRate}
                onChange={e => onChange({ defaultRate: parseFloat(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <span className={`text-sm w-8 text-right ${textCls}`}>{config.defaultRate.toFixed(1)}×</span>
            </div>
          </Row>
          <Row label="Default pitch" hint={`${config.defaultPitch.toFixed(1)} pitch level`}>
            <div className="flex items-center gap-3 w-48 shrink-0">
              <input type="range" min={0.5} max={2} step={0.1}
                value={config.defaultPitch}
                onChange={e => onChange({ defaultPitch: parseFloat(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <span className={`text-sm w-8 text-right ${textCls}`}>{config.defaultPitch.toFixed(1)}</span>
            </div>
          </Row>
        </Section>

        {/* Editor */}
        <Section title="Editor">
          <Row label="Auto-save delay" hint="Milliseconds before changes are written to storage">
            <div className="flex items-center gap-3 w-48 shrink-0">
              <input type="range" min={200} max={2000} step={100}
                value={config.autoSaveDelay}
                onChange={e => onChange({ autoSaveDelay: parseInt(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <span className={`text-sm w-12 text-right ${textCls}`}>{config.autoSaveDelay}ms</span>
            </div>
          </Row>
        </Section>

        {/* SSML Tags */}
        <SSMLSection
          config={config.ssml}
          onChange={(s: SSMLConfig) => onChange({ ssml: s })}
          dark={dark}
        />

        {/* Prompt Variables */}
        <VariablesSection
          syntax={config.variableSyntax}
          onSyntaxChange={variableSyntax => onChange({ variableSyntax })}
          dark={dark}
        />

        {/* About */}
        <Section title="About">
          <Row label="PromptEditor" hint="Version 1.0.1">
            <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
              v1.0.1
            </span>
          </Row>
          <Row label="Storage" hint="All data stored locally in your browser">
            <button
              onClick={() => {
                if (confirm('Clear all prompts from local storage? This cannot be undone.')) {
                  localStorage.removeItem('prompt-editor-prompts')
                  window.location.reload()
                }
              }}
              className="text-xs px-3 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors shrink-0"
            >
              Clear all data
            </button>
          </Row>
        </Section>
      </div>
    </div>
  )
}

// ─── Prompt Variables Section ────────────────────────────────────────────────

function VariablesSection({
  syntax,
  onSyntaxChange,
  dark,
}: {
  syntax: VariableSyntaxConfig
  onSyntaxChange: (s: VariableSyntaxConfig) => void
  dark: boolean
}) {
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'

  const SYNTAX_OPTIONS: { key: keyof VariableSyntaxConfig; label: string; example: string; description: string }[] = [
    { key: 'dollar',      label: '$name',       example: '$policy_number',   description: 'Dollar sign prefix' },
    { key: 'singleBrace', label: '{name}',      example: '{policy_number}',  description: 'Single curly braces' },
    { key: 'doubleBrace', label: '{{name}}',    example: '{{policy_number}}', description: 'Double curly braces' },
  ]

  const atLeastOneActive = syntax.dollar || syntax.singleBrace || syntax.doubleBrace

  const toggle = (key: keyof VariableSyntaxConfig) => {
    const next = { ...syntax, [key]: !syntax[key] }
    // Always keep at least one active
    if (!next.dollar && !next.singleBrace && !next.doubleBrace) return
    onSyntaxChange(next)
  }

  return (
    <div className={`rounded-lg border p-5 space-y-5 ${cardBg}`}>
      {/* Header */}
      <div>
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${mutedCls}`}>Prompt Variables</h3>
        <p className={`text-xs mt-0.5 ${mutedCls}`}>
          Choose which token syntax is recognised as a variable in your prompts. Matching tokens are highlighted in the editor and shown in the Variables panel for value assignment.
        </p>
      </div>

      {/* Syntax options */}
      <div className="space-y-2">
        {SYNTAX_OPTIONS.map(opt => {
          const active = syntax[opt.key]
          return (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border text-left transition-colors ${
                active
                  ? dark
                    ? 'border-indigo-500 bg-indigo-900/30'
                    : 'border-indigo-400 bg-indigo-50'
                  : dark
                    ? 'border-gray-700 bg-gray-700/30 opacity-60 hover:opacity-80'
                    : 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Checkbox */}
              <div className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                active
                  ? 'bg-indigo-600 border-indigo-600'
                  : dark ? 'border-gray-500' : 'border-gray-300'
              }`}>
                {active && <span className="text-white text-xs leading-none">✓</span>}
              </div>
              {/* Label + example */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <code className={`text-sm font-mono font-semibold ${active ? (dark ? 'text-indigo-300' : 'text-indigo-600') : mutedCls}`}>
                    {opt.label}
                  </code>
                  <span className={`text-xs ${mutedCls}`}>{opt.description}</span>
                </div>
                <p className={`text-xs mt-0.5 font-mono ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  e.g. <span className={active ? (dark ? 'text-blue-400' : 'text-blue-600') : ''}>{opt.example}</span>
                </p>
              </div>
            </button>
          )
        })}
        {!atLeastOneActive && (
          <p className="text-xs text-red-500">At least one syntax must remain active.</p>
        )}
      </div>

    </div>
  )
}
