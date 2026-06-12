// src/screens/FamilyScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Modal, Alert,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { FamilyService, currentUid } from '../services/firebase';
import { FamilyMember, FamilyRole, AccessLevel } from '../types';

const PURPLE = '#534AB7';
const TEAL   = '#1D9E75';
const AMBER  = '#EF9F27';
const PINK   = '#D4537E';
const CORAL  = '#D85A30';

const ROLE_OPTIONS: FamilyRole[] = ['spouse','child','parent','sibling','friend','other'];

const ACCESS_LABELS: Record<AccessLevel, string> = {
  full:          'Full access',
  gifts_events:  'Gifts + Events',
  gifts_only:    'Gifts only',
  events_only:   'Events only',
  view_only:     'View only',
};

const ACCESS_DESC: Record<AccessLevel, string> = {
  full:          'Sees everything except private items',
  gifts_events:  'Sees wish lists and event details',
  gifts_only:    'Sees wish lists only',
  events_only:   'Sees event boards only',
  view_only:     'Read-only, no gift tracking',
};

const ACCESS_COLOR: Record<AccessLevel, string> = {
  full: PURPLE, gifts_events: TEAL, gifts_only: AMBER,
  events_only: PINK, view_only: CORAL,
};

function accessColor(level: AccessLevel) { return ACCESS_COLOR[level] ?? PURPLE; }

function InitialsAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: color + '22' }]}>
      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
    </View>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const uid = currentUid();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [role, setRole]         = useState<FamilyRole>('spouse');
  const [access, setAccess]     = useState<AccessLevel>('full');
  const [saving, setSaving]     = useState(false);

  const send = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing info', 'Please enter name and email.');
      return;
    }
    setSaving(true);
    try {
      await FamilyService.invite({
        ownerUid: uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        accessLevel: access,
        inviteStatus: 'pending',
      });
      // In production: trigger invite email via Firebase Function
      Alert.alert('Invite sent!', `${name} will receive an email to join WishKeeper.`);
      onClose();
      setName(''); setEmail('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Invite family member</Text>
          <TouchableOpacity onPress={send} disabled={saving}>
            <Text style={[styles.saveBtn, { opacity: saving ? 0.5 : 1 }]}>Send</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.fieldLabel}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. James" />

          <Text style={styles.fieldLabel}>Email *</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="their@email.com" keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.fieldLabel}>Relationship</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {ROLE_OPTIONS.map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                style={[styles.chip, role === r && styles.chipActive]}
              >
                <Text style={[styles.chipText, role === r && { color: '#fff' }]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>What can they see?</Text>
          {(Object.keys(ACCESS_LABELS) as AccessLevel[]).map(a => (
            <TouchableOpacity
              key={a}
              onPress={() => setAccess(a)}
              style={[styles.accessOption, access === a && { borderColor: accessColor(a), borderWidth: 2 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.accessLabel, { color: accessColor(a) }]}>{ACCESS_LABELS[a]}</Text>
                <Text style={styles.accessDesc}>{ACCESS_DESC[a]}</Text>
              </View>
              {access === a && (
                <View style={[styles.checkCircle, { backgroundColor: accessColor(a) }]}>
                  <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function FamilyScreen() {
  const uid = currentUid();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    return FamilyService.subscribeByOwner(uid, setMembers);
  }, [uid]);

  const handleRemove = (m: FamilyMember) => {
    Alert.alert('Remove member', `Remove ${m.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => FamilyService.remove(m.id) },
    ]);
  };

  const handleChangeAccess = (m: FamilyMember) => {
    const options = (Object.keys(ACCESS_LABELS) as AccessLevel[]).map(a => ({
      text: ACCESS_LABELS[a],
      onPress: () => FamilyService.updateAccess(m.id, a),
    }));
    Alert.alert(`${m.name}'s access`, 'Choose what they can see:', [
      ...options,
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      {members.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>Invite your family</Text>
          <Text style={styles.emptySubtitle}>Let your loved ones know how to celebrate you perfectly</Text>
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInvite(true)}>
            <Text style={styles.inviteBtnText}>Invite family member</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={styles.shareCard}>
              <Text style={styles.shareTitle}>Your family link</Text>
              <Text style={styles.shareSubtitle}>Share this so family can view your profile</Text>
              <View style={styles.linkRow}>
                <Text style={styles.linkText} numberOfLines={1}>wishkeeper.app/you</Text>
                <TouchableOpacity style={styles.copyBtn}>
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item: m }) => (
            <View style={styles.memberCard}>
              <InitialsAvatar name={m.name} color={accessColor(m.accessLevel)} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.name}</Text>
                <Text style={styles.memberRole}>{m.role.charAt(0).toUpperCase() + m.role.slice(1)} · {m.email}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View style={[styles.accessBadge, { backgroundColor: accessColor(m.accessLevel) + '22' }]}>
                    <Text style={[styles.accessBadgeText, { color: accessColor(m.accessLevel) }]}>
                      {ACCESS_LABELS[m.accessLevel]}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: m.inviteStatus === 'accepted' ? '#e1f5ee' : '#faeeda',
                  }]}>
                    <Text style={{
                      fontSize: 11, fontWeight: '600',
                      color: m.inviteStatus === 'accepted' ? TEAL : AMBER,
                    }}>
                      {m.inviteStatus === 'accepted' ? 'Active' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleChangeAccess(m)}>
                  <Text style={styles.actionBtnText}>Edit access</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#fcc' }]} onPress={() => handleRemove(m)}>
                  <Text style={[styles.actionBtnText, { color: '#c00' }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {members.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowInvite(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <InviteModal visible={showInvite} onClose={() => setShowInvite(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon:      { fontSize: 56, marginBottom: 16 },
  emptyTitle:     { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  emptySubtitle:  { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  inviteBtn:      { backgroundColor: PURPLE, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  inviteBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  shareCard:      { backgroundColor: PURPLE + '15', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: PURPLE + '30' },
  shareTitle:     { fontSize: 14, fontWeight: '700', color: PURPLE, marginBottom: 2 },
  shareSubtitle:  { fontSize: 12, color: '#666', marginBottom: 10 },
  linkRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkText:       { flex: 1, fontSize: 13, color: '#555', backgroundColor: '#fff', padding: 8, borderRadius: 8 },
  copyBtn:        { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: PURPLE, borderRadius: 8 },
  copyText:       { fontSize: 13, color: '#fff', fontWeight: '600' },
  memberCard:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatar:         { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 15, fontWeight: '700' },
  memberName:     { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  memberRole:     { fontSize: 12, color: '#888', marginTop: 2 },
  accessBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  accessBadgeText:{ fontSize: 11, fontWeight: '600' },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  actionBtn:      { borderWidth: 1, borderColor: '#e0deff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  actionBtnText:  { fontSize: 12, color: PURPLE, fontWeight: '600' },
  fab:            { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText:        { fontSize: 28, color: '#fff', lineHeight: 32 },
  // Modal
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderColor: '#e5e5e5' },
  modalTitle:     { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  cancel:         { fontSize: 15, color: '#888' },
  saveBtn:        { fontSize: 15, color: PURPLE, fontWeight: '700' },
  fieldLabel:     { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:          { backgroundColor: '#f8f7ff', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0deff', marginBottom: 16 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f8f7ff', borderWidth: 1, borderColor: '#e0deff', marginRight: 8 },
  chipActive:     { backgroundColor: PURPLE, borderColor: PURPLE },
  chipText:       { fontSize: 13, color: '#555', fontWeight: '500' },
  accessOption:   { backgroundColor: '#f8f7ff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e0deff', flexDirection: 'row', alignItems: 'center' },
  accessLabel:    { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  accessDesc:     { fontSize: 12, color: '#888' },
  checkCircle:    { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
