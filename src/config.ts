export type EngineId = 'browser' | 'amazon' | 'google' | 'elevenlabs'

export interface SpeechEngineConfig {
  engine: EngineId
  enabledEngines: EngineId[]   // engines the user has switched on
  amazon: { accessKeyId: string; secretAccessKey: string; region: string; voiceId: string }
  google: { apiKey: string; voiceName: string; languageCode: string }
  elevenlabs: { apiKey: string; voiceId: string }
}

export interface SSMLSnippet {
  id: string
  label: string
  tag: string        // opening/self-closing tag template, e.g. '<break time="500ms"/>'
  description: string
}

export interface SSMLConfig {
  enabled: boolean
  snippets: SSMLSnippet[]
}

export interface AppConfig {
  defaultVoice: string
  defaultRate: number
  defaultPitch: number
  defaultDark: boolean
  autoSaveDelay: number
  speechEngine: SpeechEngineConfig
  ssml: SSMLConfig
}

export const BUILT_IN_SSML_TAGS: SSMLSnippet[] = [
  { id: 'break-short',   label: 'Short pause',     tag: '<break time="300ms"/>',           description: 'Insert a 300ms silence' },
  { id: 'break-medium',  label: 'Medium pause',    tag: '<break time="700ms"/>',           description: 'Insert a 700ms silence' },
  { id: 'break-long',    label: 'Long pause',      tag: '<break time="1200ms"/>',          description: 'Insert a 1.2s silence' },
  { id: 'emphasis-mod',  label: 'Emphasis',        tag: '<emphasis level="moderate">…</emphasis>', description: 'Moderate emphasis on a word or phrase' },
  { id: 'emphasis-str',  label: 'Strong emphasis', tag: '<emphasis level="strong">…</emphasis>',   description: 'Strong emphasis on a word or phrase' },
  { id: 'prosody-slow',  label: 'Slow speech',     tag: '<prosody rate="slow">…</prosody>',         description: 'Speak enclosed text slower' },
  { id: 'prosody-fast',  label: 'Fast speech',     tag: '<prosody rate="fast">…</prosody>',         description: 'Speak enclosed text faster' },
  { id: 'prosody-loud',  label: 'Louder',          tag: '<prosody volume="loud">…</prosody>',       description: 'Increase volume for enclosed text' },
  { id: 'prosody-pitch', label: 'Higher pitch',    tag: '<prosody pitch="+10%">…</prosody>',        description: 'Raise pitch for enclosed text' },
  { id: 'say-as-spell',  label: 'Spell out',       tag: '<say-as interpret-as="spell-out">…</say-as>', description: 'Spell out each character' },
  { id: 'say-as-num',    label: 'Cardinal number', tag: '<say-as interpret-as="cardinal">…</say-as>',  description: 'Read number as cardinal (e.g. "42")' },
  { id: 'say-as-date',   label: 'Date',            tag: '<say-as interpret-as="date" format="mdy">…</say-as>', description: 'Read as a formatted date' },
  { id: 'say-as-phone',  label: 'Phone number',    tag: '<say-as interpret-as="telephone">…</say-as>',  description: 'Read as a phone number' },
  { id: 'sub',           label: 'Substitution',    tag: '<sub alias="World Wide Web Consortium">W3C</sub>', description: 'Replace text with an alias when speaking' },
  { id: 'lang',          label: 'Language switch', tag: '<lang xml:lang="fr-FR">…</lang>',  description: 'Speak enclosed text in a different language' },
]

export const DEFAULT_CONFIG: AppConfig = {
  defaultVoice: '',
  defaultRate: 1,
  defaultPitch: 1,
  defaultDark: false,
  autoSaveDelay: 500,
  speechEngine: {
    engine: 'browser',
    enabledEngines: ['browser'],
    amazon: { accessKeyId: '', secretAccessKey: '', region: 'us-east-1', voiceId: 'Joanna' },
    google: { apiKey: '', voiceName: 'en-US-Neural2-F', languageCode: 'en-US' },
    elevenlabs: { apiKey: '', voiceId: '' },
  },
  ssml: {
    enabled: false,
    snippets: [],
  },
}
