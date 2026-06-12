// src/services/firebase.ts
// Full Firestore service layer for WishKeeper

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import {
  UserProfile, Wish, CelebrationEvent, FamilyMember,
  GiftReservation, Memory, Reminder
} from '../types';

// ─── Collections ─────────────────────────────────────────────────────────────

const col = {
  users:        firestore().collection('users'),
  wishes:       firestore().collection('wishes'),
  events:       firestore().collection('events'),
  family:       firestore().collection('familyMembers'),
  reservations: firestore().collection('giftReservations'),
  memories:     firestore().collection('memories'),
  reminders:    firestore().collection('reminders'),
};

const now = () => new Date().toISOString();

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const currentUid = (): string => auth().currentUser?.uid ?? '';

// ─── User Profile ─────────────────────────────────────────────────────────────

export const UserService = {
  async create(uid: string, data: Partial<UserProfile>): Promise<void> {
    await col.users.doc(uid).set({ ...data, uid, createdAt: now(), plan: 'free' });
  },

  async get(uid: string): Promise<UserProfile | null> {
    const snap = await col.users.doc(uid).get();
    return snap.exists ? (snap.data() as UserProfile) : null;
  },

  async update(uid: string, data: Partial<UserProfile>): Promise<void> {
    await col.users.doc(uid).update(data);
  },

  subscribe(uid: string, cb: (profile: UserProfile | null) => void) {
    return col.users.doc(uid).onSnapshot(snap =>
      cb(snap.exists ? (snap.data() as UserProfile) : null)
    );
  },
};

// ─── Wishes ──────────────────────────────────────────────────────────────────

export const WishService = {
  async add(wish: Omit<Wish, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = col.wishes.doc();
    await ref.set({ ...wish, id: ref.id, createdAt: now(), updatedAt: now() });
    return ref.id;
  },

  async update(id: string, data: Partial<Wish>): Promise<void> {
    await col.wishes.doc(id).update({ ...data, updatedAt: now() });
  },

  async delete(id: string): Promise<void> {
    await col.wishes.doc(id).delete();
  },

  // All wishes for the profile owner (shown to family)
  subscribeByOwner(ownerUid: string, cb: (wishes: Wish[]) => void) {
    return col.wishes
      .where('ownerUid', '==', ownerUid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => cb(snap.docs.map(d => d.data() as Wish)));
  },

  // Wishes visible to a family member (excludes private)
  subscribeForFamilyMember(ownerUid: string, cb: (wishes: Wish[]) => void) {
    return col.wishes
      .where('ownerUid', '==', ownerUid)
      .where('isPrivate', '==', false)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => cb(snap.docs.map(d => d.data() as Wish)));
  },
};

// ─── Events ──────────────────────────────────────────────────────────────────

export const EventService = {
  async add(event: Omit<CelebrationEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = col.events.doc();
    await ref.set({ ...event, id: ref.id, createdAt: now(), updatedAt: now() });
    return ref.id;
  },

  async update(id: string, data: Partial<CelebrationEvent>): Promise<void> {
    await col.events.doc(id).update({ ...data, updatedAt: now() });
  },

  async delete(id: string): Promise<void> {
    await col.events.doc(id).delete();
  },

  subscribeByOwner(ownerUid: string, cb: (events: CelebrationEvent[]) => void) {
    return col.events
      .where('ownerUid', '==', ownerUid)
      .orderBy('date', 'asc')
      .onSnapshot(snap => cb(snap.docs.map(d => d.data() as CelebrationEvent)));
  },
};

// ─── Family Members ───────────────────────────────────────────────────────────

export const FamilyService = {
  async invite(member: Omit<FamilyMember, 'id' | 'invitedAt'>): Promise<string> {
    const ref = col.family.doc();
    await ref.set({
      ...member,
      id: ref.id,
      inviteStatus: 'pending',
      invitedAt: now(),
    });
    return ref.id;
  },

  async updateAccess(id: string, accessLevel: FamilyMember['accessLevel']): Promise<void> {
    await col.family.doc(id).update({ accessLevel });
  },

  async acceptInvite(id: string, memberUid: string): Promise<void> {
    await col.family.doc(id).update({ inviteStatus: 'accepted', memberUid });
  },

  async remove(id: string): Promise<void> {
    await col.family.doc(id).delete();
  },

  subscribeByOwner(ownerUid: string, cb: (members: FamilyMember[]) => void) {
    return col.family
      .where('ownerUid', '==', ownerUid)
      .onSnapshot(snap => cb(snap.docs.map(d => d.data() as FamilyMember)));
  },

  // Get all profiles a user has access to (for family members viewing someone's profile)
  async getAccessibleProfiles(memberUid: string): Promise<FamilyMember[]> {
    const snap = await col.family
      .where('memberUid', '==', memberUid)
      .where('inviteStatus', '==', 'accepted')
      .get();
    return snap.docs.map(d => d.data() as FamilyMember);
  },
};

