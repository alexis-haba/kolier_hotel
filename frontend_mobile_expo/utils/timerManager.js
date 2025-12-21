// utils/timerManager.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ROOM_TIMERS";

export const loadTimers = async () => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

export const saveTimers = async (timers) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
};

export const startRoomTimer = async (roomId, endTime) => {
  const timers = await loadTimers();
  timers[roomId] = new Date(endTime).getTime();
  await saveTimers(timers);
};

export const getRemainingTime = (timestamp) => {
  const now = Date.now();
  const diff = timestamp - now;

  if (diff <= 0) return "Terminé";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  return `${hours}h ${minutes}m`;
};
