/**
 * RegisterScreen — Premium registration matching Login aesthetic
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, Dimensions, ImageBackground, TextInput
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { AuthStackParamList } from '../navigation/AuthStack';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const BG_IMAGE = "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop";

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const renderInput = (
    iconName: string,
    placeholder: string,
    value: string,
    onChangeText: (t: string) => void,
    fieldKey: string,
    options?: { secure?: boolean; keyboard?: any; autoCapitalize?: any },
  ) => (
    <View style={[styles.inputWrapper, focusedField === fieldKey && styles.inputFocused]}>
      <View style={styles.inputIconWrap}>
        <Icon name={iconName} size={20} color={focusedField === fieldKey ? theme.colors.primary : theme.colors.textSecondary} />
      </View>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={options?.secure && !showPassword}
        keyboardType={options?.keyboard}
        autoCapitalize={options?.autoCapitalize || 'none'}
        onFocus={() => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
      />
      {options?.secure && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
          <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: BG_IMAGE }} style={styles.bgImage} resizeMode="cover">
        <LinearGradient
          colors={['rgba(7,89,133,0.4)', 'rgba(7,89,133,0.2)', 'rgba(0,0,0,0.5)']}
          locations={[0, 0.3, 1]}
          style={styles.overlay}
        >
          {/* Back Button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { top: Platform.OS === 'ios' ? 54 : 44 }]}>
            <Icon name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              <View style={styles.formCard}>
                <View style={styles.grabHandle} />
                <Text style={styles.formTitle}>Tạo Tài Khoản</Text>
                <Text style={styles.formSubtitle}>Bắt đầu hành trình khám phá của bạn</Text>

                {renderInput('account-outline', 'Tên đăng nhập', username, setUsername, 'username')}
                {renderInput('email-outline', 'Địa chỉ Email', email, setEmail, 'email', { keyboard: 'email-address' })}
                {renderInput('lock-outline', 'Mật khẩu', password, setPassword, 'password', { secure: true })}
                {renderInput('lock-check-outline', 'Xác nhận mật khẩu', confirmPassword, setConfirmPassword, 'confirm', { secure: true })}

                <TouchableOpacity
                  style={[styles.registerBtn, loading && styles.btnDisabled]}
                  onPress={handleRegister} disabled={loading} activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[theme.colors.primaryDark, theme.colors.primary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.registerBtnGrad}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.registerBtnText}>Đăng Ký</Text>
                        <Icon name="arrow-right" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
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
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgImage: { width: '100%', height: '100%' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },

  formCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 28, paddingTop: 16, paddingBottom: 50,
    ...theme.shadows.xl,
  },
  grabHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 24,
  },
  formTitle: {
    fontSize: 26, fontWeight: '800', color: theme.colors.text, marginBottom: 4, letterSpacing: -0.5,
  },
  formSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 28 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 16, paddingHorizontal: 4, height: 54, marginBottom: 12,
    borderWidth: 1.5, borderColor: theme.colors.border,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
  },
  inputIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  textInput: { flex: 1, fontSize: 15, color: theme.colors.text, fontWeight: '500' },
  eyeBtn: { padding: 10 },

  registerBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, ...theme.shadows.colored },
  btnDisabled: { opacity: 0.7 },
  registerBtnGrad: {
    height: 56, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 8,
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  loginLinkWrap: { alignItems: 'center', marginTop: 28 },
  loginLink: { padding: 8 },
  loginText: { fontSize: 14, color: theme.colors.textSecondary },
  loginTextBold: { color: theme.colors.primary, fontWeight: '800' },
});
