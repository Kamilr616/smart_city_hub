import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ImageBackground } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const StatisticsScreen: React.FC = () => {
  // Sample data for the charts
  const temperatureData = {
    labels: ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob', 'Niedz'],
    datasets: [
      {
        data: [24, 25, 28, 27, 26, 25, 28],
        strokeWidth: 2,
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Custom color
      },
    ],
  };

  const humidityData = {
    labels: ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob', 'Niedz'],
    datasets: [
      {
        data: [45, 50, 55, 49, 55, 45, 46],
        strokeWidth: 2,
        color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`, // Custom color
      },
    ],
  };

  const pressureData = {
    labels: ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob', 'Niedz'],
    datasets: [
      {
        data: [1010, 1012, 1011, 1013, 1013, 1014, 1011],
        strokeWidth: 2,
        color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`, // Custom color
      },
    ],
  };

  return (
    <ImageBackground source={require('../assets/blue.jpg')} style={styles.background}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Statystyki</Text>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Temperature (°C)</Text>
          <LineChart
            data={temperatureData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Wilgotność (%)</Text>
          <LineChart
            data={humidityData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Ciśnienie (hPa)</Text>
          <LineChart
            data={pressureData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const chartConfig = {
  backgroundColor: '#000000',
  backgroundGradientFrom: '#000000',
  backgroundGradientTo: '#000000',
  decimalPlaces: 1, // optional, defaults to 2dp
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#ffa726',
  },
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: 30,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default StatisticsScreen;
