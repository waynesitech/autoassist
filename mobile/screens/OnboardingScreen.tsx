import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Instant Towing Service",
    description: "Breakdowns happen. We're here 24/7 with professional towing and recovery across the nation.",
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800",
    icon: "car",
    color: "#f97316",
  },
  {
    title: "AI Vehicle Quotation",
    description: "Get smart valuations for your vehicle in seconds using our advanced Gemini AI vision analysis.",
    image: "https://images.unsplash.com/photo-1517026575980-3e1e2dedeab4?auto=format&fit=crop&q=80&w=800",
    icon: "sparkles",
    color: "#3b82f6",
  },
  {
    title: "Premium Parts Shop",
    description: "Browse thousands of genuine automotive parts and accessories with doorstep delivery.",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800",
    icon: "construct",
    color: "#a855f7",
  }
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current === slides.length - 1) {
      onComplete();
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: slides[current].image }} style={styles.image} />
        <LinearGradient
          colors={['transparent', '#020617']}
          style={styles.gradient}
        />
        <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconBox, { backgroundColor: slides[current].color }]}>
            <Ionicons name={slides[current].icon as any} size={48} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>{slides[current].title}</Text>
        <Text style={styles.description}>{slides[current].description}</Text>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.paginationDot,
                  i === current && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.buttons}>
            {current > 0 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrent(current - 1)}
              >
                <Ionicons name="arrow-back" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.nextButton} onPress={next}>
              <Text style={styles.nextButtonText}>
                {current === slides.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <Ionicons
                name={current === slides.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
                size={20}
                color="#020617"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  imageContainer: {
    height: '45%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  skipButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBox: {
    width: 112,
    height: 112,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  footer: {
    gap: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e293b',
  },
  paginationDotActive: {
    width: 48,
    backgroundColor: '#f97316',
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
  },
  backButton: {
    width: 64,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  nextButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#020617',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default OnboardingScreen;
