# WishKeeper — Developer README

> A private family celebration platform where women capture their wishes,
> party preferences, and milestone dreams — and selectively share them with loved ones.

---

## Tech Stack

| Layer        | Technology                       |
|--------------|----------------------------------|
| Mobile app   | React Native 0.73 (iOS + Android)|
| Language     | TypeScript                       |
| Navigation   | React Navigation v6              |
| Backend      | Firebase (Firestore + Auth + Storage + Cloud Functions + FCM) |
| Notifications| Notifee + Firebase Cloud Messaging|
| Email        | SendGrid (via Cloud Functions)   |

---

## Project Structure

```
wishkeeper/
├── src/
│   ├── types/          # TypeScript interfaces for all data models
│   ├── services/
│   │   └── firebase.ts # All Firestore read/write operations
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── WishesScreen.tsx
│   │   ├── EventsScreen.tsx      ← scaffold provided
│   │   ├── FamilyScreen.tsx
│   │   ├── GiftTrackerScreen.tsx ← scaffold provided
│   │   ├── MemoriesScreen.tsx    ← scaffold provided
│   │   ├── RemindersScreen.tsx   ← scaffold provided
│   │   ├── AIAssistantScreen.tsx ← scaffold provided
│   │   └── OnboardingScreen.tsx  ← scaffold provided
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Date, formatting helpers
├── firebase/
│   ├── firestore.rules
│   └── functions/
│       └── index.ts    # Cloud Functions (reminders, invites, FCM)
├── docs/
│   └── DATABASE_SCHEMA.md
└── package.json
```

---

## Setup

### 1. Prerequisites

- Node.js 18+
- Ruby 3.x (iOS)
- Xcode 15+ (iOS)
- Android Studio (Android)
- Firebase CLI: `npm install -g firebase-tools`

### 2. Clone and install

```bash
git clone https://github.com/your-org/wishkeeper.git
cd wishkeeper
npm install
cd ios && pod install && cd ..
```

### 3. Firebase project setup

```bash
# Create a new Firebase project at console.firebase.google.com
# Enable: Authentication, Firestore, Storage, Cloud Functions, Cloud Messaging

firebase login
firebase init
# Select: Firestore, Functions, Storage, Emulators

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
cd firebase/functions && npm install && cd ../..
firebase deploy --only functions
```

### 4. Add Firebase config files

- iOS: Download `GoogleService-Info.plist` → place in `ios/WishKeeper/`
- Android: Download `google-services.json` → place in `android/app/`

### 5. Run the app

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Metro bundler
npx react-native start
```

---

## Key Features

### Wish Lists
- 10 categories: Gifts, Experiences, Restaurants, Books, Jewelry, Home Items, Travel, Acts of Service, Clothing, Charities
- Priority levels (high/medium/low) shown as color-coded dots
- Optional price range, external link, notes, and photo
- Private mode: hide specific wishes from all family

### Celebration Events / Vision Boards
- Create events: Birthday, Anniversary, Eid, Holiday, Mother's Day, Graduation, Other
- Vision board fields: theme, venue, colors, food, entertainment, cake, guest count
- Planning progress tracker (0–100%)
- Private events hidden from family

### Family Access Controls
- Invite family by email
- 5 access levels: Full, Gifts+Events, Gifts Only, Events Only, View Only
- Accepted members see only what they're permitted
- Shareable family link

### Gift Tracker (Secret Coordination)
- Family members can reserve and mark gifts as purchased
- Profile owner is **cryptographically blocked** from reading reservations via Firestore rules
- Prevents duplicate gifts

### Memory Vault
- Types: photos, letters, recipes, traditions, notes
- Time-locked letters (e.g., "open on my 60th birthday")
- Private memories visible only to owner

### Smart Reminders
- Configurable days-before notifications (e.g., 60, 30, 7, 1 days)
- Daily Cloud Function checks and sends FCM push to family
- Invite email via SendGrid when family member is added

---

## Pricing Model

| Plan          | Price     | Features                                      |
|---------------|-----------|-----------------------------------------------|
| Free          | $0        | 1 user, basic wishes, 3 family members        |
| Premium       | $7.99/mo  | Unlimited, AI suggestions, memory vault       |
| Family        | $14.99/mo | Up to 10 family members, shared calendar      |

---

## App Store Info

**App Name:** WishKeeper  
**Subtitle:** Your celebration hub  
**Category:** Lifestyle  
**Keywords:** wishlist, birthday, gifts, family, anniversary, celebration, Eid

**Description:**
WishKeeper is the private celebration platform where you capture exactly how you want to be celebrated — and share it selectively with your family. 

No more guessing games. No duplicate gifts. No "I didn't know what you wanted."

Create wish lists, plan your dream birthday party, document your anniversary ideas, and build a memory vault for your family — all in one beautifully simple app.

---

## Roadmap

- [ ] AI-powered gift suggestions (OpenAI / Claude API integration)
- [ ] Pinterest-style visual boards with photo uploads  
- [ ] Group gifting (family members pool money for one large gift)
- [ ] Anniversary countdown & milestone timeline
- [ ] Apple Watch complications for reminders
- [ ] Web dashboard for family members (no app install required)
- [ ] Integration with Amazon, Etsy, and other wishlists
- [ ] LegacyCare integration (companion life-planning app)
