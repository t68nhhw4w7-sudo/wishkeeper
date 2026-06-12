// src/screens/MemoriesScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, TextInput, Alert, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { format } from 'date-fns';
import { MemoryService, currentUid } from '../services/firebase';
import { Memory, MemoryType } from '../types';

const PURPLE = '#534AB7';
const PINK   = '#D4537E';

const MEMORY_TYPES: { key: MemoryType; label: string; emoji: string; desc: string }[] = [
  { key: 'photo',      label: 'Photo',      emoji: '📸', desc: 'A cherished photo or memory' },
  { key: 'letter',     label: 'Letter',     emoji: '💌', desc: 'A personal letter to a loved one' },
  { key: 'recipe',     label: 'Recipe',     emoji: '🍽️', desc: 'A family recipe to preserve' },
  { key: 'tradition',  label: 'Tradition',  emoji: '🎄', desc: 'A family celebration tradition' },
  { key: 'note',       label: 'Note',       emoji: '📝', desc: 'Anything you want to remember' },
];

function MemoryCard({ memory, onPress }: { memory: Memory; onPress: () => void }) {
  const mt = MEMORY_TYPES.find(t => t.key === memory.type);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardEmojiBg}>
        <Text style={styles.cardEmoji}>{mt?.emoji ?? '📝'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>{memory.title}</Text>
        <Text style={styles.cardMeta}>{mt?.label} · {format(new Date(memory.createdAt), 'MMM d, yyyy')}</Text>
        {memory.isPrivate && <Text style={styles.privateBadge}>🔒 Private</Text>}
        {memory.unlocksAt && <Text style={styles.lockBadge}>⏰ Unlocks {format(new Date(memory.unlocksAt), 'MMM d, yyyy')}</Text>}
      </View>
    </TouchableOpacity>
  );
}

