import { useState, useEffect, useRef, useCallback } from 'react'

export type PlayState = 'idle' | 'playing' | 'paused'

export function useSpeech() {
  const [supported] = useState(() => 'speechSynthesis' in window)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [playState, setPlayState] = useState<PlayState>('idle')
  const [activeSentence, setActiveSentence] = useState<number>(-1)
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([])

  useEffect(() => {
    if (!supported) return
    const load = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length) {
        setVoices(v)
        setSelectedVoice(v[0].name)
      }
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [supported])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setPlayState('idle')
    setActiveSentence(-1)
    utterancesRef.current = []
  }, [])

  const play = useCallback((text: string) => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setActiveSentence(-1)

    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text]
    const voice = voices.find(v => v.name === selectedVoice) || null

    utterancesRef.current = sentences.map((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence.trim())
      u.voice = voice
      u.rate = rate
      u.pitch = pitch
      u.onstart = () => { setActiveSentence(i); setPlayState('playing') }
      u.onend = () => {
        if (i === sentences.length - 1) {
          setPlayState('idle')
          setActiveSentence(-1)
        }
      }
      u.onerror = () => { setPlayState('idle'); setActiveSentence(-1) }
      return u
    })

    utterancesRef.current.forEach(u => window.speechSynthesis.speak(u))
    setPlayState('playing')
  }, [supported, voices, selectedVoice, rate, pitch])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setPlayState('paused')
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setPlayState('playing')
  }, [])

  return {
    supported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    playState,
    activeSentence,
    play,
    pause,
    resume,
    stop,
  }
}
