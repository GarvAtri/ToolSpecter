// src/screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CAT_YELLOW, BG, FONT_BOLD } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;
const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }: Props) {
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const logoScale     = useRef(new Animated.Value(0.85)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barWidth      = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade + scale in logo
      Animated.parallel([
        Animated.timing(logoOpacity,    { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoScale,      { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      // Tagline appears
      Animated.timing(taglineOpacity,   { toValue: 1, duration: 400, useNativeDriver: true }),
      // Progress bar fills
      Animated.timing(barWidth,         { toValue: width * 0.45, duration: 1100, useNativeDriver: false }),
      // Hold
      Animated.delay(300),
      // Fade out entire screen
      Animated.timing(screenOpacity,    { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => navigation.replace('Login'));
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Hexagon grid background (SVG via expo-svg) */}
      <View style={styles.hexBg} />

      {/* Pulsing rings */}
      <Ring delay={0}   size={320} />
      <Ring delay={400} size={240} />

      {/* Logo block */}
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center' }}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>CAT</Text>
        </View>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          INSPECT AI
        </Animated.Text>
        <Animated.Text style={[styles.sub, { opacity: taglineOpacity }]}>
          CONNECTING THE PHYSICAL & THE DIGITAL
        </Animated.Text>
      </Animated.View>

      {/* Loading bar */}
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]} />
      </View>
      <Text style={styles.initText}>INITIALIZING</Text>
    </Animated.View>
  );
}

function Ring({ delay, size }: { delay: number; size: number }) {
  const opacity = useRef(new Animated.Value(0.6)).current;
  const scale   = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 2.2, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2,
      borderWidth: 1, borderColor: CAT_YELLOW,
      opacity, transform: [{ scale }],
    }} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  hexBg:     { position: 'absolute', inset: 0, opacity: 0.04, backgroundColor: 'transparent' },
  logoBox: {
    backgroundColor: CAT_YELLOW,
    paddingHorizontal: 44, paddingVertical: 14,
    marginBottom: 18,
    // Parallelogram via skewX not natively easy in RN — use borderRadius as fallback
    borderRadius: 4,
  },
  logoText: { fontFamily: FONT_BOLD, fontSize: 68, fontWeight: '900', color: BG, letterSpacing: -2 },
  tagline:  { fontFamily: FONT_BOLD, fontSize: 20, fontWeight: '700', color: CAT_YELLOW, letterSpacing: 10 },
  sub:      { fontFamily: FONT_BOLD, fontSize: 11, color: '#333', letterSpacing: 3, marginTop: 6 },
  barTrack: { position: 'absolute', bottom: 80, width: width * 0.45, height: 2, backgroundColor: '#111', borderRadius: 1 },
  barFill:  { height: '100%', backgroundColor: CAT_YELLOW, borderRadius: 1 },
  initText: { position: 'absolute', bottom: 60, fontFamily: FONT_BOLD, fontSize: 10, color: '#333', letterSpacing: 4 },
});
