import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { View, Text } from 'react-native';
import * as Notifications from "expo-notifications";
import * as ScreenCapture from 'expo-screen-capture';

export default function App() {
  const router = useRouter();
  const [initialRoute, setInitialRoute] = useState('/login');

  // Autoriser l'enregistrement d'écran globalement
  useEffect(() => {
    ScreenCapture.allowScreenCaptureAsync();
  }, []);

  // Permissions notifications
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  // Vérification de l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 > Date.now()) {
            setInitialRoute('/(tabs)');
          } else {
            await AsyncStorage.removeItem('token');
            setInitialRoute('/login');
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        setInitialRoute('/login');
      }
    };
    checkAuth();
  }, []);

  // Redirection vers la route initiale
  useEffect(() => {
    if (initialRoute) router.replace(initialRoute);
  }, [initialRoute]);

  // Affichage d'un écran de chargement
  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return null;
}
