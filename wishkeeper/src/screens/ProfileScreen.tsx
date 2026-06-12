// src/screens/ProfileScreen.tsx
// Celebration Profile — birthday wishes, anniversary ideas, Mother's Day,
// Eid traditions, clothing sizes, jewelry preferences, charities, and more.

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { UserService, currentUid } from '../services/firebase';
import { UserProfile } from '../types';

const PURPLE = '#534AB7';
const PINK   = '#D4537E';
const TEAL   = '#1D9E75';
const AMBER  = '#EF9F27';

// ─── Section definitions ──────────────────────────────────────────────────────

const PROFILE_SECTIONS = [
  { key: 'favorites',          emoji: '❤️', label: 'My Favorites',                 color: '#FBEAF0', textColor: '#72243E' },
  { key: 'birthday_vision',    emoji: '🎂', label: 'Birthday Vision Board',        color: '#EEEDFE', textColor: '#3C3489' },
  { key: 'anniversary_dreams', emoji: '💍', label: 'Anniversary Dreams',           color: '#FBEAF0', textColor: '#72243E' },
  { key: 'eid_traditions',     emoji: '🌙', label: 'Eid Traditions',               color: '#E1F5EE', textColor: '#0F6E56' },
  { key: 'travel_wishlist',    emoji: '✈️', label: 'Travel Wishlist',              color: '#E1F5EE', textColor: '#0F6E56' },
  { key: 'gift_wishlist',      emoji: '🎁', label: 'Gift Wishlist',                color: '#EEEDFE', textColor: '#3C3489' },
  { key: 'family_traditions',  emoji: '📸', label: 'Family Traditions',            color: '#F1EFE8', textColor: '#444441' },
  { key: 'letters_memories',   emoji: '📝', label: 'Letters & Memories',           color: '#F1EFE8', textColor: '#444441' },
  { key: 'family_message',     emoji: '👵', label: 'What I Want My Family to Know', color: '#FBEAF0', textColor: '#72243E' },
];

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({
  visible, onClose, profile,
}: {
  visible: boolean; onClose: () => void; profile: UserProfile | null;
}) {
  const uid = currentUid();
  const [displayName, setName]        = useState(profile?.displayName ?? '');
  const [birthdate, setBirthdate]     = useState(profile?.birthdate ?? '');
  const [anniversary, setAnniversary] = useState(profile?.anniversary ?? '');
  const [topSize, setTop]             = useState(profile?.clothingSizes?.top ?? '');
  const [dressSize, setDress]         = useState(profile?.clothingSizes?.dress ?? '');
  const [shoeSize, setShoe]           = useState(profile?.clothingSizes?.shoes ?? '');
  const [jewelry, setJewelry]         = useState(profile?.jewelryPreferences ?? '');
  const [decor, setDecor]             = useState(profile?.homeDecorStyle ?? '');
  const [flowers, setFlowers]         = useState(profile?.favoriteFlowers ?? '');
  const [dietary, setDietary]         = useState(profile?.dietaryPreferences ?? '');
  const [birthday, setBirthday]       = useState(profile?.birthdayWishes ?? '');
  const [annivIdeas, setAnnivIdeas]   = useState(profile?.anniversaryIdeas ?? '');
  const [mothersDay, setMothersDay]   = useState(profile?.mothersDayWishes ?? '');
  const [eid, setEid]                 = useState(profile?.eidHolidayIdeas ?? '');
  const [bucket, setBucket]           = useState(profile?.bucketListExperiences ?? '');
  const [travel, setTravel]           = useState(profile?.travelDestinations ?? '');
  const [charities, setCharities]     = useState(profile?.charitiesLoved?.join(', ') ?? '');
  const [familyMsg, setFamilyMsg]     = useState(profile?.familyMessage ?? '');
  const [msgPublic, setMsgPublic]     = useState(profile?.familyMessageIsPublic ?? false);
  const [saving, setSaving]           = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await UserService.update(uid, {
        displayName: displayName.trim(),
        birthdate, anniversary,
        clothingSizes: { top: topSize, dress: dressSize, shoes: shoeSize },
        jewelryPreferences: jewelry, homeDecorStyle: decor,
        favoriteFlowers: flowers, dietaryPreferences: dietary,
        birthdayWishes: birthday, anniversaryIdeas: annivIdeas,
        mothersDayWishes: mothersDay, eidHolidayIdeas: eid,
        bucketListExperiences: bucket, travelDestinations: travel,
        charitiesLoved: charities.split(',').map(c => c.trim()).filter(Boolean),
        familyMessage: familyMsg, familyMessageIsPublic: msgPublic,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, value, onChange, placeholder, multiline = false }: any) => (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80 }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        multiline={multiline}
      />
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Edit my profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}><Text style={[styles.saveBtn, { opacity: saving ? 0.5 : 1 }]}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>

          <Text style={styles.sectionHeader}>Personal details</Text>
          <Field label="Your name" value={displayName} onChange={setName} placeholder="Sarah Ahmed" />
          <Field label="Birthday" value={birthdate} onChange={setBirthdate} placeholder="YYYY-MM-DD" />
          <Field label="Anniversary" value={anniversary} onChange={setAnniversary} placeholder="YYYY-MM-DD" />

          <Text style={styles.sectionHeader}>Clothing sizes</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Top" value={topSize} onChange={setTop} placeholder="M" /></View>
            <View style={{ flex: 1 }}><Field label="Dress" value={dressSize} onChange={setDress} placeholder="8" /></View>
            <View style={{ flex: 1 }}><Field label="Shoes" value={shoeSize} onChange={setShoe} placeholder="8.5" /></View>
          </View>

          <Text style={styles.sectionHeader}>Preferences</Text>
          <Field label="Jewelry preferences" value={jewelry} onChange={setJewelry} placeholder="Gold only · delicate layering · no hoops" multiline />
          <Field label="Home décor style" value={decor} onChange={setDecor} placeholder="Mediterranean · warm neutrals · lots of plants" />
          <Field label="Favorite flowers" value={flowers} onChange={setFlowers} placeholder="Peonies, garden roses, jasmine" />
          <Field label="Dietary preferences" value={dietary} onChange={setDietary} placeholder="No shellfish · loves Mediterranean" />

          <Text style={styles.sectionHeader}>Celebration wishes</Text>
          <Field label="🎂 Birthday wishes" value={birthday} onChange={setBirthday} placeholder="Describe your dream birthday..." multiline />
          <Field label="💍 Anniversary ideas" value={annivIdeas} onChange={setAnnivIdeas} placeholder="Describe your dream anniversary..." multiline />
          <Field label="🌸 Mother's Day wishes" value={mothersDay} onChange={setMothersDay} placeholder="What would make Mother's Day perfect?" multiline />
          <Field label="🌙 Eid / holiday ideas" value={eid} onChange={setEid} placeholder="Traditions, gift ideas, family traditions..." multiline />
          <Field label="✈️ Bucket-list experiences" value={bucket} onChange={setBucket} placeholder="Safari in Kenya, cooking class in Italy..." multiline />
          <Field label="Travel destinations" value={travel} onChange={setTravel} placeholder="Amalfi Coast, Japan, Morocco..." multiline />
          <Field label="❤️ Charities I love (comma-separated)" value={charities} onChange={setCharities} placeholder="UNICEF, Local food bank, Women's shelter" />

          <Text style={styles.sectionHeader}>👵 What I want my family to know</Text>
          <TextInput
            style={[styles.input, { height: 120 }]}
            value={familyMsg} onChangeText={setFamilyMsg}
            placeholder="A personal message to your family about what matters most to you..."
            multiline
          />
          <View style={styles.toggleRow}>
            <View><Text style={styles.fieldLabel}>Share with family</Text><Text style={{ fontSize: 12, color: '#888' }}>Private until you turn this on</Text></View>
            <Switch value={msgPublic} onValueChange={setMsgPublic} trackColor={{ true: PURPLE }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Profile Section Card ─────────────────────────────────────────────────────

function SectionCard({ emoji, label, color, textColor, value, placeholder }: any) {
  return (
    <View style={[styles.sectionCard, { borderLeftColor: textColor }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
        <Text style={[styles.sectionCardTitle, { color: textColor }]}>{label}</Text>
      </View>
      {value ? (
        <Text style={styles.sectionCardValue}>{value}</Text>
      ) : (
        <Text style={styles.sectionCardEmpty}>{placeholder}</Text>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const uid = currentUid();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    return UserService.subscribe(uid, setProfile);
  }, [uid]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>
              {(profile?.displayName ?? 'SA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.displayName ?? 'My Profile'}</Text>
            {profile?.birthdate && <Text style={styles.profileSub}>Birthday: {profile.birthdate}</Text>}
            {profile?.anniversary && <Text style={styles.profileSub}>Anniversary: {profile.anniversary}</Text>}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
            <Text style={styles.editBtnText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Sizes & preferences */}
        {(profile?.clothingSizes || profile?.jewelryPreferences || profile?.homeDecorStyle) && (
          <>
            <Text style={styles.groupLabel}>Personal details</Text>
            <View style={styles.detailsGrid}>
              {profile?.clothingSizes?.top && (
                <View style={styles.detailPill}><Text style={styles.detailKey}>Top</Text><Text style={styles.detailVal}>{profile.clothingSizes.top}</Text></View>
              )}
              {profile?.clothingSizes?.dress && (
                <View style={styles.detailPill}><Text style={styles.detailKey}>Dress</Text><Text style={styles.detailVal}>{profile.clothingSizes.dress}</Text></View>
              )}
              {profile?.clothingSizes?.shoes && (
                <View style={styles.detailPill}><Text style={styles.detailKey}>Shoes</Text><Text style={styles.detailVal}>{profile.clothingSizes.shoes}</Text></View>
              )}
            </View>
            {profile?.jewelryPreferences && (
              <View style={styles.detailBlock}><Text style={styles.detailBlockLabel}>Jewelry</Text><Text style={styles.detailBlockVal}>{profile.jewelryPreferences}</Text></View>
            )}
            {profile?.homeDecorStyle && (
              <View style={styles.detailBlock}><Text style={styles.detailBlockLabel}>Home décor style</Text><Text style={styles.detailBlockVal}>{profile.homeDecorStyle}</Text></View>
            )}
            {profile?.favoriteFlowers && (
              <View style={styles.detailBlock}><Text style={styles.detailBlockLabel}>Favorite flowers</Text><Text style={styles.detailBlockVal}>{profile.favoriteFlowers}</Text></View>
            )}
          </>
        )}

        {/* All 9 celebration sections */}
        <Text style={styles.groupLabel}>Celebration profile</Text>
        <SectionCard emoji="❤️" label="My Favorites" textColor="#72243E" value={profile?.birthdayWishes} placeholder="Add your favorite things, places, and experiences..." />
        <SectionCard emoji="🎂" label="Birthday Vision Board" textColor="#3C3489" value={profile?.birthdayWishes} placeholder="Describe your dream birthday celebration..." />
        <SectionCard emoji="💍" label="Anniversary Dreams" textColor="#72243E" value={profile?.anniversaryIdeas} placeholder="How would you love to celebrate your anniversary?" />
        <SectionCard emoji="🌙" label="Eid Traditions" textColor="#0F6E56" value={profile?.eidHolidayIdeas} placeholder="Family traditions, gift ideas, and Eid wishes..." />
        <SectionCard emoji="✈️" label="Travel Wishlist" textColor="#0F6E56" value={profile?.travelDestinations} placeholder="Where in the world do you dream of going?" />
        <SectionCard emoji="🎁" label="Gift Wishlist" textColor="#3C3489" value={undefined} placeholder="Go to Wish Lists to see your organized gift categories →" />
        <SectionCard emoji="📸" label="Family Traditions" textColor="#444441" value={undefined} placeholder="Add photos and descriptions of your family traditions →" />
        <SectionCard emoji="📝" label="Letters & Memories" textColor="#444441" value={undefined} placeholder="Visit Memory Vault to preserve letters and recipes →" />

        {/* Family message */}
        <Text style={styles.groupLabel}>What I want my family to know</Text>
        <View style={[styles.sectionCard, { borderLeftColor: '#72243E', backgroundColor: '#FBEAF0' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Text style={{ fontSize: 16 }}>👵</Text>
            <Text style={[styles.sectionCardTitle, { color: '#72243E' }]}>A message to my family</Text>
            <View style={{ marginLeft: 'auto' }}>
              <Text style={{ fontSize: 11, color: profile?.familyMessageIsPublic ? '#0F6E56' : '#888' }}>
                {profile?.familyMessageIsPublic ? '• Shared' : '🔒 Private'}
              </Text>
            </View>
          </View>
          {profile?.familyMessage ? (
            <Text style={[styles.sectionCardValue, { fontStyle: 'italic' }]}>"{profile.familyMessage}"</Text>
          ) : (
            <Text style={styles.sectionCardEmpty}>Write a personal message to your loved ones...</Text>
          )}
        </View>

        {/* Charities */}
        {profile?.charitiesLoved && profile.charitiesLoved.length > 0 && (
          <>
            <Text style={styles.groupLabel}>Charities I'd love donations to</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {profile.charitiesLoved.map(c => (
                <View key={c} style={{ backgroundColor: '#E1F5EE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ fontSize: 13, color: '#0F6E56', fontWeight: '500' }}>❤️ {c}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <EditProfileModal visible={showEdit} onClose={() => setShowEdit(false)} profile={profile} />
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, gap: 12, borderWidth: 0.5, borderColor: '#e0deff' },
  profileAvatar:       { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  profileInitials:     { fontSize: 18, fontWeight: '700', color: '#3C3489' },
  profileName:         { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  profileSub:          { fontSize: 12, color: '#888', marginTop: 2 },
  editBtn:             { backgroundColor: '#534AB7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  editBtnText:         { fontSize: 13, color: '#fff', fontWeight: '600' },
  groupLabel:          { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
  detailsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  detailPill:          { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 0.5, borderColor: '#e0deff', flexDirection: 'row', gap: 6 },
  detailKey:           { fontSize: 11, color: '#888' },
  detailVal:           { fontSize: 12, fontWeight: '600', color: '#1a1a2e' },
  detailBlock:         { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: '#e0deff' },
  detailBlockLabel:    { fontSize: 11, color: '#888', marginBottom: 3 },
  detailBlockVal:      { fontSize: 13, color: '#1a1a2e', lineHeight: 18 },
  sectionCard:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: '#e0deff', borderLeftWidth: 3 },
  sectionCardTitle:    { fontSize: 13, fontWeight: '700' },
  sectionCardValue:    { fontSize: 13, color: '#444', lineHeight: 20 },
  sectionCardEmpty:    { fontSize: 12, color: '#bbb', fontStyle: 'italic' },
  // Modal
  modalHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderColor: '#e5e5e5' },
  modalTitle:          { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  cancel:              { fontSize: 15, color: '#888' },
  saveBtn:             { fontSize: 15, color: '#534AB7', fontWeight: '700' },
  sectionHeader:       { fontSize: 13, fontWeight: '700', color: '#534AB7', marginTop: 16, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 0.5, borderColor: '#e0deff' },
  fieldLabel:          { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:               { backgroundColor: '#f8f7ff', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0deff', marginBottom: 14 },
  toggleRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f7ff', padding: 14, borderRadius: 12, marginBottom: 16 },
});
