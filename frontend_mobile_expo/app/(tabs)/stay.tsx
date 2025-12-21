// frontend/src/screens/StayScreen.tsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Vibration, Alert } from "react-native";
import eventBus from "../../utils/eventBus";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { saveTimers, loadTimers } from "../../utils/timerManager";

const COLORS = {
  bg: "#0B1220", card: "#121A2A", text: "#E5E7EB", sub: "#9CA3AF",
  primary: "#10B981", border: "#27324A", danger: "#EF4444"
};

const TYPO = StyleSheet.create({
  h1: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  label: { fontSize: 13, color: COLORS.sub, marginBottom: 6 },
});

export default function StayScreen() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomId, setRoomId] = useState("");
  const [hours, setHours] = useState("");
  const [autoAmount, setAutoAmount] = useState("");
  const [amount, setAmount] = useState("");
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [stayType, setStayType] = useState("hour");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tariff, setTariff] = useState<{ hourRate: number; nightRate: number }>({ hourRate: 50, nightRate: 100 });

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [hasAlerted, setHasAlerted] = useState(false);

  // Charger chambres
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await api.get("/rooms", { headers: { Authorization: `Bearer ${token}` } });
        setRooms(res.data);
      } catch {}
    })();
  }, []);

  // Charger tarifs
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/tariffs");
        if (res.data) setTariff(Array.isArray(res.data) ? res.data[0] : res.data);
      } catch {}
    })();
  }, []);

  // Calcul automatique des heures / nuitées
  useEffect(() => {
    if (!hours || Number(hours) <= 0) {
      setCheckIn(null);
      setCheckOut(null);
      setRemainingTime(null);
      setAutoAmount("");
      if (!isCustomAmount) setAmount("");
      return;
    }

    const now = new Date();
    setCheckIn(now);

    // --- MODE HEURE ---
    if (stayType === "hour") {
      const durationMs = Number(hours) * 3600 * 1000;
      const out = new Date(now.getTime() + durationMs);

      setCheckOut(out);
      setRemainingTime(durationMs);

      const auto = (Number(hours) * tariff.hourRate).toString();
      setAutoAmount(auto);
      if (!isCustomAmount) setAmount(auto);
      return;
    }

    // --- MODE NUITÉE (jours) ---
    let totalDays = Number(hours);
    let out: Date;

    let nowHour = now.getHours();
    let noon = new Date(now);
    noon.setHours(12, 0, 0, 0);

    // Cas 1 : Avant 08h → même jour 12h
    if (nowHour < 8) {
      out = new Date(noon);

    // Cas 2 + 3 : Entrée 08h-12h ou après 12h → demain 12h
    } else {
      noon.setDate(noon.getDate() + 1);
      out = new Date(noon);
    }

    // Ajouter JOURS - 1
    if (totalDays > 1) {
      out.setDate(out.getDate() + (totalDays - 1));
    }

    setCheckOut(out);
    setRemainingTime(out.getTime() - now.getTime());

    const auto = (totalDays * tariff.nightRate).toString();
    setAutoAmount(auto);
    if (!isCustomAmount) setAmount(auto);
  }, [hours, stayType, tariff, isCustomAmount]);

  // Timer local
  useEffect(() => {
    if (remainingTime === null) return;
    if (remainingTime <= 0 && !hasAlerted) {
      setHasAlerted(true);
      Vibration.vibrate([500, 300, 500]);
      Alert.alert("Temps écoulé", "Le séjour est arrivé à son terme.");
      return;
    }
    const interval = setInterval(() =>
      setRemainingTime(prev => (prev && prev > 0 ? prev - 1000 : 0)),
    1000);
    return () => clearInterval(interval);
  }, [remainingTime, hasAlerted]);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 1000 / 3600);
    const m = Math.floor((ms / 1000 / 60) % 60);
    const s = Math.floor((ms / 1000) % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const handleSubmit = async () => {
    if (!roomId) return Alert.alert("Erreur", "Veuillez choisir une chambre.");
    if (!hours || Number(hours) <= 0) return Alert.alert("Erreur", "Veuillez entrer une durée.");
    if (!amount || Number(amount) <= 0) return Alert.alert("Erreur", "Veuillez entrer un montant valide.");
    if (!checkOut) return Alert.alert("Erreur", "Heure de sortie introuvable.");

    Alert.alert(
      "Confirmation",
      `${stayType === "hour" ? "Durée : " + hours + "h" : "Durée : " + hours + " jour(s)"}\nMontant : ${amount} FG`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return Alert.alert("Erreur", "Vous n'êtes pas connecté.");

              const now = new Date();

              const payload = {
                roomId,
                startTime: now.toISOString(),
                endTime: checkOut.toISOString(),
                amount: Number(amount),
                phase: stayType,
                paymentMethod: paymentMethod === "mobile" ? "other" : paymentMethod,
              };

              await api.post("/stays", payload, { headers: { Authorization: `Bearer ${token}` } });

              const storedTimers = await loadTimers();
              await saveTimers({
                ...storedTimers,
                [roomId]: { endTime: checkOut.getTime(), duration: checkOut.getTime() - now.getTime() },
              });

              eventBus.emit("timersUpdated");
              Alert.alert("Succès", "Séjour enregistré !");

              setRoomId("");
              setHours("");
              setAmount("");
              setIsCustomAmount(false);
              setCheckIn(null);
              setCheckOut(null);
              setRemainingTime(null);
              setHasAlerted(false);

            } catch (e: any) {
              Alert.alert("Erreur", e.response?.data?.msg || "Impossible d’enregistrer.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[TYPO.h1, { marginBottom: 12 }]}>Enregistrer une entrée</Text>

      <View style={styles.card}>

        {/* Chambre */}
        <View style={styles.pickerBox}>
          <Picker dropdownIconColor={COLORS.text} selectedValue={roomId} onValueChange={setRoomId} style={styles.picker} itemStyle={styles.pickerItem}>
            <Picker.Item label="-- Choisir une chambre --" value="" />
            {rooms.map(room => (
              <Picker.Item key={room._id} label={`Chambre ${room.number}`} value={room._id} />
            ))}
          </Picker>
        </View>

        {/* Durée */}
        <Text style={TYPO.label}>{stayType === "hour" ? "Durée (heures)" : "Durée (nombre de jours)"}</Text>
        <TextInput
          value={hours}
          onChangeText={setHours}
          placeholder={stayType === "hour" ? "Ex: 2" : "Ex: 1, 2, 3..."}
          placeholderTextColor={COLORS.sub}
          keyboardType="numeric"
          style={styles.input}
        />

        {/* Infos entrée / sortie */}
        {checkIn && checkOut && (
          <View style={[styles.infoBox, { marginTop: 8 }]}>
            <Text style={{ color: COLORS.text }}>Entrée : {checkIn.toLocaleString()}</Text>
            <Text style={{ color: COLORS.text }}>Sortie : {checkOut.toLocaleString()}</Text>
            {remainingTime !== null && (
              <Text style={{ marginTop: 6, color: remainingTime > 0 ? COLORS.primary : COLORS.danger, fontSize: 18, fontWeight: "700" }}>
                Temps restant : {remainingTime > 0 ? formatTime(remainingTime) : "Terminé"}
              </Text>
            )}
          </View>
        )}

        {/* Montant */}
        <Text style={TYPO.label}>Montant (FG)</Text>
        <TextInput
          value={amount}
          onChangeText={t => { setIsCustomAmount(true); setAmount(t); }}
          placeholder={`Montant (auto: ${autoAmount || "0"})`}
          placeholderTextColor={COLORS.sub}
          keyboardType="numeric"
          style={styles.input}
        />

        {isCustomAmount && (
          <TouchableOpacity onPress={() => setIsCustomAmount(false)} style={[styles.btn, { backgroundColor: COLORS.border, marginTop: 6 }]}>
            <Ionicons name="refresh" size={18} color={COLORS.text} />
            <Text style={styles.btnText}>Revenir au montant automatique</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Type de séjour */}
      <Text style={TYPO.label}>Type de séjour</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={stayType} onValueChange={setStayType} style={styles.picker} itemStyle={styles.pickerItem}>
          <Picker.Item label="Heure" value="hour" />
          <Picker.Item label="Nuitée" value="night" />
        </Picker>
      </View>

      {/* Paiement */}
      <Text style={TYPO.label}>Méthode de paiement</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={paymentMethod} onValueChange={setPaymentMethod} style={styles.picker} itemStyle={styles.pickerItem}>
          <Picker.Item label="Cash" value="cash" />
          <Picker.Item label="Carte" value="card" />
          <Picker.Item label="Mobile" value="mobile" />
          <Picker.Item label="Autre" value="other" />
        </Picker>
      </View>

      {/* Bouton */}
      <TouchableOpacity onPress={handleSubmit} style={[styles.btn, { backgroundColor: COLORS.primary }]}>
        <Ionicons name="save" size={18} color="#0B1220" />
        <Text style={[styles.btnText, { color: "#0B1220", fontWeight: "800" }]}>Enregistrer</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.bg },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  input: { backgroundColor: "#0F172A", color: COLORS.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  btnText: { color: COLORS.text, marginLeft: 8, fontWeight: "700" },
  pickerBox: { backgroundColor: "#0F172A", borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, height: 44, justifyContent: "center" },
  picker: { color: COLORS.text, fontSize: 18 },
  pickerItem: { fontSize: 18, color: COLORS.text },
  infoBox: { backgroundColor: "#1E293B", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
});
