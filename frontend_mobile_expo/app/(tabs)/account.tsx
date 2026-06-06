import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#0B1220", card: "#121A2A", text: "#E5E7EB",
  sub: "#9CA3AF", primary: "#10B981", danger: "#EF4444",
  border: "#27324A",
};

export default function AccountScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="person-circle-outline" size={80} color={COLORS.primary} />
        <Text style={styles.username}>Bonjour, {user?.username || "Utilisateur"}</Text>
        <Text style={styles.role}>{user?.role || "Rôle: Utilisateur"}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: "center", justifyContent: "center", padding: 20,
  },
  card: {
    backgroundColor: COLORS.card, padding: 24, borderRadius: 16,
    alignItems: "center", marginBottom: 40, width: "100%",
    borderWidth: 1, borderColor: COLORS.border,
  },
  username: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginTop: 10 },
  role:     { fontSize: 16, color: COLORS.sub, marginTop: 4 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.danger, paddingVertical: 14,
    paddingHorizontal: 24, borderRadius: 12, width: "100%",
    justifyContent: "center",
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },
});
