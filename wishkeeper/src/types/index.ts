// src/types/index.ts — WishKeeper complete type definitions

export type WishPriority = 'high' | 'medium' | 'low';

export type WishCategory =
  | 'Gifts I Want'
  | 'Experiences I\'d Love'
  | 'Restaurants I\'d Like to Try'
  | 'Home Items'
  | 'Jewelry'
  | 'Books'
  | 'Acts of Service'
  | 'Travel'
  | 'Charities';

export type EventType = 'birthday' | 'anniversary' | 'eid' | 'mothers_day' | 'graduation' | 'holiday' | 'other';
export type FamilyRole = 'spouse' | 'child' | 'parent' | 'sibling' | 'friend' | 'other';
export type AccessLevel = 'full' | 'gifts_events' | 'gifts_only' | 'events_only' | 'partial' | 'view_only';
export type MemoryType = 'photo' | 'letter' | 'recipe' | 'tradition' | 'important_date' | 'note';

// Profile sections the user can populate
export type ProfileSection =
  | 'favorites'          // ❤️ My Favorites
  | 'birthday_vision'    // 🎂 Birthday Vision Board
  | 'anniversary_dreams' // 💍 Anniversary Dreams
  | 'eid_traditions'     // 🌙 Eid Traditions
  | 'travel_wishlist'    // ✈️ Travel Wishlist
  | 'gift_wishlist'      // 🎁 Gift Wishlist
  | 'family_traditions'  // 📸 Family Traditions
  | 'letters_memories'   // 📝 Letters & Memories
  | 'family_message';    // 👵 What I Want My Family To Know

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;

  // Important dates
  birthdate?: string;        // ISO date
  anniversary?: string;      // ISO date

  // Preferences (shown on profile for family)
  clothingSizes?: {
    top?: string;            // "M", "L"
    dress?: string;          // "8", "10"
    shoes?: string;          // "8.5"
    pants?: string;
  };
  jewelryPreferences?: string;    // "Gold only, delicate layering pieces"
  homeDecorStyle?: string;        // "Mediterranean / warm neutral"
  favoriteFlowers?: string;       // "Peonies, garden roses"
  favoriteRestaurants?: string[]; // Local favorites
  favoriteColors?: string[];
  dietaryPreferences?: string;

  // Celebration preferences
  birthdayWishes?: string;        // Free text describing dream birthday
  anniversaryIdeas?: string;
  mothersDayWishes?: string;
  eidHolidayIdeas?: string;
  bucketListExperiences?: string;
  travelDestinations?: string;
  charitiesLoved?: string[];

  // "What I want my family to know" — private by default
  familyMessage?: string;
  familyMessageIsPublic?: boolean;

  createdAt: string;
  plan: 'free' | 'premium' | 'family';
}

// ─── Wish ────────────────────────────────────────────────────────────────────

export interface Wish {
  id: string;
  ownerUid: string;
  title: string;
  category: WishCategory;
  priority: WishPriority;
  price?: string;          // "$50–100"
  link?: string;
  notes?: string;
  photoURL?: string;       // User-uploaded photo
  isPrivate: boolean;
  reservedBy?: string;
  reservedByName?: string;
  isPurchased: boolean;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Event / Vision Board ────────────────────────────────────────────────────

export interface CelebrationEvent {
  id: string;
  ownerUid: string;
  name: string;
  type: EventType;
  date: string;
  description?: string;
  theme?: string;
  venue?: string;
  guestList?: string;       // Free text or count
  guestCount?: number;
  colors?: string[];
  foodPreferences?: string;
  entertainment?: string;
  cakeDescription?: string;
  notes?: string;
  planningProgress: number; // 0–100
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Family Member ────────────────────────────────────────────────────────────

export interface FamilyMember {
  id: string;
  ownerUid: string;
  memberUid?: string;
  name: string;
  email: string;
  role: FamilyRole;
  accessLevel: AccessLevel;
  // For partial access — which specific categories/sections they can see
  allowedSections?: ProfileSection[];
  allowedWishCategories?: WishCategory[];
  inviteStatus: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
}

// ─── Gift Reservation ─────────────────────────────────────────────────────────

export interface GiftReservation {
  id: string;
  wishId: string;
  eventId: string;
  ownerUid: string;   // NEVER readable by this uid (security rule)
  reservedByUid: string;
  reservedByName: string;
  isPurchased: boolean;
  notes?: string;
  createdAt: string;
}

// ─── Memory ──────────────────────────────────────────────────────────────────

export interface Memory {
  id: string;
  ownerUid: string;
  title: string;
  type: MemoryType;
  content?: string;
  photoURL?: string;
  isPrivate: boolean;
  unlocksAt?: string;    // Time-locked letters
  createdAt: string;
  updatedAt: string;
}

// ─── Reminder ────────────────────────────────────────────────────────────────

export interface Reminder {
  id: string;
  ownerUid: string;
  title: string;
  date: string;
  eventType: EventType;
  eventId?: string;
  notifyFamilyDaysBefore: number[];  // [60, 30, 7, 1]
  isActive: boolean;
  isRecurring: boolean;              // true for birthdays, anniversaries
  createdAt: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Wishes: undefined;
  Events: undefined;
  Family: undefined;
  More: undefined;
};
