import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { useAuth } from '../context/AuthContext';

// ===== Header Component =====
const Header = ({ isAuthenticated, logout, router, colorScheme }: any) => {
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Oui', onPress: logout },
      ]
    );
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <MaterialCommunityIcons name="home" size={30} color={colors.tint} />
      <Text style={[styles.logo, { color: colors.text }]}>The Vibes Résidence</Text>
      {isAuthenticated ? (
        <TouchableOpacity style={styles.loginButton} onPress={handleLogout}>
          <Text style={styles.loginText}>Déconnexion</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginText}>Se connecter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ===== Banner Component =====
const Banner = () => (
  <View style={styles.banner}>
    <Image
      source={{ uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c' }}
      style={styles.bannerImage}
      resizeMode="cover"
    />
    <View style={styles.overlay}>
      <Text style={styles.welcomeTitle}>Bienvenue à The Vibes</Text>
      <Text style={styles.subtitle}>Suivi 24h/24 des transactions et chambres.</Text>
    </View>
  </View>
);

// ===== Card Component =====
const Card = ({ title, value }: { title: string; value: string }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardText}>{value}</Text>
  </View>
);

// ===== HomePage =====
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header isAuthenticated={isAuthenticated} logout={logout} router={router} colorScheme={colorScheme} />
        <Banner />

      
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  logo: { fontSize: 22, fontWeight: 'bold' },
  loginButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  loginText: { color: '#fff', fontWeight: '600' },

  // Banner
  banner: { position: 'relative', height: 200, marginTop: 10 },
  bannerImage: { width: '100%', height: '100%', borderRadius: 10 },
  overlay: {
    position: 'absolute',
    top: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 15,
  },
  welcomeTitle: { fontSize: 26, color: '#fff', fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#eee' },

  // Cards
  cardsContainer: { padding: 20, gap: 15 },
  card: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardText: { fontSize: 14, color: '#444' },
});