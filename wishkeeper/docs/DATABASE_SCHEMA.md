# WishKeeper — Firestore Database Schema

## Overview

WishKeeper uses Google Cloud Firestore (NoSQL document database).
All collections are flat (no subcollections) for easy querying and security rule management.

---

## Collections

### `users/{uid}`
Stores each user's profile.

| Field              | Type     | Notes                                  |
|--------------------|----------|----------------------------------------|
| uid                | string   | Firebase Auth UID                      |
| displayName        | string   | Full name                              |
| email              | string   | From Auth                              |
| photoURL           | string?  | Firebase Storage URL                   |
| birthdate          | string?  | ISO date "YYYY-MM-DD"                  |
| anniversary        | string?  | ISO date                               |
| clothingSize       | string?  | "M", "8", etc.                         |
| jewelryPreferences | string?  | Free text                              |
| homeDecorStyle     | string?  | Free text                              |
| plan               | string   | "free" | "premium" | "family"           |
| fcmToken           | string?  | Push notification token (updated on login) |
| createdAt          | string   | ISO datetime                           |

**Indexes:** uid (document ID)

---

### `wishes/{wishId}`
Each wish belongs to one profile owner.

| Field           | Type     | Notes                                   |
|-----------------|----------|-----------------------------------------|
| id              | string   | Document ID                             |
| ownerUid        | string   | Profile owner's UID                     |
| title           | string   | What the person wants                   |
| category        | string   | WishCategory enum                       |
| priority        | string   | "high" | "medium" | "low"               |
| price           | string?  | "$50–100" — display string              |
| link            | string?  | Product URL                             |
| notes           | string?  | Size, color, details                    |
| photoURL        | string?  | Firebase Storage                        |
| isPrivate       | boolean  | Hidden from all family if true          |
| reservedBy      | string?  | Family member UID                       |
| reservedByName  | string?  | Display name of reserver                |
| isPurchased     | boolean  | True after gift is bought               |
| eventId         | string?  | Linked CelebrationEvent                 |
| createdAt       | string   | ISO datetime                            |
| updatedAt       | string   | ISO datetime                            |

**Indexes:**
- `ownerUid ASC, createdAt DESC` (primary list query)
- `ownerUid ASC, isPrivate ASC, createdAt DESC` (family view)
- `ownerUid ASC, category ASC, priority ASC` (filtered views)

---

### `events/{eventId}`
Celebration events / vision boards.

| Field             | Type       | Notes                                 |
|-------------------|------------|---------------------------------------|
| id                | string     | Document ID                           |
| ownerUid          | string     | Profile owner UID                     |
| name              | string     | "50th Birthday Celebration"           |
| type              | string     | EventType enum                        |
| date              | string     | ISO date "YYYY-MM-DD"                 |
| description       | string?    | Short description                     |
| theme             | string?    | "Garden party", "Italian evening"     |
| venue             | string?    | Venue name / ideas                    |
| guestCount        | number?    | Expected guests                       |
| colors            | string[]?  | ["dusty rose", "sage", "gold"]        |
| foodPreferences   | string?    | Catering / cuisine notes              |
| entertainment     | string?    | Band, DJ, photo booth                 |
| cakeDescription   | string?    | Flavor, design notes                  |
| notes             | string?    | Extra planning notes                  |
| planningProgress  | number     | 0–100 (set manually or computed)      |
| isPrivate         | boolean    | Hidden from family if true            |
| createdAt         | string     | ISO datetime                          |
| updatedAt         | string     | ISO datetime                          |

**Indexes:**
- `ownerUid ASC, date ASC`
- `ownerUid ASC, isPrivate ASC, date ASC`

---

### `familyMembers/{memberId}`
Controls who can view whose profile and at what access level.

