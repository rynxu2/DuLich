/**
 * CreateExpenseScreen — Guide/User submits expense for a tour
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { expensesApi, CATEGORY_LABELS, ExpenseCategory } from '../api/expenses';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateExpense'>;
  route: RouteProp<RootStackParamList, 'CreateExpense'>;
};

const CATEGORIES: ExpenseCategory[] = [
  'MEALS', 'TRANSPORT', 'ACCOMMODATION', 'ENTRANCE_FEE',
  'GUIDE_FEE', 'EQUIPMENT', 'INSURANCE', 'EMERGENCY', 'OTHER',
];

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  TRANSPORT: 'car', ACCOMMODATION: 'bed', MEALS: 'food',
  ENTRANCE_FEE: 'ticket', GUIDE_FEE: 'account-tie', EQUIPMENT: 'bag-personal',
  INSURANCE: 'shield-check', EMERGENCY: 'lightning-bolt', OTHER: 'package-variant',
};

export default function CreateExpenseScreen({ navigation, route }: Props) {
  const { tourId, tourTitle } = route.params;
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<ExpenseCategory>('MEALS');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả chi phí');
      return;
    }
    setSaving(true);
    try {
      await expensesApi.create({
        tourId,
        guideId: user?.id,
        category,
        amount: numAmount,
        description: description.trim(),
      });
      Alert.alert('Thành công', 'Chi phí đã được gửi chờ duyệt', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tạo chi phí. Thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (text: string) => {
    const num = text.replace(/[^0-9]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('vi-VN').format(parseInt(num));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>  
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Thêm Chi Phí</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{tourTitle || `Tour #${tourId}`}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Số tiền chi phí</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySign}>₫</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => setAmount(formatCurrency(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Category Grid */}
          <Text style={styles.sectionTitle}>Hạng mục</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const info = CATEGORY_LABELS[cat];
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
                >
                  <View style={[styles.categoryIcon, isSelected && styles.categoryIconSelected]}>
                    <Icon
                      name={CATEGORY_ICONS[cat]}
                      size={22}
                      color={isSelected ? '#fff' : theme.colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                    {info.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="VD: Tiền xe bus từ sân bay về khách sạn..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Info */}
          <View style={styles.infoBox}>
            <Icon name="information-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Chi phí sẽ ở trạng thái "Chờ duyệt" và cần admin xác nhận trước khi được tính vào báo cáo.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="send" size={20} color="#fff" />
              <Text style={styles.submitText}>Gửi Yêu Cầu Duyệt</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  headerSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 40 },
  amountCard: {
    backgroundColor: theme.colors.primary, borderRadius: 20, padding: 24,
    marginBottom: 24, alignItems: 'center',
  },
  amountLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySign: { fontSize: 28, color: '#fff', fontWeight: '700', marginRight: 4 },
  amountInput: {
    fontSize: 36, color: '#fff', fontWeight: '800', minWidth: 80,
    textAlign: 'center', padding: 0,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: theme.colors.text,
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24,
  },
  categoryItem: {
    width: '30%', alignItems: 'center', padding: 12, borderRadius: 16,
    backgroundColor: theme.colors.card, borderWidth: 2, borderColor: 'transparent',
  },
  categoryItemSelected: {
    borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15`,
  },
  categoryIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  categoryIconSelected: { backgroundColor: theme.colors.primary },
  categoryLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary, textAlign: 'center' },
  categoryLabelSelected: { color: theme.colors.primary, fontWeight: '700' },
  descInput: {
    backgroundColor: theme.colors.card, borderRadius: 16, padding: 16,
    fontSize: 15, color: theme.colors.text, minHeight: 100, marginBottom: 20,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16,
    backgroundColor: `${theme.colors.primary}10`, borderRadius: 14,
    borderWidth: 1, borderColor: `${theme.colors.primary}30`,
  },
  infoText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },
  footer: {
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1,
    borderTopColor: theme.colors.border, backgroundColor: theme.colors.background,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
