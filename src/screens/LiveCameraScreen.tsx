// src/screens/LiveCameraScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  THE CORE SCREEN: Live camera feed + GPT-4o Vision analysis + AR overlay
//  + real-time AI voice narration + voice command control
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, ScrollView, Platform, Alert,
} from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { RootStackParamList } from '../../App';
import {
  CAT_YELLOW, BG, CARD, BORDER, GRAY, FONT_BOLD, FONT, GREEN, ORANGE, RED,
} from '../theme';
import { apiClient }   from '../services/api';
import { socketClient } from '../services/socket';
import { useVoiceControl } from '../hooks/useVoiceControl';
import ChecklistPanel  from '../components/ChecklistPanel';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveCamera'>;
const { width, height } = Dimensions.get('window');

// ── Types ─────────────────────────────────────────────────────────────────────
type BoundingBox  = { x: number; y: number; w: number; h: number; label: string };
type AiDetection  = {
  component:    string;
  severity:     'good' | 'monitor' | 'severe';
  issueType:    string;
  description:  string;
  confidence:   number;
  boundingBoxes: BoundingBox[];
  voiceMessage: string;
  partNumbers:  string[];
  actions:      string[];
};
type Finding = { status: 'good' | 'monitor' | 'severe'; note: string; aiData?: AiDetection };

const SEV_COLOR: Record<string, string> = { good: GREEN, monitor: ORANGE, severe: RED };

