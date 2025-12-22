import React, { useEffect, useState } from "react";
import ProgressCircle from "../../components/ProgressCircle";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Vibration,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import { loadTimers, saveTimers } from "../../utils/timerManager";
import { Audio } from "expo-av";

const COLORS = {
  bg: "#0B1220",
  card: "#121A2A",
  text: "#E5E7EB",
  sub: "#9CA3AF",
  primary: "#10B981",
  border: "#27324A",
  red: "#EF4444",
  yellow: "#F59E0B",
};

const TYPO = StyleSheet.create({
  h1: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginRight: 8 },
});

type Room = {
  _id: string;
  number: string;
  state: "free" | "occupied" | "cleaning";
};

type TimerMap = {
  [roomId: string]: {
    endTime: number;
    duration: number;
  };
};

type AlarmMap = {
  [roomId: string]: {
    sound: Audio.Sound | null;
  };
};

const formatRemainingCompact = (ms: number) => {
  const h = Math.floor(ms / 1000 / 3600);
  const m = Math.floor((ms / 1000 / 60) % 60);
  const s = Math.floor((ms / 1000) % 60);

  if (h > 0) return `${h}:${m}:${s}`;
  if (m > 0) return `${m}:${s}`;
  return `${s}`;
};

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [timers, setTimers] = useState<TimerMap>({});
  const [activeAlarms, setActiveAlarms] = useState<AlarmMap>({});

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await api.get("/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);

      const stored = await loadTimers();
      setTimers(stored);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de charger les chambres");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 🔥 Fonction qui stoppe toutes les alarmes existantes
  const stopAllAlarms = async () => {
    for (const roomId of Object.keys(activeAlarms)) {
      const alarm = activeAlarms[roomId];
      try {
        alarm.sound?.setOnPlaybackStatusUpdate(null);
        await alarm.sound?.stopAsync();
        await alarm.sound?.unloadAsync();
      } catch {}
    }
    Vibration.cancel();
    setActiveAlarms({});
  };

  // 🔥 Fonction qui joue l'alarme pour une chambre
  const playAlarm = async (roomId: string, roomNumber: string) => {
    // Stoppe les anciennes alarmes avant de commencer
    await stopAllAlarms();

    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/alarm.mp3")
      );

      const loop = async () => {
        await sound.replayAsync();
      };

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
          } catch {}

          Vibration.cancel();
          setActiveAlarms({});

          // ⛔ SUPPRESSION DU TIMER (IMPORTANT)
          const stored = await loadTimers();
          const updatedTimers = { ...stored };
          delete updatedTimers[roomId];
          saveTimers(updatedTimers);
          setTimers(updatedTimers);

          // 🔁 MISE À JOUR DE L’ÉTAT
          const token = await AsyncStorage.getItem("token");
          await api.put(
            `/rooms/${roomId}`,
            { state: "free" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          load();
        }
      });


      await sound.playAsync();
      Vibration.vibrate([500, 500], true);

      setActiveAlarms({ [roomId]: { sound } });

      Alert.alert(
        "Temps écoulé",
        `Le séjour de la chambre ${roomNumber} est terminé.`,
        [
          {
            text: "OK",
            onPress: async () => {
              try {
                sound.setOnPlaybackStatusUpdate(null);
                await sound.stopAsync();
                await sound.unloadAsync();
              } catch {}

              Vibration.cancel();
              setActiveAlarms({});

              const token = await AsyncStorage.getItem("token");
              await api.put(
                `/rooms/${roomId}`,
                { state: "free" },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              const stored = await loadTimers();
              const updatedTimers = { ...stored };
              delete updatedTimers[roomId];
              saveTimers(updatedTimers);
              setTimers(updatedTimers);

              load();
            },
          },
        ]
      );
    } catch (e) {
      console.log("Erreur alarme :", e);
    }
  };

  // Vérifie les timers chaque seconde
  useEffect(() => {
    const interval = setInterval(async () => {
      const stored = await loadTimers();
      const updatedTimers: TimerMap = { ...stored };

      for (const roomId of Object.keys(updatedTimers)) {
        const timer = updatedTimers[roomId];
        const timeLeft = timer.endTime - Date.now();

        if (timeLeft <= 0 && !activeAlarms[roomId]) {
          const roomNumber = rooms.find((r) => r._id === roomId)?.number || "";
          playAlarm(roomId, roomNumber);
          break; // ⚡ on ne joue qu’une alarme à la fois
        }
      }

      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [rooms, activeAlarms]);

  const cycleState = (s: Room["state"]) =>
    s === "free" ? "occupied" : s === "occupied" ? "cleaning" : "free";

  const updateRoom = (room: Room) => {
    const next = cycleState(room.state);

    const doUpdate = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        await api.put(
          `/rooms/${room._id}`,
          { state: next },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setRooms((prev) =>
          prev.map((r) => (r._id === room._id ? { ...r, state: next } : r))
        );

        setTimers((prev) => {
          const updated = { ...prev };
          if (next === "occupied") {
            const duration = 2 * 1000;
            updated[room._id] = { endTime: Date.now() + duration, duration };
          }
          if (room.state === "occupied" && next !== "occupied") {
            delete updated[room._id];
          }
          saveTimers(updated);
          return updated;
        });
      } catch {
        Alert.alert("Erreur", "Mise à jour impossible");
      }
    };

    if (room.state === "occupied") {
      Alert.alert("Confirmer", "Cette chambre est occupée. Changer l'état ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Oui", style: "destructive", onPress: doUpdate },
      ]);
      return;
    }

    doUpdate();
  };

  const badgeStyle = (state: Room["state"]) => ({
    backgroundColor:
      state === "free"
        ? "rgba(16,185,129,0.15)"
        : state === "occupied"
        ? "rgba(239,68,68,0.15)"
        : "rgba(245,158,11,0.15)",
    color:
      state === "free"
        ? COLORS.primary
        : state === "occupied"
        ? COLORS.red
        : COLORS.yellow,
  });

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={rooms}
      keyExtractor={(i) => i._id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load().finally(() => setRefreshing(false));
          }}
        />
      }
      renderItem={({ item }) => {
        const timer = timers[item._id];

        let timeLeftMs = 0;
        let progress = 0;
        let timeText = null;

        if (timer) {
          timeLeftMs = Math.max(timer.endTime - Date.now(), 0);
          progress = timeLeftMs / timer.duration;
          timeText = formatRemainingCompact(timeLeftMs);
        }

        return (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={TYPO.h1}>Chambre {item.number}</Text>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: badgeStyle(item.state).backgroundColor },
                ]}
              >
                <Text
                  style={{
                    color: badgeStyle(item.state).color,
                    fontWeight: "700",
                  }}
                >
                  {item.state === "free"
                    ? "Libre"
                    : item.state === "occupied"
                    ? "Occupée"
                    : "En nettoyage"}
                </Text>
              </View>

              {item.state === "occupied" && timeText && (
                <ProgressCircle progress={progress} text={timeText} size={40} />
              )}
            </View>

            <TouchableOpacity
              style={styles.action}
              onPress={() => updateRoom(item)}
            >
              <Ionicons name="repeat" size={18} color={COLORS.text} />
              <Text
                style={{
                  color: COLORS.text,
                  marginLeft: 6,
                  fontWeight: "600",
                }}
              >
                Changer
              </Text>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.bg },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    alignSelf: "flex-start",
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
