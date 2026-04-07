import { Tabs, Redirect } from "expo-router";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#0B1220",
  card: "#121A2A",
  text: "#E5E7EB",
  sub: "#9CA3AF",
  primary: "#10B981",
  danger: "#EF4444",
  border: "#27324A",
};

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets(); // récupère les marges safe area

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg },
        headerTitleStyle: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
        headerShadowVisible: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.sub,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 60 + insets.bottom,     // adapte la hauteur
          paddingBottom: insets.bottom,  // ajoute le bon espace
          paddingTop: 6,
        },
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
          headerTitle: "Tableau de bord",
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Chambres",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bed" size={size} color={color} />,
          headerTitle: "État des chambres",
        }}
      />
      <Tabs.Screen
        name="entries"
        options={{
          title: "Entrées",
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
          headerTitle: "Entrées (Jour & Nuit)",
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Dépenses",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="receipt" size={size} color={color} />,
          headerTitle: "Dépenses",
        }}
      />
      <Tabs.Screen
        name="stay"
        options={{
          title: "Séjours",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-text-clock" size={size} color={color} />,
          headerTitle: "Séjours (Nuit)",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historique",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
          headerTitle: "Mon compte",
        }}
      />
    </Tabs>
  );
}