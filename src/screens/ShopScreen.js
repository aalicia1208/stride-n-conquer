import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { TEAMS, BLIND_BOX_COST, PET_OPTIONS } from '../utils/constants';


export default function ShopScreen() {
  const { state, buyBlindBox, setActivePet } = useGame();
  const [revealedPet, setRevealedPet] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const shakeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];

  const team = state.player ? TEAMS[state.player.team] : null;

  const handleBuyBlindBox = () => {
    if (state.playerTokens < BLIND_BOX_COST) {
      Alert.alert(
        'Not Enough Tokens!',
        `You need ${BLIND_BOX_COST} tokens. You have ${state.playerTokens}.`
      );
      return;
    }

    setIsOpening(true);
    setRevealedPet(null);

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start(() => {
      // Scale pop
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const pet = buyBlindBox();
      if (pet) {
        setRevealedPet(pet);
      }
      setIsOpening(false);
    });
  };

  const handleSetActive = (pet) => {
    setActivePet(pet);
    Alert.alert('Pet Equipped!', `${pet.icon} ${pet.name} will now follow you on the map!`);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'rare': return '#AA44FF';
      default: return '#888';
    }
  };

  const getRarityLabel = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'LEGENDARY';
      case 'rare': return 'RARE';
      default: return 'COMMON';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pet Shop</Text>
      <Text style={styles.subtitle}>
        {'\u{1FA99}'} {state.playerTokens} tokens
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Blind Box Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blind Box</Text>
          <Text style={styles.sectionDesc}>
            Open a mystery box to get a pet companion that follows you on the map!
          </Text>

          <Animated.View
            style={[
              styles.blindBox,
              {
                borderColor: team?.color || '#888',
                transform: [
                  { translateX: shakeAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {revealedPet ? (
              <View style={styles.revealContainer}>
                {revealedPet.image ? (
                  <Image source={revealedPet.image} style={styles.revealImage} />
                ) : (
                  <Text style={styles.revealIcon}>{revealedPet.icon}</Text>
                )}
                <Text style={styles.revealName}>{revealedPet.name}</Text>
                <Text
                  style={[
                    styles.revealRarity,
                    { color: getRarityColor(revealedPet.rarity) },
                  ]}
                >
                  {getRarityLabel(revealedPet.rarity)}
                </Text>
              </View>
            ) : (
              <View style={styles.boxClosed}>
                <Text style={styles.boxIcon}>{'?'}</Text>
                <Text style={styles.boxLabel}>Mystery Pet</Text>
              </View>
            )}
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.buyButton,
              { backgroundColor: team?.color || '#e94560' },
              state.playerTokens < BLIND_BOX_COST && styles.buyButtonDisabled,
            ]}
            onPress={handleBuyBlindBox}
            disabled={isOpening || state.playerTokens < BLIND_BOX_COST}
          >
            <Text style={styles.buyButtonText}>
              {isOpening ? 'Opening...' : `Open Box - ${BLIND_BOX_COST} tokens`}
            </Text>
          </TouchableOpacity>

          {/* Possible pets */}
          <View style={styles.possiblePets}>
            <Text style={styles.possibleTitle}>Possible Pets:</Text>
            <View style={styles.petGrid}>
              {PET_OPTIONS.map((pet) => (
                <View key={pet.id} style={styles.possiblePet}>
                  {pet.image ? (
                    <Image source={pet.image} style={styles.possiblePetImage} />
                  ) : (
                    <Text style={styles.possiblePetIcon}>{pet.icon}</Text>
                  )}
                  <Text style={styles.possiblePetName}>{pet.name}</Text>
                  <Text
                    style={[
                      styles.possiblePetRarity,
                      { color: getRarityColor(pet.rarity) },
                    ]}
                  >
                    {getRarityLabel(pet.rarity)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Owned Pets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Pets ({state.ownedPets.length})
          </Text>
          {state.ownedPets.length === 0 ? (
            <Text style={styles.emptyText}>
              No pets yet! Open a blind box to get your first companion.
            </Text>
          ) : (
            state.ownedPets.map((pet, i) => {
              const isActive =
                state.activePet && state.activePet.id === pet.id;
              return (
                <View key={`${pet.id}_${i}`} style={styles.ownedPetRow}>
                  {pet.image ? (
                    <Image source={pet.image} style={styles.ownedPetImage} />
                  ) : (
                    <Text style={styles.ownedPetIcon}>{pet.icon}</Text>
                  )}
                  <View style={styles.ownedPetInfo}>
                    <Text style={styles.ownedPetName}>{pet.name}</Text>
                    <Text
                      style={[
                        styles.ownedPetRarity,
                        { color: getRarityColor(pet.rarity) },
                      ]}
                    >
                      {getRarityLabel(pet.rarity)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.equipBtn,
                      isActive && { backgroundColor: '#44bb44' },
                    ]}
                    onPress={() => handleSetActive(pet)}
                  >
                    <Text style={styles.equipBtnText}>
                      {isActive ? 'Active' : 'Equip'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Drop rates */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Drop Rates</Text>
          <View style={styles.rateRow}>
            <Text style={[styles.rateLabel, { color: '#888' }]}>Common</Text>
            <View style={styles.rateBarBg}>
              <View style={[styles.rateBar, { width: '60%', backgroundColor: '#888' }]} />
            </View>
            <Text style={styles.ratePercent}>60%</Text>
          </View>
          <View style={styles.rateRow}>
            <Text style={[styles.rateLabel, { color: '#AA44FF' }]}>Rare</Text>
            <View style={styles.rateBarBg}>
              <View style={[styles.rateBar, { width: '30%', backgroundColor: '#AA44FF' }]} />
            </View>
            <Text style={styles.ratePercent}>30%</Text>
          </View>
          <View style={styles.rateRow}>
            <Text style={[styles.rateLabel, { color: '#FFD700' }]}>Legendary</Text>
            <View style={styles.rateBarBg}>
              <View style={[styles.rateBar, { width: '10%', backgroundColor: '#FFD700' }]} />
            </View>
            <Text style={styles.ratePercent}>10%</Text>
          </View>
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDesc: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  blindBox: {
    borderWidth: 3,
    borderRadius: 20,
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#0f3460',
  },
  boxClosed: {
    alignItems: 'center',
  },
  boxIcon: {
    fontSize: 60,
    color: '#fff',
    fontWeight: 'bold',
  },
  boxLabel: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 8,
  },
  revealContainer: {
    alignItems: 'center',
  },
  revealIcon: {
    fontSize: 60,
  },
  revealImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  revealName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  revealRarity: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 2,
  },
  buyButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.4,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  possiblePets: {
    marginTop: 20,
  },
  possibleTitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
  },
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  possiblePet: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '47%',
  },
  possiblePetIcon: {
    fontSize: 30,
  },
  possiblePetImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  possiblePetName: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  possiblePetRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 1,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  ownedPetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  ownedPetIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  ownedPetImage: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
    marginRight: 12,
  },
  ownedPetInfo: {
    flex: 1,
  },
  ownedPetName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ownedPetRarity: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  equipBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  equipBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rateLabel: {
    width: 80,
    fontSize: 13,
    fontWeight: '600',
  },
  rateBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: '#0f3460',
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  rateBar: {
    height: '100%',
    borderRadius: 6,
  },
  ratePercent: {
    color: '#aaa',
    fontSize: 13,
    width: 36,
    textAlign: 'right',
  },
});
