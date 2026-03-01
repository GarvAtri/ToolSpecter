// src/screens/FleetScreen.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, Animated, PanResponder, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Canvas } from '@react-three/fiber/native';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei/native';
import { Suspense } from 'react';
import { RootStackParamList, Vehicle } from '../../App';
import { CAT_YELLOW, BG, CARD, BORDER, GRAY, FONT_BOLD, FONT, GREEN, ORANGE, RED } from '../theme';
import { useVehicles } from '../hooks/useVehicles';
import { useVoiceControl } from '../hooks/useVoiceControl';

type Props = NativeStackScreenProps<RootStackParamList, 'Fleet'>;
const { width } = Dimensions.get('window');
const CARD_W = width * 0.72;
const SPACING = 16;

// ── 3D Model Component ─────────────────────────────────────────────────────────
function VehicleModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <primitive
      object={scene}
      scale={[1.4, 1.4, 1.4]}
      position={[0, -0.5, 0]}
      rotation={[0, Math.PI / 6, 0]}
    />
  );
}

function FallbackModel({ emoji }: { emoji: string }) {
  // Used when no GLB is available — renders a placeholder mesh
  return null; // RN canvas shows emoji overlay instead
}

// ── Vehicle 3D Card ────────────────────────────────────────────────────────────
function VehicleCard3D({
  vehicle, isActive, onPress,
}: { vehicle: Vehicle; isActive: boolean; onPress: () => void }) {
  const scale   = useRef(new Animated.Value(isActive ? 1 : 0.82)).current;
  const opacity = useRef(new Animated.Value(isActive ? 1 : 0.45)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: isActive ? 1 : 0.82, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: isActive ? 1 : 0.45, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [isActive]);

  const sc = vehicle.status === 'severe' ? RED : vehicle.status === 'monitor' ? ORANGE : GREEN;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ flex: 1 }}>
        {/* Status stripe */}
        <View style={[styles.statusStripe, { backgroundColor: sc }]} />

        {/* 3D Canvas or emoji fallback */}
        <View style={styles.canvasArea}>
          {vehicle.glbUrl ? (
            <Suspense fallback={<ActivityIndicator color={CAT_YELLOW} />}>
              <Canvas camera={{ position: [0, 0.5, 3.5], fov: 40 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 5, 5]} intensity={1.2} />
                <pointLight position={[-3, 3, -3]} intensity={0.4} color={CAT_YELLOW} />
                <VehicleModel url={vehicle.glbUrl} />
                <OrbitControls
                  enablePan={false}
                  enableZoom={false}
                  autoRotate={isActive}
                  autoRotateSpeed={1.2}
                />
                <Environment preset="warehouse" />
              </Canvas>
            </Suspense>
          ) : (
            <Text style={styles.emoji}>🏗️</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.vehicleName}>{vehicle.name}</Text>
          <Text style={styles.vehicleSub}>{vehicle.model} · {vehicle.year}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>⏱ {vehicle.hours} hrs</Text>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: sc }]} />
              <Text style={[styles.statusLabel, { color: sc }]}>
                {vehicle.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Fleet Screen ───────────────────────────────────────────────────────────────
export default function FleetScreen({ navigation }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<FlatList>(null);
  const { vehicles, loading, refetch } = useVehicles();

  // Voice control: "Hey CAT, inspect vehicle" / "next vehicle" / "previous"
  const { isListening, voiceLabel, startListening } = useVoiceControl({
    wakeWord: 'hey cat',
    onCommand: (cmd) => {
      if (cmd.intent === 'NEXT_ITEM')    scrollTo(activeIdx + 1);
      if (cmd.intent === 'PREV_ITEM')    scrollTo(activeIdx - 1);
      if (cmd.intent === 'INSPECT_NOW')  handleInspect();
    },
  });

  const scrollTo = useCallback((i: number) => {
    const n = vehicles.length;
    const next = ((i % n) + n) % n;
    setActiveIdx(next);
    listRef.current?.scrollToIndex({ index: next, animated: true, viewPosition: 0.5 });
  }, [vehicles]);

  const handleInspect = () => {
    if (!vehicles[activeIdx]) return;
    navigation.navigate('Setup', { vehicle: vehicles[activeIdx] });
  };

  const counts = {
    good:    vehicles.filter(v => v.status === 'good').length,
    monitor: vehicles.filter(v => v.status === 'monitor').length,
    severe:  vehicles.filter(v => v.status === 'severe').length,
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={CAT_YELLOW} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Nav bar */}
      <View style={styles.nav}>
        <View style={styles.navLeft}>
          <View style={styles.navLogo}><Text style={styles.navLogoText}>CAT</Text></View>
          <View>
            <Text style={styles.navTitle}>INSPECT AI</Text>
            <Text style={styles.navSub}>FLEET DASHBOARD</Text>
          </View>
        </View>
        <View style={styles.navRight}>
          {voiceLabel ? (
            <Text style={styles.voiceLabel} numberOfLines={1}>{voiceLabel}</Text>
          ) : null}
          <TouchableOpacity style={[styles.voiceBtn, isListening && styles.voiceBtnActive]} onPress={startListening}>
            <Text style={styles.voiceBtnIcon}>🎙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fleet header */}
      <View style={styles.fleetHeader}>
        <Text style={styles.fleetSub}>YOUR FLEET</Text>
        <Text style={styles.fleetCount}>
          {vehicles.length} <Text style={styles.fleetCountLight}>vehicles registered</Text>
        </Text>
      </View>

      {vehicles.length === 0 ? (
        // Empty state
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚧</Text>
          <Text style={styles.emptyText}>No vehicles yet</Text>
          <TouchableOpacity style={styles.addBtnBig} onPress={() => navigation.navigate('AddVehicle')}>
            <Text style={styles.addBtnBigText}>+ ADD YOUR FIRST VEHICLE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Carousel */}
          <View style={styles.carouselWrap}>
            {/* Prev arrow */}
            <TouchableOpacity style={styles.arrow} onPress={() => scrollTo(activeIdx - 1)}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <FlatList
              ref={listRef}
              data={vehicles}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={v => v.id}
              snapToInterval={CARD_W + SPACING}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: (width - CARD_W) / 2 - SPACING / 2 }}
              ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + SPACING));
                setActiveIdx(Math.max(0, Math.min(idx, vehicles.length - 1)));
              }}
              renderItem={({ item, index }) => (
                <VehicleCard3D
                  vehicle={item}
                  isActive={index === activeIdx}
                  onPress={() => scrollTo(index)}
                />
              )}
            />

            {/* Next arrow */}
            <TouchableOpacity style={[styles.arrow, styles.arrowRight]} onPress={() => scrollTo(activeIdx + 1)}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {vehicles.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => scrollTo(i)}>
                <View style={[styles.dot, i === activeIdx && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Inspect button */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.inspectBtn} onPress={handleInspect}>
              <Text style={styles.inspectBtnText}>⚡ INSPECT NOW</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddVehicle')}>
              <Text style={styles.addBtnText}>+ ADD</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Stats bar */}
      <View style={styles.statsBar}>
        {[[counts.good, GREEN, 'GOOD'], [counts.monitor, ORANGE, 'MONITOR'], [counts.severe, RED, 'SEVERE']].map(([n, c, l]) => (
          <View key={l as string} style={styles.statCell}>
            <Text style={[styles.statNum, { color: c as string }]}>{n as number}</Text>
            <Text style={styles.statLbl}>{l as string}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: BG },
  nav:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  navLeft:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navLogo:          { backgroundColor: CAT_YELLOW, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 3 },
  navLogoText:      { fontFamily: FONT_BOLD, fontSize: 18, fontWeight: '900', color: BG },
  navTitle:         { fontFamily: FONT_BOLD, fontSize: 14, fontWeight: '600', color: '#fff', letterSpacing: 1 },
  navSub:           { fontFamily: FONT, fontSize: 9, color: '#2a2a2a', letterSpacing: 2 },
  navRight:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  voiceLabel:       { fontFamily: FONT, fontSize: 11, color: CAT_YELLOW, maxWidth: 180 },
  voiceBtn:         { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: BORDER, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' },
  voiceBtnActive:   { borderColor: CAT_YELLOW, backgroundColor: `${CAT_YELLOW}28` },
  voiceBtnIcon:     { fontSize: 16 },
  fleetHeader:      { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  fleetSub:         { fontFamily: FONT_BOLD, fontSize: 10, color: '#2a2a2a', letterSpacing: 5 },
  fleetCount:       { fontFamily: FONT_BOLD, fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 2 },
  fleetCountLight:  { fontFamily: FONT_BOLD, fontWeight: '300', color: GRAY },
  carouselWrap:     { position: 'relative', marginTop: 8 },
  arrow:            { position: 'absolute', left: 8, top: '40%', zIndex: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  arrowRight:       { left: undefined, right: 8 },
  arrowText:        { color: CAT_YELLOW, fontSize: 22, lineHeight: 26 },
  card:             { width: CARD_W, height: 310, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  statusStripe:     { height: 3 },
  canvasArea:       { height: 180, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  emoji:            { fontSize: 80 },
  cardInfo:         { padding: 16 },
  vehicleName:      { fontFamily: FONT_BOLD, fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  vehicleSub:       { fontFamily: FONT, fontSize: 12, color: GRAY, letterSpacing: 1, marginBottom: 10 },
  statsRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statText:         { fontFamily: FONT, fontSize: 12, color: GRAY },
  statusPill:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusDot:        { width: 6, height: 6, borderRadius: 3 },
  statusLabel:      { fontFamily: FONT_BOLD, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dotsRow:          { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1a1a1a' },
  dotActive:        { width: 22, backgroundColor: CAT_YELLOW },
  actions:          { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: 20, marginTop: 20 },
  inspectBtn:       { flex: 1, backgroundColor: CAT_YELLOW, padding: 16, borderRadius: 5, alignItems: 'center' },
  inspectBtnText:   { fontFamily: FONT_BOLD, fontSize: 20, fontWeight: '800', color: BG, letterSpacing: 2 },
  addBtn:           { backgroundColor: 'transparent', borderWidth: 1, borderColor: BORDER, padding: 16, borderRadius: 5, alignItems: 'center', paddingHorizontal: 22 },
  addBtnText:       { fontFamily: FONT_BOLD, fontSize: 16, fontWeight: '600', color: GRAY, letterSpacing: 1 },
  emptyState:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:        { fontSize: 60, marginBottom: 16 },
  emptyText:        { fontFamily: FONT_BOLD, fontSize: 22, color: GRAY, marginBottom: 28 },
  addBtnBig:        { backgroundColor: CAT_YELLOW, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 5 },
  addBtnBigText:    { fontFamily: FONT_BOLD, fontSize: 18, fontWeight: '800', color: BG, letterSpacing: 1 },
  statsBar:         { flexDirection: 'row', borderTopWidth: 1, borderTopColor: BORDER },
  statCell:         { flex: 1, padding: 14, borderRightWidth: 1, borderRightColor: BORDER },
  statNum:          { fontFamily: FONT_BOLD, fontSize: 26, fontWeight: '800' },
  statLbl:          { fontFamily: FONT_BOLD, fontSize: 8, color: '#2a2a2a', letterSpacing: 3, marginTop: 2 },
});
