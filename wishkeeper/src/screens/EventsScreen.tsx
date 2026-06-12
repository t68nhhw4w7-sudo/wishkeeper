// src/screens/EventsScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { format, parseISO, differenceInDays } from 'date-fns';
import { EventService, currentUid } from '../services/firebase';
import { CelebrationEvent, EventType } from '../types';

const PURPLE = '#534AB7';
const PINK   = '#D4537E';
const TEAL   = '#1D9E75';
const AMBER  = '#EF9F27';

const EVENT_TYPES: { key: EventType; label: string; emoji: string }[] = [
  { key: 'birthday',    label: 'Birthday',      emoji: '🎂' },
  { key: 'anniversary', label: 'Anniversary',    emoji: '💑' },
  { key: 'eid',         label: 'Eid',            emoji: '🌙' },
  { key: 'mothers_day', label: "Mother's Day",   emoji: '🌸' },
  { key: 'graduation',  label: 'Graduation',     emoji: '🎓' },
  { key: 'holiday',     label: 'Holiday',        emoji: '🎁' },
  { key: 'other',       label: 'Other',          emoji: '🎉' },
];

// ─── Vision Board Modal ───────────────────────────────────────────────────────

function VisionBoardModal({ event, visible, onClose }: { event: CelebrationEvent | null; visible: boolean; onClose: () => void }) {
  if (!event) return null;

  const boardItems = [
    { icon: '🏛️', label: 'Venue', value: event.venue || 'Not set yet' },
    { icon: '🎨', label: 'Theme', value: event.theme || 'Not set yet' },
    { icon: '🌈', label: 'Colors', value: event.colors?.join(', ') || 'Not set yet' },
    { icon: '🍽️', label: 'Food', value: event.foodPreferences || 'Not set yet' },
    { icon: '🎵', label: 'Entertainment', value: event.entertainment || 'Not set yet' },
    { icon: '🎂', label: 'Cake', value: event.cakeDescription || 'Not set yet' },
    { icon: '👥', label: 'Guests', value: event.guestCount ? `~${event.guestCount} guests` : 'Not set yet' },
    { icon: '📝', label: 'Notes', value: event.notes || 'Not set yet' },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={vb.header}>
        <TouchableOpacity onPress={onClose} style={vb.closeBtn}>
          <Text style={vb.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={vb.headerTitle}>Vision Board</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#F8F7FF' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Event header */}
        <View style={vb.eventBanner}>
          <Text style={vb.eventEmoji}>{EVENT_TYPES.find(e => e.key === event.type)?.emoji ?? '🎉'}</Text>
          <Text style={vb.eventBannerName}>{event.name}</Text>
          <Text style={vb.eventBannerDate}>{format(parseISO(event.date), 'MMMM d, yyyy')}</Text>
          <View style={vb.progressContainer}>
            <View style={vb.progressBg}>
              <View style={[vb.progressFill, { width: `${event.planningProgress}%` as any }]} />
            </View>
            <Text style={vb.progressLabel}>{event.planningProgress}% planned</Text>
          </View>
        </View>

        {/* Board grid */}
        <Text style={vb.sectionTitle}>Celebration details</Text>
        <View style={vb.grid}>
          {boardItems.map(item => (
            <View key={item.label} style={vb.boardCard}>
              <Text style={vb.boardIcon}>{item.icon}</Text>
              <Text style={vb.boardLabel}>{item.label}</Text>
              <Text style={vb.boardValue} numberOfLines={2}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Color palette */}
        {event.colors && event.colors.length > 0 && (
          <>
            <Text style={vb.sectionTitle}>Color palette</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {event.colors.map((c, i) => (
                <View key={i} style={vb.colorSwatch}>
                  <Text style={{ fontSize: 12, color: '#555', textAlign: 'center', marginTop: 4 }}>{c}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={vb.sectionTitle}>Description</Text>
        <View style={vb.descCard}>
          <Text style={vb.descText}>{event.description || 'No description added yet. Edit this event to add your vision!'}</Text>
        </View>
      </ScrollView>
    </Modal>
  );
}

const vb = StyleSheet.create({
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: Platform.OS === 'ios' ? 56 : 20, backgroundColor: PURPLE },
  closeBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerTitle:      { fontSize: 16, fontWeight: '700', color: '#fff' },
  eventBanner:      { backgroundColor: PURPLE, margin: -16, marginBottom: 20, padding: 24, paddingTop: 0, alignItems: 'center' },
  eventEmoji:       { fontSize: 40, marginBottom: 8 },
  eventBannerName:  { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4, textAlign: 'center' },
  eventBannerDate:  { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 14 },
  progressContainer:{ width: '100%', paddingHorizontal: 20 },
  progressBg:       { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3 },
  progressFill:     { height: 6, backgroundColor: '#fff', borderRadius: 3 },
  progressLabel:    { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 10, marginTop: 4 },
  grid:             { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  boardCard:        { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  boardIcon:        { fontSize: 22, marginBottom: 6 },
  boardLabel:       { fontSize: 11, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  boardValue:       { fontSize: 13, color: '#1a1a2e', fontWeight: '500', lineHeight: 18 },
  colorSwatch:      { width: 56, height: 56, borderRadius: 10, backgroundColor: '#e0deff', alignItems: 'center', justifyContent: 'center' },
  descCard:         { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  descText:         { fontSize: 14, color: '#555', lineHeight: 22 },
});

// ─── Add/Edit Event Modal ─────────────────────────────────────────────────────

function AddEventModal({ visible, onClose, existing }: { visible: boolean; onClose: () => void; existing?: CelebrationEvent | null }) {
  const uid = currentUid();
  const [name, setName]           = useState(existing?.name ?? '');
  const [type, setType]           = useState<EventType>(existing?.type ?? 'birthday');
  const [date, setDate]           = useState(existing?.date ?? '');
  const [theme, setTheme]         = useState(existing?.theme ?? '');
  const [venue, setVenue]         = useState(existing?.venue ?? '');
  const [food, setFood]           = useState(existing?.foodPreferences ?? '');
  const [entertainment, setEnt]   = useState(existing?.entertainment ?? '');
  const [cake, setCake]           = useState(existing?.cakeDescription ?? '');
  const [guestCount, setGuests]   = useState(existing?.guestCount?.toString() ?? '');
  const [colors, setColors]       = useState(existing?.colors?.join(', ') ?? '');
  const [desc, setDesc]           = useState(existing?.description ?? '');
  const [progress, setProgress]   = useState(existing?.planningProgress?.toString() ?? '0');
  const [saving, setSaving]       = useState(false);

  const save = async () => {
    if (!name.trim() || !date.trim()) { Alert.alert('Required', 'Please add a name and date.'); return; }
    setSaving(true);
    const data = {
      ownerUid: uid, name: name.trim(), type, date,
      theme, venue, foodPreferences: food, entertainment, cakeDescription: cake,
      guestCount: parseInt(guestCount) || undefined,
      colors: colors.split(',').map(c => c.trim()).filter(Boolean),
      description: desc, planningProgress: parseInt(progress) || 0, isPrivate: false,
    };
    try {
      if (existing) { await EventService.update(existing.id, data); }
      else { await EventService.add(data); }
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={ae.header}>
          <TouchableOpacity onPress={onClose}><Text style={ae.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={ae.title}>{existing ? 'Edit event' : 'New event'}</Text>
          <TouchableOpacity onPress={save} disabled={saving}><Text style={[ae.save, { opacity: saving ? 0.5 : 1 }]}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={ae.label}>Event name *</Text>
          <TextInput style={ae.input} value={name} onChangeText={setName} placeholder="e.g. 50th Birthday Celebration" />

          <Text style={ae.label}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {EVENT_TYPES.map(et => (
              <TouchableOpacity key={et.key} onPress={() => setType(et.key)} style={[ae.typeChip, type === et.key && ae.typeChipActive]}>
                <Text style={{ fontSize: 16 }}>{et.emoji}</Text>
                <Text style={[ae.typeLabel, type === et.key && { color: '#fff' }]}>{et.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={ae.label}>Date *</Text>
          <TextInput style={ae.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={ae.label}>Theme</Text>
              <TextInput style={ae.input} value={theme} onChangeText={setTheme} placeholder="e.g. Garden party" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ae.label}>Guest count</Text>
              <TextInput style={ae.input} value={guestCount} onChangeText={setGuests} placeholder="45" keyboardType="number-pad" />
            </View>
          </View>

          <Text style={ae.label}>Venue ideas</Text>
          <TextInput style={ae.input} value={venue} onChangeText={setVenue} placeholder="e.g. Botanical garden" />

          <Text style={ae.label}>Color palette (comma-separated)</Text>
          <TextInput style={ae.input} value={colors} onChangeText={setColors} placeholder="dusty rose, sage, gold" />

          <Text style={ae.label}>Food preferences</Text>
          <TextInput style={ae.input} value={food} onChangeText={setFood} placeholder="e.g. Mediterranean catering" />

          <Text style={ae.label}>Entertainment</Text>
          <TextInput style={ae.input} value={entertainment} onChangeText={setEnt} placeholder="e.g. Jazz trio + photo booth" />

          <Text style={ae.label}>Cake description</Text>
          <TextInput style={ae.input} value={cake} onChangeText={setCake} placeholder="e.g. 3-tier floral, lemon flavor" />

          <Text style={ae.label}>Planning progress (0–100)</Text>
          <TextInput style={ae.input} value={progress} onChangeText={setProgress} keyboardType="number-pad" placeholder="65" />

          <Text style={ae.label}>Your vision / description</Text>
          <TextInput style={[ae.input, { height: 100 }]} value={desc} onChangeText={setDesc} multiline placeholder="Describe how you want this celebration to feel..." />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ae = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderColor: '#e5e5e5' },
  title:  { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  cancel: { fontSize: 15, color: '#888' },
  save:   { fontSize: 15, color: PURPLE, fontWeight: '700' },
  label:  { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:  { backgroundColor: '#f8f7ff', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0deff', marginBottom: 14 },
  typeChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8f7ff', borderWidth: 1, borderColor: '#e0deff', marginRight: 8 },
  typeChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  typeLabel:      { fontSize: 13, color: '#555', fontWeight: '500' },
});

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, onPress, onBoard }: { event: CelebrationEvent; onPress: () => void; onBoard: () => void }) {
  const et = EVENT_TYPES.find(e => e.key === event.type);
  const days = differenceInDays(parseISO(event.date), new Date());
  const progressColor = event.planningProgress > 70 ? TEAL : event.planningProgress > 30 ? AMBER : PINK;

  return (
    <TouchableOpacity style={ev.card} onPress={onPress}>
      <View style={ev.cardTop}>
        <Text style={ev.emoji}>{et?.emoji ?? '🎉'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={ev.name}>{event.name}</Text>
          <Text style={ev.date}>{format(parseISO(event.date), 'MMMM d, yyyy')}</Text>
          {days >= 0 && <Text style={ev.countdown}>{days} days away</Text>}
        </View>
        <TouchableOpacity style={ev.boardBtn} onPress={onBoard}>
          <Text style={ev.boardBtnText}>Vision board</Text>
        </TouchableOpacity>
      </View>
      {event.theme && <Text style={ev.theme}>{event.theme}</Text>}
      <View style={ev.progressBg}>
        <View style={[ev.progressFill, { width: `${event.planningProgress}%` as any, backgroundColor: progressColor }]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={ev.progressLabel}>{event.planningProgress}% planned</Text>
        {event.guestCount && <Text style={ev.progressLabel}>{event.guestCount} guests</Text>}
      </View>
    </TouchableOpacity>
  );
}

const ev = StyleSheet.create({
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  emoji:        { fontSize: 32 },
  name:         { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 3 },
  date:         { fontSize: 12, color: '#888' },
  countdown:    { fontSize: 12, color: PURPLE, fontWeight: '600', marginTop: 2 },
  boardBtn:     { backgroundColor: PURPLE + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  boardBtnText: { fontSize: 11, color: PURPLE, fontWeight: '700' },
  theme:        { fontSize: 12, color: '#888', marginBottom: 8, fontStyle: 'italic' },
  progressBg:   { height: 5, backgroundColor: '#f0eeff', borderRadius: 3 },
  progressFill: { height: 5, borderRadius: 3 },
  progressLabel:{ fontSize: 11, color: '#aaa' },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const uid = currentUid();
  const [events, setEvents]         = useState<CelebrationEvent[]>([]);
  const [showAdd, setShowAdd]       = useState(false);
  const [editing, setEditing]       = useState<CelebrationEvent | null>(null);
  const [boardEvent, setBoardEvent] = useState<CelebrationEvent | null>(null);

  useEffect(() => {
    return EventService.subscribeByOwner(uid, setEvents);
  }, [uid]);

  const handleDelete = (e: CelebrationEvent) => {
    Alert.alert('Delete event', `Remove "${e.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => EventService.delete(e.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      <FlatList
        data={events}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎂</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 }}>No events yet</Text>
            <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 }}>
              Create your birthday, anniversary, or Eid celebration vision board
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => { setEditing(item); setShowAdd(true); }}
            onBoard={() => setBoardEvent(item)}
          />
        )}
      />

      <TouchableOpacity style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }} onPress={() => { setEditing(null); setShowAdd(true); }}>
        <Text style={{ fontSize: 28, color: '#fff', lineHeight: 32 }}>+</Text>
      </TouchableOpacity>

      <AddEventModal visible={showAdd} onClose={() => { setShowAdd(false); setEditing(null); }} existing={editing} />
      <VisionBoardModal event={boardEvent} visible={!!boardEvent} onClose={() => setBoardEvent(null)} />
    </View>
  );
}