function MemoryModal({ visible, onClose, existing }: { visible: boolean; onClose: () => void; existing?: Memory | null }) {
  const uid = currentUid();
  const [title, setTitle]     = useState(existing?.title ?? '');
  const [type, setType]       = useState<MemoryType>(existing?.type ?? 'note');
  const [content, setContent] = useState(existing?.content ?? '');
  const [isPrivate, setPriv]  = useState(existing?.isPrivate ?? false);
  const [unlocksAt, setUnlocks] = useState(existing?.unlocksAt ?? '');
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const data = { ownerUid: uid, title: title.trim(), type, content, isPrivate, unlocksAt: unlocksAt || undefined };
    try {
      if (existing) { await MemoryService.update(existing.id, data); }
      else { await MemoryService.add(data); }
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: '#888', fontSize: 15 }}>Cancel</Text></TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a2e' }}>{existing ? 'Edit memory' : 'New memory'}</Text>
          <TouchableOpacity onPress={save} disabled={saving}><Text style={{ color: PURPLE, fontSize: 15, fontWeight: '700', opacity: saving ? 0.5 : 1 }}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Letter to my daughter" autoFocus />

          <Text style={styles.label}>Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {MEMORY_TYPES.map(mt => (
              <TouchableOpacity key={mt.key} onPress={() => setType(mt.key)} style={[styles.typeChip, type === mt.key && styles.typeChipActive]}>
                <Text>{mt.emoji}</Text>
                <Text style={[styles.typeLabel, type === mt.key && { color: '#fff' }]}>{mt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Content</Text>
          <TextInput
            style={[styles.input, { height: 160 }]}
            value={content} onChangeText={setContent}
            multiline
            placeholder={type === 'letter' ? 'Dear...' : type === 'recipe' ? 'Ingredients:\n\nMethod:' : 'Write here...'}
          />

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.label}>Private (only you)</Text>
              <Text style={{ fontSize: 12, color: '#888' }}>Hidden from all family members</Text>
            </View>
            <Switch value={isPrivate} onValueChange={setPriv} trackColor={{ true: PURPLE }} />
          </View>

          {type === 'letter' && (
            <>
              <Text style={styles.label}>Time-lock — unlock on date (optional)</Text>
              <TextInput style={styles.input} value={unlocksAt} onChangeText={setUnlocks} placeholder="YYYY-MM-DD" />
              <Text style={{ fontSize: 12, color: '#888', marginTop: -10, marginBottom: 16 }}>The letter reveals itself to family on this date</Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MemoriesScreen() {
  const uid = currentUid();
  const [memories, setMemories]   = useState<Memory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Memory | null>(null);
  const [filter, setFilter]       = useState<MemoryType | 'All'>('All');

  useEffect(() => {
    return MemoryService.subscribeByOwner(uid, true, setMemories);
  }, [uid]);

  const filtered = filter === 'All' ? memories : memories.filter(m => m.type === filter);

  const handleDelete = (m: Memory) => {
    Alert.alert('Delete memory', `Remove "${m.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => MemoryService.delete(m.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 56, paddingVertical: 10 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
        {(['All', ...MEMORY_TYPES.map(t => t.key)] as const).map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f as any)} style={[styles.filterChip, filter === f && styles.filterChipActive]}>
            {f !== 'All' && <Text>{MEMORY_TYPES.find(t => t.key === f)?.emoji}</Text>}
            <Text style={[styles.filterText, filter === f && { color: '#fff' }]}>{f === 'All' ? 'All' : MEMORY_TYPES.find(t => t.key === f)?.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>💌</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 }}>Memory vault is empty</Text>
            <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>Preserve photos, letters, recipes, and family traditions</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <MemoryCard memory={item} onPress={() => { setEditing(item); setShowModal(true); }} />
          </View>
        )}
      />

      <TouchableOpacity style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }} onPress={() => { setEditing(null); setShowModal(true); }}>
        <Text style={{ fontSize: 28, color: '#fff', lineHeight: 32 }}>+</Text>
      </TouchableOpacity>

      <MemoryModal visible={showModal} onClose={() => { setShowModal(false); setEditing(null); }} existing={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  card:           { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardEmojiBg:    { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cardEmoji:      { fontSize: 22 },
  cardTitle:      { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 3 },
  cardMeta:       { fontSize: 11, color: '#888' },
  privateBadge:   { fontSize: 11, color: '#888', marginTop: 4 },
  lockBadge:      { fontSize: 11, color: PURPLE, marginTop: 4 },
  filterChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0deff' },
  filterChipActive:{ backgroundColor: PURPLE, borderColor: PURPLE },
  filterText:     { fontSize: 13, color: '#555', fontWeight: '500' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderColor: '#e5e5e5' },
  label:          { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:          { backgroundColor: '#f8f7ff', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0deff', marginBottom: 16 },
  typeChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8f7ff', borderWidth: 1, borderColor: '#e0deff' },
  typeChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  typeLabel:      { fontSize: 13, color: '#555', fontWeight: '500' },
  toggleRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f7ff', padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e0deff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// src/screens/RemindersScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────

export function RemindersScreen() {
  const uid = currentUid();
  const [reminders, setReminders] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle]   = useState('');
  const [date, setDate]     = useState('');
  const [days, setDays]     = useState<number[]>([60, 30, 7, 1]);

  useEffect(() => {
    return require('../services/firebase').ReminderService.subscribeByOwner(uid, setReminders);
  }, [uid]);

  const toggleDay = (d: number) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a,b) => b-a));

  const save = async () => {
    if (!title.trim() || !date.trim()) return;
    await require('../services/firebase').ReminderService.add({ ownerUid: uid, title: title.trim(), date, notifyFamilyDaysBefore: days, isActive: true });
    setShowModal(false); setTitle(''); setDate('');
  };

  const upcoming = reminders.filter(r => new Date(r.date) >= new Date()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past     = reminders.filter(r => new Date(r.date) < new Date());

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {upcoming.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 }}>No reminders yet</Text>
            <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>Add reminders so your family never forgets your special days</Text>
          </View>
        )}

        {upcoming.map(r => {
          const d = new Date(r.date);
          const du = daysUntil(r.date);
          return (
            <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#534AB7', textTransform: 'uppercase' }}>{MONTH_ABBR[d.getMonth()]}</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#3C3489', lineHeight: 22 }}>{d.getDate()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a1a2e' }}>{r.title}</Text>
                <Text style={{ fontSize: 12, color: du <= 7 ? '#D4537E' : '#888', marginTop: 2 }}>{du > 0 ? `${du} days away` : 'Today!'}</Text>
                <Text style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Notifies family {r.notifyFamilyDaysBefore?.join(', ')} days before</Text>
              </View>
              <TouchableOpacity onPress={() => require('../services/firebase').ReminderService.update(r.id, { isActive: !r.isActive })}>
                <View style={{ width: 34, height: 20, borderRadius: 10, backgroundColor: r.isActive ? '#534AB7' : '#ddd', padding: 2 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', alignSelf: r.isActive ? 'flex-end' : 'flex-start' }} />
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }} onPress={() => setShowModal(true)}>
        <Text style={{ fontSize: 28, color: '#fff', lineHeight: 32 }}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowModal(false)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderColor: '#e5e5e5' }}>
          <TouchableOpacity onPress={() => setShowModal(false)}><Text style={{ color: '#888', fontSize: 15 }}>Cancel</Text></TouchableOpacity>
          <Text style={{ fontWeight: '600', fontSize: 16 }}>New reminder</Text>
          <TouchableOpacity onPress={save}><Text style={{ color: PURPLE, fontWeight: '700', fontSize: 15 }}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 }}>Name *</Text>
          <TextInput style={{ backgroundColor: '#f8f7ff', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#e0deff', marginBottom: 16, color: '#1a1a2e' }} value={title} onChangeText={setTitle} placeholder="e.g. Sarah's 50th Birthday" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 }}>Date *</Text>
          <TextInput style={{ backgroundColor: '#f8f7ff', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#e0deff', marginBottom: 16, color: '#1a1a2e' }} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 10 }}>Notify family (days before)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[90, 60, 30, 14, 7, 3, 1].map(d => (
              <TouchableOpacity key={d} onPress={() => toggleDay(d)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: days.includes(d) ? PURPLE : '#f8f7ff', borderWidth: 1, borderColor: days.includes(d) ? PURPLE : '#e0deff' }}>
                <Text style={{ color: days.includes(d) ? '#fff' : '#555', fontWeight: '600', fontSize: 13 }}>{d} days</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const PURPLE = '#534AB7';
const PINK   = '#D4537E';

function currentUid() { return require('../services/firebase').currentUid(); }
