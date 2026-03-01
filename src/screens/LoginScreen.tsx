// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../../App';
import { CAT_YELLOW, BG, CARD, BORDER, GRAY, FONT_BOLD, FONT } from '../theme';
import { apiClient } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID });

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail]     = useState('');
  const [pass,  setPass]      = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const saveAndNavigate = async (token: string) => {
    await SecureStore.setItemAsync('auth_token', token);
    navigation.replace('Fleet');
  };

  // ── Google Sign-In ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading('google');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken  = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token returned');
      const { token } = await apiClient.post('/auth/google', { idToken });
      await saveAndNavigate(token);
    } catch (e: any) {
      Alert.alert('Sign-in failed', e.message);
    } finally {
      setLoading(null);
    }
  };

  // ── Email Sign-In ───────────────────────────────────────────────────────────
  const handleEmail = async () => {
    if (!email || !pass) return Alert.alert('Please enter email and password');
    setLoading('email');
    try {
      const { token } = await apiClient.post('/auth/email', { email, password: pass });
      await saveAndNavigate(token);
    } catch (e: any) {
      Alert.alert('Sign-in failed', e.message);
    } finally {
      setLoading(null);
    }
  };

  // ── CAT SSO (SAML/OIDC) ─────────────────────────────────────────────────────
  const handleSSO = async () => {
    setLoading('sso');
    try {
      // In production: open WebBrowser to CAT's OIDC endpoint
      // const result = await WebBrowser.openAuthSessionAsync(SSO_URL);
      // Parse token from result.url callback
      Alert.alert('SSO', 'Open WebBrowser to CAT Identity Provider — implement with expo-web-browser');
    } finally {
      setLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Left branding area (shown on tablet / landscape) */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>CAT</Text>
          </View>
          <Text style={styles.headline}>Welcome back,{'\n'}Inspector.</Text>
          {['🎙️  Voice-controlled — works with gloves',
            '🔍  Real-time AI defect detection',
            '📊  Instant color-coded reports'].map((t, i) => (
            <Text key={i} style={styles.bullet}>{t}</Text>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Google */}
          <TouchableOpacity style={styles.socialBtn} onPress={handleGoogle} disabled={!!loading}>
            {loading === 'google'
              ? <ActivityIndicator color={CAT_YELLOW} />
              : <Text style={styles.socialBtnText}>🔵  Continue with Google</Text>}
          </TouchableOpacity>

          {/* CAT SSO */}
          <TouchableOpacity style={styles.socialBtn} onPress={handleSSO} disabled={!!loading}>
            {loading === 'sso'
              ? <ActivityIndicator color={CAT_YELLOW} />
              : <Text style={styles.socialBtnText}>🏢  Caterpillar SSO</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or email</Text>
            <View style={styles.divider} />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={GRAY}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={GRAY}
            value={pass}
            onChangeText={setPass}
            secureTextEntry
          />

          <TouchableOpacity style={styles.signInBtn} onPress={handleEmail} disabled={!!loading}>
            {loading === 'email'
              ? <ActivityIndicator color={BG} />
              : <Text style={styles.signInText}>SIGN IN →</Text>}
          </TouchableOpacity>

          <Text style={styles.footer}>
            Secured by Caterpillar Digital Identity Platform
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  scroll:      { flexGrow: 1, justifyContent: 'center', padding: 28 },
  brand:       { marginBottom: 36 },
  logoBox:     { backgroundColor: CAT_YELLOW, paddingHorizontal: 20, paddingVertical: 7, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 20 },
  logoText:    { fontFamily: FONT_BOLD, fontSize: 26, fontWeight: '900', color: BG },
  headline:    { fontFamily: FONT_BOLD, fontSize: 34, fontWeight: '700', color: '#fff', marginBottom: 16, lineHeight: 40 },
  bullet:      { fontFamily: FONT, fontSize: 13, color: '#3a3a3a', marginBottom: 6 },
  form:        {},
  socialBtn:   { backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 14, alignItems: 'center', marginBottom: 10 },
  socialBtnText:{ fontFamily: FONT, fontSize: 14, color: '#ccc' },
  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  divider:     { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { fontFamily: FONT, fontSize: 12, color: '#2a2a2a', marginHorizontal: 12 },
  input:       { backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 13, color: '#fff', fontFamily: FONT, fontSize: 14, marginBottom: 10 },
  signInBtn:   { backgroundColor: CAT_YELLOW, borderRadius: 5, padding: 15, alignItems: 'center', marginTop: 4 },
  signInText:  { fontFamily: FONT_BOLD, fontSize: 20, fontWeight: '800', color: BG, letterSpacing: 2 },
  footer:      { fontFamily: FONT, fontSize: 11, color: '#2a2a2a', textAlign: 'center', marginTop: 20 },
});
