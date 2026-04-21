/**
 * LoginScreen — Immersive travel background, gradient overlay, polished form card
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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const { width, height } = Dimensions.get('window');

const BG_IMAGE = "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop";

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
    } catch (error: any) {
      Alert.alert('Đăng nhập thất bại', error.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: BG_IMAGE }} style={styles.bgImage} resizeMode="cover">
        <LinearGradient
          colors={['rgba(7,89,133,0.5)', 'rgba(7,89,133,0.3)', 'rgba(0,0,0,0.5)']}
          locations={[0, 0.4, 1]}
          style={styles.overlay}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              <View style={styles.headerArea}>
                <View style={styles.iconBg}>
                  <Icon name="compass-outline" size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.brandTitle}>DuLịch</Text>
                <Text style={styles.brandSubtitle}>Khám phá Việt Nam tuyệt đẹp</Text>
              </View>

              <View style={styles.formCard}>
                {/* Grab handle */}
                <View style={styles.grabHandle} />

                <Text style={styles.formTitle}>Đăng Nhập</Text>
                <Text style={styles.formSubtitle}>Chào mừng bạn quay trở lại</Text>

                <View style={[
                  styles.inputWrapper,
                  focusedField === 'username' && styles.inputFocused,
                ]}>
                  <View style={styles.inputIconWrap}>
                    <Icon name="account-outline" size={20} color={focusedField === 'username' ? theme.colors.primary : theme.colors.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Tên đăng nhập"
                    placeholderTextColor={theme.colors.textLight}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <View style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputFocused,
                ]}>
                  <View style={styles.inputIconWrap}>
                    <Icon name="lock-outline" size={20} color={focusedField === 'password' ? theme.colors.primary : theme.colors.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mật khẩu"
                    placeholderTextColor={theme.colors.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotPassBtn}>
                  <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginBtn, loading && styles.btnDisabled]}
                  onPress={handleLogin} disabled={loading} activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[theme.colors.primaryDark, theme.colors.primary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.loginBtnGrad}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.loginBtnText}>Đăng Nhập</Text>
                        <Icon name="arrow-right" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Hoặc</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerText}>
                    Chưa có tài khoản? <Text style={styles.registerTextBold}>Đăng Ký Ngay</Text>
                  </Text>
                </TouchableOpacity>
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
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },

  headerArea: { paddingHorizontal: 30, marginBottom: 28, paddingBottom: 10 },
  iconBg: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...theme.shadows.lg,
  },
  brandTitle: {
    fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -0.8, marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  brandSubtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

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
  formSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 32 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 16, paddingHorizontal: 4, height: 54, marginBottom: 14,
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

  forgotPassBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPassText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },

  loginBtn: { borderRadius: 16, overflow: 'hidden', ...theme.shadows.colored },
  btnDisabled: { opacity: 0.7 },
  loginBtnGrad: {
    height: 56, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { marginHorizontal: 16, color: theme.colors.textLight, fontSize: 13, fontWeight: '500' },

  registerLink: { alignItems: 'center' },
  registerText: { fontSize: 14, color: theme.colors.textSecondary },
  registerTextBold: { color: theme.colors.primary, fontWeight: '800' },
});
