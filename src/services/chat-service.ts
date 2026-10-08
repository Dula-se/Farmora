import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'farmer' | 'buyer';
  text: string;
  timestamp: string;
  isRead: boolean;
  imageUri?: string; // Base64 or URL
  isVoiceNote?: boolean;
  voiceDuration?: string;
  offer?: {
    id: string;
    productTitle: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalAmount: number;
    status: 'pending' | 'accepted' | 'declined' | 'countered';
  };
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
  images?: string[]; // Base64
  date: string;
  helpfulCount: number;
}

const INITIAL_CONVERSATIONS: Conversation[] = [
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
    lastMessageTime: '10:32 AM',
    unreadCount: 2,
    messages: [
      {
        id: 'm1',
        senderId: 'buyer-user',
        senderName: 'You',
        senderRole: 'buyer',
        text: 'Ayubowan! Is the 150kg tomatoes batch available for collection this Wednesday?',
        timestamp: '10:15 AM',
        isRead: true,
      },
      {
        id: 'm2',
        senderId: 'farmer-kusuma',
        senderName: 'Kusuma Bandara',
        senderRole: 'farmer',
        text: 'Ayubowan! Yes, the field harvest is in prime condition. Grade A sorting ready.',
        timestamp: '10:18 AM',
        isRead: true,
      },
      {
        id: 'm3',
        senderId: 'buyer-user',
        senderName: 'You',
        senderRole: 'buyer',
        text: 'Can you offer a bulk price for 100 kg?',
        timestamp: '10:20 AM',
        isRead: true,
        offer: {
          id: 'off-1',
          productTitle: 'Organic Red Tomatoes',
          quantity: 100,
          unit: 'kg',
          pricePerUnit: 220,
          totalAmount: 22000,
          status: 'pending',
        },
      },
      {
        id: 'm4',
        senderId: 'farmer-kusuma',
        senderName: 'Kusuma Bandara',
        senderRole: 'farmer',
        text: 'I can harvest early morning and dispatch 100kg directly.',
        timestamp: '10:32 AM',
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
        senderId: 'buyer-sunil',
        senderName: 'Sunil Dissanayake',
        senderRole: 'buyer',
        text: 'Can you dispatch the tomatoes before 10 AM?',
        timestamp: 'Yesterday 4:15 PM',
        isRead: true,
      },
      {
        id: 'm11',
        senderId: 'current-user',
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
        senderId: 'buyer-greenleaf',
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
        senderId: 'farmer-anura',
        senderName: 'Anura Bandara',
        senderRole: 'farmer',
        text: 'Sent test sample batch with tracking #LK-9024.',
        timestamp: 'Sep 29, 11:00 AM',
        isRead: true,
      },
    ],
  },
];

const INITIAL_CALLS: CallRecord[] = [
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

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    targetId: 'farmer-kusuma',
    authorName: 'Chinthaka Perera',
    authorRole: 'buyer',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    overallRating: 5,
    criteriaRatings: {
      quality: 5,
      freshness: 5,
      packaging: 5,
      communication: 4,
    },
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
    criteriaRatings: {
      quality: 5,
      freshness: 5,
      packaging: 4,
      communication: 5,
    },
    tags: ['Fair Pricing', 'Accurate Grading'],
    comment: 'Direct farm gate pricing saved us 20%. Getting 200kg straight from Welimada plots at guaranteed rates is a game changer.',
    date: '5 days ago',
    helpfulCount: 9,
  },
];

let conversationsCache: Conversation[] = [...INITIAL_CONVERSATIONS];
let callHistoryCache: CallRecord[] = [...INITIAL_CALLS];
let reviewsCache: ReviewItem[] = [...INITIAL_REVIEWS];

export const ChatService = {
  async getConversations(): Promise<Conversation[]> {
    return conversationsCache;
  },

  async getConversationById(id: string): Promise<Conversation | undefined> {
    return conversationsCache.find((c) => c.id === id);
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

  async sendMessage(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>
  ): Promise<ChatMessage> {
    const conv = conversationsCache.find((c) => c.id === conversationId);
    const newMsg: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };

    if (conv) {
      conv.messages.push(newMsg);
      conv.lastMessage = message.text || (message.imageUri ? '📷 [Photo]' : 'Proposed an offer');
      conv.lastMessageTime = newMsg.timestamp;
    }
    return newMsg;
  },

  async updateOfferStatus(
    conversationId: string,
    messageId: string,
    status: 'accepted' | 'declined' | 'countered'
  ): Promise<void> {
    const conv = conversationsCache.find((c) => c.id === conversationId);
    if (!conv) return;
    const msg = conv.messages.find((m) => m.id === messageId);
    if (msg && msg.offer) {
      msg.offer.status = status;
    }
  },

  async markAsRead(conversationId: string): Promise<void> {
    const conv = conversationsCache.find((c) => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
      conv.messages.forEach((m) => (m.isRead = true));
    }
  },

  async getCallHistory(): Promise<CallRecord[]> {
    return callHistoryCache;
  },

  async addCallRecord(record: Omit<CallRecord, 'id'>): Promise<CallRecord> {
    const newRecord: CallRecord = {
      ...record,
      id: `call_${Date.now()}`,
    };
    callHistoryCache = [newRecord, ...callHistoryCache];
    return newRecord;
  },

  async getReviews(targetId?: string): Promise<ReviewItem[]> {
    if (targetId) {
      return reviewsCache.filter((r) => r.targetId === targetId);
    }
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
