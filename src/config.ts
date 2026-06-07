export type EngineId = 'browser' | 'amazon' | 'google' | 'elevenlabs'

export interface SpeechEngineConfig {
  engine: EngineId
  enabledEngines: EngineId[]   // engines the user has switched on
  amazon: { accessKeyId: string; secretAccessKey: string; region: string; voiceId: string; language: string; engineType: string }
  google: { apiKey: string; voiceName: string; languageCode: string }
  elevenlabs: { apiKey: string; voiceId: string }
}

export type PollyEngineType = 'standard' | 'neural' | 'long-form' | 'generative'
export const ALL_POLLY_ENGINES: PollyEngineType[] = ['standard', 'neural', 'long-form', 'generative']

export interface SSMLSnippet {
  id: string
  label: string
  tag: string        // opening/self-closing tag template, e.g. '<break time="500ms"/>'
  description: string
  engines?: PollyEngineType[]  // undefined = shown for all engines (custom snippets)
}

export interface SSMLConfig {
  enabled: boolean
  snippets: SSMLSnippet[]
  favourites: string[]   // tag IDs (built-in or custom) starred by the user
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

const A = ALL_POLLY_ENGINES
const STD: PollyEngineType[]  = ['standard']
const SN:  PollyEngineType[]  = ['standard', 'neural']
const SNL: PollyEngineType[]  = ['standard', 'neural', 'long-form']
const N:   PollyEngineType[]  = ['neural']

export const BUILT_IN_SSML_TAGS: SSMLSnippet[] = [
  // ── Pauses ──────────────────────────────────────────────────────────────────
  { id: 'break-strength-none',    label: 'Remove pause',          tag: '<break strength="none"/>',           engines: A,   description: 'Remove a normally occurring pause (e.g. after a period).' },
  { id: 'break-short',            label: 'Short pause',           tag: '<break time="300ms"/>',              engines: A,   description: 'Insert a 300 ms silence. Max 10 s.' },
  { id: 'break-medium',           label: 'Medium pause',          tag: '<break time="700ms"/>',              engines: A,   description: 'Insert a 700 ms silence. Equivalent to <break strength="medium"/>.' },
  { id: 'break-long',             label: 'Long pause',            tag: '<break time="1200ms"/>',             engines: A,   description: 'Insert a 1.2 s silence.' },
  { id: 'break-sentence',         label: 'Sentence-length pause', tag: '<break strength="strong"/>',         engines: A,   description: 'Pause equivalent to the gap after a sentence.' },
  { id: 'break-paragraph',        label: 'Paragraph-length pause',tag: '<break strength="x-strong"/>',       engines: A,   description: 'Pause equivalent to the gap after a paragraph.' },
  { id: 'paragraph',              label: 'Paragraph',             tag: '<p>…</p>',                           engines: A,   description: 'Wrap a paragraph to add an x-strong pause after it. Equivalent to <break strength="x-strong"/>.' },
  { id: 'sentence',               label: 'Sentence',              tag: '<s>…</s>',                           engines: A,   description: 'Wrap a sentence to add a strong pause after it. Equivalent to ending with a period.' },

  // ── Emphasis ─────────────────────────────────────────────────────────────────
  { id: 'emphasis-strong',        label: 'Strong emphasis',       tag: '<emphasis level="strong">…</emphasis>',   engines: STD, description: 'Speak louder and slower. Standard voices only.' },
  { id: 'emphasis-moderate',      label: 'Moderate emphasis',     tag: '<emphasis level="moderate">…</emphasis>', engines: STD, description: 'Default emphasis — louder and slower than normal. Standard voices only.' },
  { id: 'emphasis-reduced',       label: 'Reduced emphasis',      tag: '<emphasis level="reduced">…</emphasis>',  engines: STD, description: 'Speak softer and faster than normal. Standard voices only.' },

  // ── Prosody: rate ────────────────────────────────────────────────────────────
  { id: 'prosody-rate-xslow',     label: 'Extra slow rate',       tag: '<prosody rate="x-slow">…</prosody>',      engines: A,   description: 'Speak at the x-slow preset rate.' },
  { id: 'prosody-rate-slow',      label: 'Slow rate',             tag: '<prosody rate="slow">…</prosody>',        engines: A,   description: 'Speak at the slow preset rate.' },
  { id: 'prosody-rate-fast',      label: 'Fast rate',             tag: '<prosody rate="fast">…</prosody>',        engines: A,   description: 'Speak at the fast preset rate.' },
  { id: 'prosody-rate-xfast',     label: 'Extra fast rate',       tag: '<prosody rate="x-fast">…</prosody>',      engines: A,   description: 'Speak at the x-fast preset rate.' },
  { id: 'prosody-rate-pct',       label: 'Rate % (85%)',          tag: '<prosody rate="85%">…</prosody>',         engines: A,   description: 'Set speaking rate as a percentage (20–200%). 100% = normal.' },

  // ── Prosody: volume ──────────────────────────────────────────────────────────
  { id: 'prosody-vol-loud',       label: 'Loud',                  tag: '<prosody volume="loud">…</prosody>',      engines: A,   description: 'Speak at the loud preset volume.' },
  { id: 'prosody-vol-xloud',      label: 'Extra loud',            tag: '<prosody volume="x-loud">…</prosody>',    engines: A,   description: 'Speak at the x-loud preset volume.' },
  { id: 'prosody-vol-soft',       label: 'Soft',                  tag: '<prosody volume="soft">…</prosody>',      engines: A,   description: 'Speak at the soft preset volume.' },
  { id: 'prosody-vol-db',         label: 'Volume +6 dB',          tag: '<prosody volume="+6dB">…</prosody>',      engines: A,   description: 'Increase volume ~6 dB (≈ double). Use negative values to decrease.' },

  // ── Prosody: pitch (standard only) ──────────────────────────────────────────
  { id: 'prosody-pitch-high',     label: 'High pitch',            tag: '<prosody pitch="high">…</prosody>',       engines: STD, description: 'Speak at a higher pitch. Standard voices only.' },
  { id: 'prosody-pitch-low',      label: 'Low pitch',             tag: '<prosody pitch="low">…</prosody>',        engines: STD, description: 'Speak at a lower pitch. Standard voices only.' },
  { id: 'prosody-pitch-pct',      label: 'Pitch +10%',            tag: '<prosody pitch="+10%">…</prosody>',       engines: STD, description: 'Adjust pitch by a relative percentage. Standard voices only.' },

  // ── Prosody: max-duration (standard only) ────────────────────────────────────
  { id: 'prosody-maxdur',         label: 'Max duration',          tag: '<prosody amazon:max-duration="5s">…</prosody>', engines: STD, description: 'Constrain speech to a max duration (e.g. 5s or 5000ms). Polly speeds up to fit. Text limit: 1500 chars. Standard voices only.' },

  // ── Say-as ───────────────────────────────────────────────────────────────────
  { id: 'say-as-spell',           label: 'Spell out',             tag: '<say-as interpret-as="spell-out">…</say-as>',      engines: STD, description: 'Spell each character individually (a-b-c). Standard voices only (neural falls back to standard).' },
  { id: 'say-as-cardinal',        label: 'Cardinal number',       tag: '<say-as interpret-as="cardinal">…</say-as>',       engines: A,   description: 'Read a number as a cardinal (e.g. "1,234").' },
  { id: 'say-as-ordinal',         label: 'Ordinal number',        tag: '<say-as interpret-as="ordinal">…</say-as>',        engines: A,   description: 'Read a number as an ordinal (e.g. "1,234th").' },
  { id: 'say-as-digits',          label: 'Digits',                tag: '<say-as interpret-as="digits">…</say-as>',         engines: A,   description: 'Say each digit separately (1-2-3-4).' },
  { id: 'say-as-fraction',        label: 'Fraction',              tag: '<say-as interpret-as="fraction">3/4</say-as>',     engines: A,   description: 'Read as a fraction ("three fourths"). Mixed: 3+1/2.' },
  { id: 'say-as-unit',            label: 'Measurement unit',      tag: '<say-as interpret-as="unit">1/2inch</say-as>',     engines: A,   description: 'Read as a measurement — number directly followed by unit (no space).' },
  { id: 'say-as-date',            label: 'Date (mdy)',            tag: '<say-as interpret-as="date" format="mdy">12-31-2025</say-as>', engines: A, description: 'Read as a date. Formats: mdy dmy ymd md dm ym my d m y yyyymmdd.' },
  { id: 'say-as-time',            label: 'Duration (time)',       tag: '<say-as interpret-as="time">1\'21"</say-as>',      engines: A,   description: 'Read as duration in minutes and seconds.' },
  { id: 'say-as-address',         label: 'Street address',        tag: '<say-as interpret-as="address">…</say-as>',        engines: A,   description: 'Interpret as a street address.' },
  { id: 'say-as-telephone',       label: 'Phone number',          tag: '<say-as interpret-as="telephone">2025551212</say-as>', engines: A, description: 'Read as a telephone number (English, Spanish, French, Portuguese, German, Italian, Japanese, Russian).' },
  { id: 'say-as-expletive',       label: 'Bleep (expletive)',     tag: '<say-as interpret-as="expletive">…</say-as>',      engines: A,   description: 'Beep out the enclosed text.' },

  // ── Phonetics ────────────────────────────────────────────────────────────────
  { id: 'phoneme-ipa',            label: 'IPA pronunciation',     tag: '<phoneme alphabet="ipa" ph="pɪˈkɑːn">pecan</phoneme>',       engines: SNL, description: 'Specify pronunciation using the International Phonetic Alphabet (IPA). Standard · Neural · Long-form.' },
  { id: 'phoneme-xsampa',         label: 'X-SAMPA pronunciation', tag: '<phoneme alphabet="x-sampa" ph=\'pI"kA:n\'>pecan</phoneme>', engines: SNL, description: 'Specify pronunciation using Extended X-SAMPA. Standard · Neural · Long-form.' },

  // ── Word / part-of-speech ────────────────────────────────────────────────────
  { id: 'w-verb',                 label: 'Word as verb',          tag: '<w role="amazon:VB">read</w>',        engines: A,   description: 'Interpret word as a present-simple verb.' },
  { id: 'w-past',                 label: 'Word as past verb',     tag: '<w role="amazon:VBD">read</w>',       engines: A,   description: 'Interpret word as past-tense verb.' },
  { id: 'w-noun',                 label: 'Word as noun',          tag: '<w role="amazon:NN">bass</w>',        engines: A,   description: 'Interpret word as a noun.' },
  { id: 'w-adj',                  label: 'Word as adjective',     tag: '<w role="amazon:JJ">…</w>',          engines: A,   description: 'Interpret word as an adjective.' },
  { id: 'w-sense1',               label: 'Alternate word sense',  tag: '<w role="amazon:SENSE_1">bass</w>',   engines: A,   description: 'Use the non-default meaning of a word (e.g. "bass" as a fish vs. musical term).' },

  // ── Substitution & language ──────────────────────────────────────────────────
  { id: 'sub',                    label: 'Substitution (alias)',   tag: '<sub alias="Mercury">Hg</sub>',       engines: A,   description: 'Speak the alias instead of the written text (e.g. expand acronyms).' },
  { id: 'lang',                   label: 'Language switch',        tag: '<lang xml:lang="fr-FR">…</lang>',    engines: A,   description: 'Pronounce enclosed text in a different language/accent. For generative voices, wrap full sentences only.' },

  // ── Mark ─────────────────────────────────────────────────────────────────────
  { id: 'mark',                   label: 'Custom mark',            tag: '<mark name="my-tag"/>',               engines: SNL, description: 'Place a named marker in the SSML. Polly returns its timestamp in speech-mark metadata. Standard · Neural · Long-form.' },

  // ── Amazon-specific: breathing (standard only) ───────────────────────────────
  { id: 'amazon-breath-manual',   label: 'Breath (manual)',        tag: '<amazon:breath duration="medium" volume="medium"/>',                    engines: STD, description: 'Insert a single breathing sound. duration: x-short short medium long x-long. volume: x-soft soft medium loud x-loud. Standard only.' },
  { id: 'amazon-breath-auto',     label: 'Auto-breaths',           tag: '<amazon:auto-breaths volume="medium" frequency="medium">…</amazon:auto-breaths>', engines: STD, description: 'Automatically insert breathing sounds. Standard only.' },

  // ── Amazon-specific: speaking style (neural only) ────────────────────────────
  { id: 'amazon-domain-news',     label: 'Newscaster style',       tag: '<amazon:domain name="news">…</amazon:domain>',    engines: N,   description: 'Newscaster speaking style. Available only for Matthew/Joanna (en-US), Lupe (es-US), Amy (en-GB) — neural only.' },

  // ── Amazon-specific: effects ─────────────────────────────────────────────────
  { id: 'amazon-drc',             label: 'Dynamic range (DRC)',    tag: '<amazon:effect name="drc">…</amazon:effect>',            engines: SNL, description: 'Boost mid-range sounds for clearer audio in noisy environments. Standard · Neural · Long-form. Case-sensitive: "drc".' },
  { id: 'amazon-phonation-soft',  label: 'Soft phonation',         tag: '<amazon:effect phonation="soft">…</amazon:effect>',     engines: STD, description: 'Speak in a softer-than-normal voice. Standard only.' },
  { id: 'amazon-vocal-tract',     label: 'Vocal tract length',     tag: '<amazon:effect vocal-tract-length="+15%">…</amazon:effect>', engines: STD, description: 'Change timbre by adjusting vocal tract length (+100% to -50%). Standard only.' },
  { id: 'amazon-whisper',         label: 'Whisper',                tag: '<amazon:effect name="whispered">…</amazon:effect>',     engines: STD, description: 'Speak enclosed text in a whispered voice. Combine with <prosody rate="-10%"> for effect. Standard only.' },
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
    amazon: { accessKeyId: '', secretAccessKey: '', region: 'us-east-1', voiceId: 'Joanna', language: 'English (US)', engineType: 'neural' },
    google: { apiKey: '', voiceName: 'en-US-Neural2-F', languageCode: 'en-US' },
    elevenlabs: { apiKey: '', voiceId: '' },
  },
  ssml: {
    enabled: false,
    snippets: [],
    favourites: [],
  },
}
