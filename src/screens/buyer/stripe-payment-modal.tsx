import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { StripeService, CardDetails } from '@/services/stripe-service';

interface StripePaymentModalProps {
  visible: boolean;
  amount: number;
  orderId?: string;
  paymentType?: 'order' | 'harvest_deposit' | 'auction_win';
  title?: string;
  description?: string;
  onSuccess: (paymentIntentId: string) => void;
  onClose: () => void;
}

export function StripePaymentModal({
  visible,
  amount,
  orderId,
  paymentType = 'order',
  title = 'Stripe Card Checkout',
  description = 'Safe & 256-bit encrypted card processing',
  onSuccess,
  onClose,
}: StripePaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('Sunil Dissanayake');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [postalCode, setPostalCode] = useState('00100');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Format card number with spaces (4 4 4 4)
  const handleCardNumberChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
    setErrorMsg(null);
  };

  // Format expiry MM/YY
  const handleExpiryChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
    setErrorMsg(null);
  };

  const handleCvcChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 4);
    setCvc(raw);
    setErrorMsg(null);
  };

  // Quick fill Stripe test card (4242 ...)
  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setExpiry('12/28');
    setCvc('123');
    setCardHolder('Sunil Dissanayake');
    setPostalCode('00100');
    setErrorMsg(null);
  };

  const handlePay = async () => {
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 16) {
      setErrorMsg('Please enter a valid 16-digit card number');
      return;
    }
    if (!expiry || !expiry.includes('/')) {
      setErrorMsg('Please enter valid MM/YY expiry date');
      return;
    }
    const [month, year] = expiry.split('/');
    if (!month || !year || parseInt(month, 10) < 1 || parseInt(month, 10) > 12) {
      setErrorMsg('Invalid expiry month');
      return;
    }
    if (cvc.length < 3) {
      setErrorMsg('Please enter a valid CVC');
      return;
    }
    if (!cardHolder.trim()) {
      setErrorMsg('Please enter cardholder name');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Create PaymentIntent on Backend
      const intentRes = await StripeService.createPaymentIntent({
        amount,
        currency: 'lkr',
        orderId,
        paymentType,
        metadata: {
          client: 'Famora Mobile App',
          cardHolder,
        },
      });

      // 2. Tokenize card details via Stripe REST API
      const cardDetails: CardDetails = {
        number: cleanNum,
        expMonth: month,
        expYear: year,
        cvc: cvc.trim(),
        name: cardHolder.trim(),
        postalCode: postalCode.trim(),
      };

      const cardToken = await StripeService.tokenizeCard(cardDetails);

      // 3. Confirm Payment
      const confirmRes = await StripeService.confirmCardPayment({
        clientSecret: intentRes.clientSecret,
        cardToken,
        orderId,
      });

      if (confirmRes.success) {
        setIsProcessing(false);
        onSuccess(confirmRes.paymentIntentId);
      } else {
        throw new Error(`Payment status: ${confirmRes.status}`);
      }
    } catch (err: any) {
      console.error('[StripePaymentModal] error:', err);
      setIsProcessing(false);
      setErrorMsg(err.message || 'Payment processing failed. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.stripeBadge}>
                  <Text style={styles.stripeBadgeText}>STRIPE TEST MODE</Text>
                </View>
                <Text style={styles.sheetTitle}>{title}</Text>
                <Text style={styles.sheetSub}>{description}</Text>
              </View>

              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Amount Banner */}
            <View style={styles.amountCard}>
              <View>
                <Text style={styles.amountLabel}>Total to Pay</Text>
                <Text style={styles.amountValue}>Rs. {amount.toLocaleString()}</Text>
              </View>

              <Pressable style={styles.testCardFillBtn} onPress={handleFillTestCard}>
                <Text style={styles.testCardFillBtnText}>Auto-Fill Test Card</Text>
              </Pressable>
            </View>

            {/* Error Banner */}
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2}>
                  <Circle cx={12} cy={12} r={10} />
                  <Path d="M12 8v4M12 16h.01" />
                </Svg>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Card Number</Text>
              <View style={styles.inputBox}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2} style={styles.inputIcon}>
                  <Rect x={1} y={4} width={22} height={16} rx={2} ry={2} />
                  <Path d="M1 10h22" />
                </Svg>
                <TextInput
                  style={styles.textInput}
                  placeholder="4242 4242 4242 4242"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  maxLength={19}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Cardholder Name</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sunil Dissanayake"
                  placeholderTextColor="#94A3B8"
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Expires (MM/YY)</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="12/28"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={expiry}
                    onChangeText={handleExpiryChange}
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>CVC / CVV</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="123"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    secureTextEntry
                    value={cvc}
                    onChangeText={handleCvcChange}
                    maxLength={4}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Postal Code</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="00100"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  maxLength={6}
                />
              </View>
            </View>

            {/* Security Assurance */}
            <View style={styles.securityRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}>
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </Svg>
              <Text style={styles.securityText}>
                Stripe 256-bit SSL encrypted. Card data is never stored locally.
              </Text>
            </View>

            {/* Action Buttons */}
            <Pressable
              style={[styles.payBtn, isProcessing && styles.payBtnDisabled]}
              onPress={handlePay}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <View style={styles.processingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.payBtnText}>Processing via Stripe...</Text>
                </View>
              ) : (
                <Text style={styles.payBtnText}>Pay Rs. {amount.toLocaleString()} Securely</Text>
              )}
            </Pressable>

            <Pressable onPress={onClose} style={styles.cancelBtn} disabled={isProcessing}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <View style={{ height: 28 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  stripeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  stripeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  amountCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#14532D',
    marginTop: 2,
  },
  testCardFillBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testCardFillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  securityText: {
    flex: 1,
    fontSize: 11.5,
    color: '#15803D',
    lineHeight: 16,
  },
  payBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
