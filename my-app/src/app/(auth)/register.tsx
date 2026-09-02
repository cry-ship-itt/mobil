import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { spacing, radius } from '../../constants/theme';

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

const PERSONAL_EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'yandex.com'];

export default function RegisterScreen() {
  const [adminName, setAdminName] = useState('');
  const [adminTitle, setAdminTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading } = useAuthStore();

  const isPersonalEmail = (value: string) => {
    const domain = value.split('@')[1]?.toLowerCase().trim();
    return domain ? PERSONAL_EMAIL_DOMAINS.includes(domain) : false;
  };

  const submitRegistration = async () => {
    try {
      await register(adminName.trim(), adminTitle.trim(), phone.trim(), companyName.trim(), email.trim(), password);
      router.replace('/(admin)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
      Alert.alert('Kayıt başarısız', message);
    }
  };

  const handleRegister = () => {
    if (!adminName.trim() || !companyName.trim()) {
      Alert.alert('Eksik bilgi', 'Ad soyad ve işletme adı zorunludur.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Eksik bilgi', 'Telefon numarası zorunludur.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eksik bilgi', 'E-posta ve şifre zorunludur.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Geçersiz e-posta', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Geçersiz şifre', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (isPersonalEmail(email.trim())) {
      Alert.alert(
        'Kurumsal e-posta önerilir',
        'Kişisel bir e-posta adresi kullanıyorsunuz. İşletmenizin kurumsal e-posta adresini kullanmanızı öneririz. Yine de devam etmek istiyor musunuz?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Devam Et', onPress: () => void submitRegistration() },
        ]
      );
      return;
    }

    void submitRegistration();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🏭</Text>
        </View>
        <Text style={styles.title}>Yeni İşletme Kuruluşu</Text>
        <Text style={styles.subtitle}>İşletmenizi sisteme tanıtın ve yönetici hesabınızı oluşturun</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ad Soyad</Text>
          <TextInput
            style={styles.input}
            placeholder="Adınız ve Soyadınız"
            placeholderTextColor={palette.textMuted}
            value={adminName}
            onChangeText={setAdminName}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ünvan</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Fabrika Müdürü, Genel Müdür"
            placeholderTextColor={palette.textMuted}
            value={adminTitle}
            onChangeText={setAdminTitle}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefon Numarası</Text>
          <TextInput
            style={styles.input}
            placeholder="05XX XXX XX XX"
            placeholderTextColor={palette.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Şirket E-posta Adresi</Text>
          <TextInput
            style={styles.input}
            placeholder="adiniz@firmaniz.com"
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
            placeholder="En az 6 karakter"
            placeholderTextColor={palette.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>İşletme Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Fabrika / İşletme Adı"
            placeholderTextColor={palette.textMuted}
            value={companyName}
            onChangeText={setCompanyName}
            editable={!isLoading}
          />
        </View>

        <View style={styles.buttonWrapper}>
          <PrimaryButton
            label={isLoading ? 'Yükleniyor...' : 'Kuruluşu Oluştur'}
            onPress={handleRegister}
            disabled={isLoading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>Giriş Yap</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
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
    paddingHorizontal: spacing.md,
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