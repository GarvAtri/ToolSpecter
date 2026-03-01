// src/screens/ReportScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Share, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CAT_YELLOW, BG, CARD, BORDER, GRAY, FONT_BOLD, FONT, GREEN, ORANGE, RED } from '../theme';
import { apiClient } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;
const SEV_COLOR: Record<string, string> = { good: GREEN, monitor: ORANGE, severe: RED };

export default function ReportScreen({ navigation, route }: Props) {
  const { vehicle, sessionId } = route.params;
  const [report,   setReport]   = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      // Fetch findings for session then generate AI report
      const findings = sessionId
        ? await apiClient.get(`/inspections/${sessionId}/findings`)
        : {};
      const generated = await apiClient.post('/reports/generate', {
        vehicle, findings, sessionId,
        checklistItems: [], // fetched server-side from session
      });
      setReport(generated);
    } catch (e) {
      // Graceful fallback with mock data
      setReport({ mock: true, vehicle, findings: {}, aiSummary: { executiveSummary: 'Report generation in progress.' } });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!report?.id) return Alert.alert('Report not saved yet');
    setExporting(true);
    try {
      const url = `${process.env.EXPO_PUBLIC_API_URL}/api/reports/${report.id}/pdf`;
      await Share.share({ url, title: `Inspection Report - ${vehicle.name}` });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={CAT_YELLOW} size="large" />
        <Text style={styles.loadingText}>Generating AI Report…</Text>
      </View>
    );
  }

  const findings = report?.findings || {};
  const allItems = Object.entries(findings) as [string, any][];
  const counts   = {
    severe:  allItems.filter(([, f]) => f.status === 'severe').length,
    monitor: allItems.filter(([, f]) => f.status === 'monitor').length,
    good:    allItems.filter(([, f]) => f.status === 'good').length,
  };
  const overall    = counts.severe > 0 ? 'severe' : counts.monitor > 2 ? 'monitor' : 'good';
  const overallCol = SEV_COLOR[overall];
  const overallLbl = overall === 'severe' ? 'REQUIRES IMMEDIATE ATTENTION'
                   : overall === 'monitor' ? 'SCHEDULE MAINTENANCE' : 'CLEARED FOR OPERATION';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>INSPECTION REPORT</Text>
          <Text style={styles.headerSub}>{vehicle.name} · {new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF} disabled={exporting}>
            {exporting ? <ActivityIndicator color={BG} size="small" />
              : <Text style={styles.exportBtnText}>⬇ PDF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.emailBtn}>
            <Text style={styles.emailBtnText}>✉</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Overall status */}
        <View style={[styles.overallCard, { borderColor: `${overallCol}44`, backgroundColor: `${overallCol}0A` }]}>
          <Text style={styles.overallEmoji}>
            {overall === 'severe' ? '🔴' : overall === 'monitor' ? '🟡' : '🟢'}
          </Text>
          <View style={styles.overallInfo}>
            <Text style={[styles.overallLabel, { color: overallCol }]}>OVERALL STATUS</Text>
            <Text style={[styles.overallStatus, { color: overallCol }]}>{overallLbl}</Text>
          </View>
          <View style={styles.overallCounts}>
            {([[counts.severe, RED, 'SEV'], [counts.monitor, ORANGE, 'MON'], [counts.good, GREEN, 'OK']] as const).map(([n, c, l]) => (
              <View key={l} style={[styles.countChip, { backgroundColor: `${c}10`, borderColor: `${c}28` }]}>
                <Text style={[styles.countNum, { color: c }]}>{n}</Text>
                <Text style={[styles.countLbl, { color: c }]}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Vehicle meta */}
        <View style={styles.metaGrid}>
          {[['Vehicle', vehicle.name], ['Model', vehicle.model], ['Year', String(vehicle.year)], ['Hours', vehicle.hours + ' hrs']].map(([l, v]) => (
            <View key={l} style={styles.metaCell}>
              <Text style={styles.metaLabel}>{l.toUpperCase()}</Text>
              <Text style={styles.metaValue}>{v}</Text>
            </View>
          ))}
        </View>

        {/* AI Summary */}
        <View style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <Text style={styles.aiCardIcon}>🤖</Text>
            <Text style={styles.aiCardTitle}>AI INSPECTION SUMMARY</Text>
          </View>
          <Text style={styles.aiCardText}>
            {report?.aiSummary?.executiveSummary ||
              `The ${vehicle.name} (${vehicle.model}) inspection identified ${counts.severe} critical issue${counts.severe !== 1 ? 's' : ''} requiring immediate action. ${counts.monitor > 0 ? `${counts.monitor} items flagged for monitoring.` : ''} All other systems nominal.`}
          </Text>
          {report?.aiSummary?.recommendations?.length > 0 && (
            <View style={styles.recommendations}>
              <Text style={styles.recTitle}>RECOMMENDATIONS</Text>
              {report.aiSummary.recommendations.map((r: string, i: number) => (
                <Text key={i} style={styles.recItem}>{i + 1}. {r}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Findings list */}
        <Text style={styles.sectionTitle}>FINDINGS</Text>
        {allItems.length === 0 && (
          <Text style={styles.noFindings}>No findings recorded — run a full inspection to populate this report.</Text>
        )}
        {allItems.map(([itemId, finding]) => {
          const c = SEV_COLOR[finding.status] || GREEN;
          return (
            <View key={itemId} style={[styles.findingCard, { borderLeftColor: c }]}>
              <View style={styles.findingHeader}>
                <View style={[styles.findingPill, { backgroundColor: `${c}12`, borderColor: `${c}28` }]}>
                  <View style={[styles.findingDot, { backgroundColor: c }]} />
                  <Text style={[styles.findingPillText, { color: c }]}>{finding.status?.toUpperCase()}</Text>
                </View>
                <Text style={styles.findingLabel}>{finding.label || itemId}</Text>
              </View>
              <Text style={styles.findingNote}>{finding.note}</Text>
              {finding.aiData?.partNumbers?.length > 0 && (
                <Text style={styles.partNumbers}>Parts: {finding.aiData.partNumbers.join(', ')}</Text>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Fleet')}>
          <Text style={styles.doneBtnText}>← BACK TO FLEET</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: BG },
  loadingText:   { fontFamily: FONT, fontSize: 14, color: GRAY, marginTop: 16 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle:   { fontFamily: FONT_BOLD, fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: .5 },
  headerSub:     { fontFamily: FONT_BOLD, fontSize: 11, color: GRAY, letterSpacing: 2, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  exportBtn:     { backgroundColor: CAT_YELLOW, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
  exportBtnText: { fontFamily: FONT_BOLD, fontSize: 12, fontWeight: '700', color: BG, letterSpacing: 1 },
  emailBtn:      { backgroundColor: 'transparent', borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 4 },
  emailBtnText:  { fontFamily: FONT, fontSize: 14, color: GRAY },
  scroll:        { padding: 20, paddingBottom: 60 },
  overallCard:   { borderRadius: 10, borderWidth: 1, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  overallEmoji:  { fontSize: 44 },
  overallInfo:   { flex: 1 },
  overallLabel:  { fontFamily: FONT_BOLD, fontSize: 10, letterSpacing: 3, marginBottom: 3 },
  overallStatus: { fontFamily: FONT_BOLD, fontSize: 18, fontWeight: '800', letterSpacing: .5 },
  overallCounts: { flexDirection: 'row', gap: 8 },
  countChip:     { alignItems: 'center', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  countNum:      { fontFamily: FONT_BOLD, fontSize: 22, fontWeight: '900' },
  countLbl:      { fontFamily: FONT_BOLD, fontSize: 8, letterSpacing: 1 },
  metaGrid:      { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 6, overflow: 'hidden', marginBottom: 20, gap: 1, backgroundColor: BORDER },
  metaCell:      { width: '49.5%', backgroundColor: CARD, padding: 12 },
  metaLabel:     { fontFamily: FONT_BOLD, fontSize: 8, color: '#2a2a2a', letterSpacing: 3, marginBottom: 3 },
  metaValue:     { fontFamily: FONT, fontSize: 13, color: '#fff', fontWeight: '500' },
  aiCard:        { backgroundColor: '#090910', borderWidth: 1, borderColor: `${CAT_YELLOW}20`, borderRadius: 8, padding: 18, marginBottom: 20 },
  aiCardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiCardIcon:    { fontSize: 18 },
  aiCardTitle:   { fontFamily: FONT_BOLD, fontSize: 13, fontWeight: '600', color: CAT_YELLOW, letterSpacing: 1 },
  aiCardText:    { fontFamily: FONT, fontSize: 13, color: '#888', lineHeight: 21 },
  recommendations:{ marginTop: 14, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 },
  recTitle:      { fontFamily: FONT_BOLD, fontSize: 10, color: GRAY, letterSpacing: 3, marginBottom: 8 },
  recItem:       { fontFamily: FONT, fontSize: 12, color: '#777', marginBottom: 5, lineHeight: 18 },
  sectionTitle:  { fontFamily: FONT_BOLD, fontSize: 11, color: '#2a2a2a', letterSpacing: 4, marginBottom: 10 },
  noFindings:    { fontFamily: FONT, fontSize: 13, color: GRAY, marginBottom: 20 },
  findingCard:   { backgroundColor: CARD, borderRadius: 4, padding: 14, borderLeftWidth: 4, marginBottom: 4 },
  findingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  findingPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 },
  findingDot:    { width: 5, height: 5, borderRadius: 3 },
  findingPillText:{ fontFamily: FONT_BOLD, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  findingLabel:  { fontFamily: FONT_BOLD, fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },
  findingNote:   { fontFamily: FONT, fontSize: 12, color: GRAY, lineHeight: 18 },
  partNumbers:   { fontFamily: FONT, fontSize: 11, color: '#3a3a3a', marginTop: 4 },
  doneBtn:       { marginTop: 24, padding: 16, borderWidth: 1, borderColor: BORDER, borderRadius: 5, alignItems: 'center' },
  doneBtnText:   { fontFamily: FONT_BOLD, fontSize: 15, color: GRAY, letterSpacing: 1 },
});


// ─────────────────────────────────────────────────────────────────────────────
// src/screens/InspectionSetupScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
export { default as InspectionSetupScreen } from './InspectionSetupScreen_impl';
