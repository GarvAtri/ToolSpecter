import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { apiClient } from '../services/api';

type VoiceCommand = { intent: string; params?: Record<string, any>; confidence: number };
type Options = { wakeWord: string; onCommand: (cmd: VoiceCommand) => void };

export function useVoiceControl({ wakeWord, onCommand }: Options) {
  const [isListening, setIsListening] = useState(false);
  const [voiceLabel,  setVoiceLabel]  = useState('');
  const recording = useRef<Audio.Recording | null>(null);

  const startListening = useCallback(async () => {
    if (isListening) return;
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recording.current = rec;
      setIsListening(true);
      setVoiceLabel(`🎙️ Say "${wakeWord}"…`);

      // Auto-stop after 4 seconds
      setTimeout(async () => {
        await stopListening();
      }, 4000);
    } catch (e) {
      console.warn('[Voice] Recording error:', e);
    }
  }, [isListening, wakeWord]);

  const stopListening = useCallback(async () => {
    if (!recording.current) return;
    try {
      await recording.current.stopAndUnloadAsync();
      const uri  = recording.current.getURI();
      recording.current = null;
      setIsListening(false);
      if (!uri) return;

      setVoiceLabel('Processing…');

      // Read audio and send to Whisper via backend
      const FileSystem = require('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const { text } = await apiClient.post('/ai/transcribe', { audioBase64: base64 });

      setVoiceLabel(`Heard: "${text}"`);

      // Check for wake word
      if (text.toLowerCase().includes(wakeWord)) {
        const command = text.toLowerCase().replace(wakeWord, '').trim();
        const intent  = await apiClient.post('/ai/voice-command', {
          transcript: command, context: {},
        });
        onCommand(intent);
        setVoiceLabel(`✓ ${intent.intent.replace('_', ' ')}`);
      } else {
        setVoiceLabel('Wake word not detected');
      }

      setTimeout(() => setVoiceLabel(''), 2500);
    } catch (e) {
      console.warn('[Voice] Error:', e);
      setVoiceLabel('');
      setIsListening(false);
    }
  }, [wakeWord, onCommand]);

  return { isListening, voiceLabel, startListening, stopListening };
}