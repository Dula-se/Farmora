/**
 * chat-service.ts
 *
 * Bidirectional in-memory chat store.
 * Both buyer and farmer share the SAME conversationsCache (module-level singleton),
 * so a message sent by the buyer WILL appear when the farmer opens the same
 * conversation — no backend required.
 *
 * Sender identity:
 *   - Every message carries senderRole: 'buyer' | 'farmer' (the role that sent it).
 *   - The conversation screen determines "isMe" by comparing the message's
 *     senderRole against the currentRole prop of the viewer.
 */

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'farmer' | 'buyer';
  text: string;
  timestamp: string;
  isRead: boolean;
  imageUri?: string;
  isVoiceNote?: boolean;
  voiceDuration?: string;
  voiceWaveform?: number[];
  offer?: NegotiationOffer;
}

export interface NegotiationOffer {
  id: string;
  productTitle: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  counterBy?: 'buyer' | 'farmer';
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: 'farmer' | 'buyer';
  participantAvatar: string;
  isOnline: boolean;
  verified: boolean;
  productTitle?: string;
  productImage?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface CallRecord {
  id: string;
  participantName: string;
  participantAvatar: string;
  participantRole: 'farmer' | 'buyer';
  type: 'incoming' | 'outgoing' | 'missed';
  callMode: 'audio' | 'video';
  timestamp: string;
  duration?: string;
}

export interface ReviewItem {
  id: string;
  targetId: string;
  authorName: string;
  authorRole: 'buyer' | 'farmer';
  authorAvatar: string;
  overallRating: number;
  criteriaRatings: {
    quality?: number;
    freshness?: number;
    packaging?: number;
    communication?: number;
    paymentPromptness?: number;
  };
  tags: string[];
  comment: string;
  images?: string[];
  date: string;
  helpfulCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowStr(offsetMinutes = 0): string {
  const d = new Date(Date.now() - offsetMinutes * 60000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateWaveform(): number[] {
  return Array.from({ length: 20 }, () => 8 + Math.floor(Math.random() * 24));
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participantId: 'farmer-kusuma',
    participantName: 'Kusuma Bandara',
    participantRole: 'farmer',
    participantAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    isOnline: true,
    verified: true,
    productTitle: 'Organic Red Tomatoes',
    productImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
    lastMessage: 'I can harvest early morning and dispatch 100kg directly.',
    lastMessageTime: nowStr(32),
    unreadCount: 2,
    messages: [
      {
        id: 'm1',
        senderId: 'buyer',
        senderName: 'You',
        senderRole: 'buyer',
        text: 'Ayubowan! Is the 150kg tomatoes batch available for collection this Wednesday?',
        timestamp: nowStr(45),
        isRead: true,
      },
      {
        id: 'm2',
        senderId: 'farmer',
        senderName: 'Kusuma Bandara',
        senderRole: 'farmer',
        text: 'Ayubowan! Yes, the field harvest is in prime condition. Grade A sorting ready.',
        timestamp: nowStr(42),
        isRead: true,
      },
      {
        id: 'm3',
        senderId: 'buyer',
        senderName: 'You',
        senderRole: 'buyer',
        text: 'Can you give me bulk price for 100 kg?',
        timestamp: nowStr(40),
        isRead: true,
        offer: {
          id: 'off-1',
          productTitle: 'Organic Red Tomatoes',
          quantity: 100,
          unit: 'kg',
          pricePerUnit: 220,
          totalAmount: 22000,
          status: 'pending',
          counterBy: 'buyer',
        },
      },
      {
        id: 'm4',
        senderId: 'farmer',
        senderName: 'Kusuma Bandara',
        senderRole: 'farmer',
        text: 'I can harvest early morning and dispatch 100kg directly.',
        timestamp: nowStr(32),
        isRead: false,
      },
    ],
  },
  {
    id: 'c2',
    participantId: 'buyer-sunil',
    participantName: 'Sunil Dissanayake',
    participantRole: 'buyer',
    participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    isOnline: false,
    verified: true,
    productTitle: 'Highland Carrots',
    productImage: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
    lastMessage: 'Can you dispatch the tomatoes before 10 AM?',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    messages: [
      {
        id: 'm10',
        senderId: 'buyer',
        senderName: 'Sunil Dissanayake',
        senderRole: 'buyer',
        text: 'Can you dispatch the tomatoes before 10 AM?',
        timestamp: 'Yesterday 4:15 PM',
        isRead: true,
      },
      {
        id: 'm11',
        senderId: 'farmer',
        senderName: 'You',
        senderRole: 'farmer',
        text: 'Yes sir, crates are labeled and packed for 9:30 AM pickup.',
        timestamp: 'Yesterday 4:30 PM',
        isRead: true,
      },
    ],
  },
  {
    id: 'c3',
    participantId: 'buyer-greenleaf',
    participantName: 'Green Leaf Supermarket',
    participantRole: 'buyer',
    participantAvatar: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=400',
    isOnline: true,
    verified: true,
    productTitle: 'Green Bell Peppers',
    productImage: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
    lastMessage: 'Invoice received. Transferring to commercial escrow account.',
    lastMessageTime: 'Oct 06',
    unreadCount: 0,
    messages: [
      {
        id: 'm20',
        senderId: 'buyer',
        senderName: 'Green Leaf Supermarket',
        senderRole: 'buyer',
        text: 'Invoice received. Transferring to commercial escrow account.',
        timestamp: 'Oct 06, 2:10 PM',
        isRead: true,
      },
    ],
  },
  {
    id: 'c4',
    participantId: 'farmer-anura',
    participantName: 'Anura Bandara',
    participantRole: 'farmer',
    participantAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    isOnline: false,
    verified: true,
    productTitle: 'Ceylon Black Pepper',
    productImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    lastMessage: 'Sent test sample batch with tracking #LK-9024.',
    lastMessageTime: 'Sep 29',
    unreadCount: 0,
    messages: [
      {
        id: 'm30',
        senderId: 'farmer',
        senderName: 'Anura Bandara',
        senderRole: 'farmer',
        text: 'Sent test sample batch with tracking #LK-9024.',
        timestamp: 'Sep 29, 11:00 AM',
        isRead: true,
      },
    ],
  },
];

const SEED_CALLS: CallRecord[] = [
  {
    id: 'call-1',
    participantName: 'Kusuma Bandara',
    participantAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    participantRole: 'farmer',
    type: 'incoming',
    callMode: 'video',
    timestamp: 'Today, 10:14 AM',
    duration: '04:12',
  },
  {
    id: 'call-2',
    participantName: 'Sunil Dissanayake',
    participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    participantRole: 'buyer',
    type: 'outgoing',
    callMode: 'audio',
    timestamp: 'Yesterday, 3:45 PM',
    duration: '02:40',
  },
  {
    id: 'call-3',
    participantName: 'Green Leaf Supermarket',
    participantAvatar: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=400',
    participantRole: 'buyer',
    type: 'missed',
    callMode: 'audio',
    timestamp: 'Oct 06, 1:20 PM',
  },
];

const SEED_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    targetId: 'farmer-kusuma',
    authorName: 'Chinthaka Perera',
    authorRole: 'buyer',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    overallRating: 5,
    criteriaRatings: { quality: 5, freshness: 5, packaging: 5, communication: 4 },
    tags: ['Fresh Produce', 'On Time Dispatch', 'Clean Packaging'],
    comment: 'Harvest was crisp and sweet. Arrived washed and sorted in ventilated wooden crates. Zero bruising. Perfect for our restaurant kitchen in Colombo.',
    date: '2 days ago',
    helpfulCount: 14,
  },
  {
    id: 'rev-2',
    targetId: 'farmer-kusuma',
    authorName: 'Dilshan Wickramasinghe',
    authorRole: 'buyer',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400',
    overallRating: 5,
    criteriaRatings: { quality: 5, freshness: 5, packaging: 4, communication: 5 },
    tags: ['Fair Pricing', 'Accurate Grading'],
    comment: 'Direct farm gate pricing saved us 20%. Getting 200kg straight from Welimada plots at guaranteed rates is a game changer.',
    date: '5 days ago',
    helpfulCount: 9,
  },
];

// ─── Module-level singleton cache ─────────────────────────────────────────────

let conversationsCache: Conversation[] = SEED_CONVERSATIONS.map((c) => ({
  ...c,
  messages: c.messages.map((m) => ({ ...m })),
}));
let callHistoryCache: CallRecord[] = [...SEED_CALLS];
let reviewsCache: ReviewItem[] = [...SEED_REVIEWS];

// ─── Auto-reply pool ──────────────────────────────────────────────────────────

const FARMER_AUTO_REPLIES = [
  'Sure, I can arrange that for you!',
  'The harvest is fresh — picked this morning from Welimada fields.',
  'I can offer a 5% bulk discount for orders above 100kg.',
  'Let me check stock availability and get back to you shortly.',
  'Grade A produce guaranteed. Ready for dispatch tomorrow morning.',
  'We do free sorting and crate packaging for orders above 50kg.',
  'Payment via escrow or direct bank transfer both accepted.',
  'Yes, the field is ready. We can do 200kg this week.',
];

const BUYER_AUTO_REPLIES = [
  "That sounds great! I'll confirm the order shortly.",
  'Can you share a photo of the current stock?',
  'We need delivery before 9 AM to the Colombo warehouse.',
  "Perfect. I'll proceed with the order for 100kg.",
  'Could you give a slightly better rate for a repeat order?',
  'When is the next harvest ready?',
  'We have a standing weekly order if quality is consistent.',
];

function randomReply(role: 'farmer' | 'buyer'): string {
  const arr = role === 'farmer' ? FARMER_AUTO_REPLIES : BUYER_AUTO_REPLIES;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── ChatService ──────────────────────────────────────────────────────────────

export const ChatService = {
  // ── Conversations ──────────────────────────────────────────────────────────

  async getConversations(): Promise<Conversation[]> {
    return [...conversationsCache];
  },

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const conv = conversationsCache.find((c) => c.id === id);
    if (!conv) return undefined;
    // Return a shallow copy so state updates propagate
    return { ...conv, messages: [...conv.messages] };
  },

  async getOrCreateConversation(params: {
    participantId: string;
    participantName: string;
    participantRole: 'farmer' | 'buyer';
    participantAvatar?: string;
    productTitle?: string;
    productImage?: string;
  }): Promise<Conversation> {
    const existing = conversationsCache.find((c) => c.participantId === params.participantId);
    if (existing) {
      if (params.productTitle) existing.productTitle = params.productTitle;
      if (params.productImage) existing.productImage = params.productImage;
      return existing;
    }

    const newConv: Conversation = {
      id: `c_${Date.now()}`,
      participantId: params.participantId,
      participantName: params.participantName,
      participantRole: params.participantRole,
      participantAvatar:
        params.participantAvatar ||
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      isOnline: true,
      verified: true,
      productTitle: params.productTitle,
      productImage: params.productImage,
      lastMessage: 'Chat opened',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      messages: [],
    };
    conversationsCache = [newConv, ...conversationsCache];
    return newConv;
  },

  // ── Messaging ──────────────────────────────────────────────────────────────

  /**
   * Send a message.
   * senderRole MUST be set to the role of the person sending ('buyer' or 'farmer').
   * The chat screen determines "isMe" by comparing message.senderRole === currentRole.
   */
  async sendMessage(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>
  ): Promise<ChatMessage> {
    const conv = conversationsCache.find((c) => c.id === conversationId);
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: ts,
      isRead: false,
    };

    if (conv) {
      conv.messages = [...conv.messages, newMsg];
      conv.lastMessage =
        newMsg.isVoiceNote
          ? '🎙️ Voice note'
          : newMsg.imageUri
          ? '📷 Photo'
          : newMsg.offer
          ? '🤝 Offer proposal'
          : newMsg.text;
      conv.lastMessageTime = ts;
    }

    return newMsg;
  },

