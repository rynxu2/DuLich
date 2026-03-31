/**
 * Premium Register Screen — Matches the Login Screen aesthetic
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, Dimensions, ImageBackground, TextInput
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { AuthStackParamList } from '../navigation/AuthStack';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const BG_IMAGE = "https://images.unsplash.com/photo-1541604907993-e4dcd69ec23f?q=80&w=1200&auto=format&fit=crop";

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await register({ username: username.trim(), email: email.trim(), password });
    } catch (error: any) {
      Alert.alert('Đăng ký thất bại', error.response?.data?.message || 'Có lỗi xảy ra trong quá trình đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: BG_IMAGE }} style={styles.bgImage} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
               <Icon name="chevron-left" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              <View style={styles.formCard}>
                <View style={styles.headerIndicator} />
                <Text style={styles.formTitle}>Tạo Tài Khoản</Text>
                <Text style={styles.formSubtitle}>Bắt đầu hành trình của bạn ngay hôm nay</Text>

                <View style={styles.inputWrapper}>
                  <Icon name="account-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput} placeholder="Tên đăng nhập" placeholderTextColor={theme.colors.textLight}
                    value={username} onChangeText={setUsername} autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Icon name="email-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput} placeholder="Địa chỉ Email" placeholderTextColor={theme.colors.textLight}
                    value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Icon name="lock-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput} placeholder="Mật khẩu" placeholderTextColor={theme.colors.textLight}
                    value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <Icon name="lock-check-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput} placeholder="Xác nhận mật khẩu" placeholderTextColor={theme.colors.textLight}
                    value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.registerBtn, loading && styles.btnDisabled]}
                  onPress={handleRegister} disabled={loading} activeOpacity={0.8}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Đăng Ký</Text>}
                </TouchableOpacity>

                <View style={styles.loginLinkWrap}>
                  <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
                    <Text style={styles.loginText}>
                      Đã có tài khoản? <Text style={styles.loginTextBold}>Đăng Nhập</Text>
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgImage: { width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  topNav: { position: 'absolute', top: 50, left: 10, zIndex: 10 },
  backBtn: { padding: 10, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)' },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },

  formCard: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 30, paddingTop: 16, paddingBottom: 50, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  headerIndicator: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  formTitle: { fontSize: 26, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
  formSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 24 },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, height: 54, marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, color: theme.colors.text, fontWeight: '500' },

  registerBtn: { backgroundColor: theme.colors.primary, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, marginTop: 16 },
  btnDisabled: { opacity: 0.7 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  loginLinkWrap: { alignItems: 'center', marginTop: 32 },
  loginLink: { padding: 8 },
  loginText: { fontSize: 15, color: theme.colors.textSecondary },
  loginTextBold: { color: theme.colors.primary, fontWeight: '800' },
});
