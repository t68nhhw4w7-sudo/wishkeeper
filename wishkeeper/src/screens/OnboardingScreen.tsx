// src/screens/OnboardingScreen.tsx
// 4-step onboarding: welcome → name/birthday → celebration style → invite family

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Dimensions, ScrollView, Animated, Platform, KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { UserService } from '../services/firebase';

const { width } = Dimensions.get('window');
const PURPLE = '#534AB7';
const PINK   = '#D4537E';
const TEAL   = '#1D9E75';

const CELEBRATION_STYLES = [
  { key: 'intimate', label: 'Intimate gatherings', emoji: '🕯️' },
  { key: 'big_party', label: 'Big celebrations', emoji: '🎉' },
  { key: 'experiences', label: 'Experiences over things', emoji: '✈️' },
  { key: 'family_traditions', label: 'Family traditions', emoji: '👨‍👩‍👧' },
  { key: 'luxury', label: 'A little luxury', emoji: '💍' },
  { key: 'acts_of_service', label: 'Acts of service', emoji: '❤️' },
];

const MILESTONES = [
  { key: 'birthday', label: 'Birthday', emoji: '🎂' },
  { key: 'anniversary', label: 'Anniversary', emoji: '💑' },
  { key: 'eid', label: 'Eid', emoji: '🌙' },
  { key: 'mothers_day', label: "Mother's Day", emoji: '🌸' },
  { key: 'holiday', label: 'Holiday season', emoji: '🎁' },
  { key: 'graduation', label: 'Graduations', emoji: '🎓' },
];

