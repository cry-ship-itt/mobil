import { useCallback, useState } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { ticketService } from '../../services/ticketService';
import { TicketCard } from '../../components/TicketCard';
import { LogoutHeader } from '../../components/LogoutHeader';
import { Ticket } from '../../types';
import { colors, spacing } from '../../constants/theme';

export default function BakimciHavuzuScreen() {
  const user = useAuthStore((s: AuthState) => s.user)!;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = useCallback(async () => {
    const data = await ticketService.getOpenTickets(user.companyId);
    setTickets(data);
  }, [user.companyId]);

  // Ekrana her dönüşte listeyi tazele (detaydan geri dönünce güncel görünsün)
  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <LogoutHeader userName={user.name} subtitle="Bakımcı" />
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <TicketCard ticket={item} onPress={() => router.push(`/(bakimci)/${item.id}`)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Açık arıza kaydı bulunmuyor 🎉</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});