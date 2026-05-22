/**
 * Premium Edit Profile Screen — Beautiful avatar uploader and clean modern inputs
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Image, TextInput, Modal
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuthStore } from '../store/useAuthStore';
import { storageApi } from '../api/storage';
import { theme } from '../theme';
import { getMediaUrl } from '../utils/media';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function EditProfileScreen({ navigation }: Props) {
  const { user, restoreSession, updateProfile } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [address, setAddress] = useState(user?.address || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Separate state for day/month/year inputs in modal
  const initDob = user?.dateOfBirth ? user.dateOfBirth.split('-') : ['', '', ''];
  const [dobDay, setDobDay] = useState(initDob[2] || '');
  const [dobMonth, setDobMonth] = useState(initDob[1] || '');
  const [dobYear, setDobYear] = useState(initDob[0] || '');

  const handleSave = async () => {
    if (!email.trim() || !fullName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Tên và Email.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      await restoreSession();
      Alert.alert('Thành công', 'Hồ sơ cá nhân đã được cập nhật mượt mà.', [
        { text: 'Trở về', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể cập nhật lúc này. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const pickAvatar = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo', maxWidth: 512, maxHeight: 512, quality: 0.8,
      });
      if (result.assets?.[0]) {
        const asset = result.assets[0];
        setUploadingAvatar(true);
        try {
          const file = { uri: asset.uri, name: asset.fileName || 'avatar.jpg', type: asset.type || 'image/jpeg' };
          const uploadRes = await storageApi.upload(file, 'user', String(user?.userId || 0));
          setAvatarUrl(uploadRes.data.url);
        } catch {
          Alert.alert('Lỗi tải ảnh', 'Có vấn đề khi tải ảnh lên. Các bạn thông cảm.');
        } finally {
          setUploadingAvatar(false);
        }
      }
    } catch { /* User cancelled */ }
  };

  const handleDateConfirm = () => {
    const d = parseInt(dobDay, 10);
    const m = parseInt(dobMonth, 10);
    const y = parseInt(dobYear, 10);
    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng nhập đúng định dạng ngày/tháng/năm.');
      return;
    }
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const testDate = new Date(iso);
    if (isNaN(testDate.getTime()) || testDate > new Date()) {
      Alert.alert('Ngày không hợp lệ', 'Ngày sinh phải nhỏ hơn ngày hiện tại.');
      return;
    }
    setDateOfBirth(iso);
    setShowDatePicker(false);
  };

  const handleDateClear = () => {
    setDobDay(''); setDobMonth(''); setDobYear('');
    setDateOfBirth('');
    setShowDatePicker(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevron-left" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông Tin Cá Nhân</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentWrapper} keyboardShouldPersistTaps="handled">
          
          {/* Enhanced Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarBox} onPress={pickAvatar} activeOpacity={0.8}>
              {avatarUrl ? (
                <Image source={{ uri: getMediaUrl(avatarUrl) }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="account" size={54} color={theme.colors.textLight} />
                </View>
              )}
              <View style={styles.cameraIconBadge}>
                 <Icon name="camera-plus" size={16} color="#fff" />
              </View>
              {uploadingAvatar && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.usernameDisplay}>{user?.username || 'Thành viên'}</Text>
            <Text style={styles.roleDisplay}>{user?.role || 'GUEST'} ACCOUNT</Text>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionHeading}>Hồ Sơ Của Bạn</Text>
            
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconBg}><Icon name="card-account-details-outline" size={20} color={theme.colors.primary} /></View>
              <View style={styles.inputBody}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  value={fullName} onChangeText={setFullName}
                  style={styles.textInput} placeholder="Nhập tên của bạn" placeholderTextColor={theme.colors.textLight}
                />
              </View>
            </View>

            {/* Email (readonly) */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconBg}><Icon name="email-outline" size={20} color={theme.colors.primary} /></View>
              <View style={styles.inputBody}>
                <Text style={styles.inputLabel}>Email liên hệ (Cố định)</Text>
                <TextInput
                  value={email} onChangeText={setEmail}
                  style={[styles.textInput, { color: theme.colors.textSecondary }]}
                  editable={false} keyboardType="email-address" autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconBg}><Icon name="phone-outline" size={20} color={theme.colors.primary} /></View>
              <View style={styles.inputBody}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  value={phone} onChangeText={setPhone}
                  style={styles.textInput} placeholder="Nhập SĐT..." placeholderTextColor={theme.colors.textLight}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconBg}><Icon name="calendar-outline" size={20} color={theme.colors.primary} /></View>
              <View style={styles.inputBody}>
                <Text style={styles.inputLabel}>Ngày sinh</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Text style={[styles.textInput, { paddingVertical: 8 }, !dateOfBirth && { color: theme.colors.textLight }]}>
                    {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('vi-VN') : 'Chọn ngày sinh...'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconBg}><Icon name="map-marker-outline" size={20} color={theme.colors.primary} /></View>
              <View style={styles.inputBody}>
                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  value={address} onChangeText={setAddress}
                  style={styles.textInput} placeholder="Nhập địa chỉ..." placeholderTextColor={theme.colors.textLight}
                />
              </View>
            </View>

            {/* Bio */}
            <View style={[styles.inputGroup, { alignItems: 'flex-start', paddingVertical: 16 }]}>
              <View style={[styles.inputIconBg, { marginTop: 4 }]}><Icon name="text-box-outline" size={20} color={theme.colors.primary} /></View>
              <View style={styles.inputBody}>
                <Text style={styles.inputLabel}>Giới thiệu bản thân</Text>
                <TextInput
                  value={bio} onChangeText={setBio}
                  style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Viết vài dòng về bản thân..." placeholderTextColor={theme.colors.textLight}
                  multiline numberOfLines={4}
                />
              </View>
            </View>
          </View>

          {/* Date Picker Modal */}
          <Modal visible={showDatePicker} transparent animationType="slide">
            <TouchableOpacity style={styles.datePickerOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
              <View style={styles.datePickerContainer} onStartShouldSetResponder={() => true}>
                <Text style={styles.datePickerTitle}>Chọn Ngày Sinh</Text>
                <View style={styles.datePickerInputRow}>
                  <View style={styles.datePickerField}>
                    <Text style={styles.datePickerFieldLabel}>Ngày</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      placeholder="DD"
                      placeholderTextColor={theme.colors.textLight}
                      value={dobDay}
                      onChangeText={(t) => setDobDay(t.replace(/[^0-9]/g, '').slice(0, 2))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.datePickerSep}>/</Text>
                  <View style={styles.datePickerField}>
                    <Text style={styles.datePickerFieldLabel}>Tháng</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      placeholder="MM"
                      placeholderTextColor={theme.colors.textLight}
                      value={dobMonth}
                      onChangeText={(t) => setDobMonth(t.replace(/[^0-9]/g, '').slice(0, 2))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.datePickerSep}>/</Text>
                  <View style={styles.datePickerField}>
                    <Text style={styles.datePickerFieldLabel}>Năm</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      placeholder="YYYY"
                      placeholderTextColor={theme.colors.textLight}
                      value={dobYear}
                      onChangeText={(t) => setDobYear(t.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                </View>
                <View style={styles.datePickerActions}>
                  <TouchableOpacity style={styles.datePickerActionBtn} onPress={handleDateClear}>
                    <Icon name="trash-can-outline" size={16} color={theme.colors.error} />
                    <Text style={{ color: theme.colors.error, fontWeight: '600', marginLeft: 6 }}>Xóa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.datePickerActionBtn, styles.datePickerConfirmBtn]} onPress={handleDateConfirm}>
                    <Icon name="check" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Bar for Action */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 24 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave} disabled={loading} activeOpacity={0.8}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <>
               <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>
               <Icon name="check" size={20} color="#fff" />
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.background,
  },
  backBtn: { padding: 8 },
  headerTitle: { ...theme.typography.h2, fontSize: 20, color: theme.colors.text },
  
  contentWrapper: { paddingBottom: 100 },
  
  avatarSection: { alignItems: 'center', marginVertical: 32 },
  avatarBox: { width: 120, height: 120, borderRadius: 60, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, backgroundColor: '#fff' },
  avatarImg: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 4, backgroundColor: theme.colors.primary, padding: 8, borderRadius: 20, borderWidth: 3, borderColor: theme.colors.background },
  avatarLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  
  usernameDisplay: { ...theme.typography.h2, fontSize: 22, color: theme.colors.text, marginTop: 16 },
  roleDisplay: { ...theme.typography.caption, fontSize: 12, color: theme.colors.primary, marginTop: 4, letterSpacing: 1, paddingHorizontal: 10, paddingVertical: 2, backgroundColor: theme.colors.primary + '15', borderRadius: 10 },

  formContainer: { paddingHorizontal: 20 },
  sectionHeading: { ...theme.typography.h3, color: theme.colors.textSecondary, marginBottom: 16, marginLeft: 4 },
  
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  inputIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  inputBody: { flex: 1 },
  inputLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 2, fontWeight: '500' },
  textInput: { fontSize: 16, color: theme.colors.text, fontWeight: '600', padding: 0, margin: 0 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, borderTopLeftRadius: 32, borderTopRightRadius: 32, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  saveBtn: { backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 24 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...theme.typography.button, color: '#fff', fontSize: 16 },

  // Date Picker Modal
  datePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  datePickerContainer: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  datePickerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 20, textAlign: 'center' },
  datePickerInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 8 },
  datePickerField: { flex: 1, alignItems: 'center' },
  datePickerFieldLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600', marginBottom: 6 },
  datePickerInput: { backgroundColor: theme.colors.surfaceVariant, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 20, fontWeight: '700', color: theme.colors.text, textAlign: 'center', width: '100%' },
  datePickerSep: { fontSize: 24, fontWeight: '700', color: theme.colors.textLight, marginTop: 18 },
  datePickerActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  datePickerActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16 },
  datePickerConfirmBtn: { backgroundColor: theme.colors.primary, borderRadius: 16 },
});
