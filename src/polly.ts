export type PollyEngine = 'standard' | 'neural' | 'long-form' | 'generative'

export interface PollyVoice {
  id: string
  name: string
  language: string
  languageCode: string
  gender: 'Female' | 'Male'
  engines: PollyEngine[]
}

export const POLLY_REGIONS = [
  { id: 'us-east-1',      label: 'US East (N. Virginia)' },
  { id: 'us-east-2',      label: 'US East (Ohio)' },
  { id: 'us-west-1',      label: 'US West (N. California)' },
  { id: 'us-west-2',      label: 'US West (Oregon)' },
  { id: 'ca-central-1',   label: 'Canada (Central)' },
  { id: 'eu-west-1',      label: 'EU (Ireland)' },
  { id: 'eu-west-2',      label: 'EU (London)' },
  { id: 'eu-west-3',      label: 'EU (Paris)' },
  { id: 'eu-central-1',   label: 'EU (Frankfurt)' },
  { id: 'eu-north-1',     label: 'EU (Stockholm)' },
  { id: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { id: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { id: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { id: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
  { id: 'ap-south-1',     label: 'Asia Pacific (Mumbai)' },
  { id: 'sa-east-1',      label: 'South America (São Paulo)' },
]

const NEURAL_REGIONS = new Set([
  'us-east-1', 'us-east-2', 'us-west-2',
  'ca-central-1',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
])

export function isNeuralRegion(region: string): boolean {
  return NEURAL_REGIONS.has(region)
}

export const POLLY_VOICES: PollyVoice[] = [
  // English (US)
  { id: 'Ivy',      name: 'Ivy',      language: 'English (US)', languageCode: 'en-US', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Joanna',   name: 'Joanna',   language: 'English (US)', languageCode: 'en-US', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Kendra',   name: 'Kendra',   language: 'English (US)', languageCode: 'en-US', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Kimberly', name: 'Kimberly', language: 'English (US)', languageCode: 'en-US', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Salli',    name: 'Salli',    language: 'English (US)', languageCode: 'en-US', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Ruth',     name: 'Ruth',     language: 'English (US)', languageCode: 'en-US', gender: 'Female', engines: ['neural', 'long-form', 'generative'] },
  { id: 'Danielle', name: 'Danielle', language: 'English (US)', languageCode: 'en-US', gender: 'Female', engines: ['neural', 'long-form'] },
  { id: 'Joey',     name: 'Joey',     language: 'English (US)', languageCode: 'en-US', gender: 'Male',   engines: ['standard', 'neural'] },
  { id: 'Justin',   name: 'Justin',   language: 'English (US)', languageCode: 'en-US', gender: 'Male',   engines: ['standard', 'neural'] },
  { id: 'Kevin',    name: 'Kevin',    language: 'English (US)', languageCode: 'en-US', gender: 'Male',   engines: ['neural'] },
  { id: 'Matthew',  name: 'Matthew',  language: 'English (US)', languageCode: 'en-US', gender: 'Male',   engines: ['standard', 'neural', 'generative'] },
  { id: 'Gregory',  name: 'Gregory',  language: 'English (US)', languageCode: 'en-US', gender: 'Male',   engines: ['neural', 'long-form'] },
  { id: 'Stephen',  name: 'Stephen',  language: 'English (US)', languageCode: 'en-US', gender: 'Male',   engines: ['neural'] },
  // English (GB)
  { id: 'Amy',    name: 'Amy',    language: 'English (GB)', languageCode: 'en-GB', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Emma',   name: 'Emma',   language: 'English (GB)', languageCode: 'en-GB', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Brian',  name: 'Brian',  language: 'English (GB)', languageCode: 'en-GB', gender: 'Male',   engines: ['standard', 'neural'] },
  { id: 'Arthur', name: 'Arthur', language: 'English (GB)', languageCode: 'en-GB', gender: 'Male',   engines: ['neural'] },
  // English (AU)
  { id: 'Nicole', name: 'Nicole', language: 'English (AU)', languageCode: 'en-AU', gender: 'Female', engines: ['standard'] },
  { id: 'Olivia', name: 'Olivia', language: 'English (AU)', languageCode: 'en-AU', gender: 'Female', engines: ['neural'] },
  { id: 'Russell',name: 'Russell',language: 'English (AU)', languageCode: 'en-AU', gender: 'Male',   engines: ['standard'] },
  // English (IN)
  { id: 'Aditi',   name: 'Aditi',   language: 'English (IN)', languageCode: 'en-IN', gender: 'Female', engines: ['standard'] },
  { id: 'Raveena', name: 'Raveena', language: 'English (IN)', languageCode: 'en-IN', gender: 'Female', engines: ['standard'] },
  // English (NZ)
  { id: 'Aria', name: 'Aria', language: 'English (NZ)', languageCode: 'en-NZ', gender: 'Female', engines: ['neural'] },
  // English (ZA)
  { id: 'Ayanda', name: 'Ayanda', language: 'English (ZA)', languageCode: 'en-ZA', gender: 'Female', engines: ['neural'] },
  // Spanish (ES)
  { id: 'Conchita', name: 'Conchita', language: 'Spanish (ES)', languageCode: 'es-ES', gender: 'Female', engines: ['standard'] },
  { id: 'Lucia',    name: 'Lucia',    language: 'Spanish (ES)', languageCode: 'es-ES', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Enrique',  name: 'Enrique',  language: 'Spanish (ES)', languageCode: 'es-ES', gender: 'Male',   engines: ['standard'] },
  // Spanish (US)
  { id: 'Lupe',     name: 'Lupe',     language: 'Spanish (US)', languageCode: 'es-US', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Penelope', name: 'Penélope', language: 'Spanish (US)', languageCode: 'es-US', gender: 'Female', engines: ['standard'] },
  { id: 'Miguel',   name: 'Miguel',   language: 'Spanish (US)', languageCode: 'es-US', gender: 'Male',   engines: ['standard'] },
  { id: 'Pedro',    name: 'Pedro',    language: 'Spanish (US)', languageCode: 'es-US', gender: 'Male',   engines: ['neural'] },
  // Spanish (MX)
  { id: 'Mia',  name: 'Mia',  language: 'Spanish (MX)', languageCode: 'es-MX', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Andres',name:'Andrés',language: 'Spanish (MX)', languageCode: 'es-MX', gender: 'Male',   engines: ['neural'] },
  // French (FR)
  { id: 'Celine',  name: 'Céline',  language: 'French (FR)', languageCode: 'fr-FR', gender: 'Female', engines: ['standard'] },
  { id: 'Lea',     name: 'Léa',     language: 'French (FR)', languageCode: 'fr-FR', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Mathieu', name: 'Mathieu', language: 'French (FR)', languageCode: 'fr-FR', gender: 'Male',   engines: ['standard'] },
  { id: 'Remi',    name: 'Rémi',    language: 'French (FR)', languageCode: 'fr-FR', gender: 'Male',   engines: ['neural'] },
  // French (CA)
  { id: 'Chantal',   name: 'Chantal',   language: 'French (CA)', languageCode: 'fr-CA', gender: 'Female', engines: ['standard'] },
  { id: 'Gabrielle', name: 'Gabrielle', language: 'French (CA)', languageCode: 'fr-CA', gender: 'Female', engines: ['neural'] },
  { id: 'Liam',      name: 'Liam',      language: 'French (CA)', languageCode: 'fr-CA', gender: 'Male',   engines: ['neural'] },
  // German
  { id: 'Marlene', name: 'Marlene', language: 'German (DE)', languageCode: 'de-DE', gender: 'Female', engines: ['standard'] },
  { id: 'Vicki',   name: 'Vicki',   language: 'German (DE)', languageCode: 'de-DE', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Hans',    name: 'Hans',    language: 'German (DE)', languageCode: 'de-DE', gender: 'Male',   engines: ['standard'] },
  { id: 'Daniel',  name: 'Daniel',  language: 'German (DE)', languageCode: 'de-DE', gender: 'Male',   engines: ['neural'] },
  // Italian
  { id: 'Carla',   name: 'Carla',   language: 'Italian (IT)', languageCode: 'it-IT', gender: 'Female', engines: ['standard'] },
  { id: 'Bianca',  name: 'Bianca',  language: 'Italian (IT)', languageCode: 'it-IT', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Giorgio', name: 'Giorgio', language: 'Italian (IT)', languageCode: 'it-IT', gender: 'Male',   engines: ['standard'] },
  { id: 'Adriano', name: 'Adriano', language: 'Italian (IT)', languageCode: 'it-IT', gender: 'Male',   engines: ['neural'] },
  // Japanese
  { id: 'Mizuki', name: 'Mizuki', language: 'Japanese (JP)', languageCode: 'ja-JP', gender: 'Female', engines: ['standard'] },
  { id: 'Kazuha', name: 'Kazuha', language: 'Japanese (JP)', languageCode: 'ja-JP', gender: 'Female', engines: ['neural'] },
  { id: 'Tomoko', name: 'Tomoko', language: 'Japanese (JP)', languageCode: 'ja-JP', gender: 'Female', engines: ['neural'] },
  { id: 'Takumi', name: 'Takumi', language: 'Japanese (JP)', languageCode: 'ja-JP', gender: 'Male',   engines: ['standard', 'neural'] },
  // Korean
  { id: 'Seoyeon', name: 'Seoyeon', language: 'Korean (KR)', languageCode: 'ko-KR', gender: 'Female', engines: ['standard', 'neural'] },
  // Portuguese (BR)
  { id: 'Camila',  name: 'Camila',  language: 'Portuguese (BR)', languageCode: 'pt-BR', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Vitoria', name: 'Vitória', language: 'Portuguese (BR)', languageCode: 'pt-BR', gender: 'Female', engines: ['standard'] },
  { id: 'Ricardo', name: 'Ricardo', language: 'Portuguese (BR)', languageCode: 'pt-BR', gender: 'Male',   engines: ['standard'] },
  { id: 'Thiago',  name: 'Thiago',  language: 'Portuguese (BR)', languageCode: 'pt-BR', gender: 'Male',   engines: ['neural'] },
  // Portuguese (PT)
  { id: 'Ines',      name: 'Inês',      language: 'Portuguese (PT)', languageCode: 'pt-PT', gender: 'Female', engines: ['standard', 'neural'] },
  { id: 'Cristiano', name: 'Cristiano', language: 'Portuguese (PT)', languageCode: 'pt-PT', gender: 'Male',   engines: ['standard'] },
  // Dutch
  { id: 'Lotte', name: 'Lotte', language: 'Dutch (NL)', languageCode: 'nl-NL', gender: 'Female', engines: ['standard'] },
  { id: 'Ruben', name: 'Ruben', language: 'Dutch (NL)', languageCode: 'nl-NL', gender: 'Male',   engines: ['standard'] },
  { id: 'Laura', name: 'Laura', language: 'Dutch (NL)', languageCode: 'nl-NL', gender: 'Female', engines: ['neural'] },
  // Swedish
  { id: 'Astrid', name: 'Astrid', language: 'Swedish (SE)', languageCode: 'sv-SE', gender: 'Female', engines: ['standard'] },
  { id: 'Elin',   name: 'Elin',   language: 'Swedish (SE)', languageCode: 'sv-SE', gender: 'Female', engines: ['neural'] },
  // Danish
  { id: 'Naja',  name: 'Naja',  language: 'Danish (DK)', languageCode: 'da-DK', gender: 'Female', engines: ['standard'] },
  { id: 'Mads',  name: 'Mads',  language: 'Danish (DK)', languageCode: 'da-DK', gender: 'Male',   engines: ['standard'] },
  { id: 'Sofie', name: 'Sofie', language: 'Danish (DK)', languageCode: 'da-DK', gender: 'Female', engines: ['neural'] },
  // Norwegian
  { id: 'Liv', name: 'Liv', language: 'Norwegian (NO)', languageCode: 'nb-NO', gender: 'Female', engines: ['standard'] },
  { id: 'Ida', name: 'Ida', language: 'Norwegian (NO)', languageCode: 'nb-NO', gender: 'Female', engines: ['neural'] },
  // Polish
  { id: 'Ewa',   name: 'Ewa',   language: 'Polish (PL)', languageCode: 'pl-PL', gender: 'Female', engines: ['standard'] },
  { id: 'Maja',  name: 'Maja',  language: 'Polish (PL)', languageCode: 'pl-PL', gender: 'Female', engines: ['standard'] },
  { id: 'Jacek', name: 'Jacek', language: 'Polish (PL)', languageCode: 'pl-PL', gender: 'Male',   engines: ['standard'] },
  { id: 'Jan',   name: 'Jan',   language: 'Polish (PL)', languageCode: 'pl-PL', gender: 'Male',   engines: ['standard'] },
  { id: 'Ola',   name: 'Ola',   language: 'Polish (PL)', languageCode: 'pl-PL', gender: 'Female', engines: ['neural'] },
  // Russian
  { id: 'Tatyana', name: 'Tatyana', language: 'Russian (RU)', languageCode: 'ru-RU', gender: 'Female', engines: ['standard'] },
  { id: 'Maxim',   name: 'Maxim',   language: 'Russian (RU)', languageCode: 'ru-RU', gender: 'Male',   engines: ['standard'] },
  // Chinese
  { id: 'Zhiyu', name: 'Zhiyu', language: 'Chinese (CN)', languageCode: 'cmn-CN', gender: 'Female', engines: ['standard', 'neural'] },
  // Arabic
  { id: 'Zeina', name: 'Zeina', language: 'Arabic (AR)',   languageCode: 'arb',   gender: 'Female', engines: ['standard'] },
  { id: 'Hala',  name: 'Hala',  language: 'Arabic (Gulf)', languageCode: 'ar-AE', gender: 'Female', engines: ['neural'] },
  { id: 'Zayd',  name: 'Zayd',  language: 'Arabic (Gulf)', languageCode: 'ar-AE', gender: 'Male',   engines: ['neural'] },
  // Turkish
  { id: 'Filiz', name: 'Filiz', language: 'Turkish (TR)', languageCode: 'tr-TR', gender: 'Female', engines: ['standard'] },
]

export const POLLY_LANGUAGES = [...new Set(POLLY_VOICES.map(v => v.language))].sort()

export const POLLY_ENGINE_TYPES: { id: PollyEngine; label: string; description: string }[] = [
  { id: 'standard',   label: 'Standard',   description: 'Traditional TTS, broad language support' },
  { id: 'neural',     label: 'Neural',     description: 'Natural-sounding NTTS voices' },
  { id: 'long-form',  label: 'Long-form',  description: 'Optimized for long-form content' },
  { id: 'generative', label: 'Generative', description: 'AI-generated, most expressive (en-US only)' },
]

export function getVoicesForRegion(region: string): PollyVoice[] {
  const neural = isNeuralRegion(region)
  return POLLY_VOICES.filter(v => {
    if (!neural) return v.engines.includes('standard')
    return true
  })
}

export function getVoicesFiltered(region: string, language: string, engine: PollyEngine): PollyVoice[] {
  return getVoicesForRegion(region).filter(v => v.language === language && v.engines.includes(engine))
}

export function getEngineForVoice(voice: PollyVoice, region: string, preferredEngine?: PollyEngine): PollyEngine {
  if (preferredEngine && voice.engines.includes(preferredEngine)) return preferredEngine
  if (isNeuralRegion(region) && voice.engines.includes('neural')) return 'neural'
  if (voice.engines.includes('standard')) return 'standard'
  return voice.engines[0]
}

// ── AWS Signature V4 + Polly SynthesizeSpeech ────────────────────────────────

async function sha256Hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256(key: Uint8Array<ArrayBuffer>, message: string): Promise<Uint8Array<ArrayBuffer>> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return new Uint8Array(sig) as Uint8Array<ArrayBuffer>
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function buildWavHeader(pcmByteLength: number, sampleRate = 16000, numChannels = 1, bitsPerSample = 16): ArrayBuffer {
  const byteRate = sampleRate * numChannels * bitsPerSample / 8
  const blockAlign = numChannels * bitsPerSample / 8
  const buf = new ArrayBuffer(44)
  const view = new DataView(buf)
  const writeStr = (offset: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)) }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + pcmByteLength, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)        // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeStr(36, 'data')
  view.setUint32(40, pcmByteLength, true)
  return buf
}

async function pollyRequest(params: {
  text: string
  voiceId: string
  engine: PollyEngine
  region: string
  accessKeyId: string
  secretAccessKey: string
  outputFormat: 'mp3' | 'pcm'
  sampleRate?: string
}): Promise<ArrayBuffer> {
  const { text, voiceId, engine, region, accessKeyId, secretAccessKey, outputFormat, sampleRate } = params

  const pad2 = (n: number) => n.toString().padStart(2, '0')
  const now = new Date()
  const dateStamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}`
  const amzDate = `${dateStamp}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`

  const service = 'polly'
  const host = `polly.${region}.amazonaws.com`

  const isSsml = text.trimStart().startsWith('<speak>')
  const bodyObj: Record<string, string> = {
    Text: text,
    OutputFormat: outputFormat,
    VoiceId: voiceId,
    Engine: engine,
    TextType: isSsml ? 'ssml' : 'text',
  }
  if (sampleRate) bodyObj.SampleRate = sampleRate
  const requestBody = JSON.stringify(bodyObj)

  const bodyHash = await sha256Hex(requestBody)
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'content-type;host;x-amz-date'
  const canonicalRequest = ['POST', '/v1/speech', '', canonicalHeaders, signedHeaders, bodyHash].join('\n')

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n')

  let sigKey = new Uint8Array(new TextEncoder().encode(`AWS4${secretAccessKey}`).buffer) as Uint8Array<ArrayBuffer>
  sigKey = await hmacSha256(sigKey, dateStamp)
  sigKey = await hmacSha256(sigKey, region)
  sigKey = await hmacSha256(sigKey, service)
  sigKey = await hmacSha256(sigKey, 'aws4_request')
  const signature = toHex(await hmacSha256(sigKey, stringToSign))

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const response = await fetch(`https://${host}/v1/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Date': amzDate,
      'Authorization': authorization,
    },
    body: requestBody,
  })

  if (!response.ok) {
    let msg = `Polly API error ${response.status}`
    try { const j = await response.json(); msg = j.message || j.Message || msg } catch {}
    throw new Error(msg)
  }

  return response.arrayBuffer()
}

export async function synthesizeSpeech(params: {
  text: string; voiceId: string; engine: PollyEngine
  region: string; accessKeyId: string; secretAccessKey: string
}): Promise<ArrayBuffer> {
  return pollyRequest({ ...params, outputFormat: 'mp3' })
}

export async function synthesizeSpeechWav(params: {
  text: string; voiceId: string; engine: PollyEngine
  region: string; accessKeyId: string; secretAccessKey: string
}): Promise<ArrayBuffer> {
  const pcm = await pollyRequest({ ...params, outputFormat: 'pcm', sampleRate: '16000' })
  const header = buildWavHeader(pcm.byteLength)
  const wav = new Uint8Array(header.byteLength + pcm.byteLength)
  wav.set(new Uint8Array(header), 0)
  wav.set(new Uint8Array(pcm), header.byteLength)
  return wav.buffer
}
