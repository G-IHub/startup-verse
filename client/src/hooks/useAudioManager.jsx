import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchClientPreferences,
  mergeClientPreferencesPatch,
} from "../utils/api/clientPreferencesApi";

const AUDIO_PREF_KEY = "startupverse_audio_settings";

const DEFAULT_AUDIO_SETTINGS = {
  soundProfile: "balanced",
  isMuted: false,
  ambientType: "office",
  voiceCoachEnabled: false,
  voiceCoachMode: "balanced",
  voiceCoachVoice: "female",
  voiceCoachRate: 1.0,
};

// Generate smooth, soft sounds using Web Audio API
class SoundGenerator {
  constructor() {
    this.audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
  }

  // Helper to create a smooth envelope with filter
  createSmoothTone(
    frequency,
    duration,
    volume,
    type = "sine",
    attack = 0.02,
    release = 0.1,
  ) {
    if (volume === 0) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Smooth lowpass filter for warmth
    filter.type = "lowpass";
    filter.frequency.value = frequency * 2;
    filter.Q.value = 1;

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Smooth ADSR envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + attack);
    gainNode.gain.setValueAtTime(volume, now + duration - release);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // Soft layered chord with subtle harmonics
  playSmoothChord(frequencies, duration, volume) {
    frequencies.forEach((freq, index) => {
      const delay = index * 0.015; // Slight arpeggio effect
      setTimeout(() => {
        this.createSmoothTone(
          freq,
          duration,
          volume / frequencies.length,
          "sine",
          0.03,
          0.15,
        );
      }, delay * 1000);
    });
  }

  playNotification(volume, type) {
    if (type === "success") {
      // Gentle upward chime
      this.playSmoothChord([329.63, 415.3], 0.6, volume * 0.5); // E4, G#4
    } else if (type === "info") {
      // Soft single tone
      this.createSmoothTone(440, 0.4, volume * 0.4, "sine", 0.02, 0.2);
    } else if (type === "achievement") {
      // Beautiful ascending chord with sparkle
      this.playSmoothChord([261.63, 329.63, 392.0, 523.25], 1.0, volume * 0.6); // C4, E4, G4, C5
    }
  }

  playClick(volume) {
    // Soft, subtle click with filtered noise
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    filter.type = "highpass";
    filter.frequency.value = 1200;

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 2000;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(volume * 0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    oscillator.start(now);
    oscillator.stop(now + 0.04);
  }

  playWhoosh(volume) {
    // Smooth, airy whoosh sound
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    filter.Q.value = 2;

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(250, now);
    oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.5);
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  playDoorOpen(volume) {
    // Gentle ascending tone suggesting opening
    this.createSmoothTone(220, 0.25, volume * 0.4, "sine", 0.05, 0.15);
    setTimeout(
      () => this.createSmoothTone(330, 0.3, volume * 0.35, "sine", 0.03, 0.2),
      80,
    );
  }

  playDoorClose(volume) {
    // Gentle descending tone suggesting closing
    this.createSmoothTone(330, 0.25, volume * 0.4, "sine", 0.05, 0.15);
    setTimeout(
      () => this.createSmoothTone(220, 0.3, volume * 0.35, "sine", 0.03, 0.2),
      80,
    );
  }

  playBell(volume) {
    // Soft, warm bell-like chord
    this.playSmoothChord([523.25, 659.25, 783.99], 0.8, volume * 0.5);
  }

  playTick(volume) {
    // Very subtle, soft tick
    this.createSmoothTone(1200, 0.03, volume * 0.12, "sine", 0.001, 0.02);
  }
}

// TTS Manager for Voice Coach
class VoiceCoach {
  voices = [];

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Voices may load asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    this.voices = this.synth.getVoices();
  }

  selectVoice(preference) {
    const voices = this.synth.getVoices();

    // Try to find a good match based on preference
    let preferredVoice = null;

    if (preference === "female") {
      preferredVoice =
        voices.find(
          (v) =>
            v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("samantha") ||
            v.name.toLowerCase().includes("victoria") ||
            v.name.toLowerCase().includes("karen"),
        ) || null;
    } else if (preference === "male") {
      preferredVoice =
        voices.find(
          (v) =>
            v.name.toLowerCase().includes("male") ||
            v.name.toLowerCase().includes("daniel") ||
            v.name.toLowerCase().includes("alex") ||
            v.name.toLowerCase().includes("thomas"),
        ) || null;
    }

    // Fallback to default voice
    return preferredVoice || voices[0] || null;
  }

  speak(text, voicePreference, rate = 1.0) {
    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.selectVoice(voicePreference);

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 0.08; // Minimal volume to match other sounds

    this.synth.speak(utterance);
  }

  stop() {
    this.synth.cancel();
  }
}