  /**
   * Simulate a reply from the OTHER party (auto-reply for demo purposes).
   * Call this right after sendMessage to make the chat feel alive.
   *
   * @param conversationId - conversation to reply in
   * @param replyAs        - which ROLE auto-replies (the OTHER person)
   * @param replyName      - display name shown in the bubble
   * @param onReply        - called after reply is added so the UI can re-render
   */
  simulateReply(
    conversationId: string,
    replyAs: 'farmer' | 'buyer',
    replyName: string,
    onReply: () => void
  ): void {
    const delay = 1200 + Math.random() * 2500;
    setTimeout(() => {
      const conv = conversationsCache.find((c) => c.id === conversationId);
      if (!conv) return;

      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const replyMsg: ChatMessage = {
        id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        senderId: replyAs,
        senderName: replyName,
        senderRole: replyAs,
        text: randomReply(replyAs),
        timestamp: ts,
        isRead: false,
      };

      conv.messages = [...conv.messages, replyMsg];
      conv.lastMessage = replyMsg.text;
      conv.lastMessageTime = ts;
      conv.unreadCount = (conv.unreadCount || 0) + 1;

      onReply();
    }, delay);
  },

  // ── Voice notes ────────────────────────────────────────────────────────────

  /**
   * Build a voice note message payload (no id/timestamp/isRead — pass to sendMessage).
   */
  createVoiceNotePayload(params: {
    senderRole: 'farmer' | 'buyer';
    senderName: string;
    durationSeconds: number;
  }): Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'> {
    const mins = Math.floor(params.durationSeconds / 60);
    const secs = params.durationSeconds % 60;
    return {
      senderId: params.senderRole,
      senderName: params.senderName,
      senderRole: params.senderRole,
      text: '',
      isVoiceNote: true,
      voiceDuration: `${mins}:${secs.toString().padStart(2, '0')}`,
      voiceWaveform: generateWaveform(),
    };
  },

  // ── Offer negotiation ──────────────────────────────────────────────────────

  async updateOfferStatus(
    conversationId: string,
    messageId: string,
    status: 'accepted' | 'declined' | 'countered'
  ): Promise<void> {
    const conv = conversationsCache.find((c) => c.id === conversationId);
    if (!conv) return;
    const idx = conv.messages.findIndex((m) => m.id === messageId);
    if (idx !== -1 && conv.messages[idx].offer) {
      conv.messages = conv.messages.map((m, i) =>
        i === idx ? { ...m, offer: { ...m.offer!, status } } : m
      );
    }
  },

  async markAsRead(conversationId: string): Promise<void> {
    const conv = conversationsCache.find((c) => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
      conv.messages = conv.messages.map((m) => ({ ...m, isRead: true }));
    }
  },

  // ── Call History ───────────────────────────────────────────────────────────

  async getCallHistory(): Promise<CallRecord[]> {
    return callHistoryCache;
  },

  async addCallRecord(record: Omit<CallRecord, 'id'>): Promise<CallRecord> {
    const newRecord: CallRecord = { ...record, id: `call_${Date.now()}` };
    callHistoryCache = [newRecord, ...callHistoryCache];
    return newRecord;
  },

  // ── Reviews ────────────────────────────────────────────────────────────────

  async getReviews(targetId?: string): Promise<ReviewItem[]> {
    if (targetId) return reviewsCache.filter((r) => r.targetId === targetId);
    return reviewsCache;
  },

  async submitReview(review: Omit<ReviewItem, 'id' | 'date' | 'helpfulCount'>): Promise<ReviewItem> {
    const newReview: ReviewItem = {
      ...review,
      id: `rev_${Date.now()}`,
      date: 'Just now',
      helpfulCount: 0,
    };
    reviewsCache = [newReview, ...reviewsCache];
    return newReview;
  },
};
