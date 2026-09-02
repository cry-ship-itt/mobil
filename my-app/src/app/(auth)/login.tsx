import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { spacing, radius } from '../../constants/theme';
import { UserRole } from '../../types';

// Modern beyaz + mor palet
const palette = {
  background: '#F7F5FB',
  card: '#FFFFFF',
  border: '#EDE9F7',
  primary: '#7C3AED',
  primaryLight: '#EDE4FC',
  primaryDark: '#5B21B6',
  secondary: '#A78BFA',
  text: '#1F1B2E',
  textSecondary: '#7A7488',
  textMuted: '#9CA3AF',
  danger: '#DC2626',
  white: '#FFFFFF',
};

export default function LoginScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [returningUser, setReturningUser] = useState(true);
  const [role, setRole] = useState<UserRole>('amiri');
  const { login, adminLogin, passwordLogin, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (role === 'admin') {
      if (!email.trim() || !password) {
        Alert.alert('Hata', 'Admin e-posta ve şifresini girin.');
        return;
      }
    } else if (returningUser) {
      if (!email.trim() || !password) {
        Alert.alert('Hata', 'E-posta ve şifrenizi girin.');
        return;
      }
    } else {
      if (!inviteCode.trim() || inviteCode.trim().length < 4) {
        Alert.alert('Hata', 'Davet kodunu girin (en az 4 karakter).');
        return;
      }
      if (!name.trim()) {
        Alert.alert('Hata', 'Adınızı girin.');
        return;
      }
      if (!email.trim() || !password || password.length < 6) {
        Alert.alert('Hata', 'E-posta ve en az 6 karakterlik şifre girin.');
        return;
      }
    }

    try {
      if (role === 'admin') {
        await adminLogin(email.trim(), password);
        router.replace('/(admin)');
      } else if (returningUser) {
        await passwordLogin(email.trim(), password, role);
        router.replace(role === 'amiri' ? '/(amiri)' : '/(bakimci)');
      } else {
        await login(inviteCode.trim().toUpperCase(), name.trim(), role, email.trim(), password);
        router.replace(role === 'amiri' ? '/(amiri)' : '/(bakimci)');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
      Alert.alert('Giriş başarısız', message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Üst Logo ve Başlık Alanı */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🛠️</Text>
        </View>
        <Text style={styles.title}>Arıza Takip Sistemi</Text>
        <Text style={styles.subtitle}>
          {returningUser || role === 'admin' ? 'Hesabınızla giriş yapın' : 'Davet kodunuzla kayıt olun'}
        </Text>
      </View>

      {/* Form Kartı */}
      <View style={styles.formCard}>
        {/* Rol Seçici */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rolünüz</Text>
          <View style={styles.roleRow}>
            <RoleButton
              label="Vardiya Amiri"
              active={role === 'amiri'}
              onPress={() => setRole('amiri')}
            />
            <RoleButton
              label="Bakımcı"
              active={role === 'bakimci'}
              onPress={() => setRole('bakimci')}
            />
            <RoleButton
              label="İşletme Sahibi"
              active={role === 'admin'}
              onPress={() => setRole('admin')}
            />
          </View>
        </View>

        {role === 'admin' || returningUser ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@firma.com"
                placeholderTextColor={palette.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                style={styles.input}
                placeholder="Şifreniz"
                placeholderTextColor={palette.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adınız</Text>
              <TextInput
                style={styles.input}
                placeholder="Ad ve Soyad"
                placeholderTextColor={palette.textMuted}
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Davet Kodu</Text>
              <TextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Örn: ABC123"
                placeholderTextColor={palette.textMuted}
                autoCapitalize="characters"
                style={styles.input}
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hesap E-posta</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@firma.com"
                placeholderTextColor={palette.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hesap Şifresi</Text>
              <TextInput
                style={styles.input}
                placeholder="En az 6 karakter"
                placeholderTextColor={palette.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </>
        )}

        {role !== 'admin' && (
          <Pressable onPress={() => setReturningUser((value) => !value)} style={styles.toggleContainer}>
            <Text style={styles.toggleLink}>
              {returningUser ? 'Hesabınız yok mu? Kayıt Olun' : 'Zaten hesabınız var mı? Giriş Yapın'}
            </Text>
          </Pressable>
        )}

        <View style={styles.buttonWrapper}>
          <PrimaryButton
            label={isLoading ? 'Yükleniyor...' : 'Giriş Yap'}
            onPress={handleLogin}
            disabled={isLoading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>İşletme sahibi misiniz? </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>Kuruluş Oluştur</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function RoleButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.roleButton, active && styles.roleButtonActive]}
    >
      <Text style={[styles.roleButtonText, active && styles.roleButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: palette.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: palette.text,
    backgroundColor: palette.background,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  roleButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  roleButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textSecondary,
    textAlign: 'center',
  },
  roleButtonTextActive: {
    color: palette.white,
  },
  toggleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  toggleLink: {
    color: palette.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonWrapper: {
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  footerText: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  link: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});