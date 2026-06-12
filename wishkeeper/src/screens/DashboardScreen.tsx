// src/screens/DashboardScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays, parseISO, format } from 'date-fns';
import { WishService, EventService, FamilyService } from '../services/firebase';
import { Wish, CelebrationEvent, FamilyMember } from '../types';
import { currentUid } from '../services/firebase';

const PURPLE = '#534AB7';
const PINK   = '#D4537E';
const TEAL   = '#1D9E75';

export default function DashboardScreen() {
  const nav = useNavigation<any>();
  const uid = currentUid();

  const [wishes, setWishes]   = useState<Wish[]>([]);
  const [events, setEvents]   = useState<CelebrationEvent[]>([]);
  const [family, setFamily]   = useState<FamilyMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const u1 = WishService.subscribeByOwner(uid, setWishes);
    const u2 = EventService.subscribeByOwner(uid, setEvents);
    const u3 = FamilyService.subscribeByOwner(uid, setFamily);
    return () => { u1(); u2(); u3(); };
  }, [uid]);

  const topWishes   = wishes.filter(w => w.priority === 'high').slice(0, 3);
  const nextEvent   = events.find(e => differenceInDays(parseISO(e.date), new Date()) >= 0);
  const daysToNext  = nextEvent
    ? differenceInDays(parseISO(nextEvent.date), new Date())
    : null;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Greeting banner */}
      <View style={styles.banner}>
        <Text style={styles.greeting}>Welcome back 👋</Text>
        {daysToNext !== null && nextEvent && (
          <Text style={styles.subGreeting}>
            Your {nextEvent.name} is in{' '}
            <Text style={{ fontWeight: '700' }}>{daysToNext} days</Text>
          </Text>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Wishes', value: wishes.length },
          { label: 'Events',  value: events.length },
          { label: 'Family',  value: family.length },
          { label: 'Reserved', value: wishes.filter(w => w.reservedBy).length },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statNum}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Top wishes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top priority wishes</Text>
          <TouchableOpacity onPress={() => nav.navigate('Wishes')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {topWishes.length === 0 ? (
          <TouchableOpacity style={styles.emptyCard} onPress={() => nav.navigate('Wishes')}>
            <Text style={styles.emptyText}>Add your first wish →</Text>
          </TouchableOpacity>
        ) : (
          topWishes.map(w => (
            <TouchableOpacity
              key={w.id}
              style={styles.wishRow}
              onPress={() => nav.navigate('WishDetail', { wishId: w.id })}
            >
              <View style={[styles.wishDot, { backgroundColor: PINK }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.wishTitle} numberOfLines={1}>{w.title}</Text>
                <Text style={styles.wishMeta}>{w.category}{w.price ? ` · ${w.price}` : ''}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Upcoming events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming events</Text>
          <TouchableOpacity onPress={() => nav.navigate('Events')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {events.slice(0, 3).map(e => {
          const days = differenceInDays(parseISO(e.date), new Date());
          return (
            <TouchableOpacity
              key={e.id}
              style={styles.eventCard}
              onPress={() => nav.navigate('EventDetail', { eventId: e.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{e.name}</Text>
                <Text style={styles.eventDate}>
                  {format(parseISO(e.date), 'MMMM d, yyyy')} · {days >= 0 ? `${days} days away` : 'Past'}
                </Text>
                {/* Progress bar */}
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${e.planningProgress}%` as any }]} />
                </View>
                <Text style={styles.progressLabel}>{e.planningProgress}% planned</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        })}
        {events.length === 0 && (
          <TouchableOpacity style={styles.emptyCard} onPress={() => nav.navigate('Events')}>
            <Text style={styles.emptyText}>Add your first event →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsRow}>
          {[
            { label: 'Add wish',   icon: '🎁', screen: 'AddEditWish' },
            { label: 'Add event',  icon: '🎂', screen: 'AddEditEvent' },
            { label: 'AI ideas',   icon: '✨', screen: 'AIAssistant' },
            { label: 'Invite family', icon: '👨‍👩‍👧', screen: 'InviteFamily' },
          ].map(a => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionBtn}
              onPress={() => nav.navigate(a.screen)}
            >
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F7FF' },
  banner:         { backgroundColor: PURPLE, padding: 24, paddingTop: 56 },
  greeting:       { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subGreeting:    { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  statsRow:       { flexDirection: 'row', padding: 16, gap: 10 },
  statCard:       { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statNum:        { fontSize: 22, fontWeight: '700', color: PURPLE },
  statLabel:      { fontSize: 11, color: '#888', marginTop: 2 },
  section:        { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:   { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  seeAll:         { fontSize: 13, color: PURPLE },
  wishRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  wishDot:        { width: 8, height: 8, borderRadius: 4 },
  wishTitle:      { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  wishMeta:       { fontSize: 12, color: '#888', marginTop: 2 },
  chevron:        { fontSize: 20, color: '#ccc' },
  eventCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  eventName:      { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  eventDate:      { fontSize: 12, color: '#888', marginTop: 2 },
  progressBg:     { height: 4, backgroundColor: '#f0eeff', borderRadius: 2, marginTop: 8, width: '100%' },
  progressFill:   { height: 4, backgroundColor: PURPLE, borderRadius: 2 },
  progressLabel:  { fontSize: 11, color: '#999', marginTop: 4 },
  emptyCard:      { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#e0deff' },
  emptyText:      { color: PURPLE, fontSize: 14, fontWeight: '600' },
  actionsRow:     { flexDirection: 'row', gap: 10 },
  actionBtn:      { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  actionIcon:     { fontSize: 22, marginBottom: 6 },
  actionLabel:    { fontSize: 11, color: '#555', textAlign: 'center', fontWeight: '500' },
});
