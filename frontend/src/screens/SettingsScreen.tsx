import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài Đặt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.groupTitle}>Thông báo</Text>
        <View style={styles.card}>
          <SettingSwitchRow
            icon="bell-ring-outline"
            label="Thông báo đẩy"
            value={pushEnabled}
            onValueChange={setPushEnabled}
          />
          <SettingSwitchRow
            icon="email-outline"
            label="Email cập nhật"
            value={emailEnabled}
            onValueChange={setEmailEnabled}
            isLast
          />
        </View>

        <Text style={styles.groupTitle}>Bảo mật</Text>
        <View style={styles.card}>
          <SettingSwitchRow
            icon="fingerprint"
            label="Mở khóa sinh trắc học"
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            isLast
          />
        </View>

        <Text style={styles.groupTitle}>Khác</Text>
        <View style={styles.card}>
          <SettingActionRow
            icon="shield-check-outline"
            label="Chính sách quyền riêng tư"
            onPress={() => Alert.alert('Thông báo', 'Tính năng sẽ sớm ra mắt.')}
          />
          <SettingActionRow
            icon="file-document-outline"
            label="Điều khoản sử dụng"
            onPress={() => Alert.alert('Thông báo', 'Tính năng sẽ sớm ra mắt.')}
            isLast
          />
        </View>
      </ScrollView>
    </View>
  );
}

type SwitchRowProps = {
  icon: string;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
};

function SettingSwitchRow({ icon, label, value, onValueChange, isLast }: SwitchRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={18} color={theme.colors.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: '#7DD3FC' }}
        thumbColor={value ? theme.colors.primary : '#F8FAFC'}
      />
    </View>
  );
}

type ActionRowProps = {
  icon: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
};

function SettingActionRow({ icon, label, onPress, isLast }: ActionRowProps) {
  return (
    <TouchableOpacity style={[styles.row, !isLast && styles.rowBorder]} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={18} color={theme.colors.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={theme.colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 80 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: 12,
    marginBottom: 18,
    ...theme.shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryMuted,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
});
