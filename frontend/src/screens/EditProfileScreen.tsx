/**
 * Edit Profile Screen — Update user information with avatar upload
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../store/AuthContext';
import { storageApi } from '../api/storage';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function EditProfileScreen({ navigation }: Props) {
  const { user, refreshUser, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSave = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Email không được để trống');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      if (refreshUser) {
        await refreshUser();
      }
      Alert.alert('Thành công ✅', 'Thông tin cá nhân đã được cập nhật.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể cập nhật. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Chỉnh Sửa Hồ Sơ</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Icon name="account" size={48} color="#fff" />
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.changeAvatarBtn}
              disabled={uploadingAvatar}
              onPress={async () => {
                try {
                  const result = await launchImageLibrary({
                    mediaType: 'photo',
                    maxWidth: 512,
                    maxHeight: 512,
                    quality: 0.8,
                  });
                  if (result.assets?.[0]) {
                    const asset = result.assets[0];
                    setUploadingAvatar(true);
                    try {
                      const file = {
                        uri: asset.uri,
                        name: asset.fileName || 'avatar.jpg',
                        type: asset.type || 'image/jpeg',
                      };
                      const uploadRes = await storageApi.upload(
                        file, 'user', String(user?.userId || 0)
                      );
                      const signedRes = await storageApi.getSignedUrl(uploadRes.data.objectName);
                      setAvatarUrl(signedRes.data);
                    } catch {
                      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
                    } finally {
                      setUploadingAvatar(false);
                    }
                  }
                } catch {
                  // User cancelled
                }
              }}>
              <Icon name="camera" size={16} color={theme.colors.primary} />
              <Text style={styles.changeAvatarText}>Đổi ảnh</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.label}>TÊN ĐĂNG NHẬP</Text>
            <View style={styles.readOnlyField}>
              <Icon name="account-outline" size={20} color={theme.colors.textLight} />
              <Text style={styles.readOnlyText}>{user?.username || ''}</Text>
              <Icon name="lock-outline" size={16} color={theme.colors.textLight} />
            </View>

            <TextInput
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              left={<TextInput.Icon icon="account-edit-outline" />}
              style={styles.input}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.input}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              left={<TextInput.Icon icon="phone-outline" />}
              style={styles.input}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
              keyboardType="phone-pad"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="content-save-outline" size={20} color="#fff" />
                <Text style={styles.saveText}>Lưu Thay Đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, overflow: 'hidden',
  },
  avatarImage: {
    width: 96, height: 96, borderRadius: 48,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 48,
  },
  changeAvatarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
  },
  changeAvatarText: { ...theme.typography.caption, color: theme.colors.primary },
  formSection: { marginBottom: 24 },
  label: {
    ...theme.typography.caption, color: theme.colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  readOnlyField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 16,
  },
  readOnlyText: { ...theme.typography.body, color: theme.colors.textSecondary, flex: 1 },
  input: { marginBottom: 14, backgroundColor: '#fff' },
  saveButton: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, elevation: 3,
  },
  buttonDisabled: { opacity: 0.7 },
  saveText: { ...theme.typography.button, color: '#fff' },
});