export function useAudioManager(userId) {
  const [settings, setSettings] = useState(DEFAULT_AUDIO_SETTINGS);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchClientPreferences(String(userId))
      .then((prefs) => {
        if (cancelled) return;
        const raw = prefs[AUDIO_PREF_KEY];
        if (raw && typeof raw === "object") {
          setSettings({ ...DEFAULT_AUDIO_SETTINGS, ...raw });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const soundGenerator = useRef(null);
  const voiceCoach = useRef(null);
  const ambientAudioRef = useRef(null);

  useEffect(() => {
    soundGenerator.current = new SoundGenerator();
    voiceCoach.current = new VoiceCoach();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(() => {
      mergeClientPreferencesPatch(String(userId), {
        [AUDIO_PREF_KEY]: settings,
      }).catch(() => {});
    }, 450);
    return () => clearTimeout(t);
  }, [settings, userId]);

  const getEffectiveVolume = useCallback(() => {
    if (settings.isMuted) return 0;
    // Fixed minimal volume - barely audible
    return 0.08;
  }, [settings.isMuted]);

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Sound effect functions
  const playNotificationSound = useCallback(
    (type = "info") => {
      const volume = getEffectiveVolume();
      if (settings.soundProfile === "silent") return;
      soundGenerator.current?.playNotification(volume, type);
    },
    [getEffectiveVolume, settings.soundProfile],
  );

  const playClickSound = useCallback(() => {
    const volume = getEffectiveVolume();
    if (
      settings.soundProfile === "silent" ||
      settings.soundProfile === "minimal"
    )
      return;
    soundGenerator.current?.playClick(volume);
  }, [getEffectiveVolume, settings.soundProfile]);

  const playWhooshSound = useCallback(() => {
    const volume = getEffectiveVolume();
    if (settings.soundProfile === "silent") return;
    soundGenerator.current?.playWhoosh(volume);
  }, [getEffectiveVolume, settings.soundProfile]);

  const playDoorSound = useCallback(
    (type) => {
      const volume = getEffectiveVolume();
      if (
        settings.soundProfile === "silent" ||
        settings.soundProfile === "minimal"
      )
        return;
      if (type === "open") {
        soundGenerator.current?.playDoorOpen(volume);
      } else {
        soundGenerator.current?.playDoorClose(volume);
      }
    },
    [getEffectiveVolume, settings.soundProfile],
  );

  const playBellSound = useCallback(() => {
    const volume = getEffectiveVolume();
    if (settings.soundProfile === "silent") return;
    soundGenerator.current?.playBell(volume);
  }, [getEffectiveVolume, settings.soundProfile]);

  const playTickSound = useCallback(() => {
    const volume = getEffectiveVolume();
    if (settings.soundProfile !== "immersive") return;
    soundGenerator.current?.playTick(volume);
  }, [getEffectiveVolume, settings.soundProfile]);

  const playAchievementSound = useCallback(() => {
    const volume = getEffectiveVolume();
    if (settings.soundProfile === "silent") return;
    soundGenerator.current?.playNotification(volume, "achievement");
  }, [getEffectiveVolume, settings.soundProfile]);

  // Voice Coach TTS functions
  const speakCoachMessage = useCallback(
    (message, level) => {
      if (!settings.voiceCoachEnabled || settings.voiceCoachMode === "off")
        return;
      if (settings.isMuted) return;

      // Check if the current mode supports this level of coaching
      const modes = ["minimal", "balanced", "full"];
      const currentModeLevel = modes.indexOf(settings.voiceCoachMode);
      const requiredLevel = modes.indexOf(level);

      if (currentModeLevel < requiredLevel) return;

      voiceCoach.current?.speak(
        message,
        settings.voiceCoachVoice,
        settings.voiceCoachRate,
      );
    },
    [
      settings.voiceCoachEnabled,
      settings.voiceCoachMode,
      settings.voiceCoachVoice,
      settings.voiceCoachRate,
      settings.isMuted,
    ],
  );

  const stopCoachSpeaking = useCallback(() => {
    voiceCoach.current?.stop();
  }, []);

  // Ambient audio management
  const startAmbient = useCallback(() => {
    if (settings.ambientType === "none" || settings.soundProfile === "silent")
      return;

    // In a real implementation, you would load actual audio files here
    // For now, we'll create a subtle white noise effect
    const volume = getEffectiveVolume();

    // This is a placeholder - in production, you'd load actual ambient audio files
    console.log(
      `Starting ambient: ${settings.ambientType} at volume ${volume}`,
    );
  }, [settings.ambientType, settings.soundProfile, getEffectiveVolume]);

  const stopAmbient = useCallback(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
    }
  }, []);

  return {
    settings,
    updateSettings,
    playNotificationSound,
    playClickSound,
    playWhooshSound,
    playDoorSound,
    playBellSound,
    playTickSound,
    playAchievementSound,
    startAmbient,
    stopAmbient,
    speakCoachMessage,
    stopCoachSpeaking,
  };
}
