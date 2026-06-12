// firebase/functions/index.ts
// WishKeeper — Cloud Functions

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

// ─── Email transport (configure with SendGrid or similar) ─────────────────────

const transport = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: functions.config().sendgrid?.key ?? '',
  },
});

// ─── Send invite email when a new family member is added ─────────────────────

export const onFamilyMemberInvited = functions.firestore
  .document('familyMembers/{memberId}')
  .onCreate(async (snap) => {
    const member = snap.data();
    const ownerDoc = await db.doc(`users/${member.ownerUid}`).get();
    const owner = ownerDoc.data();
    if (!owner || !member.email) return;

    const inviteLink = `https://wishkeeper.app/invite/${snap.id}`;
    await transport.sendMail({
      from: 'WishKeeper <hello@wishkeeper.app>',
      to: member.email,
      subject: `${owner.displayName} invited you to their WishKeeper`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #534AB7;">You're invited! 🎁</h2>
          <p><strong>${owner.displayName}</strong> has invited you to view their celebration wishes on WishKeeper.</p>
          <p>As their <strong>${member.role}</strong>, you'll have access to: <strong>${member.accessLevel.replace(/_/g,' ')}</strong></p>
          <a href="${inviteLink}" style="display:inline-block;background:#534AB7;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;margin:16px 0;">
            Accept invitation
          </a>
          <p style="color:#999;font-size:12px;">WishKeeper — Never miss a celebration moment</p>
        </div>
      `,
    });
  });

// ─── Push notification reminders (runs daily at 8 AM) ─────────────────────────

export const dailyReminderCheck = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('America/New_York')
  .onRun(async () => {
    const today = new Date();

    // Get all reminders
    const remindersSnap = await db.collection('reminders').where('isActive', '==', true).get();

    for (const doc of remindersSnap.docs) {
      const reminder = doc.data();
      const eventDate = new Date(reminder.date);
      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (!reminder.notifyFamilyDaysBefore.includes(daysUntil)) continue;

      // Get all accepted family members for this owner
      const familySnap = await db.collection('familyMembers')
        .where('ownerUid', '==', reminder.ownerUid)
        .where('inviteStatus', '==', 'accepted')
        .get();

      // Get owner's display name
      const ownerDoc = await db.doc(`users/${reminder.ownerUid}`).get();
      const ownerName = ownerDoc.data()?.displayName ?? 'someone special';

      // Send push to each family member
      const tokens: string[] = [];
      for (const famDoc of familySnap.docs) {
        const fam = famDoc.data();
        if (fam.memberUid) {
          const userDoc = await db.doc(`users/${fam.memberUid}`).get();
          const fcmToken = userDoc.data()?.fcmToken;
          if (fcmToken) tokens.push(fcmToken);
        }
      }

      if (tokens.length > 0) {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: `🎂 ${reminder.title} in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`,
            body: `Time to plan something special for ${ownerName}. Check their WishKeeper!`,
          },
          data: {
            type: 'reminder',
            ownerUid: reminder.ownerUid,
            daysUntil: String(daysUntil),
          },
        });
      }
    }
  });

// ─── Store FCM token when user logs in ────────────────────────────────────────

export const storeFcmToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const { token } = data;
  if (!token) throw new functions.https.HttpsError('invalid-argument', 'Token required');
  await db.doc(`users/${context.auth.uid}`).update({ fcmToken: token });
  return { success: true };
});

// ─── Get gift reservations for a family member (hides owner) ─────────────────

export const getGiftReservations = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const { eventId } = data;

  // Verify caller is NOT the event owner
  const eventDoc = await db.doc(`events/${eventId}`).get();
  if (!eventDoc.exists) throw new functions.https.HttpsError('not-found', 'Event not found');
  const event = eventDoc.data()!;
  if (event.ownerUid === context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Recipients cannot view gift reservations');
  }

  const snap = await db.collection('giftReservations')
    .where('eventId', '==', eventId)
    .get();
  return snap.docs.map(d => d.data());
});