// ─── Gift Reservations ────────────────────────────────────────────────────────

export const GiftService = {
  async reserve(reservation: Omit<GiftReservation, 'id' | 'createdAt'>): Promise<string> {
    const ref = col.reservations.doc();
    await ref.set({ ...reservation, id: ref.id, createdAt: now() });
    // Also update the wish
    await WishService.update(reservation.wishId, {
      reservedBy: reservation.reservedByUid,
      reservedByName: reservation.reservedByName,
    });
    return ref.id;
  },

  async markPurchased(id: string, wishId: string): Promise<void> {
    await col.reservations.doc(id).update({ isPurchased: true });
    await WishService.update(wishId, { isPurchased: true });
  },

  async cancel(id: string, wishId: string): Promise<void> {
    await col.reservations.doc(id).delete();
    await WishService.update(wishId, { reservedBy: undefined, reservedByName: undefined });
  },

  // Only visible to family, never to the profile owner
  subscribeByEvent(eventId: string, cb: (reservations: GiftReservation[]) => void) {
    return col.reservations
      .where('eventId', '==', eventId)
      .onSnapshot(snap => cb(snap.docs.map(d => d.data() as GiftReservation)));
  },
};

// ─── Memories ─────────────────────────────────────────────────────────────────

export const MemoryService = {
  async add(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = col.memories.doc();
    await ref.set({ ...memory, id: ref.id, createdAt: now(), updatedAt: now() });
    return ref.id;
  },

  async update(id: string, data: Partial<Memory>): Promise<void> {
    await col.memories.doc(id).update({ ...data, updatedAt: now() });
  },

  async delete(id: string): Promise<void> {
    await col.memories.doc(id).delete();
  },

  subscribeByOwner(ownerUid: string, isOwner: boolean, cb: (memories: Memory[]) => void) {
    let query = col.memories.where('ownerUid', '==', ownerUid);
    if (!isOwner) query = query.where('isPrivate', '==', false) as any;
    return query
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => cb(snap.docs.map(d => d.data() as Memory)));
  },
};

// ─── Reminders ────────────────────────────────────────────────────────────────

export const ReminderService = {
  async add(reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<string> {
    const ref = col.reminders.doc();
    await ref.set({ ...reminder, id: ref.id, createdAt: now() });
    return ref.id;
  },

  async update(id: string, data: Partial<Reminder>): Promise<void> {
    await col.reminders.doc(id).update(data);
  },

  async delete(id: string): Promise<void> {
    await col.reminders.doc(id).delete();
  },

  subscribeByOwner(ownerUid: string, cb: (reminders: Reminder[]) => void) {
    return col.reminders
      .where('ownerUid', '==', ownerUid)
      .orderBy('date', 'asc')
      .onSnapshot(snap => cb(snap.docs.map(d => d.data() as Reminder)));
  },
};

// ─── Storage ──────────────────────────────────────────────────────────────────

export const StorageService = {
  async uploadProfilePhoto(uid: string, localUri: string): Promise<string> {
    const ref = storage().ref(`profiles/${uid}/avatar.jpg`);
    await ref.putFile(localUri);
    return ref.getDownloadURL();
  },

  async uploadWishPhoto(uid: string, wishId: string, localUri: string): Promise<string> {
    const ref = storage().ref(`wishes/${uid}/${wishId}.jpg`);
    await ref.putFile(localUri);
    return ref.getDownloadURL();
  },

  async uploadMemoryPhoto(uid: string, memoryId: string, localUri: string): Promise<string> {
    const ref = storage().ref(`memories/${uid}/${memoryId}.jpg`);
    await ref.putFile(localUri);
    return ref.getDownloadURL();
  },
};
