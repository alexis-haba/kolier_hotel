import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import eventBus from "../../utils/eventBus";

const COLORS = {
  bg: "#0B1220",
  card: "#121A2A",
  text: "#E5E7EB",
  sub: "#9CA3AF",
  primary: "#10B981",
  danger: "#EF4444",
  info: "#3B82F6",
  border: "#27324A",
};

const TYPO = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  h2: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  p: { fontSize: 14, color: COLORS.sub },
  moneyIn: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  moneyOut: { fontSize: 18, fontWeight: "700", color: COLORS.danger },
  money: { fontSize: 18, fontWeight: "700", color: COLORS.info },
});

const safeFormat = (value: any) => {
  if (typeof value === "number" && !isNaN(value)) {
    return value.toLocaleString();
  }
  return "0";
};

export default function Dashboard() {
  const [totals, setTotals] = useState({
    totalEntries: 0,
    totalExpenses: 0,
    balance: 0,
    hourEntries: 0,
    dayEntries: 0,
    nightEntries: 0,
    entriesIncome: 0,
  });
  const [stays, setStays] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDailyReport = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await api.get("/user-report/daily", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Adapter au nouveau format du back
      setTotals({
        totalEntries: data.totals?.totalIncome ?? 0,
        totalExpenses: data.totals?.totalExpenses ?? 0,
        balance: data.totals?.remaining ?? 0,
        hourEntries: data.totals?.hourIncome ?? 0,
        dayEntries: data.totals?.dayIncome ?? 0,
        nightEntries: data.totals?.nightIncome ?? 0,
        entriesIncome: data.totals?.entriesIncome ?? 0,
      });

      setStays([
        ...(data.stays?.hours || []),
        ...(data.stays?.days || []),
        ...(data.stays?.nights || []),
      ]);

      setExpenses(data.expenses?.list || []);
    } catch (e) {
      console.error("Erreur chargement report:", e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDailyReport();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDailyReport();
    eventBus.on("dataUpdated", fetchDailyReport);
    return () => {
      eventBus.off("dataUpdated", fetchDailyReport);
    };
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]} // Android
          tintColor={COLORS.primary} // iOS
        />
      }
    >
      <Text style={[TYPO.h1, { marginBottom: 12 }]}>
        Tableau de bord du jour
      </Text>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={TYPO.p}>Total Entrées</Text>
          <Text style={TYPO.moneyIn}>{safeFormat(totals.totalEntries)} FG</Text>
        </View>
        <View style={styles.card}>
          <Text style={TYPO.p}>Total Dépenses</Text>
          <Text style={TYPO.moneyOut}>
            {safeFormat(totals.totalExpenses)} FG
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={TYPO.p}>Solde</Text>
        <Text style={TYPO.money}>{safeFormat(totals.balance)} FG</Text>
      </View>

      {/* Détail des revenus */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={TYPO.p}>La Journée</Text>
          <Text style={TYPO.moneyIn}>{safeFormat(totals.entriesIncome)} FG</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={TYPO.p}>Heures</Text>
          <Text style={TYPO.moneyIn}>{safeFormat(totals.hourEntries)} FG</Text>
        </View>

        <View style={styles.card}>
          <Text style={TYPO.p}>Nuitées</Text>
          <Text style={TYPO.moneyIn}>{safeFormat(totals.nightEntries)} FG</Text>
        </View>
      </View>



      {/* Liste des séjours */}
      <View style={styles.card}>
        <Text style={[TYPO.h2, { marginBottom: 8 }]}>
          Séjours du jour ({stays.length})
        </Text>
        {stays.length === 0 ? (
          <Text style={TYPO.p}>Aucun séjour enregistré aujourd'hui.</Text>
        ) : (
          stays.map((stay, idx) => (
            <View
              key={idx}
              style={{
                borderBottomWidth: idx < stays.length - 1 ? 1 : 0,
                borderColor: COLORS.border,
                paddingVertical: 6,
              }}
            >
              <Text style={TYPO.p}>
                Chambre: {stay.roomId?.name || stay.roomId?.number || "N/A"} |{" "}
                {stay.phase === "night"
                  ? "Nuit"
                  : stay.phase === "day"
                  ? "Journée"
                  : "Heures"}
              </Text>
              <Text style={TYPO.moneyIn}>{safeFormat(stay.amount)} FG</Text>
              <Text style={{ fontSize: 12, color: COLORS.sub }}>
                Début:{" "}
                {stay.startTime
                  ? new Date(stay.startTime).toLocaleTimeString()
                  : "N/A"}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.sub }}>
                Fin:{" "}
                {stay.endTime
                  ? new Date(stay.endTime).toLocaleTimeString()
                  : "N/A"}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Liste des dépenses */}
      <View style={styles.card}>
        <Text style={[TYPO.h2, { marginBottom: 8 }]}>
          Dépenses du jour ({expenses.length})
        </Text>
        {expenses.length === 0 ? (
          <Text style={TYPO.p}>Aucune dépense enregistrée aujourd'hui.</Text>
        ) : (
          expenses.map((exp, idx) => (
            <View
              key={idx}
              style={{
                borderBottomWidth: idx < expenses.length - 1 ? 1 : 0,
                borderColor: COLORS.border,
                paddingVertical: 6,
              }}
            >
              <Text style={TYPO.p}>
                Motif: {exp.description || "Sans motif"}
              </Text>
              <Text style={TYPO.moneyOut}>{safeFormat(exp.amount)} FG</Text>
              <Text style={{ fontSize: 12, color: COLORS.sub }}>
                Heure:{" "}
                {exp.date
                  ? new Date(exp.date).toLocaleTimeString()
                  : "N/A"}
              </Text>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.bg },
  row: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
});
