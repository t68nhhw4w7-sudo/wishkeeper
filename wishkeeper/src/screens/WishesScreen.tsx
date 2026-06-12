// src/screens/WishesScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Modal, ScrollView,
  Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WishService, currentUid } from '../services/firebase';
import { Wish, WishCategory, WishPriority } from '../types';

const PURPLE = '#534AB7';
const PINK   = '#D4537E';
const AMBER  = '#EF9F27';
const TEAL   = '#1D9E75';

const CATEGORIES: WishCategory[] = [
  'Gifts','Experiences','Restaurants','Books','Jewelry',
  'Home Items','Travel','Acts of Service','Clothing','Charities',
];

const CAT_EMOJI: Record<WishCategory, string> = {
  Gifts: '🎁', Experiences: '✈️', Restaurants: '🍽️', Books: '📚',
  Jewelry: '💍', 'Home Items': '🏠', Travel: '🌍',
  'Acts of Service': '❤️', Clothing: '👗', Charities: '🤝',
};

const PRIORITY_COLOR: Record<WishPriority, string> = {
  high: PINK, medium: AMBER, low: TEAL,
};

// ─── Wish Card ────────────────────────────────────────────────────────────────

function WishCard({ wish, onPress, onDelete }: { wish: Wish; onPress: () => void; onDelete: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onDelete}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardEmoji}>{CAT_EMOJI[wish.category] ?? '🎁'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{wish.title}</Text>
          <Text style={styles.cardMeta}>
            {wish.category}{wish.price ? ` · ${wish.price}` : ''}
          </Text>
          {wish.reservedBy && (
            <Text style={styles.reservedLabel}>Reserved by {wish.reservedByName}</Text>
          )}
        </View>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[wish.priority] }]} />
      </View>
      {wish.link ? (
        <Text style={styles.linkBadge}>🔗 link</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function AddWishModal({
  visible, onClose, existing,
}: {
  visible: boolean;
  onClose: () => void;
  existing?: Wish | null;
}) {
  const uid = currentUid();
  const [title, setTitle]       = useState(existing?.title ?? '');
  const [category, setCategory] = useState<WishCategory>(existing?.category ?? 'Gifts');
  const [priority, setPriority] = useState<WishPriority>(existing?.priority ?? 'medium');
  const [price, setPrice]       = useState(existing?.price ?? '');
  const [link, setLink]         = useState(existing?.link ?? '');
  const [notes, setNotes]       = useState(existing?.notes ?? '');
  const [isPrivate, setIsPrivate] = useState(existing?.isPrivate ?? false);
  const [saving, setSaving]     = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const data = { ownerUid: uid, title: title.trim(), category, priority, price, link, notes, isPrivate, reservedBy: undefined, reservedByName: undefined, isPurchased: false };
    try {
      if (existing) {
        await WishService.update(existing.id, data);
      } else {
        await WishService.add(data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{existing ? 'Edit wish' : 'New wish'}</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            <Text style={[styles.save, { opacity: saving ? 0.5 : 1 }]}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.fieldLabel}>What do you wish for? *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Weekend trip to Savannah" />

          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.catChip, category === c && styles.catChipActive]}
              >
                <Text style={{ marginRight: 4 }}>{CAT_EMOJI[c]}</Text>
                <Text style={[styles.catChipText, category === c && { color: '#fff' }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {(['high','medium','low'] as WishPriority[]).map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[styles.priorityBtn, { borderColor: PRIORITY_COLOR[p] }, priority === p && { backgroundColor: PRIORITY_COLOR[p] }]}
              >
                <Text style={{ color: priority === p ? '#fff' : PRIORITY_COLOR[p], fontWeight: '600', fontSize: 13 }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Budget / price</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="e.g. $50–100" />

          <Text style={styles.fieldLabel}>Link</Text>
          <TextInput style={styles.input} value={link} onChangeText={setLink} placeholder="https://..." keyboardType="url" autoCapitalize="none" />

          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput style={[styles.input, { height: 80 }]} value={notes} onChangeText={setNotes} placeholder="Size, color, any details..." multiline />

          <View style={styles.privateRow}>
            <View>
              <Text style={styles.fieldLabel}>Keep private</Text>
              <Text style={{ fontSize: 12, color: '#888' }}>Hidden from all family members</Text>
            </View>
            <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: PURPLE }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WishesScreen() {
  const uid = currentUid();
  const [wishes, setWishes]         = useState<Wish[]>([]);
  const [filterCat, setFilterCat]   = useState<WishCategory | 'All'>('All');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Wish | null>(null);

  useEffect(() => {
    return WishService.subscribeByOwner(uid, setWishes);
  }, [uid]);

  const filtered = filterCat === 'All' ? wishes : wishes.filter(w => w.category === filterCat);

  const handleDelete = (w: Wish) => {
    Alert.alert('Delete wish', `Remove "${w.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => WishService.delete(w.id) },
    ]);
  };

  const openEdit = (w: Wish) => { setEditing(w); setShowModal(true); };
  const openNew  = () => { setEditing(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
        {(['All', ...CATEGORIES] as const).map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setFilterCat(c as any)}
            style={[styles.filterChip, filterCat === c && styles.filterChipActive]}
          >
            {c !== 'All' && <Text style={{ marginRight: 3 }}>{CAT_EMOJI[c as WishCategory]}</Text>}
            <Text style={[styles.filterChipText, filterCat === c && { color: '#fff' }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyTitle}>No wishes yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first wish</Text>
          </View>
        }
        renderItem={({ item }) => (
          <WishCard wish={item} onPress={() => openEdit(item)} onDelete={() => handleDelete(item)} />
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openNew}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddWishModal visible={showModal} onClose={closeModal} existing={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar:      { maxHeight: 56, paddingVertical: 10 },
  filterChip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0deff' },
  filterChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  filterChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  card:           { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji:      { fontSize: 26, width: 36, textAlign: 'center' },
  cardTitle:      { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  cardMeta:       { fontSize: 12, color: '#888', marginTop: 2 },
  reservedLabel:  { fontSize: 11, color: TEAL, marginTop: 3, fontWeight: '500' },
  priorityDot:    { width: 10, height: 10, borderRadius: 5 },
  linkBadge:      { fontSize: 11, color: PURPLE, marginTop: 6, fontWeight: '500' },
  empty:          { alignItems: 'center', paddingTop: 80 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  emptySubtitle:  { fontSize: 14, color: '#888' },
  fab:            { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText:        { fontSize: 28, color: '#fff', lineHeight: 32 },
  // Modal
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderColor: '#e5e5e5' },
  modalTitle:     { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  cancel:         { fontSize: 15, color: '#888' },
  save:           { fontSize: 15, color: PURPLE, fontWeight: '700' },
  fieldLabel:     { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:          { backgroundColor: '#f8f7ff', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0deff', marginBottom: 16 },
  catChip:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f8f7ff', borderWidth: 1, borderColor: '#e0deff', marginRight: 8 },
  catChipActive:  { backgroundColor: PURPLE, borderColor: PURPLE },
  catChipText:    { fontSize: 13, color: '#555', fontWeight: '500' },
  priorityRow:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  priorityBtn:    { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  privateRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f7ff', padding: 14, borderRadius: 12, marginBottom: 24 },
});
