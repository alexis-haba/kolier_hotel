import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#0B1220",
  card: "#121A2A",
  text: "#E5E7EB",
  sub: "#9CA3AF",
  primary: "#10B981",
  border: "#27324A",
  danger: "#EF4444",
};

const TYPO = StyleSheet.create({
  h1: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  label: { fontSize: 13, color: COLORS.sub, marginBottom: 6 },
  money: { fontSize: 16, fontWeight: "700", color: COLORS.text },
});

type Expense = { reason: string; amount: string };

export default function Expenses() {
  const [items, setItems] = useState<Expense[]>([{ reason: "", amount: "" }]);
  const lastSaved = useRef<string>(""); // 🔹 garde en mémoire la dernière sauvegarde

  const add = () => setItems((p) => [...p, { reason: "", amount: "" }]);
  const rm = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const setField = (i: number, k: keyof Expense, v: string) =>
    setItems((p) => p.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));

  const total = items.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const save = async () => {
    const validExpenses = items
      .filter((i) => i.reason.trim() && i.amount)
      .map((i) => ({ description: i.reason.trim(), amount: Number(i.amount) }));

    if (validExpenses.length === 0) {
      Alert.alert("Erreur", "Veuillez saisir au moins une dépense valide.");
      return;
    }

    // 🔸 Vérifie doublons dans le même lot (local)
    const unique = new Set(validExpenses.map((e) => `${e.description}-${e.amount}`));
    if (unique.size !== validExpenses.length) {
      Alert.alert("Doublon détecté", "Certaines dépenses sont identiques. Vérifiez avant d’enregistrer.");
      return;
    }

    // 🔸 Empêche de renvoyer la même donnée deux fois
    const currentData = JSON.stringify(validExpenses);
    if (lastSaved.current === currentData) {
      Alert.alert("Doublon détecté", "Ces mêmes dépenses ont déjà été enregistrées.");
      return;
    }

    // 🔸 Confirmation avant enregistrement
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment enregistrer ces dépenses ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                Alert.alert("Erreur", "Vous devez être connecté pour enregistrer.");
                return;
              }

              await api.post(
                "/expenses",
                { expenses: validExpenses },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              lastSaved.current = currentData; // garde la dernière sauvegarde
              Alert.alert("Succès", "Dépenses enregistrées !");
              setItems([{ reason: "", amount: "" }]);
            } catch (err) {
              console.error(err);
              Alert.alert("Erreur", "Impossible d’enregistrer les dépenses.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[TYPO.h1, { marginBottom: 8 }]}>Dépenses (libres)</Text>

      <View style={styles.card}>
        {items.map((exp, idx) => (
          <View key={idx} style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Motif"
              placeholderTextColor={COLORS.sub}
              value={exp.reason}
              onChangeText={(t) => setField(idx, "reason", t)}
            />
            <TextInput
              style={[styles.input, { width: 130 }]}
              placeholder="Montant"
              placeholderTextColor={COLORS.sub}
              value={exp.amount}
              onChangeText={(t) => setField(idx, "amount", t)}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={() => rm(idx)} style={styles.iconBtn}>
              <Ionicons name="trash" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={add} style={[styles.btn, { backgroundColor: "#1F2937" }]}>
          <Ionicons name="add" size={18} color={COLORS.text} />
          <Text style={styles.btnText}>Ajouter une dépense</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
        <Text style={TYPO.money}>Total :</Text>
        <Text style={TYPO.money}>{total.toLocaleString()} FG</Text>
      </View>

      <TouchableOpacity onPress={save} style={[styles.btn, { backgroundColor: COLORS.primary }]}>
        <Ionicons name="save" size={18} color="#0B1220" />
        <Text style={[styles.btnText, { color: "#0B1220", fontWeight: "800" }]}>Enregistrer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.bg },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  input: { backgroundColor: "#0F172A", color: COLORS.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  btnText: { color: COLORS.text, marginLeft: 8, fontWeight: "700" },
  iconBtn: { padding: 8 },
});
