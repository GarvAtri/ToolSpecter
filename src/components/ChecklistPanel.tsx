import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChecklistItem } from '../../App';
import { CAT_YELLOW, BG, CARD, BORDER, GRAY, FONT_BOLD, FONT, GREEN, ORANGE, RED } from '../theme';

type Finding = { status: 'good' | 'monitor' | 'severe' };
const SEV_COL: Record<string, string> = { good: GREEN, monitor: ORANGE, severe: RED };

type Props = {
  items:       ChecklistItem[];
  findings:    Record<string, Finding>;
  activeIdx:   number;
  progress:    number;
  onSelectItem:(idx: number) => void;
  onComplete:  () => void;
};

export default function ChecklistPanel({ items, findings, activeIdx, progress, onSelectItem, onComplete }: Props) {
  const sections = items.reduce((acc, item) => {
    (acc[item.section] = acc[item.section] || []).push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const counts = {
    good:    Object.values(findings).filter(f => f.status === 'good').length,
    monitor: Object.values(findings).filter(f => f.status === 'monitor').length,
    severe:  Object.values(findings).filter(f => f.status === 'severe').length,
  };

  return (
    <View style={cp.panel}>
      {/* Progress */}
      <View style={cp.progressHeader}>
        <View style={cp.progressRow}>
          <Text style={cp.progressLabel}>PROGRESS</Text>
          <Text style={cp.progressPct}>{progress}%</Text>
        </View>
        <View style={cp.progressTrack}>
          <View style={[cp.progressFill, { width: `${progress}%` as any }]} />
        </View>
        <View style={cp.countsRow}>
          {([[counts.good, GREEN], [counts.monitor, ORANGE], [counts.severe, RED]] as const).map(([n, c], i) => (
            <View key={i} style={[cp.countCell, { backgroundColor: `${c}10`, borderColor: `${c}28` }]}>
              <Text style={[cp.countN, { color: c }]}>{n}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Items */}
      <ScrollView style={cp.list} showsVerticalScrollIndicator={false}>
        {Object.entries(sections).map(([sec, sitems]) => (
          <View key={sec}>
            <Text style={cp.sectionLabel}>{sec.toUpperCase()}</Text>
            {sitems.map(ci => {
              const idx = items.indexOf(ci);
              const f   = findings[ci.id];
              const isCur = idx === activeIdx;
              const fc  = f ? SEV_COL[f.status] : null;
              return (
                <TouchableOpacity key={ci.id} style={[cp.item, isCur && cp.itemActive, f && { borderLeftColor: fc! }]} onPress={() => onSelectItem(idx)}>
                  <Text style={[cp.itemLabel, isCur && { color: '#ddd' }, f && { color: '#777' }]} numberOfLines={1}>
                    {ci.label}
                  </Text>
                  {f  && <Text style={{ fontSize: 11, color: fc! }}>{f.status === 'good' ? '✓' : f.status === 'monitor' ? '⚠' : '✗'}</Text>}
                  {!f && isCur && <View style={cp.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={cp.completeBtn} onPress={onComplete}>
        <Text style={cp.completeBtnText}>GENERATE REPORT →</Text>
      </TouchableOpacity>
    </View>
  );
}

const cp = StyleSheet.create({
  panel:         { width: 220, backgroundColor: CARD, borderLeftWidth: 1, borderLeftColor: BORDER },
  progressHeader:{ padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontFamily: FONT_BOLD, fontSize: 9, color: GRAY, letterSpacing: 2 },
  progressPct:   { fontFamily: FONT_BOLD, fontSize: 16, fontWeight: '700', color: CAT_YELLOW },
  progressTrack: { height: 3, backgroundColor: '#111', borderRadius: 2, marginBottom: 8 },
  progressFill:  { height: '100%', backgroundColor: CAT_YELLOW, borderRadius: 2 },
  countsRow:     { flexDirection: 'row', gap: 6 },
  countCell:     { flex: 1, borderWidth: 1, borderRadius: 4, alignItems: 'center', paddingVertical: 4 },
  countN:        { fontFamily: FONT_BOLD, fontSize: 14, fontWeight: '700' },
  list:          { flex: 1 },
  sectionLabel:  { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 2, fontFamily: FONT_BOLD, fontSize: 8, color: '#2a2a2a', letterSpacing: 3, backgroundColor: BG },
  item:          { paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: BORDER, borderLeftWidth: 3, borderLeftColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemActive:    { backgroundColor: `${CAT_YELLOW}08`, borderLeftColor: CAT_YELLOW },
  itemLabel:     { fontFamily: FONT, fontSize: 11, color: '#3a3a3a', flex: 1 },
  activeDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: CAT_YELLOW },
  completeBtn:   { padding: 12, borderTopWidth: 1, borderTopColor: BORDER, alignItems: 'center', backgroundColor: CAT_YELLOW },
  completeBtnText:{ fontFamily: FONT_BOLD, fontSize: 13, fontWeight: '800', color: BG, letterSpacing: 1 },
});