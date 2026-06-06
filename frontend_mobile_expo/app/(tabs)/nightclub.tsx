import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import ModuleHistory from '../../components/ModuleHistory';

const COLORS = {
  bg: '#0B1220', card: '#121A2A', text: '#E5E7EB',
  sub: '#9CA3AF', primary: '#8B5CF6', border: '#27324A',
  danger: '#EF4444',
};

type Line = { description: string; amount: string };

export default function NightclubScreen() {
  const [tab, setTab] = useState<'form' | 'history'>('form');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [lines, setLines] = useState<Line[]>([{ description: '', amount: '' }]);
  const lastSaved = useRef('');

  const addLine = () => setLines(p => [...p, { description: '', amount: '' }]);
  const rmLine  = (i: number) => setLines(p => p.filter((_, idx) => idx !== i));
  const setField = (i: number, k: keyof Line, v: string) =>
    setLines(p => p.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const total = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);

  const save = async () => {
    const valid = lines.filter(l => l.description.trim() && l.amount);
    if (!valid.length) { Alert.alert('Erreur', 'Saisissez au moins une ligne valide.'); return; }
    const key = JSON.stringify({ type, valid });
    if (lastSaved.current === key) { Alert.alert('Doublon', 'Ces données ont déjà été enregistrées.'); return; }

    Alert.alert('Confirmation', 'Enregistrer ces données ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui',
        onPress: async () => {
          try {
            await Promise.all(
              valid.map(l => api.post('/module-entries', {
                module: 'nightclub', type,
                description: l.description.trim(), amount: Number(l.amount),
              }))
            );
            lastSaved.current = key;
            Alert.alert('Succès', 'Enregistré !');
            setLines([{ description: '', amount: '' }]);
          } catch {
            Alert.alert('Erreur', 'Impossible d\'enregistrer.');
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={styles.topTabs}>
        <TouchableOpacity style={[styles.topTab, tab === 'form' && styles.topTabActive]} onPress={() => setTab('form')}>
          <Text style={[styles.topTabText, tab === 'form' && { color: COLORS.primary }]}>Saisie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTab, tab === 'history' && styles.topTabActive]} onPress={() => setTab('history')}>
          <Text style={[styles.topTabText, tab === 'history' && { color: COLORS.primary }]}>Historique</Text>
        </TouchableOpacity>
      </View>

      {tab === 'form' ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.toggle}>
            <TouchableOpacity style={[styles.toggleBtn, type === 'income' && styles.toggleActive]} onPress={() => setType('income')}>
              <Text style={[styles.toggleText, type === 'income' && { color: '#fff' }]}>Entrées</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, type === 'expense' && styles.toggleDanger]} onPress={() => setType('expense')}>
              <Text style={[styles.toggleText, type === 'expense' && { color: '#fff' }]}>Dépenses</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {lines.map((l, idx) => (
              <View key={idx} style={styles.row}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Description" placeholderTextColor={COLORS.sub} value={l.description} onChangeText={v => setField(idx, 'description', v)} />
                <TextInput style={[styles.input, { width: 110 }]} placeholder="Montant" placeholderTextColor={COLORS.sub} keyboardType="numeric" value={l.amount} onChangeText={v => setField(idx, 'amount', v)} />
                <TouchableOpacity onPress={() => rmLine(idx)} style={{ padding: 8 }}>
                  <Ionicons name="trash" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addLine} style={[styles.btn, { backgroundColor: '#1F2937', marginTop: 4 }]}>
              <Ionicons name="add" size={18} color={COLORS.text} />
              <Text style={styles.btnText}>Ajouter une ligne</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalLabel, { color: type === 'income' ? COLORS.primary : COLORS.danger }]}>
              {total.toLocaleString()} FG
            </Text>
          </View>

          <TouchableOpacity onPress={save} style={[styles.btn, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="save" size={18} color="#fff" />
            <Text style={[styles.btnText, { color: '#fff', fontWeight: '800' }]}>Enregistrer</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ModuleHistory module="nightclub" accentColor={COLORS.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  topTabs: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  topTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  topTabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  topTabText: { fontWeight: '600', color: COLORS.sub },
  toggle: { flexDirection: 'row', marginBottom: 16, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.card },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleDanger: { backgroundColor: COLORS.danger },
  toggleText: { fontWeight: '600', color: COLORS.text },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: { backgroundColor: '#0F172A', color: COLORS.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  btnText: { color: COLORS.text, marginLeft: 8, fontWeight: '700' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  historyDesc: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  historyDate: { fontSize: 12, color: COLORS.sub, marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: '700', marginRight: 4 },
  empty: { textAlign: 'center', color: COLORS.sub, marginTop: 40 },
});
