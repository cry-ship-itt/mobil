import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabase';
import { spacing, radius } from '../../constants/theme';

const palette = {
  background: '#F7F5FB',
  card: '#FFFFFF',
  border: '#EDE9F7',
  primary: '#7C3AED',
  primaryLight: '#EDE4FC',
  primaryDark: '#5B21B6',
  text: '#1F1B2E',
  textSecondary: '#7A7488',
  textMuted: '#9CA3AF',
  white: '#FFFFFF',
};

interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

export default function DepartmentsScreen() {
  const user = useAuthStore((s) => s.user);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, is_active')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: true });
    if (error) {
      Alert.alert('Hata', 'Departmanlar yüklenemedi.');
      return;
    }
    setDepartments(data ?? []);
  }, [user]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert('Eksik bilgi', 'Departman adı girin.');
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.rpc('create_department', { department_name: newName.trim() });
      if (error) throw error;
      setNewName('');
      await load();
    } catch (error) {
      Alert.alert('Hata', error instanceof Error ? error.message : 'Departman oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.root}>
      <View style={styles.formCard}>
        <Text style={styles.label}>Yeni Departman</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Örn: Büküm"
            placeholderTextColor={palette.textMuted}
            value={newName}
            onChangeText={setNewName}
          />
          <Pressable style={styles.addButton} onPress={handleCreate} disabled={creating}>
            <Text style={styles.addButtonText}>{creating ? '...' : 'Ekle'}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={departments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.deptCard}
            onPress={() => router.push({ pathname: '/(admin)/departments/[id]', params: { id: item.id, name: item.name } })}
          >
            <Text style={styles.deptName}>{item.name}</Text>
            {!item.is_active && <Text style={styles.inactiveTag}>Pasif</Text>}
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Henüz departman oluşturulmadı.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background, padding: spacing.lg, gap: spacing.md },
  formCard: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  label: { fontSize: 13, fontWeight: '700', color: palette.text },
  row: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: palette.text,
    backgroundColor: palette.background,
  },
  addButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { color: palette.white, fontWeight: '700' },
  list: { gap: spacing.xs },
  deptCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  deptName: { flex: 1, fontSize: 15, fontWeight: '700', color: palette.text },
  inactiveTag: { fontSize: 11, color: palette.textMuted, fontWeight: '600' },
  chevron: { fontSize: 20, color: palette.primary },
  empty: { color: palette.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});