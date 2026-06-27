import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type MusicTrack = { id: string; title: string; artist?: string; url: string };
export type AmbientKey = "rain" | "fire" | "cafe" | "wind" | "waves" | "thunder";

// Public, royalty-free MP3s (Pixabay / cdn.pixabay.com). Direct, stable URLs.
export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "px1", title: "Lo-Fi Study", artist: "Pixabay", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" },
  { id: "px2", title: "Chill Lo-Fi", artist: "Pixabay", url: "https://cdn.pixabay.com/download/audio/2022/10/30/audio_347111d654.mp3?filename=chill-lofi-music-interior-122192.mp3" },
  { id: "px3", title: "Coffee Relax", artist: "Pixabay", url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=relaxing-145038.mp3" },
  { id: "px4", title: "Jazz Lounge", artist: "Pixabay", url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bdd.mp3?filename=jazzy-abstract-beat-8550.mp3" },
  { id: "px5", title: "Slow Focus", artist: "Pixabay", url: "https://cdn.pixabay.com/download/audio/2023/06/05/audio_3c8d8c66a4.mp3?filename=lofi-chill-medium-version-159456.mp3" },
  { id: "px6", title: "Late Night Tape", artist: "Pixabay", url: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_2dde668d05.mp3?filename=lofi-chill-jazz-112190.mp3" },
  { id: "px7", title: "Rainy Window Keys", artist: "Pixabay", url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_270f49b83f.mp3?filename=piano-moment-9835.mp3" },
  { id: "px8", title: "Crochet & Coffee", artist: "Pixabay", url: "https://cdn.pixabay.com/download/audio/2024/02/13/audio_8e83e2c92e.mp3?filename=relaxing-acoustic-guitar-191428.mp3" },
];

export const AMBIENT_LIST: { key: AmbientKey; label: string; emoji: string }[] = [
  { key: "rain", label: "Chuva Suave", emoji: "🌧️" },
  { key: "fire", label: "Lareira a Estalar", emoji: "🔥" },
  { key: "cafe", label: "Sons de Café", emoji: "☕" },
  { key: "wind", label: "Vento na Floresta", emoji: "🌬️" },
  { key: "waves", label: "Ondas do Mar", emoji: "🌊" },
  { key: "thunder", label: "Trovoada", emoji: "⛈️" },
];

type Ctx = {
  // music
  playing: boolean;
  currentIndex: number;
  track: MusicTrack | null;
  volume: number;
  setVolume: (v: number) => void;
  play: (i?: number) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  // visualizer
  analyser: AnalyserNode | null;
  // ambient mixer
  ambient: Record<AmbientKey, { enabled: boolean; volume: number }>;
  setAmbient: (k: AmbientKey, patch: Partial<{ enabled: boolean; volume: number }>) => void;
  // sleep timer
  sleepRemaining: number; // seconds, 0 = off
  startSleep: (minutes: number) => void;
  cancelSleep: () => void;
};

const AtelierCtx = createContext<Ctx | null>(null);

export function useAtelierSounds() {
  const ctx = useContext(AtelierCtx);
  if (!ctx) throw new Error("useAtelierSounds requires AtelierSoundsProvider");
  return ctx;
}

function createNoise(ac: AudioContext, type: "white" | "pink" | "brown") {
  const bufferSize = 2 * ac.sampleRate;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === "pink") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

type AmbientNode = { source: AudioBufferSourceNode; gain: GainNode; extra?: AudioNode[] };

function buildAmbient(ac: AudioContext, key: AmbientKey, dest: AudioNode): AmbientNode {
  const gain = ac.createGain();
  gain.gain.value = 0;
  gain.connect(dest);
  let source: AudioBufferSourceNode;
  const extra: AudioNode[] = [];
  if (key === "rain") {
    source = createNoise(ac, "white");
    const hp = ac.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 800;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 6000;
    source.connect(hp).connect(lp).connect(gain);
    extra.push(hp, lp);
  } else if (key === "fire") {
    source = createNoise(ac, "brown");
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 900;
    // crackle via tremolo
    const trem = ac.createGain();
    trem.gain.value = 1;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 7;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain).connect(trem.gain);
    lfo.start();
    source.connect(lp).connect(trem).connect(gain);
    extra.push(lp, trem, lfo, lfoGain);
  } else if (key === "cafe") {
    source = createNoise(ac, "pink");
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = 0.7;
    source.connect(bp).connect(gain);
    extra.push(bp);
  } else {
    // wind
    source = createNoise(ac, "pink");
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 500;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    source.connect(lp).connect(gain);
    extra.push(lp, lfo, lfoGain);
  }
  if (key === "waves") {
    source = createNoise(ac, "pink");
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 700;
    // slow swelling tide
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 0.6;
    const tide = ac.createGain();
    tide.gain.value = 0.4;
    lfo.connect(lfoGain).connect(tide.gain);
    lfo.start();
    source.connect(lp).connect(tide).connect(gain);
    extra.push(lp, tide, lfo, lfoGain);
  } else if (key === "thunder") {
    // base: muffled rain
    source = createNoise(ac, "pink");
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1800;
    source.connect(lp).connect(gain);
    extra.push(lp);
    // periodic distant rumble
    const rumble = () => {
      const now = ac.currentTime;
      const burst = createNoise(ac, "brown");
      const bp = ac.createBiquadFilter();
      bp.type = "lowpass"; bp.frequency.value = 220;
      const g = ac.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.9, now + 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
      burst.connect(bp).connect(g).connect(gain);
      burst.start(now);
      burst.stop(now + 3.6);
      const next = 8000 + Math.random() * 12000;
      (gain as any)._thunderTimer = window.setTimeout(rumble, next);
    };
    (gain as any)._thunderTimer = window.setTimeout(rumble, 4000);
  }
  source.start();
  return { source, gain, extra };
}

export function AtelierSoundsProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ambientNodesRef = useRef<Partial<Record<AmbientKey, AmbientNode>>>({});
  const sleepTimerRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [ambient, setAmbientState] = useState<Record<AmbientKey, { enabled: boolean; volume: number }>>({
    rain: { enabled: false, volume: 0.5 },
    fire: { enabled: false, volume: 0.5 },
    cafe: { enabled: false, volume: 0.5 },
    wind: { enabled: false, volume: 0.5 },
    waves: { enabled: false, volume: 0.5 },
    thunder: { enabled: false, volume: 0.5 },
  });
  const [sleepRemaining, setSleepRemaining] = useState(0);

  // init audio element once
  useEffect(() => {
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.preload = "none";
    a.volume = volume;
    audioRef.current = a;
    const onEnded = () => {
      setCurrentIndex((i) => {
        const n = (i + 1) % MUSIC_TRACKS.length;
        const track = MUSIC_TRACKS[n];
        a.src = track.url;
        a.play().catch(() => setPlaying(false));
        return n;
      });
    };
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("ended", onEnded);
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureAudioContext = () => {
    if (acRef.current) return acRef.current;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ac = new AC();
    acRef.current = ac;
    const masterMusic = ac.createGain();
    masterMusic.gain.value = 1;
    musicGainRef.current = masterMusic;
    const an = ac.createAnalyser();
    an.fftSize = 128;
    analyserRef.current = an;
    setAnalyser(an);
    try {
      const src = ac.createMediaElementSource(audioRef.current!);
      src.connect(masterMusic).connect(an).connect(ac.destination);
    } catch {
      // fallback if already connected
    }
    return ac;
  };

  const play = (i?: number) => {
    const a = audioRef.current;
    if (!a) return;
    ensureAudioContext();
    acRef.current?.resume();
    const idx = typeof i === "number" ? i : currentIndex;
    if (typeof i === "number" || !a.src) {
      a.src = MUSIC_TRACKS[idx].url;
      setCurrentIndex(idx);
    }
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };
  const pause = () => { audioRef.current?.pause(); setPlaying(false); };
  const toggle = () => (playing ? pause() : play());
  const next = () => play((currentIndex + 1) % MUSIC_TRACKS.length);
  const prev = () => play((currentIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length);

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const setAmbient: Ctx["setAmbient"] = (k, patch) => {
    setAmbientState((prev) => {
      const next = { ...prev, [k]: { ...prev[k], ...patch } };
      const ac = ensureAudioContext();
      ac.resume();
      let node = ambientNodesRef.current[k];
      if (!node) {
        node = buildAmbient(ac, k, ac.destination);
        ambientNodesRef.current[k] = node;
      }
      const target = next[k].enabled ? next[k].volume : 0;
      node.gain.gain.setTargetAtTime(target, ac.currentTime, 0.05);
      return next;
    });
  };

  // sleep timer
  useEffect(() => {
    if (sleepRemaining <= 0) return;
    const id = window.setInterval(() => {
      setSleepRemaining((s) => {
        if (s <= 1) {
          pause();
          Object.keys(ambient).forEach((k) => setAmbient(k as AmbientKey, { enabled: false }));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    sleepTimerRef.current = id;
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepRemaining > 0]);

  const startSleep = (minutes: number) => setSleepRemaining(minutes * 60);
  const cancelSleep = () => setSleepRemaining(0);

  const value = useMemo<Ctx>(() => ({
    playing, currentIndex,
    track: MUSIC_TRACKS[currentIndex] ?? null,
    volume, setVolume,
    play, pause, toggle, next, prev,
    analyser,
    ambient, setAmbient,
    sleepRemaining, startSleep, cancelSleep,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [playing, currentIndex, volume, analyser, ambient, sleepRemaining]);

  return <AtelierCtx.Provider value={value}>{children}</AtelierCtx.Provider>;
}