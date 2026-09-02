import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';
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
  white: '#FFFFFF',
};

interface CompanyUser {
  id: string;
  name: string;
  role: 'admin' | 'amiri' | 'bakimci';
  email: string | null;
  phone: string | null;
  title: string | null;
  department_id: string | null;
  department_name: string | null;
  maintenance_type: 'elektrik' | 'mekanik' | 'genel' | null;
  authority_level: 'seviye_1' | 'seviye_2' | null;
  created_at: string;
}

function roleLabel(role: CompanyUser['role']) {
  if (role === 'admin') return 'İşletme Sahibi';
  if (role === 'amiri') return 'Vardiya Amiri';
  return 'Bakımcı';
}

export default function UsersScreen() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_company_users');
    if (error) {
      Alert.alert('Hata', 'Kullanıcılar yüklenemedi.');
      setLoading(false);
      return;
    }
    setUsers((data as CompanyUser[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <View style={styles.root}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleLabel(item.role)}</Text>
              </View>
            </View>

            {item.title && <Text style={styles.meta}>Ünvan: {item.title}</Text>}
            {item.email && <Text style={styles.meta}>E-posta: {item.email}</Text>}
            {item.phone && <Text style={styles.meta}>Telefon: {item.phone}</Text>}
            {item.department_name && <Text style={styles.meta}>Departman: {item.department_name}</Text>}
            {item.role === 'bakimci' && (
              <Text style={styles.meta}>
                {item.maintenance_type === 'genel' ? 'Genel' : item.maintenance_type === 'elektrik' ? 'Elektrik' : 'Mekanik'}
                {' • '}
                {item.authority_level === 'seviye_2' ? '2. Seviye' : '1. Seviye'}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Henüz kayıtlı kullanıcı yok.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1 },
  roleBadge: { backgroundColor: palette.primaryLight, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: palette.primaryDark },
  meta: { fontSize: 12, color: palette.textSecondary },
  empty: { color: palette.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});