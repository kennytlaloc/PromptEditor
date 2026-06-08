import React, { useState, useRef } from 'react'
import { Prompt } from '../types'
import { AppConfig } from '../config'
import {
  POLLY_VOICES, POLLY_LANGUAGES, POLLY_ENGINE_TYPES, getVoicesFiltered,
  getEngineForVoice, PollyEngine, synthesizeSpeech,
} from '../polly'

interface Props {
  prompts: Prompt[]
  config: AppConfig
  dark: boolean
}

type PlayState = 'idle' | 'playing' | 'paused'

interface SlotConfig {
  language: string
  engineType: PollyEngine
  voiceId: string
}

function defaultSlot(config: AppConfig): SlotConfig {
  const a = config.speechEngine.amazon
  return {
    language: a.language ?? 'English (US)',
    engineType: (a.engineType ?? 'neural') as PollyEngine,
    voiceId: a.voiceId ?? 'Joanna',
  }
}

export default function ComparatorPanel({ prompts, config, dark }: Props) {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(prompts[0]?.id ?? '')

  // Two comparison slots — A is seeded from current config, B starts the same
  const [slotA, setSlotA] = useState<SlotConfig>(() => defaultSlot(config))
  const [slotB, setSlotB] = useState<SlotConfig>(() => defaultSlot(config))

  const [playStateA, setPlayStateA] = useState<PlayState>('idle')
  const [playStateB, setPlayStateB] = useState<PlayState>('idle')
  const [errorA, setErrorA] = useState<string | null>(null)
  const [errorB, setErrorB] = useState<string | null>(null)

  const audioARef = useRef<HTMLAudioElement | null>(null)
  const audioBRef = useRef<HTMLAudioElement | null>(null)

  const bg = dark ? 'bg-gray-900' : 'bg-gray-50'
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textCls = dark ? 'text-gray-100' : 'text-gray-900'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-gray-100'
    : 'bg-white border-gray-300 text-gray-900'
  const labelCls = `block text-xs font-medium mb-1 ${mutedCls}`

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId) ?? null
  const { accessKeyId, secretAccessKey, region } = config.speechEngine.amazon
  const credentialsOk = !!(accessKeyId && secretAccessKey && region)

  const playSlot = async (
    slot: SlotConfig,
    setPlayState: (s: PlayState) => void,
    setError: (e: string | null) => void,
    audioRef: React.MutableRefObject<HTMLAudioElement | null>,
    otherAudioRef: React.MutableRefObject<HTMLAudioElement | null>,
  ) => {
    if (!selectedPrompt?.content) return
    if (!credentialsOk) {
      setError('Amazon Polly credentials are not configured. Go to Configuration → Speech Engine.')
      return
    }

    // Stop the other slot if playing
    if (otherAudioRef.current) {
      otherAudioRef.current.pause()
    }

    setError(null)
    setPlayState('playing')

    try {
      const voice = POLLY_VOICES.find(v => v.id === slot.voiceId)
      const engine = voice
        ? getEngineForVoice(voice, region, slot.engineType)
        : slot.engineType

      const content = config.ssml.enabled
        ? (selectedPrompt.content.trim().startsWith('<speak>')
          ? selectedPrompt.content.trim()
          : `<speak>${selectedPrompt.content.trim()}</speak>`)
        : selectedPrompt.content

      const buf = await synthesizeSpeech({
        text: content,
        voiceId: slot.voiceId,
        engine,
        region,
        accessKeyId,
        secretAccessKey,
      })

      const blob = new Blob([buf], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPlayState('idle'); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPlayState('idle'); URL.revokeObjectURL(url) }
      await audio.play()
    } catch (err: unknown) {
      setPlayState('idle')
      setError(err instanceof Error ? err.message : 'Playback failed')
    }
  }

  const stopSlot = (
    setPlayState: (s: PlayState) => void,
    audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  ) => {
    audioRef.current?.pause()
    audioRef.current = null
    setPlayState('idle')
  }

  const SlotCard = ({
    label,
    slot,
    setSlot,
    playState,
    error,
    onPlay,
    onStop,
    accent,
  }: {
    label: string
    slot: SlotConfig
    setSlot: (s: SlotConfig) => void
    playState: PlayState
    error: string | null
    onPlay: () => void
    onStop: () => void
    accent: string
  }) => {
    const voices = getVoicesFiltered(region, slot.language, slot.engineType)
    const currentVoice = POLLY_VOICES.find(v => v.id === slot.voiceId)

    const setLang = (language: string) => {
      const filtered = getVoicesFiltered(region, language, slot.engineType)
      const voiceId = filtered.find(v => v.id === slot.voiceId) ? slot.voiceId : (filtered[0]?.id ?? slot.voiceId)
      setSlot({ ...slot, language, voiceId })
    }

    const setEngine = (engineType: PollyEngine) => {
      const filtered = getVoicesFiltered(region, slot.language, engineType)
      const voiceId = filtered.find(v => v.id === slot.voiceId) ? slot.voiceId : (filtered[0]?.id ?? slot.voiceId)
      setSlot({ ...slot, engineType, voiceId })
    }

    return (
      <div className={`flex-1 rounded-xl border flex flex-col overflow-hidden ${cardBg}`}>
        {/* Slot header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
          <span className={`text-sm font-semibold ${textCls}`}>{label}</span>
          {playState === 'idle' ? (
            <button
              disabled={!selectedPrompt || !credentialsOk}
              onClick={onPlay}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-40 text-white ${accent}`}
            >
              ▶ Play
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              ■ Stop
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3 flex-1">
          {/* Language */}
          <div>
            <label className={labelCls}>Language</label>
            <select
              value={slot.language}
              onChange={e => setLang(e.target.value)}
              className={`w-full text-xs px-2 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputCls}`}
            >
              {POLLY_LANGUAGES.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Engine type */}
          <div>
            <label className={labelCls}>Engine type</label>
            <div className="flex gap-1 flex-wrap">
              {POLLY_ENGINE_TYPES.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEngine(e.id)}
                  title={e.description}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    slot.engineType === e.id
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : dark
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div>
            <label className={labelCls}>Voice</label>
            <select
              value={slot.voiceId}
              onChange={e => setSlot({ ...slot, voiceId: e.target.value })}
              className={`w-full text-xs px-2 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputCls}`}
            >
              {voices.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.gender === 'Female' ? '♀' : '♂'} {v.language}
                </option>
              ))}
            </select>
          </div>

          {/* Active voice summary */}
          {currentVoice && (
            <div className={`text-xs px-3 py-2 rounded-lg ${dark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
              <span className="font-medium">{currentVoice.name}</span>
              {' · '}
              {currentVoice.gender === 'Female' ? '♀ Female' : '♂ Male'}
              {' · '}
              {slot.engineType.charAt(0).toUpperCase() + slot.engineType.slice(1)}
              {' · '}
              {slot.language}
            </div>
          )}

          {/* Playing status */}
          {playState === 'playing' && (
            <p className="text-xs text-indigo-500 font-medium">● Playing…</p>
          )}

          {/* Error */}
          {error && (
            <div className={`text-xs px-3 py-2 rounded-lg ${dark ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${bg}`}>
      {/* Top bar — prompt selector */}
      <div className={`px-6 py-3 border-b shrink-0 flex items-center gap-4 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <span className={`text-sm font-medium shrink-0 ${textCls}`}>Compare prompt:</span>
        <select
          value={selectedPromptId}
          onChange={e => setSelectedPromptId(e.target.value)}
          className={`flex-1 max-w-sm text-sm px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputCls}`}
        >
          {prompts.length === 0 && <option value="">No prompts</option>}
          {prompts.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        {!credentialsOk && (
          <span className={`text-xs ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            ⚠ Amazon Polly credentials required
          </span>
        )}
      </div>

      {/* Prompt preview */}
      {selectedPrompt && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-lg border text-sm font-mono leading-relaxed shrink-0 max-h-32 overflow-y-auto ${dark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          {selectedPrompt.content || <span className={mutedCls}>(empty)</span>}
        </div>
      )}

      {/* Two slot cards side by side */}
      <div className="flex-1 flex gap-4 px-6 py-4 overflow-auto min-h-0">
        <SlotCard
          label="Version A"
          slot={slotA}
          setSlot={setSlotA}
          playState={playStateA}
          error={errorA}
          onPlay={() => playSlot(slotA, setPlayStateA, setErrorA, audioARef, audioBRef)}
          onStop={() => stopSlot(setPlayStateA, audioARef)}
          accent="bg-indigo-600 hover:bg-indigo-700"
        />
        <SlotCard
          label="Version B"
          slot={slotB}
          setSlot={setSlotB}
          playState={playStateB}
          error={errorB}
          onPlay={() => playSlot(slotB, setPlayStateB, setErrorB, audioBRef, audioARef)}
          onStop={() => stopSlot(setPlayStateB, audioBRef)}
          accent="bg-emerald-600 hover:bg-emerald-700"
        />
      </div>
    </div>
  )
}