| Field         | Type     | Notes                                        |
|---------------|----------|----------------------------------------------|
| id            | string   | Document ID                                  |
| ownerUid      | string   | Profile owner (the woman whose wishes these are) |
| memberUid     | string?  | UID of family member (set after invite accepted) |
| name          | string   | Family member's name                         |
| email         | string   | Used to match when they create account       |
| role          | string   | FamilyRole enum                              |
| accessLevel   | string   | AccessLevel enum                             |
| inviteStatus  | string   | "pending" | "accepted" | "declined"         |
| invitedAt     | string   | ISO datetime                                 |

**Indexes:**
- `ownerUid ASC` (list all members of a profile)
- `memberUid ASC, inviteStatus ASC` (which profiles can this user see)
- `email ASC` (match invite to new account)

---

### `giftReservations/{resId}`
Family gift coordination. THE PROFILE OWNER MUST NOT BE ABLE TO READ THESE.
Security rules explicitly deny read if `request.auth.uid == resource.data.ownerUid`.

| Field           | Type     | Notes                              |
|-----------------|----------|------------------------------------|
| id              | string   | Document ID                        |
| wishId          | string   | The Wish being reserved            |
| eventId         | string   | The associated event               |
| ownerUid        | string   | Profile owner (used for deny rule) |
| reservedByUid   | string   | Family member who reserved it      |
| reservedByName  | string   | Display name                       |
| isPurchased     | boolean  | Has it been bought yet             |
| notes           | string?  | "Bought in black, size M"          |
| createdAt       | string   | ISO datetime                       |

**Indexes:**
- `eventId ASC` (all reservations for an event)
- `reservedByUid ASC` (what I've reserved)

---

### `memories/{memoryId}`
Memory vault — photos, letters, recipes, traditions.

| Field       | Type     | Notes                                         |
|-------------|----------|-----------------------------------------------|
| id          | string   | Document ID                                   |
| ownerUid    | string   | Profile owner                                 |
| title       | string   | e.g. "Letter to my daughter"                  |
| type        | string   | "photo"|"letter"|"recipe"|"tradition"|"note"  |
| content     | string?  | Text content (letters, recipes, notes)        |
| photoURL    | string?  | Firebase Storage URL                          |
| isPrivate   | boolean  | Hidden from family if true                    |
| unlocksAt   | string?  | ISO date — time-locked letters                |
| createdAt   | string   | ISO datetime                                  |
| updatedAt   | string   | ISO datetime                                  |

**Indexes:**
- `ownerUid ASC, createdAt DESC`
- `ownerUid ASC, isPrivate ASC, createdAt DESC`

---

### `reminders/{reminderId}`
Upcoming celebration reminders sent to family.

| Field                    | Type      | Notes                              |
|--------------------------|-----------|------------------------------------|
| id                       | string    | Document ID                        |
| ownerUid                 | string    | Whose profile                      |
| title                    | string    | "Sarah's 50th Birthday"            |
| date                     | string    | ISO date                           |
| eventId                  | string?   | Linked event                       |
| notifyFamilyDaysBefore   | number[]  | [60, 30, 7, 1]                     |
| isActive                 | boolean   | Toggle reminders on/off            |
| createdAt                | string    | ISO datetime                       |

**Indexes:**
- `ownerUid ASC, date ASC`
- `isActive ASC, date ASC` (Cloud Function query)

---

## Firebase Storage structure

```
/profiles/{uid}/avatar.jpg
/wishes/{uid}/{wishId}.jpg
/memories/{uid}/{memoryId}.jpg
```

All files require authenticated access via Firebase Storage security rules.

---

## Key design decisions

1. **Flat collections** — No subcollections so Firestore security rules stay simple and readable
2. **Gift secrecy** — `giftReservations` explicitly denies reads from the profile owner via security rules AND by using a Cloud Function wrapper (`getGiftReservations`)
3. **Private items** — `isPrivate: boolean` on wishes, events, and memories. Security rules enforce this at the DB level, not just the UI
4. **Family access levels** — Enforced in the app layer (what screens/data to show). Firestore rules enforce `isPrivate` but can't easily enforce `accessLevel` per document — use Cloud Functions for fine-grained access checks in production
5. **Invite flow** — Family member is stored with `inviteStatus: "pending"` and matched to a new/existing account by email when they accept
