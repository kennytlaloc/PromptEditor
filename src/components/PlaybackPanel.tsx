import React from 'react'
import { PlayState } from '../useSpeech'
import { EngineId } from '../config'

export interface EngineDetails {
  region?: string
  language?: string
  engineType?: string
  voice?: string
}

interface Props {
  supported: boolean
  voices: SpeechSynthesisVoice[]
  selectedVoice: string
  onVoiceChange: (v: string) => void
  playState: PlayState
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  hasContent: boolean
  dark: boolean
  activeEngine: EngineId
  activeEngineVoiceLabel: string
  engineDetails: EngineDetails
  onGoToSettings: () => void
  onDownload?: () => void
  downloadState?: 'idle' | 'loading'
}

const ENGINE_VOICE_LABELS: Record<EngineId, string> = {
  browser: 'Browser (Web Speech API)',
  amazon: 'Amazon Polly',
  google: 'Google Cloud TTS',
  elevenlabs: 'ElevenLabs',
}

export default function PlaybackPanel({
  supported, voices, selectedVoice, onVoiceChange,
  playState, onPlay, onPause, onResume, onStop,
  hasContent, dark, activeEngine, activeEngineVoiceLabel, engineDetails, onGoToSettings,
  onDownload, downloadState = 'idle',
}: Props) {
  const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
  const textCls = dark ? 'text-gray-100' : 'text-gray-900'
  const mutedCls = dark ? 'text-gray-400' : 'text-gray-500'
  const selectCls = dark
    ? 'bg-gray-800 border-gray-600 text-gray-100'
    : 'bg-white border-gray-300 text-gray-900'

  if (!supported) {
    return (
      <aside className={`w-56 border-l p-4 ${bg}`}>
        <p className={`text-sm ${mutedCls}`}>
          Web Speech API is not supported in this browser. Try Chrome or Edge.
        </p>
      </aside>
    )
  }

  return (
    <aside className={`w-56 border-l p-4 flex flex-col gap-5 ${bg}`}>
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${mutedCls}`}>Playback</h3>

        {/* Play/Pause/Stop buttons */}
        <div className="flex gap-2 mb-4">
          {playState === 'idle' && (
            <button
              disabled={!hasContent}
              onClick={onPlay}
              className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm py-2 rounded font-medium transition-colors"
            >
              ▶ Play
            </button>
          )}
          {playState === 'playing' && (
            <button
              onClick={onPause}
              className="flex-1 flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 rounded font-medium transition-colors"
            >
              ⏸ Pause
            </button>
          )}
          {playState === 'paused' && (
            <button
              onClick={onResume}
              className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 rounded font-medium transition-colors"
            >
              ▶ Resume
            </button>
          )}
          {playState !== 'idle' && (
            <button
              onClick={onStop}
              className="px-3 bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded font-medium transition-colors"
              title="Stop"
            >
              ■
            </button>
          )}
        </div>

        {/* Status */}
        {playState !== 'idle' && (
          <p className={`text-xs text-center mb-3 ${
            playState === 'playing' ? 'text-indigo-500' : 'text-yellow-500'
          }`}>
            {playState === 'playing' ? '● Playing…' : '⏸ Paused'}
          </p>
        )}

        {/* Download WAV */}
        <button
          disabled={!hasContent || !onDownload || downloadState === 'loading'}
          onClick={onDownload}
          title={activeEngine !== 'amazon' ? 'WAV download requires Amazon Polly' : 'Download as WAV'}
          className={`w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded border font-medium transition-colors disabled:opacity-40 ${
            dark
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:hover:bg-transparent'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50 disabled:hover:bg-transparent'
          }`}
        >
          {downloadState === 'loading' ? '⏳ Generating…' : '⬇ Download WAV'}
        </button>
      </div>

      {/* Engine details */}
      <div className={`rounded-lg border p-3 space-y-2 ${dark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wide ${mutedCls}`}>{ENGINE_VOICE_LABELS[activeEngine]}</span>
          <button onClick={onGoToSettings} className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
            Settings →
          </button>
        </div>

        {activeEngine === 'browser' ? (
          <select
            className={`w-full text-xs px-2 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectCls}`}
            value={selectedVoice}
            onChange={e => onVoiceChange(e.target.value)}
          >
            {voices.map(v => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
          </select>
        ) : (
          <dl className="space-y-1">
            {engineDetails.region && (
              <div className="flex justify-between gap-2">
                <dt className={`text-xs ${mutedCls}`}>Region</dt>
                <dd className={`text-xs font-medium text-right truncate ${textCls}`}>{engineDetails.region}</dd>
              </div>
            )}
            {engineDetails.language && (
              <div className="flex justify-between gap-2">
                <dt className={`text-xs ${mutedCls}`}>Language</dt>
                <dd className={`text-xs font-medium text-right truncate ${textCls}`}>{engineDetails.language}</dd>
              </div>
            )}
            {engineDetails.engineType && (
              <div className="flex justify-between gap-2">
                <dt className={`text-xs ${mutedCls}`}>Engine type</dt>
                <dd className={`text-xs font-medium text-right truncate ${textCls}`}>{engineDetails.engineType}</dd>
              </div>
            )}
            {engineDetails.voice && (
              <div className="flex justify-between gap-2">
                <dt className={`text-xs ${mutedCls}`}>Voice</dt>
                <dd className={`text-xs font-medium text-right truncate ${textCls}`}>{engineDetails.voice}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </aside>
  )
}
