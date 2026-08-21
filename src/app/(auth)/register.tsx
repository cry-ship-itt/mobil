import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing, radius } from '../../constants/theme';

export default function RegisterScreen() {
  const [adminName, setAdminName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!adminName.trim() || !companyName.trim()) {
      Alert.alert('Eksik bilgi', 'Yönetici adı ve işletme adı zorunludur.');
      return;
    }

    try {
      await register(adminName.trim(), companyName.trim());
      router.replace('/(admin)');
    } catch (error) {
      Alert.alert('Hata', 'Kayıt başarısız oldu.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Yeni İşletme Kuruluşu</Text>
        <Text style={styles.subtitle}>Yönetici hesabı oluştur</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Yönetici Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Adınız ve Soyadınız"
            value={adminName}
            onChangeText={setAdminName}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>İşletme Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Fabrika / İşletme Adı"
            value={companyName}
            onChangeText={setCompanyName}
            editable={!isLoading}
          />
        </View>

        <PrimaryButton
          label={isLoading ? 'Yükleniyor...' : 'Kuruluşu Oluştur'}
          onPress={handleRegister}
          disabled={isLoading}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
          <Text
            style={styles.link}
            onPress={() => router.push('/(auth)/login')}
          >
            Giriş Yap
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