// ── AR Overlay Component ───────────────────────────────────────────────────────
function AROverlay({ detection, camW, camH }: { detection: AiDetection | null; camW: number; camH: number }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (detection) {
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [detection]);

  if (!detection) return null;
  const col = SEV_COLOR[detection.severity];

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity }]} pointerEvents="none">
      <Svg width={camW} height={camH}>
        {detection.boundingBoxes.map((box, i) => {
          // Convert percentage coords to pixels
          const px = (box.x / 100) * camW;
          const py = (box.y / 100) * camH;
          const pw = (box.w / 100) * camW;
          const ph = (box.h / 100) * camH;

          // Centre dot → line → label box
          const cx = px + pw / 2;
          const cy = py + ph / 2;
          const lx = cx + 60;
          const ly = cy - 50;

          return (
            <React.Fragment key={i}>
              {/* Bounding box */}
              <Rect
                x={px} y={py} width={pw} height={ph}
                stroke={col} strokeWidth={2} fill={`${col}15`} strokeDasharray="6 3"
              />
              {/* Centre dot */}
              <Circle cx={cx} cy={cy} r={6} fill={col} opacity={0.9} />
              <Circle cx={cx} cy={cy} r={12} stroke={col} strokeWidth={1.5} fill="none" opacity={0.6} />
              {/* Connector line */}
              <Line x1={cx} y1={cy} x2={lx} y2={ly} stroke={col} strokeWidth={1.5} strokeDasharray="4 3" />
              {/* Label */}
              <Rect x={lx} y={ly - 28} width={160} height={34} fill="#000D" rx={4} />
              <SvgText x={lx + 8} y={ly - 14} fill={col} fontSize={10} fontWeight="bold">
                {detection.severity.toUpperCase()} — {box.label}
              </SvgText>
              <SvgText x={lx + 8} y={ly} fill="#aaa" fontSize={9}>
                {detection.issueType}  {Math.round(detection.confidence * 100)}% conf
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </Animated.View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function LiveCameraScreen({ navigation, route }: Props) {
  const { vehicle, checklistItems } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [findings,   setFindings]   = useState<Record<string, Finding>>({});
  const [detection,  setDetection]  = useState<AiDetection | null>(null);
  const [scanning,   setScanning]   = useState(false);
  const [aiMsg,      setAiMsg]      = useState('Point camera at: ' + checklistItems[0]?.label);
  const [elapsed,    setElapsed]    = useState(0);
  const [panelOpen,  setPanelOpen]  = useState(false);
  const [mode,       setMode]       = useState<'camera' | 'upload'>('camera');
  const [uploadLoading, setUploadLoading] = useState(false);

  const cameraRef   = useRef<CameraView>(null);
  const frameTimer  = useRef<NodeJS.Timeout | null>(null);
  const timerRef    = useRef<NodeJS.Timeout | null>(null);
  const sessionId   = useRef<string>('');

  const item = checklistItems[activeIdx];

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Create inspection session on mount ────────────────────────────────────
  useEffect(() => {
    apiClient.post('/inspections', {
      vehicleId:  vehicle.id,
      mode:       'camera',
    }).then(r => { sessionId.current = r.id; });
    if (!permission?.granted) requestPermission();
  }, []);

  // ── Speak AI message ────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.92,
      onDone: () => {},
    });
  }, []);

  // ── Announce current checklist item ───────────────────────────────────────
  useEffect(() => {
    if (item) {
      const msg = `Now inspecting ${item.section}: ${item.label}`;
      setAiMsg(msg);
      speak(msg);
      setDetection(null);
      // Auto-capture frame after 1.5s settling time
      if (mode === 'camera') {
        const t = setTimeout(() => captureAndAnalyze(), 1500);
        return () => clearTimeout(t);
      }
    }
  }, [activeIdx]);

  // ── Capture frame + send to GPT-4o ────────────────────────────────────────
  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7, base64: true, skipProcessing: true,
      });
      if (!photo?.base64) return;

      // Send to backend (which calls GPT-4o Vision)
      const result: AiDetection = await apiClient.post('/ai/analyze-frame', {
        frameBase64:   photo.base64,
        vehicleModel:  vehicle.model,
        checklistItem: item,
      });

      setDetection(result);
      setAiMsg(result.voiceMessage);
      speak(result.voiceMessage);

      // Save finding to session
      if (sessionId.current) {
        await apiClient.patch(`/inspections/${sessionId.current}/finding`, {
          checklistItemId: item.id,
          status:   result.severity,
          note:     result.description,
          aiData:   result,
          imageUrl: photo.uri,
        });
      }
    } catch (err) {
      console.warn('[AI] Frame analysis error:', err);
      setAiMsg('Unable to analyze. Please check your connection.');
    } finally {
      setScanning(false);
    }
  }, [scanning, item, vehicle, mode]);

  // ── Upload image/video flow ────────────────────────────────────────────────
  const handleUpload = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      base64: true,
    });
    if (res.canceled || !res.assets[0]) return;
    setUploadLoading(true);
    try {
      const asset = res.assets[0];
      const base64 = asset.base64 || await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      const results = await apiClient.post('/ai/analyze-media', {
        mediaBase64:   base64,
        mediaType:     asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        vehicleModel:  vehicle.model,
        checklistItems: JSON.stringify(checklistItems),
      });
      // Auto-fill findings
      for (const r of results) {
        setFindings(f => ({ ...f, [r.checklistItemId]: { status: r.severity, note: r.description, aiData: r } }));
      }
      const severeCnt = results.filter((r: AiDetection) => r.severity === 'severe').length;
      speak(`Analysis complete. Found ${severeCnt} critical issues across ${results.length} inspection points.`);
      setAiMsg(`Upload analyzed — ${severeCnt} critical issue${severeCnt !== 1 ? 's' : ''} found`);
    } catch (e) {
      Alert.alert('Analysis failed', String(e));
    } finally {
      setUploadLoading(false);
    }
  };

  // ── Mark item manually ─────────────────────────────────────────────────────
  const markItem = useCallback((status: 'good' | 'monitor' | 'severe') => {
    const note = detection?.description || `Manually marked as ${status}.`;
    setFindings(f => ({ ...f, [item.id]: { status, note, aiData: detection || undefined } }));
    if (activeIdx < checklistItems.length - 1) {
      setActiveIdx(i => i + 1);
    } else {
      handleComplete();
    }
  }, [activeIdx, item, detection, checklistItems]);

  // ── Complete inspection ────────────────────────────────────────────────────
  const handleComplete = async () => {
    try {
      if (sessionId.current) {
        await apiClient.post(`/inspections/${sessionId.current}/complete`, {});
      }
      Speech.stop();
      navigation.replace('Report', { vehicle, sessionId: sessionId.current });
    } catch (e) {
      navigation.replace('Report', { vehicle, sessionId: '' });
    }
  };

  // ── Voice commands ─────────────────────────────────────────────────────────
  const { isListening, startListening } = useVoiceControl({
    wakeWord: 'hey cat',
    onCommand: (cmd) => {
      switch (cmd.intent) {
        case 'NEXT_ITEM':    if (activeIdx < checklistItems.length - 1) setActiveIdx(i => i + 1); break;
        case 'PREV_ITEM':    if (activeIdx > 0) setActiveIdx(i => i - 1); break;
        case 'MARK_STATUS':  markItem(cmd.params?.status || 'good'); break;
        case 'TAKE_PHOTO':   captureAndAnalyze(); break;
        case 'GENERATE_REPORT': handleComplete(); break;
      }
    },
  });

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progress = Math.round((Object.keys(findings).length / checklistItems.length) * 100);
  const sevCol = detection ? SEV_COLOR[detection.severity] : '#aaa';

  if (!permission?.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>Camera access is required for live inspection.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Camera / Upload area ──────────────────────────────────────────── */}
      <View style={styles.cameraArea}>
        {mode === 'camera' ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.uploadPlaceholder]}>
            <Text style={styles.uploadIcon}>📁</Text>
            <Text style={styles.uploadHint}>Tap the upload button to analyze a photo or video</Text>
          </View>
        )}

        {/* Scan grid overlay */}
        <View style={styles.scanGrid} pointerEvents="none" />

        {/* AR overlay */}
        <AROverlay detection={detection} camW={width} camH={height * 0.56} />

        {/* Top HUD */}
        <View style={styles.hud}>
          <View style={styles.hudLeft}>
            <View style={styles.recDot} />
            <Text style={styles.hudTime}>{mode === 'camera' ? 'LIVE' : 'UPLOAD'} · {fmt(elapsed)}</Text>
          </View>
          <Text style={styles.hudProgress}>{activeIdx + 1} / {checklistItems.length}</Text>
          <View style={styles.hudRight}>
            <TouchableOpacity
              style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
              onPress={startListening}
            >
              <Text style={styles.voiceBtnText}>🎙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modeBtn}
              onPress={() => setMode(m => m === 'camera' ? 'upload' : 'camera')}
            >
              <Text style={styles.modeBtnText}>{mode === 'camera' ? '📁' : '🎥'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Speech bubble */}
        <View style={styles.aiSpeech}>
          <View style={styles.aiSpeechInner}>
            <Text style={styles.aiSpeechSection}>{item?.section?.toUpperCase()}</Text>
            <Text style={styles.aiSpeechItem}>Inspecting: {item?.label}</Text>
            <Text style={[styles.aiSpeechMsg, { color: detection ? sevCol : CAT_YELLOW }]} numberOfLines={2}>
              {scanning ? '● AI Scanning…' : aiMsg}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {mode === 'upload' ? (
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: CAT_YELLOW }]}
              onPress={handleUpload}
              disabled={uploadLoading}
            >
              <Text style={[styles.scanBtnText, { color: BG }]}>
                {uploadLoading ? 'Analyzing…' : '📂 UPLOAD & ANALYZE'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.scanBtn, scanning && { opacity: 0.5 }]}
              onPress={captureAndAnalyze}
              disabled={scanning}
            >
              <Text style={styles.scanBtnText}>{scanning ? '● Scanning…' : '📸 CAPTURE & ANALYZE'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Manual mark buttons */}
        <View style={styles.markBtns}>
          {([['good', GREEN, '✓ GOOD'], ['monitor', ORANGE, '⚠ MONITOR'], ['severe', RED, '✗ SEVERE']] as const).map(([s, c, l]) => (
            <TouchableOpacity
              key={s}
              style={[styles.markBtn, { borderColor: c, backgroundColor: `${c}18` }]}
              onPress={() => markItem(s)}
            >
              <Text style={[styles.markBtnText, { color: c }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Right / Bottom checklist panel ───────────────────────────────── */}
      <ChecklistPanel
        items={checklistItems}
        findings={findings}
        activeIdx={activeIdx}
        progress={progress}
        onSelectItem={setActiveIdx}
        onComplete={handleComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000', flexDirection: 'row' },
  cameraArea:       { flex: 1, position: 'relative', overflow: 'hidden' },
  scanGrid:         {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    // Grid via border (approximate)
  },
  uploadPlaceholder:{ backgroundColor: '#050503', alignItems: 'center', justifyContent: 'center', gap: 12 },
  uploadIcon:       { fontSize: 64 },
  uploadHint:       { fontFamily: FONT, fontSize: 14, color: GRAY, textAlign: 'center', paddingHorizontal: 40 },
  hud:              { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingTop: Platform.OS === 'ios' ? 54 : 14, backgroundColor: 'rgba(0,0,0,0.6)' },
  hudLeft:          { flexDirection: 'row', alignItems: 'center', gap: 7 },
  recDot:           { width: 9, height: 9, borderRadius: 5, backgroundColor: RED },
  hudTime:          { fontFamily: FONT_BOLD, fontSize: 13, color: '#fff', letterSpacing: 2 },
  hudProgress:      { fontFamily: FONT_BOLD, fontSize: 13, color: GRAY },
  hudRight:         { flexDirection: 'row', gap: 8 },
  voiceBtn:         { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: BORDER, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  voiceBtnActive:   { borderColor: CAT_YELLOW, backgroundColor: `${CAT_YELLOW}28` },
  voiceBtnText:     { fontSize: 15 },
  modeBtn:          { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: BORDER, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  modeBtnText:      { fontSize: 15 },
  aiSpeech:         { position: 'absolute', bottom: 130, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
  aiSpeechInner:    { backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: 8, borderWidth: 1, borderColor: BORDER, padding: 12, maxWidth: 420, width: '100%' },
  aiSpeechSection:  { fontFamily: FONT_BOLD, fontSize: 9, color: '#333', letterSpacing: 3, marginBottom: 2 },
  aiSpeechItem:     { fontFamily: FONT_BOLD, fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 3 },
  aiSpeechMsg:      { fontFamily: FONT, fontSize: 12, lineHeight: 16 },
  actions:          { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center' },
  scanBtn:          { backgroundColor: 'rgba(255,205,17,0.15)', borderWidth: 1, borderColor: CAT_YELLOW, borderRadius: 5, paddingHorizontal: 28, paddingVertical: 12 },
  scanBtnText:      { fontFamily: FONT_BOLD, fontSize: 14, color: CAT_YELLOW, letterSpacing: 2 },
  markBtns:         { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  markBtn:          { flex: 1, borderWidth: 1, borderRadius: 4, paddingVertical: 10, alignItems: 'center' },
  markBtnText:      { fontFamily: FONT_BOLD, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  permContainer:    { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permText:         { fontFamily: FONT, fontSize: 15, color: GRAY, textAlign: 'center', marginBottom: 24 },
  permBtn:          { backgroundColor: CAT_YELLOW, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 5 },
  permBtnText:      { fontFamily: FONT_BOLD, fontSize: 16, fontWeight: '700', color: BG },
});
