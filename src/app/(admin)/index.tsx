import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing, radius } from '../../constants/theme';
import { UserRole } from '../../types';

interface GeneratedCode {
  code: string;
  role: UserRole;
  createdAt: number;
}

export default function AdminDashboard() {
  const { user, generateInviteCode, logout } = useAuthStore();
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('amiri');

  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.center}>
        <Text>Yetkisiz erişim</Text>
      </View>
    );
  }

  const handleGenerateCode = () => {
    const code = generateInviteCode(selectedRole);
    setGeneratedCodes([
      {
        code,
        role: selectedRole,
        createdAt: Date.now(),
      },
      ...generatedCodes,
    ]);
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', onPress: () => {} },
        {
          text: 'Evet',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hoş geldin, {user.name}!</Text>
          <Text style={styles.companyInfo}>İşletme ID: {user.companyId}</Text>
        </View>
        <PrimaryButton
          label="Çıkış"
          onPress={handleLogout}
          variant="danger"
        />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ gap: spacing.lg }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Davet Kodu Oluştur</Text>
          
          <View style={styles.roleSelector}>
            <RoleOption
              label="Vardiya Amiri"
              active={selectedRole === 'amiri'}
              onPress={() => setSelectedRole('amiri')}
            />
            <RoleOption
              label="Bakımcı"
              active={selectedRole === 'bakimci'}
              onPress={() => setSelectedRole('bakimci')}
            />
          </View>

          <PrimaryButton
            label="Kod Oluştur"
            onPress={handleGenerateCode}
          />
        </View>

        {generatedCodes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Oluşturulan Kodlar</Text>
            
            <FlatList
              data={generatedCodes}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.codeCard}>
                  <View style={styles.codeInfo}>
                    <Text style={styles.codeText}>{item.code}</Text>
                    <Text style={styles.roleLabel}>
                      {item.role === 'amiri' ? 'Vardiya Amiri' : 'Bakımcı'}
                    </Text>
                  </View>
                  <View style={[styles.roleBadge, getRoleBadgeColor(item.role)]}>
                    <Text style={styles.roleBadgeText}>
                      {item.role === 'amiri' ? 'A' : 'B'}
                    </Text>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.code}
            />
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Nasıl Çalışır?</Text>
          <Text style={styles.infoText}>
            1. Yukarıdan rol seçerek davet kodu oluşturun{'\n'}
            2. Oluşturulan kodu bakımcı veya amir'e verin{'\n'}
            3. Onlar kodu kullanarak sisteme giriş yapabilirler{'\n'}
            4. Girdikten sonra arızaları raporlayabilirler
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function RoleOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.roleOption,
        active && styles.roleOptionActive,
      ]}
    >
      {label}
    </Text>
  );
}

function getRoleBadgeColor(role: UserRole) {
  return role === 'amiri'
    ? { backgroundColor: '#3b82f6' }
    : { backgroundColor: '#8b5cf6' };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  companyInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logoutButton: {
    flex: 0,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleOption: {
    flex: 1,
    paddingVertical: spacing.md,
    textAlign: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: '#fff',
  },
  codeCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.sm,
  },
  codeInfo: {
    flex: 1,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
  },
  roleLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  roleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
