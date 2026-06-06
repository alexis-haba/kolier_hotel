import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ResidenceProvider } from '../context/ResidenceContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ResidenceProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>
      </ResidenceProvider>
    </AuthProvider>
  );
}