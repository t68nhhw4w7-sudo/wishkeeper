// src/screens/AIAssistantScreen.tsx

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';

const PURPLE = '#534AB7';

interface Message { role: 'user' | 'assistant'; text: string; }

const QUICK_PROMPTS = [
  { emoji: '🎂', label: 'Birthday party themes', prompt: 'Give me 5 unique and personal birthday party theme ideas for a woman turning 50 who loves gardens, travel, and Mediterranean food.' },
  { emoji: '💍', label: 'Anniversary gifts', prompt: 'What are 10 meaningful anniversary gift ideas for a 25th anniversary? Mix experiences and physical gifts.' },
  { emoji: '🌙', label: 'Eid gift ideas', prompt: 'Suggest thoughtful Eid al-Adha gift ideas for a woman who loves home décor, fragrance, and wellness.' },
  { emoji: '✉️', label: 'Birthday wish letter', prompt: 'Write a beautiful, heartfelt birthday message from a daughter to her mother turning 50. Warm and personal.' },
  { emoji: '🌸', label: "Mother's Day ideas", prompt: "Give me 8 creative Mother's Day celebration ideas that go beyond flowers and brunch." },
  { emoji: '✈️', label: 'Travel wish list', prompt: 'Suggest 6 romantic or meaningful travel destinations for a woman who loves culture, food, and history.' },
];

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your personal celebration assistant. Ask me about gift ideas, party themes, event planning, or let me help you describe what you want for any occasion. 🎉" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are WishKeeper's celebration assistant. Help women plan celebrations, find gift ideas, describe their wishes, and document how they want to be celebrated. You know about birthdays, anniversaries, Eid, Mother's Day, and all milestones. Be warm, personal, and specific. Keep responses concise and practical. Use emojis sparingly. Never be generic.`,
          messages: newMessages.map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text ?? "I'm having trouble responding right now. Please try again!";
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "Couldn't connect. Please check your internet and try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8F7FF' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Quick prompts */}
        {messages.length <= 1 && (
          <>
            <Text style={ai.sectionLabel}>Quick questions</Text>
            <View style={ai.quickGrid}>
              {QUICK_PROMPTS.map(q => (
                <TouchableOpacity key={q.label} style={ai.quickCard} onPress={() => send(q.prompt)}>
                  <Text style={ai.quickEmoji}>{q.emoji}</Text>
                  <Text style={ai.quickLabel}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <View key={i} style={[ai.bubble, m.role === 'user' ? ai.userBubble : ai.assistantBubble]}>
            <Text style={[ai.bubbleText, m.role === 'user' ? ai.userText : ai.assistantText]}>
              {m.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={ai.assistantBubble}>
            <ActivityIndicator size="small" color={PURPLE} />
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={ai.inputBar}>
        <TextInput
          style={ai.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about gifts, themes, planning..."
          multiline
          maxLength={500}
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity style={[ai.sendBtn, { opacity: input.trim() && !loading ? 1 : 0.4 }]} onPress={() => send(input)} disabled={!input.trim() || loading}>
          <Text style={ai.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const ai = StyleSheet.create({
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickCard:    { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  quickEmoji:   { fontSize: 22, marginBottom: 6 },
  quickLabel:   { fontSize: 13, fontWeight: '600', color: '#1a1a2e', lineHeight: 18 },
  bubble:       { marginBottom: 10, maxWidth: '85%', borderRadius: 16, padding: 12 },
  userBubble:   { alignSelf: 'flex-end', backgroundColor: PURPLE },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  bubbleText:   { fontSize: 14, lineHeight: 21 },
  userText:     { color: '#fff' },
  assistantText:{ color: '#1a1a2e' },
  inputBar:     { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff', borderTopWidth: 0.5, borderColor: '#e5e5e5', alignItems: 'flex-end' },
  input:        { flex: 1, backgroundColor: '#f8f7ff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1a1a2e', maxHeight: 100, borderWidth: 1, borderColor: '#e0deff' },
  sendBtn:      { width: 42, height: 42, borderRadius: 21, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  sendIcon:     { color: '#fff', fontSize: 18, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// src/screens/GiftTrackerScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { GiftService, WishService, EventService } from '../services/firebase';
import { GiftReservation, Wish, CelebrationEvent } from '../types';

export function GiftTrackerScreen() {
  const uid = currentUid();
  const [events, setEvents]   = useState<CelebrationEvent[]>([]);
  const [wishes, setWishes]   = useState<Wish[]>([]);
  const [reservations, setRes] = useState<GiftReservation[]>([]);
  const [selectedEvent, setSel] = useState<string | null>(null);

  useEffect(() => {
    const u1 = EventService.subscribeByOwner(uid, e => { setEvents(e); if (e.length > 0 && !selectedEvent) setSel(e[0].id); });
    const u2 = WishService.subscribeForFamilyMember(uid, setWishes);
    return () => { u1(); u2(); };
  }, [uid]);

  useEffect(() => {
    if (!selectedEvent) return;
    return GiftService.subscribeByEvent(selectedEvent, setRes);
  }, [selectedEvent]);

  const isReserved = (wishId: string) => reservations.find(r => r.wishId === wishId);

  const toggleReserve = async (wish: Wish) => {
    if (!selectedEvent) return;
    const existing = isReserved(wish.id);
    if (existing) {
      Alert.alert('Cancel reservation?', undefined, [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => GiftService.cancel(existing.id, wish.id) },
      ]);
    } else {
      await GiftService.reserve({
        wishId: wish.id, eventId: selectedEvent, ownerUid: uid,
        reservedByUid: 'family_member_uid', reservedByName: 'Family Member',
        isPurchased: false,
      });
    }
  };

  const reservedWishes  = wishes.filter(w => isReserved(w.id));
  const availableWishes = wishes.filter(w => !isReserved(w.id));

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      {/* Event selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 56, paddingVertical: 10 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
        {events.map(e => (
          <TouchableOpacity key={e.id} onPress={() => setSel(e.id)} style={[{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedEvent === e.id ? PURPLE : '#fff', borderWidth: 1, borderColor: selectedEvent === e.id ? PURPLE : '#e0deff' }]}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: selectedEvent === e.id ? '#fff' : '#555' }}>{e.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Secret notice */}
        <View style={{ backgroundColor: '#fff8e6', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fce08a', flexDirection: 'row', gap: 8 }}>
          <Text style={{ fontSize: 16 }}>🔒</Text>
          <Text style={{ fontSize: 13, color: '#7a5c00', flex: 1, lineHeight: 19 }}>
            Gift reservations are hidden from the profile owner. Only family members can see this.
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total wishes', value: wishes.length },
            { label: 'Reserved', value: reservedWishes.length },
            { label: 'Available', value: availableWishes.length },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: PURPLE }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Available */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 }}>Available to reserve</Text>
        {availableWishes.map(w => (
          <View key={w.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a2e' }}>{w.title}</Text>
              <Text style={{ fontSize: 12, color: '#888' }}>{w.category}{w.price ? ` · ${w.price}` : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleReserve(w)} style={{ backgroundColor: PURPLE, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Reserve</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Reserved */}
        {reservedWishes.length > 0 && (
          <>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 8, marginTop: 8 }}>Reserved gifts</Text>
            {reservedWishes.map(w => {
              const res = isReserved(w.id)!;
              return (
                <View key={w.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fff4', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#b8f0c8' }}>
                  <Text style={{ fontSize: 20 }}>✓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a2e', textDecorationLine: 'line-through' }}>{w.title}</Text>
                    <Text style={{ fontSize: 12, color: TEAL }}>Reserved by {res.reservedByName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleReserve(w)}>
                    <Text style={{ fontSize: 12, color: '#c00' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function currentUid() { return require('../services/firebase').currentUid(); }
