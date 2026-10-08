import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import {
  ChatService,
  Conversation,
  ChatMessage,
} from '@/services/chat-service';
import {
  capturePhotoFromCamera,
  pickImageFromGallery,
} from '@/services/media-picker';

interface ChatConversationScreenProps {
  conversationId: string;
  onBack: () => void;
  onStartAudioCall: (name: string, avatar: string) => void;
  onStartVideoCall: (name: string, avatar: string) => void;
  onRequestInspection?: () => void;
  onRateUser?: (userId: string, userName: string, userAvatar: string, role: 'farmer' | 'buyer') => void;
  currentRole?: 'buyer' | 'farmer';
}

export function ChatConversationScreen({
  conversationId,
  onBack,
  onStartAudioCall,
  onStartVideoCall,
  onRequestInspection,
  onRateUser,
  currentRole = 'buyer',
}: ChatConversationScreenProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Counter-offer state
  const [offerQty, setOfferQty] = useState('100');
  const [offerPrice, setOfferPrice] = useState('210');

  const flatListRef = useRef<FlatList>(null);

  const loadConv = async () => {
    const c = await ChatService.getConversationById(conversationId);
    if (c) {
      setConversation({ ...c });
      await ChatService.markAsRead(conversationId);
    }
  };

  useEffect(() => {
    loadConv();
  }, [conversationId]);

  const handleSendTextMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || !conversation) return;

    setInputText('');
    await ChatService.sendMessage(conversation.id, {
      senderId: 'current-user',
      senderName: currentRole === 'buyer' ? 'Buyer' : 'Farmer',
      senderRole: currentRole,
      text,
    });
    await loadConv();
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendPhoto = async (source: 'camera' | 'gallery') => {
    setShowActionSheet(false);
    const result =
      source === 'camera'
        ? await capturePhotoFromCamera({ quality: 0.65 })
        : await pickImageFromGallery({ quality: 0.65 });

    if (result && conversation) {
      await ChatService.sendMessage(conversation.id, {
        senderId: 'current-user',
        senderName: 'You',
        senderRole: currentRole,
        text: 'Sent a photo of produce',
        imageUri: result.dataUrl,
      });
      await loadConv();
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleSendVoiceNote = async () => {
    if (!conversation) return;
    await ChatService.sendMessage(conversation.id, {
      senderId: 'current-user',
      senderName: 'You',
      senderRole: currentRole,
      text: 'Voice note (0:18)',
      isVoiceNote: true,
      voiceDuration: '0:18',
    });
    await loadConv();
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendCounterOffer = async () => {
    if (!conversation) return;
    const qty = parseFloat(offerQty) || 50;
    const price = parseFloat(offerPrice) || 200;
    const total = qty * price;

    await ChatService.sendMessage(conversation.id, {
      senderId: 'current-user',
      senderName: 'You',
      senderRole: currentRole,
      text: `Proposed counter-offer for ${qty} kg @ Rs. ${price}/kg`,
      offer: {
        id: `off_${Date.now()}`,
        productTitle: conversation.productTitle || 'Produce',
        quantity: qty,
        unit: 'kg',
        pricePerUnit: price,
        totalAmount: total,
        status: 'pending',
      },
    });

    setShowOfferModal(false);
    await loadConv();
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleAcceptOffer = async (msgId: string) => {
    if (!conversation) return;
    await ChatService.updateOfferStatus(conversation.id, msgId, 'accepted');
    Alert.alert(
      'Offer Accepted! 🎉',
      'The price offer has been agreed. You can now proceed to payment and delivery confirmation.'
    );
    await loadConv();
  };

  const handleDeclineOffer = async (msgId: string) => {
    if (!conversation) return;
    await ChatService.updateOfferStatus(conversation.id, msgId, 'declined');
    Alert.alert('Offer Declined', 'The proposed price offer was declined.');
    await loadConv();
  };

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <Text style={{ color: '#64748B' }}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.headerParticipant}>
          <View style={styles.headerAvatarWrap}>
            <Image source={{ uri: conversation.participantAvatar }} style={styles.headerAvatar} contentFit="cover" />
            {conversation.isOnline && <View style={styles.headerOnlineDot} />}
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerName} numberOfLines={1}>
                {conversation.participantName}
              </Text>
              {conversation.verified && (
                <View style={styles.headerTick}>
                  <Text style={styles.headerTickText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerStatusText}>
              {conversation.isOnline ? 'Active now' : 'Verified Farmer'}
            </Text>
          </View>
        </View>

        {/* Action icons: Audio Call, Video Call, Rate */}
        <View style={styles.headerIconsRow}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() =>
              onStartAudioCall(conversation.participantName, conversation.participantAvatar)
            }>
            <Text style={{ fontSize: 17 }}>📞</Text>
          </Pressable>

          <Pressable
            style={styles.headerIconBtn}
            onPress={() =>
              onStartVideoCall(conversation.participantName, conversation.participantAvatar)
            }>
            <Text style={{ fontSize: 17 }}>📹</Text>
          </Pressable>

          {onRateUser && (
            <Pressable
              style={styles.headerIconBtn}
              onPress={() =>
                onRateUser(
                  conversation.participantId,
                  conversation.participantName,
                  conversation.participantAvatar,
                  conversation.participantRole
                )
              }>
              <Text style={{ fontSize: 17 }}>⭐</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Pinned Produce Reference Bar */}
      {conversation.productTitle && (
        <View style={styles.producePinnedBar}>
          {conversation.productImage && (
            <Image source={{ uri: conversation.productImage }} style={styles.pinnedThumb} contentFit="cover" />
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.pinnedTitle} numberOfLines={1}>
              {conversation.productTitle}
            </Text>
            <Text style={styles.pinnedPrice}>Direct Farm Price • Grade A</Text>
          </View>
          <Pressable
            style={styles.pinnedOfferBtn}
            onPress={() => setShowOfferModal(true)}>
            <Text style={styles.pinnedOfferBtnText}>Make Offer</Text>
          </Pressable>
        </View>
      )}

      {/* Quick Prompt Pills */}
      <View style={styles.quickPromptsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsContent}>
          <Pressable
            style={styles.promptPill}
            onPress={() => handleSendTextMessage('Is this harvest available for pickup this week?')}>
            <Text style={styles.promptPillText}>🌾 Available this week?</Text>
          </Pressable>
          <Pressable
            style={styles.promptPill}
            onPress={() => handleSendTextMessage('Can you provide a discount for orders over 100 kg?')}>
            <Text style={styles.promptPillText}>💰 Bulk discount query</Text>
          </Pressable>
          <Pressable
            style={styles.promptPill}
            onPress={() => {
              if (onRequestInspection) onRequestInspection();
              else setShowOfferModal(true);
            }}>
            <Text style={styles.promptPillText}>📹 Request live inspection</Text>
          </Pressable>
          <Pressable
            style={styles.promptPill}
            onPress={() => handleSendTextMessage('What certifications do you hold for this produce?')}>
            <Text style={styles.promptPillText}>📜 SL-GAP / Organic info</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Message Stream */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={conversation.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.senderId === 'current-user' || item.senderName === 'You';
            return (
              <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                {!isMe && (
                  <Image
                    source={{ uri: conversation.participantAvatar }}
                    style={styles.msgAvatar}
                    contentFit="cover"
                  />
                )}

                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  {/* Photo Attachment */}
                  {item.imageUri && (
                    <View style={styles.imageAttachWrap}>
                      <Image source={{ uri: item.imageUri }} style={styles.imageAttach} contentFit="cover" />
                    </View>
                  )}

                  {/* Voice Note Bubble */}
                  {item.isVoiceNote ? (
                    <View style={styles.voiceNoteWrap}>
                      <View style={styles.voicePlayCircle}>
                        <Text style={{ fontSize: 13, color: '#FFFFFF' }}>▶</Text>
                      </View>
                      <View style={styles.voiceWaveforms}>
                        {[16, 24, 12, 30, 20, 28, 14, 22, 10, 26, 18].map((h, i) => (
                          <View
                            key={i}
                            style={[
                              styles.waveformBar,
                              { height: h, backgroundColor: isMe ? '#FFFFFF' : '#1E5E3A' },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.voiceDuration, isMe ? { color: '#E2E8F0' } : { color: '#64748B' }]}>
                        {item.voiceDuration || '0:18'}
                      </Text>
                    </View>
                  ) : (
                    /* Regular Text */
                    <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
                      {item.text}
                    </Text>
                  )}

                  {/* Negotiation / Counter-Offer Card */}
                  {item.offer && (
                    <View style={styles.offerCard}>
                      <View style={styles.offerCardHeader}>
                        <Text style={styles.offerBadgeEmoji}>🤝</Text>
                        <Text style={styles.offerCardTitle}>Price Offer Proposal</Text>
                      </View>
                      <Text style={styles.offerProduct}>{item.offer.productTitle}</Text>
                      <View style={styles.offerDetailsRow}>
                        <Text style={styles.offerDetailText}>
                          Qty: <Text style={{ fontWeight: '700' }}>{item.offer.quantity} {item.offer.unit}</Text>
                        </Text>
                        <Text style={styles.offerDetailText}>
                          Rate: <Text style={{ fontWeight: '700' }}>Rs. {item.offer.pricePerUnit} /{item.offer.unit}</Text>
                        </Text>
                      </View>
                      <View style={styles.offerTotalRow}>
                        <Text style={styles.offerTotalLabel}>Total Amount:</Text>
                        <Text style={styles.offerTotalVal}>Rs. {item.offer.totalAmount.toLocaleString()}</Text>
                      </View>

                      {/* Status & Action buttons */}
                      {item.offer.status === 'pending' ? (
                        <View style={styles.offerActionsRow}>
                          <Pressable
                            style={styles.offerAcceptBtn}
                            onPress={() => handleAcceptOffer(item.id)}>
                            <Text style={styles.offerAcceptBtnText}>✓ Accept</Text>
                          </Pressable>
                          <Pressable
                            style={styles.offerDeclineBtn}
                            onPress={() => handleDeclineOffer(item.id)}>
                            <Text style={styles.offerDeclineBtnText}>✕ Decline</Text>
                          </Pressable>
                          <Pressable
                            style={styles.offerCounterBtn}
                            onPress={() => setShowOfferModal(true)}>
                            <Text style={styles.offerCounterBtnText}>Counter</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.offerStatusBadge,
                            item.offer.status === 'accepted'
                              ? styles.offerAcceptedBadge
                              : styles.offerDeclinedBadge,
                          ]}>
                          <Text style={styles.offerStatusBadgeText}>
                            {item.offer.status === 'accepted' ? '✓ Offer Agreed & Accepted' : '✕ Offer Declined'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeThem]}>
                    {item.timestamp}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Bottom Input Controls */}
        <View style={styles.inputBar}>
          <Pressable
            style={styles.inputActionBtn}
            onPress={() => setShowActionSheet(true)}>
            <Text style={{ fontSize: 20, color: '#1E5E3A', fontWeight: '800' }}>+</Text>
          </Pressable>

          <Pressable
            style={styles.inputActionBtn}
            onPress={() => handleSendPhoto('camera')}>
            <Text style={{ fontSize: 18 }}>📷</Text>
          </Pressable>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message or offer..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          {inputText.trim().length > 0 ? (
            <Pressable
              style={styles.sendBtn}
              onPress={() => handleSendTextMessage()}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M22 2L11 13" />
                <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </Svg>
            </Pressable>
          ) : (
            <Pressable
              style={styles.micBtn}
              onPress={handleSendVoiceNote}>
              <Text style={{ fontSize: 18 }}>🎙️</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Action Sheet Modal */}
      <Modal visible={showActionSheet} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionSheet(false)}>
          <View style={styles.actionSheetContent}>
            <Text style={styles.actionSheetTitle}>Share & Negotiate</Text>

            <Pressable
              style={styles.actionSheetItem}
              onPress={() => {
                setShowActionSheet(false);
                setShowOfferModal(true);
              }}>
              <Text style={styles.actionSheetIcon}>💰</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionSheetItemTitle}>Make Price Offer</Text>
                <Text style={styles.actionSheetItemSub}>Negotiate direct bulk farm gate price</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.actionSheetItem}
              onPress={() => {
                setShowActionSheet(false);
                if (onRequestInspection) onRequestInspection();
                else Alert.alert('Farm Visit', 'Inspection request sent to farmer.');
              }}>
              <Text style={styles.actionSheetIcon}>📹</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionSheetItemTitle}>Request Live Video Inspection</Text>
                <Text style={styles.actionSheetItemSub}>Inspect crop quality, sorting & field freshness</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.actionSheetItem}
              onPress={() => handleSendPhoto('gallery')}>
              <Text style={styles.actionSheetIcon}>🖼️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionSheetItemTitle}>Send Produce Photo</Text>
                <Text style={styles.actionSheetItemSub}>Attach photos from your camera roll</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.actionSheetItem}
              onPress={() => {
                setShowActionSheet(false);
                handleSendTextMessage('📍 Shared Location: Welimada Agri Hub, Central Province (6.9497, 80.7891)');
              }}>
              <Text style={styles.actionSheetIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionSheetItemTitle}>Share Delivery / Farm Location</Text>
                <Text style={styles.actionSheetItemSub}>Send coordinates for collection or logistics</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.actionSheetCancel}
              onPress={() => setShowActionSheet(false)}>
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Make / Counter Offer Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOfferModal(false)}>
          <View style={styles.offerModalContent}>
            <View style={styles.offerModalHeader}>
              <Text style={styles.offerModalTitle}>Negotiate Price Offer</Text>
              <Pressable onPress={() => setShowOfferModal(false)} hitSlop={8}>
                <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.offerModalSub}>
              Propose a custom volume and unit rate directly to {conversation.participantName}.
            </Text>

            <View style={styles.offerInputsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputFieldLabel}>Quantity (kg)</Text>
                <TextInput
                  style={styles.offerInput}
                  keyboardType="numeric"
                  value={offerQty}
                  onChangeText={setOfferQty}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputFieldLabel}>Price / kg (LKR)</Text>
                <TextInput
                  style={styles.offerInput}
                  keyboardType="numeric"
                  value={offerPrice}
                  onChangeText={setOfferPrice}
                />
              </View>
            </View>

            {/* Calculated Total Bar */}
            <View style={styles.computedTotalCard}>
              <Text style={styles.computedTotalLabel}>Total Projected Cost:</Text>
              <Text style={styles.computedTotalValue}>
                Rs. {((parseFloat(offerQty) || 0) * (parseFloat(offerPrice) || 0)).toLocaleString()}
              </Text>
            </View>

            <Pressable
              style={styles.submitOfferBtn}
              onPress={handleSendCounterOffer}>
              <Text style={styles.submitOfferBtnText}>Send Offer to Chat</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
    marginRight: 4,
  },
  headerParticipant: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerTick: {
    marginLeft: 4,
    backgroundColor: '#1E5E3A',
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTickText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  headerStatusText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '500',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  producePinnedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  pinnedThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  pinnedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  pinnedPrice: {
    fontSize: 11,
    color: '#64748B',
  },
  pinnedOfferBtn: {
    backgroundColor: '#1E5E3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pinnedOfferBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quickPromptsWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quickPromptsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  promptPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  promptPillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMe: {
    backgroundColor: '#1E5E3A',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMe: {
    color: '#FFFFFF',
  },
  msgTextThem: {
    color: '#0F172A',
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeMe: {
    color: '#DCFCE7',
  },
  msgTimeThem: {
    color: '#94A3B8',
  },
  imageAttachWrap: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  imageAttach: {
    width: '100%',
    height: '100%',
  },
  voiceNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  voicePlayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceWaveforms: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    gap: 3,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 11,
    fontWeight: '600',
  },
  offerCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  offerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  offerBadgeEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  offerCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  offerProduct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  offerDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  offerDetailText: {
    fontSize: 12,
    color: '#475569',
  },
  offerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 4,
    marginTop: 4,
  },
  offerTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  offerTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E5E3A',
  },
  offerActionsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  offerAcceptBtn: {
    flex: 1,
    backgroundColor: '#1E5E3A',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  offerAcceptBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  offerDeclineBtn: {
    paddingHorizontal: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  offerDeclineBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  offerCounterBtn: {
    paddingHorizontal: 8,
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  offerCounterBtnText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  offerStatusBadge: {
    marginTop: 6,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  offerAcceptedBadge: {
    backgroundColor: '#DCFCE7',
  },
  offerDeclinedBadge: {
    backgroundColor: '#FEE2E2',
  },
  offerStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inputActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    maxHeight: 90,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    marginHorizontal: 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E5E3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  actionSheetIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  actionSheetItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSheetItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionSheetCancel: {
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  offerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  offerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  offerModalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  offerInputsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  inputFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  offerInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  computedTotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
  },
  computedTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  computedTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E5E3A',
  },
  submitOfferBtn: {
    backgroundColor: '#1E5E3A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitOfferBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
