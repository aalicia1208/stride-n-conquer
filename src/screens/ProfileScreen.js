import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGame } from '../context/GameContext';
import { TEAMS } from '../utils/constants';
import { calculatePolygonArea, sqMetersToSqMiles } from '../utils/geo';

// Generate a color from team base at a given lightness (0 = dark, 1 = light)
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getTeamColorAtPosition(teamColor, position) {
  // position: 0 to 1, maps to lightness 20% to 80%
  const [h, s] = hexToHSL(teamColor);
  const lightness = 20 + position * 60; // range 20-80
  return hslToHex(h, s, lightness);
}

export default function ProfileScreen() {
  const { state, dispatch, setProfileColor } = useGame();
  const team = state.player ? TEAMS[state.player.team] : null;
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0.5);
  const barPageX = useRef(0);
  const barWidth = useRef(0);

  const handleTouch = (pageX) => {
    if (barWidth.current > 0) {
      const x = pageX - barPageX.current;
      const pos = Math.max(0, Math.min(1, x / barWidth.current));
      setSliderPosition(pos);
    }
  };

  const myTerritories = state.territories.filter(
    (t) => t.claimedBy === state.player?.name
  );
  const myClaimedLandmarks = state.landmarks.filter(
    (l) => l.claimed && l.claimedByTeam === state.player?.team
  );

  const profileColor = state.player?.profileColor || team?.color || '#888';

  const handleReset = () => {
    Alert.alert(
      'Reset Account?',
      'This will delete all your progress. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('stride_player');
            dispatch({ type: 'RESET' });
          },
        },
      ]
    );
  };

  if (!state.player) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.header, { borderBottomColor: team.color }]}>
          <TouchableOpacity onPress={() => setShowColorPicker(!showColorPicker)}>
            <View style={[styles.avatar, { backgroundColor: profileColor }]}>
              <Text style={styles.avatarText}>
                {state.player.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{state.player.name}</Text>
          <View style={[styles.teamTag, { backgroundColor: team.color }]}>
            <Text style={styles.teamTagText}>
              {team.emoji} Team {team.name}
            </Text>
          </View>

          {/* Color Picker */}
          {showColorPicker && team && (
            <View style={styles.colorPickerContainer}>
              <Text style={styles.colorPickerLabel}>Drag to pick your shade</Text>
              <View
                style={styles.gradientBar}
                onLayout={(e) => {
                  barWidth.current = e.nativeEvent.layout.width;
                  e.target.measure((_x, _y, _w, _h, px) => {
                    barPageX.current = px;
                  });
                }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) => handleTouch(e.nativeEvent.pageX)}
                onResponderMove={(e) => handleTouch(e.nativeEvent.pageX)}
              >
                {/* Render gradient segments */}
                {Array.from({ length: 20 }).map((_, i) => {
                  const pos = i / 19;
                  return (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor: getTeamColorAtPosition(team.color, pos),
                      }}
                    />
                  );
                })}
                {/* Thumb indicator */}
                <View
                  style={[
                    styles.sliderThumb,
                    {
                      left: `${sliderPosition * 100}%`,
                      backgroundColor: getTeamColorAtPosition(team.color, sliderPosition),
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={[styles.confirmColorBtn, { backgroundColor: getTeamColorAtPosition(team.color, sliderPosition) }]}
                onPress={() => {
                  setProfileColor(getTeamColorAtPosition(team.color, sliderPosition));
                  setShowColorPicker(false);
                }}
              >
                <Text style={styles.confirmColorText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{state.playerTokens}</Text>
            <Text style={styles.statLabel}>Tokens</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myTerritories.length}</Text>
            <Text style={styles.statLabel}>Territories</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myClaimedLandmarks.length}</Text>
            <Text style={styles.statLabel}>Landmarks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{state.ownedPets.length}</Text>
            <Text style={styles.statLabel}>Pets</Text>
          </View>
        </View>

        {/* Active Pet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Companion</Text>
          {state.activePet ? (
            <View style={styles.activePetRow}>
              {state.activePet.image ? (
                <Image source={state.activePet.image} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
              ) : (
                <Text style={styles.activePetIcon}>{state.activePet.icon}</Text>
              )}
              <View>
                <Text style={styles.activePetName}>{state.activePet.name}</Text>
                <Text style={styles.activePetRarity}>{state.activePet.rarity}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noPet}>
              No pet equipped. Visit the shop to get one!
            </Text>
          )}
        </View>

        {/* Personal Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Stats</Text>
          <View>
            <View style={styles.teamStatRow}>
              <Text style={styles.teamStatLabel}>My Area</Text>
              <Text style={styles.teamStatValue}>
                {sqMetersToSqMiles(
                  myTerritories.reduce((sum, t) => sum + calculatePolygonArea(t.polygon), 0)
                ).toFixed(3)} sq mi
              </Text>
            </View>
            <View style={styles.teamStatRow}>
              <Text style={styles.teamStatLabel}>Territories Claimed</Text>
              <Text style={styles.teamStatValue}>{myTerritories.length}</Text>
            </View>
            <View style={styles.teamStatRow}>
              <Text style={styles.teamStatLabel}>Landmarks Held</Text>
              <Text style={styles.teamStatValue}>{myClaimedLandmarks.length}</Text>
            </View>
            <View style={styles.teamStatRow}>
              <Text style={styles.teamStatLabel}>Tokens Earned</Text>
              <Text style={styles.teamStatValue}>{state.playerTokens}</Text>
            </View>
            <View style={styles.teamStatRow}>
              <Text style={styles.teamStatLabel}>Pets Collected</Text>
              <Text style={styles.teamStatValue}>{state.ownedPets.length}</Text>
            </View>
          </View>
        </View>

        {/* How to Play */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Play</Text>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleIcon}>{'\u{1F6B6}'}</Text>
            <Text style={styles.ruleText}>
              Walk, run, or bike to draw your path on the map
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleIcon}>{'\u{1F3E0}'}</Text>
            <Text style={styles.ruleText}>
              Return to your team's colored territory to claim the area you circled
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleIcon}>{'\u{1F3DB}'}</Text>
            <Text style={styles.ruleText}>
              Circle around landmarks (don't just walk to them) to claim them for bonus tokens
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleIcon}>{'\u{1FA99}'}</Text>
            <Text style={styles.ruleText}>
              Walk to token locations on the map to collect them automatically
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleIcon}>{'\u{1F381}'}</Text>
            <Text style={styles.ruleText}>
              Spend tokens on blind boxes in the shop to get pet companions
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleIcon}>{'\u{2694}'}</Text>
            <Text style={styles.ruleText}>
              Cutting someone's line won't break it, but the most recent claim takes priority
            </Text>
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Reset Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 2,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  username: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  teamTag: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  teamTagText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  colorPickerContainer: {
    marginTop: 16,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  colorPickerLabel: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  gradientBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 24,
    height: 48,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    marginLeft: -12,
  },
  confirmColorBtn: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  confirmColorText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  activePetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activePetIcon: {
    fontSize: 40,
  },
  activePetName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activePetRarity: {
    color: '#888',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  noPet: {
    color: '#555',
    fontSize: 14,
  },
  teamStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  teamStatLabel: {
    color: '#888',
    fontSize: 14,
  },
  teamStatValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  ruleIcon: {
    fontSize: 20,
    width: 28,
  },
  ruleText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  resetBtn: {
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#ff4444',
    fontWeight: '600',
    fontSize: 14,
  },
});
