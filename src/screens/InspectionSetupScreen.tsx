// ─────────────────────────────────────────────────────────────────────────────
// src/screens/InspectionSetupScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ChecklistItem } from '../../App';
import { CAT_YELLOW, BG, CARD, BORDER, GRAY, FONT_BOLD, FONT, GREEN } from '../theme';
import { apiClient } from '../services/api';
import { DEFAULT_CHECKLIST } from '../constants/checklist';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

export default function InspectionSetupScreen({ navigation, route }: Props) {
  const { vehicle } = route.params;
  const [mode,      setMode]     = useState<'camera' | 'video' | 'image' | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[] | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);

  const loadDefaultChecklist = () => {
    setChecklist(DEFAULT_CHECKLIST);
  };

  const handleUploadChecklist = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] });
      if (res.canceled || !res.assets[0]) return;
      setChecklistLoading(true);
      const base64 = await FileSystem.readAsStringAsync(res.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
      const items: ChecklistItem[] = await apiClient.post('/ai/extract-checklist', {
        fileText: Buffer.from(base64, 'base64').toString('utf-8'),
      });
      setChecklist(items);
      Alert.alert('Checklist loaded', `${items.length} inspection points extracted.`);
    } catch (e) {
      Alert.alert('Failed to load checklist', String(e));
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleCaptureChecklist = async () => {
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.9 });
    if (res.canceled || !res.assets[0]?.base64) return;
    setChecklistLoading(true);
    try {
      const items: ChecklistItem[] = await apiClient.post('/ai/extract-checklist', {
        imageBase64: res.assets[0].base64,
      });
      setChecklist(items);
      Alert.alert('Checklist extracted', `${items.length} inspection points from photo.`);
    } catch (e) {
      Alert.alert('Extraction failed', String(e));
    } finally {
      setChecklistLoading(false);
    }
  };

  const canStart = !!mode && !!checklist;

  const handleStart = () => {
    if (!canStart) return;
    navigation.navigate('LiveCamera', { vehicle, checklistItems: checklist! });
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backBtn}>← BACK</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>START INSPECTION</Text>
          <Text style={s.headerSub}>{vehicle.name} · {vehicle.model}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Step 1 — Checklist */}
        <Text style={s.stepLabel}>STEP 1 — LOAD INSPECTION CHECKLIST</Text>
        <View style={s.row}>
          {[
            { ic: '📄', l: 'Upload File',    sub: 'PDF, DOCX, TXT', fn: handleUploadChecklist },
            { ic: '📷', l: 'Capture Form',   sub: 'Scan paper checklist', fn: handleCaptureChecklist },
            { ic: '📋', l: 'Use Template',   sub: `${vehicle.model} standard`, fn: loadDefaultChecklist, hi: true },
          ].map((o, i) => (
            <TouchableOpacity key={i} style={[s.optCard, checklist && i === 2 && s.optCardActive]} onPress={o.fn}>
              {o.hi && <View style={s.badge}><Text style={s.badgeText}>DEFAULT</Text></View>}
              <Text style={s.optIc}>{o.ic}</Text>
              <Text style={s.optLabel}>{o.l}</Text>
              <Text style={s.optSub}>{o.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {checklistLoading && <ActivityIndicator color={CAT_YELLOW} style={{ marginTop: 8 }} />}
        {checklist && (
          <View style={s.checklistLoaded}>
            <Text style={s.checklistLoadedText}>✓ {checklist.length} inspection points loaded</Text>
          </View>
        )}

        {/* Step 2 — Mode */}
        <Text style={[s.stepLabel, { marginTop: 28 }]}>STEP 2 — CHOOSE INSPECTION MODE</Text>
        {[
          { id: 'camera', ic: '🎥', l: 'LIVE AI CAMERA', sub: 'Real-time defect detection with AR overlay and voice guidance', hi: true },
          { id: 'video',  ic: '📹', l: 'UPLOAD VIDEO',   sub: 'Analyze recorded inspection footage' },
          { id: 'image',  ic: '🖼️', l: 'UPLOAD IMAGE',   sub: 'Identify defects from part photos' },
        ].map(o => (
          <TouchableOpacity key={o.id} style={[s.modeCard, mode === o.id && s.modeCardActive]} onPress={() => setMode(o.id as any)}>
            {o.hi && <View style={s.badge}><Text style={s.badgeText}>RECOMMENDED</Text></View>}
            <Text style={s.modeIc}>{o.ic}</Text>
            <View style={s.modeInfo}>
              <Text style={[s.modeLabel, mode === o.id && { color: CAT_YELLOW }]}>{o.l}</Text>
              <Text style={s.modeSub}>{o.sub}</Text>
            </View>
            {mode === o.id && <Text style={s.modeCheck}>✓</Text>}
          </TouchableOpacity>
        ))}

        {/* Voice note */}
        <View style={s.voiceNote}>
          <Text style={s.voiceIc}>🎙️</Text>
          <View style={s.voiceInfo}>
            <Text style={s.voiceTitle}>VOICE CONTROL ENABLED</Text>
            <Text style={s.voiceSub}>Say "Hey CAT" then "next item", "mark as severe", "take photo", or "generate report". Fully hands-free for gloved inspectors.</Text>
          </View>
        </View>

        <TouchableOpacity style={[s.startBtn, !canStart && s.startBtnDisabled]} onPress={handleStart} disabled={!canStart}>
          <Text style={[s.startBtnText, !canStart && s.startBtnTextDisabled]}>
            {!checklist ? 'LOAD CHECKLIST TO CONTINUE'
              : !mode ? 'SELECT INSPECTION MODE'
              : `▶ BEGIN ${mode.toUpperCase()} INSPECTION`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: BG },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn:        { fontFamily: FONT_BOLD, fontSize: 16, color: GRAY },
  headerTitle:    { fontFamily: FONT_BOLD, fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub:      { fontFamily: FONT_BOLD, fontSize: 11, color: GRAY, letterSpacing: 2 },
  scroll:         { padding: 20, paddingBottom: 60 },
  stepLabel:      { fontFamily: FONT_BOLD, fontSize: 10, color: '#2a2a2a', letterSpacing: 4, marginBottom: 12 },
  row:            { flexDirection: 'row', gap: 10, marginBottom: 10 },
  optCard:        { flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 14, position: 'relative' },
  optCardActive:  { borderColor: CAT_YELLOW },
  badge:          { position: 'absolute', top: 8, right: 8, backgroundColor: CAT_YELLOW, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },
  badgeText:      { fontFamily: FONT_BOLD, fontSize: 7, fontWeight: '700', color: BG },
  optIc:          { fontSize: 22, marginBottom: 6 },
  optLabel:       { fontFamily: FONT_BOLD, fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 2 },
  optSub:         { fontFamily: FONT, fontSize: 10, color: GRAY },
  checklistLoaded:{ backgroundColor: '#061006', borderWidth: 1, borderColor: `${GREEN}28`, borderRadius: 6, padding: 12, flexDirection: 'row', alignItems: 'center' },
  checklistLoadedText:{ fontFamily: FONT, fontSize: 13, color: GREEN },
  modeCard:       { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, position: 'relative' },
  modeCardActive: { borderColor: CAT_YELLOW, backgroundColor: `${CAT_YELLOW}08` },
  modeIc:         { fontSize: 28 },
  modeInfo:       { flex: 1 },
  modeLabel:      { fontFamily: FONT_BOLD, fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 3, letterSpacing: .5 },
  modeSub:        { fontFamily: FONT, fontSize: 12, color: GRAY, lineHeight: 17 },
  modeCheck:      { fontFamily: FONT_BOLD, fontSize: 18, color: CAT_YELLOW },
  voiceNote:      { backgroundColor: '#090909', borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 16, flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 24 },
  voiceIc:        { fontSize: 26 },
  voiceInfo:      { flex: 1 },
  voiceTitle:     { fontFamily: FONT_BOLD, fontSize: 13, fontWeight: '600', color: CAT_YELLOW, marginBottom: 4 },
  voiceSub:       { fontFamily: FONT, fontSize: 12, color: GRAY, lineHeight: 18 },
  startBtn:       { backgroundColor: CAT_YELLOW, borderRadius: 5, padding: 17, alignItems: 'center' },
  startBtnDisabled:{ backgroundColor: '#111' },
  startBtnText:   { fontFamily: FONT_BOLD, fontSize: 20, fontWeight: '800', color: BG, letterSpacing: 2 },
  startBtnTextDisabled:{ color: '#2a2a2a' },
});
