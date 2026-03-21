/**
 * Feedback Screen — Customer support & feedback submission
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, TextInput as RNTextInput,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const TOPICS = [
  { id: 'booking', icon: 'ticket-outline', label: 'Đặt tour' },
  { id: 'payment', icon: 'credit-card-outline', label: 'Thanh toán' },
  { id: 'itinerary', icon: 'calendar-outline', label: 'Lịch trình' },
  { id: 'cancel', icon: 'close-circle-outline', label: 'Hủy / Hoàn tiền' },
  { id: 'general', icon: 'help-circle-outline', label: 'Khác' },
];

const FAQ_ITEMS = [
  { q: 'Làm sao để hủy tour?', a: 'Vào "Chuyến Đi" → Chọn booking → Nhấn "Hủy Booking". Chính sách hoàn tiền theo quy định của tour.' },
  { q: 'Tôi có thể thay đổi ngày khởi hành?', a: 'Liên hệ bộ phận hỗ trợ qua form bên dưới ít nhất 48 giờ trước ngày khởi hành.' },
  { q: 'Phương thức thanh toán nào được hỗ trợ?', a: 'Chúng tôi hỗ trợ chuyển khoản ngân hàng, Momo, ZaloPay và thẻ tín dụng.' },
  { q: 'Tour bao gồm những gì?', a: 'Mỗi tour bao gồm chi tiết trong phần mô tả. Thường gồm: vé tham quan, vận chuyển, HDV, bảo hiểm du lịch.' },
];

export default function FeedbackScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedTopic) {
      Alert.alert('Lỗi', 'Vui lòng chọn chủ đề phản hồi');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung phản hồi');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.hTitle}>Phản Hồi & Hỗ Trợ</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={64} color={theme.colors.success} />
          </View>
          <Text style={styles.successTitle}>Đã Gửi Thành Công!</Text>
          <Text style={styles.successText}>
            Cảm ơn bạn đã gửi phản hồi. Chúng tôi sẽ phản hồi trong vòng 24 giờ qua email.
          </Text>
          <TouchableOpacity
            style={styles.backToHomeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Text style={styles.backToHomeText}>Quay Lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Phản Hồi & Hỗ Trợ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Câu Hỏi Thường Gặp</Text>
        {FAQ_ITEMS.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqCard}
            onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            activeOpacity={0.8}>
            <View style={styles.faqHeader}>
              <Icon name="help-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Icon
                name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textLight}
              />
            </View>
            {expandedFaq === index && (
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Feedback Form */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Gửi Phản Hồi</Text>

        {/* Topic Selection */}
        <Text style={styles.label}>Chủ đề</Text>
        <View style={styles.topicGrid}>
          {TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicChip,
                selectedTopic === topic.id && styles.topicChipActive,
              ]}
              onPress={() => setSelectedTopic(topic.id)}>
              <Icon
                name={topic.icon}
                size={20}
                color={selectedTopic === topic.id ? '#fff' : theme.colors.primary}
              />
              <Text style={[
                styles.topicText,
                selectedTopic === topic.id && styles.topicTextActive,
              ]}>
                {topic.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message */}
        <Text style={styles.label}>Nội dung</Text>
        <RNTextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Mô tả chi tiết vấn đề hoặc góp ý của bạn..."
          multiline
          numberOfLines={5}
          style={styles.textArea}
          textAlignVertical="top"
          placeholderTextColor={theme.colors.textLight}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="send" size={20} color="#fff" />
              <Text style={styles.submitText}>Gửi Phản Hồi</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Liên Hệ Trực Tiếp</Text>
          <View style={styles.contactRow}>
            <Icon name="phone" size={18} color={theme.colors.primary} />
            <Text style={styles.contactText}>Hotline: 1900 1234</Text>
          </View>
          <View style={styles.contactRow}>
            <Icon name="email-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.contactText}>Email: support@dulich.app</Text>
          </View>
          <View style={styles.contactRow}>
            <Icon name="clock-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.contactText}>Hỗ trợ: 8:00 - 22:00 hàng ngày</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  backBtn: { padding: 8 },
  hTitle: { ...theme.typography.h3, color: theme.colors.text },
  content: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 },
  sectionTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 14 },
  faqCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 14, marginBottom: 8, elevation: 1,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQuestion: { ...theme.typography.body, color: theme.colors.text, flex: 1, fontWeight: '500' },
  faqAnswer: {
    ...theme.typography.bodySmall, color: theme.colors.textSecondary,
    marginTop: 10, paddingLeft: 30, lineHeight: 20,
  },
  label: {
    ...theme.typography.caption, color: theme.colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  topicGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20,
  },
  topicChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
  },
  topicChipActive: {
    backgroundColor: theme.colors.primary, borderColor: theme.colors.primary,
  },
  topicText: { ...theme.typography.bodySmall, color: theme.colors.text },
  topicTextActive: { color: '#fff' },
  textArea: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 16, fontSize: 15, color: theme.colors.text, minHeight: 120,
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20,
  },
  submitButton: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, elevation: 3, marginBottom: 28,
  },
  buttonDisabled: { opacity: 0.7 },
  submitText: { ...theme.typography.button, color: '#fff' },
  contactCard: {
    backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md,
    padding: 20,
  },
  contactTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 14 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  contactText: { ...theme.typography.body, color: theme.colors.textSecondary },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  successIcon: { marginBottom: 20 },
  successTitle: { ...theme.typography.h1, color: theme.colors.text, marginBottom: 12 },
  successText: {
    ...theme.typography.body, color: theme.colors.textSecondary,
    textAlign: 'center', lineHeight: 24,
  },
  backToHomeBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingHorizontal: 32, paddingVertical: 14, marginTop: 28,
  },
  backToHomeText: { ...theme.typography.button, color: '#fff' },
});
