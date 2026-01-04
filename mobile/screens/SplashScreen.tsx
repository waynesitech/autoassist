import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const SplashScreen: React.FC = () => {
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <LinearGradient
      colors={['#020617', '#1e1b4b', '#020617']}
      style={styles.container}
    >
      <Animated.View style={[styles.iconContainer, { transform: [{ translateY }] }]}>
        <View style={styles.iconBox}>
          <Ionicons name="car-sport" size={60} color="#fff" />
        </View>
      </Animated.View>
      <Text style={styles.title}>
        Auto<Text style={styles.titleAccent}>Assist</Text>
      </Text>
      <View style={styles.dots}>
        <View style={[styles.dot, { opacity: 0.5 }]} />
        <View style={[styles.dot, { opacity: 0.7 }]} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.subtitle}>Your Premium Roadside Partner</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#f97316',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
  },
  subtitle: {
    position: 'absolute',
    bottom: 48,
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(148, 163, 184, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 6,
  },
});

export default SplashScreen;
