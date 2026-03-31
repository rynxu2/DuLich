/**
 * Premium Login Screen — Full screen image background with a clean card
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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const { width, height } = Dimensions.get('window');

// A nice travel background image from unsplash
const BG_IMAGE = "https://images.unsplash.com/photo-1541604907993-e4dcd69ec23f?q=80&w=1200&auto=format&fit=crop";

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              
              <View style={styles.headerArea}>
                <View style={styles.iconBg}>
                  <Icon name="airplane-takeoff" size={40} color={theme.colors.primary} />
                </View>
                <Text style={styles.brandTitle}>Khám Phá</Text>
                <Text style={styles.brandSubtitle}>Mở ra những hành trình vô tận</Text>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Đăng Nhập</Text>
                <Text style={styles.formSubtitle}>Chào mừng bạn quay trở lại</Text>

                <View style={styles.inputWrapper}>
                  <Icon name="account-outline" size={22} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Tên đăng nhập"
                    placeholderTextColor={theme.colors.textLight}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Icon name="lock-outline" size={22} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mật khẩu"
                    placeholderTextColor={theme.colors.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotPassBtn}>
                  <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginBtn, loading && styles.btnDisabled]}
                  onPress={handleLogin} disabled={loading} activeOpacity={0.8}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Đăng Nhập</Text>}
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
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgImage: { width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  
  headerArea: { paddingHorizontal: 30, marginBottom: 24, paddingBottom: 10 },
  iconBg: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  brandTitle: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 1, marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  brandSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  formCard: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 30, paddingTop: 40, paddingBottom: 50, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  formTitle: { fontSize: 26, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
  formSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 32 },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 16, color: theme.colors.text, fontWeight: '500' },

  forgotPassBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPassText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },

  loginBtn: { backgroundColor: theme.colors.primary, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 16, color: theme.colors.textLight, fontSize: 14, fontWeight: '500' },

  registerLink: { alignItems: 'center' },
  registerText: { fontSize: 15, color: theme.colors.textSecondary },
  registerTextBold: { color: theme.colors.primary, fontWeight: '800' },
});
