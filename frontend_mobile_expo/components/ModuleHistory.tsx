import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '../services/api';

const COLORS = {
  bg: '#0B1220', card: '#121A2A', text: '#E5E7EB',
  sub: '#9CA3AF', border: '#27324A', danger: '#EF4444',
};

const PAGE_SIZE = 20;

type Entry = {
  _id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
};

type Props = {
  module: 'restaurant' | 'nightclub';
  accentColor: string;
};

export default function ModuleHistory({ module, accentColor }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/module-entries?module=${module}&page=${p}&limit=${PAGE_SIZE}`
      );
      setTotal(data.total);
      setEntries(prev => reset ? data.entries : [...prev, ...data.entries]);
      setPage(p);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger l\'historique.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(1, true); }, []));

  const deleteEntry = (id: string) => {
    Alert.alert('Supprimer', 'Confirmer la suppression ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/module-entries/${id}`);
            setEntries(prev => prev.filter(e => e._id !== id));
            setTotal(t => t - 1);
          } catch {
            Alert.alert('Erreur', 'Suppression impossible.');
          }
        },
      },
    ]);
  };

  const totalIncome  = entries.reduce((s, e) => e.type === 'income'  ? s + e.amount : s, 0);
  const totalExpense = entries.reduce((s, e) => e.type === 'expense' ? s + e.amount : s, 0);
  const hasMore = entries.length < total;

  return (
    <FlatList
      data={entries}
      keyExtractor={e => e._id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={() => (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Entrées</Text>
            <Text style={[styles.summaryAmount, { color: accentColor }]}>
              +{totalIncome.toLocaleString()} FG
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Dépenses</Text>
            <Text style={[styles.summaryAmount, { color: COLORS.danger }]}>
              -{totalExpense.toLocaleString()} FG
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Solde</Text>
            <Text style={[styles.summaryAmount, {
              color: totalIncome - totalExpense >= 0 ? accentColor : COLORS.danger,
            }]}>
              {(totalIncome - totalExpense).toLocaleString()} FG
            </Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        !loading ? <Text style={styles.empty}>Aucune entrée pour l'instant.</Text> : null
      }
      ListFooterComponent={() => (
        <>
          {loading && <ActivityIndicator color={accentColor} style={{ marginVertical: 16 }} />}
          {hasMore && !loading && (
            <TouchableOpacity style={[styles.loadMore, { borderColor: accentColor }]} onPress={() => load(page + 1)}>
              <Text style={[styles.loadMoreText, { color: accentColor }]}>Charger plus</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString('fr-FR')}</Text>
          </View>
          <Text style={[styles.amount, { color: item.type === 'income' ? accentColor : COLORS.danger }]}>
            {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} FG
          </Text>
          <TouchableOpacity onPress={() => deleteEntry(item._id)} style={{ padding: 8 }}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  summary: {
    flexDirection: 'row', backgroundColor: '#121A2A', borderRadius: 14,
    padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#27324A',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  summaryAmount: { fontSize: 14, fontWeight: '700' },
  summaryDivider: { width: 1, backgroundColor: '#27324A', marginHorizontal: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#121A2A',
    borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#27324A',
  },
  desc:   { fontSize: 14, fontWeight: '600', color: '#E5E7EB' },
  date:   { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', marginRight: 4 },
  empty:  { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  loadMore: {
    borderWidth: 1, borderRadius: 12, paddingVertical: 10,
    alignItems: 'center', marginTop: 8,
  },
  loadMoreText: { fontWeight: '600' },
});
