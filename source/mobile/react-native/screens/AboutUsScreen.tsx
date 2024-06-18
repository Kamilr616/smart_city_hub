import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';

const AboutUsScreen: React.FC = () => {
  return (
    <ImageBackground source={require('../assets/blue.jpg')} style={styles.background}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Aplikacja do obsługi inteligentnego miasteczka</Text>
          <Text style={styles.subtitle}>Autorzy:</Text>
          <Text style={styles.text}>Mateusz Ciszek</Text>
          <Text style={styles.text}>nr indeksu: 35191</Text>
          <Text style={styles.text}>Kamil Rataj</Text>
          <Text style={styles.text}>nr indeksu: 35712</Text>
          <Text style={styles.subtitle}>Nazwa Projektu: Inteligentne Miasteczko</Text>
          <Text style={styles.subtitle}>Opis aplikacji:</Text>
          <Text style={styles.text}>Innowacyjna aplikacja mobilna stworzona w technologii React Native, zaprojektowana do obsługi makiety inteligentnego miasteczka. Głównym celem aplikacji jest zapewnienie użytkownikom możliwości monitorowania i zarządzania infrastrukturą miejską, wykorzystując zaawansowane rozwiązania.</Text>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Adding a white overlay to make the text readable
  },
  scrollContainer: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default AboutUsScreen;
