import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { TEAMS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { joinTeam } = useGame();
  const [name, setName] = useState('');
  const [step, setStep] = useState(0);
  const [assignedTeam, setAssignedTeam] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handleStart = () => {
    if (name.trim().length < 2) return;
    // Randomly assign team
    const teamKeys = Object.keys(TEAMS);
    const randomTeam = teamKeys[Math.floor(Math.random() * teamKeys.length)];
    setAssignedTeam(randomTeam);
    setStep(1);
  };

  const handleJoin = () => {
    joinTeam(name.trim(), assignedTeam);
  };

  if (step === 0) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Stride 'n Conquer</Text>
        <Text style={styles.subtitle}>
          Walk. Run. Bike.{'\n'}Make the world your color!
        </Text>

        <View style={styles.teamPreview}>
          {Object.entries(TEAMS).map(([key, team]) => (
            <View key={key} style={[styles.teamDot, { backgroundColor: team.color }]}>
              <Text style={styles.teamEmoji}>{team.emoji}</Text>
            </View>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          maxLength={20}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, name.trim().length < 2 && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={name.trim().length < 2}
        >
          <Text style={styles.buttonText}>Join the Battle</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Teams are randomly assigned for fair competition
        </Text>
      </Animated.View>
    );
  }

  const team = TEAMS[assignedTeam];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Welcome, {name}!</Text>

      <View style={[styles.teamReveal, { borderColor: team.color }]}>
        <Text style={styles.teamRevealEmoji}>{team.emoji}</Text>
        <Text style={[styles.teamName, { color: team.color }]}>
          Team {team.name}
        </Text>
      </View>

      <Text style={styles.subtitle}>
        You've been drafted to Team {team.name}!
      </Text>

      <View style={styles.rules}>
        <Text style={styles.ruleTitle}>How to Play:</Text>
        <Text style={styles.rule}>1. Walk, run, or bike to draw your path</Text>
        <Text style={styles.rule}>2. Circle back to your team's territory</Text>
        <Text style={styles.rule}>3. The enclosed area becomes your team's!</Text>
        <Text style={styles.rule}>4. Circle landmarks to claim bonus tokens</Text>
        <Text style={styles.rule}>5. Collect tokens for pet blind boxes</Text>
        <Text style={styles.rule}>
          Speed limit: 12 mph (no cars allowed!)
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: team.color }]}
        onPress={handleJoin}
      >
        <Text style={styles.buttonText}>Let's Go!</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  teamPreview: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 12,
  },
  teamDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamEmoji: {
    fontSize: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#16213e',
    color: '#fff',
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  hint: {
    color: '#666',
    fontSize: 13,
  },
  teamReveal: {
    borderWidth: 3,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  teamRevealEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  rules: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  ruleTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rule: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
});