export default function OnboardingScreen() {
  const nav = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  // Step 1 fields
  const [displayName, setDisplayName] = useState('');
  const [birthdate, setBirthdate]     = useState('');

  // Step 2 fields
  const [celebStyles, setCelebStyles] = useState<string[]>([]);
  const [milestones, setMilestones]   = useState<string[]>([]);

  // Step 3 fields
  const [inviteEmail, setInviteEmail] = useState('');
  const [remindersOn, setRemindersOn] = useState(true);

  const [saving, setSaving] = useState(false);

  const goTo = (n: number) => {
    setStep(n);
    scrollRef.current?.scrollTo({ x: n * width, animated: true });
    Animated.timing(progress, { toValue: n / 3, duration: 300, useNativeDriver: false }).start();
  };

  const toggleStyle = (key: string) => {
    setCelebStyles(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleMilestone = (key: string) => {
    setMilestones(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const finish = async () => {
    setSaving(true);
    try {
      const uid = auth().currentUser?.uid;
      if (!uid) return;
      await UserService.update(uid, {
        displayName: displayName.trim() || 'My Profile',
        birthdate,
      });
      nav.replace('Main');
    } finally {
      setSaving(false);
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8F7FF' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Progress bar */}
      <View style={styles.progressOuter}>
        <Animated.View style={[styles.progressInner, { width: progressWidth }]} />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* ── Step 0: Welcome ──────────────────────────────── */}
        <View style={[styles.slide, { width }]}>
          <Text style={styles.bigEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>Welcome to{'\n'}WishKeeper</Text>
          <Text style={styles.heroSub}>
            Your private celebration hub where your family always knows how to make you feel truly special.
          </Text>
          <View style={styles.featureList}>
            {[
              ['🎂', 'Capture exactly how you want to be celebrated'],
              ['👨‍👩‍👧', 'Share selectively with family — no surprises ruined'],
              ['💍', 'Build vision boards for every milestone'],
              ['🔒', 'Private and secure — you control everything'],
            ].map(([emoji, text]) => (
              <View key={text} style={styles.featureRow}>
                <Text style={styles.featureEmoji}>{emoji}</Text>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => goTo(1)}>
            <Text style={styles.primaryBtnText}>Get started</Text>
          </TouchableOpacity>
          <Text style={styles.alreadyHave}>Already have an account? <Text style={{ color: PURPLE, fontWeight: '700' }}>Sign in</Text></Text>
        </View>

        {/* ── Step 1: Your profile ──────────────────────────── */}
        <View style={[styles.slide, { width }]}>
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
          <Text style={styles.stepTitle}>Tell us about you</Text>
          <Text style={styles.stepSub}>So your family knows when to celebrate</Text>

          <Text style={styles.fieldLabel}>Your name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Sarah Ahmed"
            autoFocus
          />

          <Text style={styles.fieldLabel}>Birthday</Text>
          <TextInput
            style={styles.input}
            value={birthdate}
            onChangeText={setBirthdate}
            placeholder="MM/DD/YYYY"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.fieldLabel}>Anniversary (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/DD/YYYY"
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => goTo(0)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]} onPress={() => goTo(2)}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Step 2: Celebration style ────────────────────── */}
        <View style={[styles.slide, { width, paddingBottom: 32 }]}>
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
          <Text style={styles.stepTitle}>How do you love to celebrate?</Text>
          <Text style={styles.stepSub}>Pick all that feel like you</Text>

          <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Your style</Text>
          <View style={styles.chipGrid}>
            {CELEBRATION_STYLES.map(s => (
              <TouchableOpacity
                key={s.key}
                onPress={() => toggleStyle(s.key)}
                style={[styles.selChip, celebStyles.includes(s.key) && styles.selChipActive]}
              >
                <Text style={styles.selEmoji}>{s.emoji}</Text>
                <Text style={[styles.selLabel, celebStyles.includes(s.key) && { color: '#fff' }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16, marginBottom: 8 }]}>Important milestones</Text>
          <View style={styles.chipGrid}>
            {MILESTONES.map(m => (
              <TouchableOpacity
                key={m.key}
                onPress={() => toggleMilestone(m.key)}
                style={[styles.selChip, milestones.includes(m.key) && styles.selChipActive]}
              >
                <Text style={styles.selEmoji}>{m.emoji}</Text>
                <Text style={[styles.selLabel, milestones.includes(m.key) && { color: '#fff' }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => goTo(1)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]} onPress={() => goTo(3)}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Step 3: Invite & finish ───────────────────────── */}
        <View style={[styles.slide, { width }]}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={styles.stepLabel}>Step 3 of 3</Text>
          <Text style={styles.stepTitle}>Invite your first family member</Text>
          <Text style={styles.stepSub}>They'll get an email with a special link to view your wishes</Text>

          <TextInput
            style={styles.input}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="spouse@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.reminderRow}>
            <View>
              <Text style={styles.fieldLabel}>Enable celebration reminders</Text>
              <Text style={{ fontSize: 12, color: '#888' }}>Family gets reminded before your big days</Text>
            </View>
            <Switch value={remindersOn} onValueChange={setRemindersOn} trackColor={{ true: PURPLE }} />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 24, opacity: saving ? 0.6 : 1 }]}
            onPress={finish}
            disabled={saving}
          >
            <Text style={styles.primaryBtnText}>{saving ? 'Setting up...' : 'Enter WishKeeper ✨'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={finish} style={{ marginTop: 12 }}>
            <Text style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  progressOuter:    { height: 4, backgroundColor: '#e0deff', marginTop: Platform.OS === 'ios' ? 50 : 24 },
  progressInner:    { height: 4, backgroundColor: PURPLE },
  slide:            { paddingHorizontal: 28, paddingTop: 40, flex: 1 },
  bigEmoji:         { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  heroTitle:        { fontSize: 30, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', lineHeight: 36, marginBottom: 12 },
  heroSub:          { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  featureList:      { gap: 14, marginBottom: 32 },
  featureRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureEmoji:     { fontSize: 20, width: 28 },
  featureText:      { fontSize: 14, color: '#444', flex: 1, lineHeight: 20 },
  stepLabel:        { fontSize: 12, color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  stepTitle:        { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  stepSub:          { fontSize: 14, color: '#888', marginBottom: 24 },
  fieldLabel:       { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:            { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0deff', marginBottom: 16 },
  chipGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selChip:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0deff', gap: 6 },
  selChipActive:    { backgroundColor: PURPLE, borderColor: PURPLE },
  selEmoji:         { fontSize: 16 },
  selLabel:         { fontSize: 13, color: '#555', fontWeight: '500' },
  primaryBtn:       { backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn:     { borderWidth: 1.5, borderColor: '#e0deff', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
  secondaryBtnText: { color: '#888', fontSize: 15, fontWeight: '600' },
  alreadyHave:      { textAlign: 'center', color: '#888', fontSize: 13, marginTop: 16 },
  reminderRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f7ff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e0deff' },
});
