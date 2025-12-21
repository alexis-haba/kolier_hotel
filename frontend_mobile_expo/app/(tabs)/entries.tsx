import React, { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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

type Expense = { label: string; amount: string };

export default function Entries() {
  const [phase, setPhase] = useState<"day" | "night">("day");
  const [totalEntries, setTotalEntries] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([{ label: "", amount: "" }]);
  const [entries, setEntries] = useState<any[]>([]);
  const lastSaved = useRef<string>(""); // 🔹 garde en mémoire la dernière entrée sauvegardée
  const router = useRouter();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await api.get("/entries", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setEntries(data);
      } catch (e: any) {
        console.error("Erreur /entries:", e.response?.data || e.message);
        setEntries([]);
      }
    };
    fetchEntries();
  }, []);

  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
    [expenses]
  );

  const balance = useMemo(
    () => (parseFloat(totalEntries) || 0) - totalExpenses,
    [totalEntries, totalExpenses]
  );

  const addExpense = () => setExpenses((prev) => [...prev, { label: "", amount: "" }]);
  const removeExpense = (idx: number) => setExpenses((prev) => prev.filter((_, i) => i !== idx));
  const setExpenseField = (idx: number, key: keyof Expense, val: string) =>
    setExpenses((prev) => prev.map((e, i) => (i === idx ? { ...e, [key]: val } : e)));

  const saveDay = async () => {
    if (!totalEntries) return Alert.alert("Erreur", "Entrez le total des entrées");

    const expensesPayload = expenses
      .filter((e) => e.label.trim() && e.amount)
      .map((e) => ({
        description: e.label.trim(),
        amount: Number(e.amount),
      }));

    const currentData = JSON.stringify({
      totalIncome: Number(totalEntries),
      expenses: expensesPayload,
      phase,
    });

    // 🔸 Vérifie si c’est la même donnée que précédemment
    if (lastSaved.current === currentData) {
      return Alert.alert("Doublon détecté", "Cette entrée a déjà été enregistrée.");
    }

    // 🔸 Demande confirmation à l'utilisateur
    Alert.alert(
      "Confirmation",
      "Voulez-vous enregistrer ces entrées ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await api.post(
                "/entries",
                {
                  phase: "day",
                  totalIncome: Number(totalEntries),
                  expenses: expensesPayload,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              lastSaved.current = currentData; // 🔹 Sauvegarde la dernière donnée
              Alert.alert("Succès", "Entrées (Jour) enregistrées");

              setTotalEntries("");
              setExpenses([{ label: "", amount: "" }]);
            } catch (e: any) {
              console.error("Erreur API:", e.response?.data || e.message);
              Alert.alert("Erreur", "Impossible d’enregistrer");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.segment}>
        <TouchableOpacity onPress={() => setPhase("day")} style={[styles.segBtn, phase === "day" && styles.segActive]}>
          <Text style={{ color: phase === "day" ? COLORS.text : COLORS.sub, fontWeight: "700" }}>Phase 1 (8h-18h)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPhase("night")} style={[styles.segBtn, phase === "night" && styles.segActive]}>
          <Text style={{ color: phase === "night" ? COLORS.text : COLORS.sub, fontWeight: "700" }}>Phase 2 (18h-8h)</Text>
        </TouchableOpacity>
      </View>

      {phase === "day" ? (
        <>
          <Text style={TYPO.h1}>Entrées — Journée</Text>

          <View style={styles.card}>
            <Text style={TYPO.label}>Total entrées (FG)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={totalEntries}
              onChangeText={setTotalEntries}
              placeholder="Ex: 1200000"
              placeholderTextColor={COLORS.sub}
            />
          </View>

          <TouchableOpacity onPress={saveDay} style={[styles.btn, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="save" size={18} color="#0B1220" />
            <Text style={[styles.btnText, { color: "#0B1220", fontWeight: "800" }]}>Enregistrer la journée</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={[TYPO.h1, { marginBottom: 8 }]}>Phase 2 (Nuit)</Text>
          <Text style={TYPO.label}>
            La phase nuit se gère par séjour par chambre (montant, heures, dépenses). Va dans l’onglet{" "}
            <Text style={{ color: COLORS.text, fontWeight: "700" }}>Séjours</Text>.
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/stay")} style={[styles.btn, { marginTop: 12 }]}>
            <Ionicons name="arrow-forward" size={18} color={COLORS.text} />
            <Text style={styles.btnText}>Aller aux Séjours</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.bg },
  segment: { flexDirection: "row", backgroundColor: COLORS.card, borderRadius: 12, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 8 },
  segActive: { backgroundColor: "#1F2937" },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  input: { backgroundColor: "#0F172A", color: COLORS.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  btnText: { color: COLORS.text, marginLeft: 8, fontWeight: "700" },
});
