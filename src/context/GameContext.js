import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SAMPLE_TERRITORIES,
  SAMPLE_LANDMARKS,
  SAMPLE_TOKENS,
  SAMPLE_LEADERBOARD,
  SAMPLE_COMMUNITY_LANDMARKS,
} from '../data/sampleData';
import {
  TEAMS,
  PET_OPTIONS,
  BLIND_BOX_COST,
  RARITY_CHANCES,
  SPEED_LIMIT_MPH,
} from '../utils/constants';
import * as turf from '@turf/turf';
import {
  onTerritoriesChange,
  onLandmarksChange,
  onCommunityLandmarksChange,
  addTerritory as fbAddTerritory,
  removeTerritory as fbRemoveTerritory,
  updateLandmark as fbUpdateLandmark,
  addLandmark as fbAddLandmark,
  addCommunityLandmark as fbAddCommunityLandmark,
  updateCommunityLandmark as fbUpdateCommunityLandmark,
  removeCommunityLandmark as fbRemoveCommunityLandmark,
  seedInitialData,
} from '../services/firebase';

// Convert our polygon format to turf and back
function polygonToTurf(polygon) {
  const coords = polygon.map((p) => [p.longitude, p.latitude]);
  // Close the ring
  if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
    coords.push(coords[0]);
  }
  return turf.polygon([coords]);
}

function turfToPolygon(turfPoly) {
  const coords = turf.getCoords(turfPoly)[0];
  return coords.slice(0, -1).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

// Subtract newPoly from existingPoly, returns array of polygons (may split into multiple)
function subtractTerritory(existingPolygon, newPolygon) {
  try {
    const existing = polygonToTurf(existingPolygon);
    const claiming = polygonToTurf(newPolygon);
    const result = turf.difference(turf.featureCollection([existing, claiming]));
    if (!result) return []; // Fully consumed
    if (result.geometry.type === 'Polygon') {
      return [turfToPolygon(result)];
    }
    if (result.geometry.type === 'MultiPolygon') {
      return result.geometry.coordinates.map((ring) => {
        return ring[0].slice(0, -1).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
      });
    }
    return [];
  } catch {
    return [existingPolygon]; // On error, keep original
  }
}

// Union two polygons, returns array of polygons (usually 1, but may be separate if non-overlapping)
function unionTerritories(polygonA, polygonB) {
  try {
    const a = polygonToTurf(polygonA);
    const b = polygonToTurf(polygonB);
    const result = turf.union(turf.featureCollection([a, b]));
    if (!result) return [polygonA, polygonB];
    if (result.geometry.type === 'Polygon') {
      return [turfToPolygon(result)];
    }
    if (result.geometry.type === 'MultiPolygon') {
      return result.geometry.coordinates.map((ring) => {
        return ring[0].slice(0, -1).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
      });
    }
    return [polygonA, polygonB];
  } catch {
    return [polygonA, polygonB];
  }
}

// Merge all same-team territories that overlap/touch into combined polygons
function mergeSameTeamTerritories(territories, team) {
  const sameTeam = territories.filter((t) => t.team === team);
  const otherTeam = territories.filter((t) => t.team !== team);

  if (sameTeam.length <= 1) return territories;

  // Iteratively merge overlapping polygons
  let merged = [sameTeam[0]];
  for (let i = 1; i < sameTeam.length; i++) {
    let didMerge = false;
    for (let j = 0; j < merged.length; j++) {
      try {
        const a = polygonToTurf(merged[j].polygon);
        const b = polygonToTurf(sameTeam[i].polygon);
        if (turf.booleanIntersects(a, b)) {
          const unionResult = unionTerritories(merged[j].polygon, sameTeam[i].polygon);
          if (unionResult.length === 1) {
            merged[j] = { ...merged[j], polygon: unionResult[0] };
            didMerge = true;
            break;
          }
        }
      } catch {
        // If geometry check fails, skip merge
      }
    }
    if (!didMerge) {
      merged.push(sameTeam[i]);
    }
  }

  // Additional passes to catch chains (A touches B, B touches C => all merge)
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        try {
          const a = polygonToTurf(merged[i].polygon);
          const b = polygonToTurf(merged[j].polygon);
          if (turf.booleanIntersects(a, b)) {
            const unionResult = unionTerritories(merged[i].polygon, merged[j].polygon);
            if (unionResult.length === 1) {
              merged[i] = { ...merged[i], polygon: unionResult[0] };
              merged.splice(j, 1);
              changed = true;
              break;
            }
          }
        } catch {
          // skip
        }
      }
      if (changed) break;
    }
  }

  return [...otherTeam, ...merged];
}

// Merge all teams' overlapping territories
function mergeAllTeams(territories) {
  const teams = [...new Set(territories.map((t) => t.team))];
  let result = territories;
  for (const team of teams) {
    result = mergeSameTeamTerritories(result, team);
  }
  return result;
}

const GameContext = createContext();

const initialState = {
  // Player
  player: null, // { id, name, team, profileColor }
  isOnboarded: false,

  // Map & Territory
  territories: [],
  currentPath: [], // points being drawn
  isDrawing: false,
  lineBreak: false,

  // Landmarks
  landmarks: [],
  communityLandmarks: [],

  // Tokens & Economy
  tokens: [],
  playerTokens: 50,

  // Pets
  ownedPets: [],
  activePet: null,

  // Leaderboard
  leaderboard: { teams: [], players: [] },

  // Speed tracking
  currentSpeed: 0,
  speedExceeded: false,

  // Player location (from GPS)
  playerLocation: null,

  // Navigate to a coordinate on the map (set by other screens, consumed by MapScreen)
  focusMapCoordinate: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYER':
      return {
        ...state,
        player: action.payload,
        isOnboarded: true,
      };

    case 'LOAD_GAME_DATA':
      return {
        ...state,
        tokens: SAMPLE_TOKENS,
        leaderboard: SAMPLE_LEADERBOARD,
      };

    case 'SYNC_TERRITORIES':
      return {
        ...state,
        territories: action.payload,
      };

    case 'SYNC_LANDMARKS':
      return {
        ...state,
        landmarks: action.payload,
      };

    case 'SYNC_COMMUNITY_LANDMARKS':
      return {
        ...state,
        communityLandmarks: action.payload,
      };

    case 'START_DRAWING':
      return {
        ...state,
        isDrawing: true,
        lineBreak: false,
        currentPath: [],
      };

    case 'ADD_PATH_POINT':
      return {
        ...state,
        currentPath: [...state.currentPath, action.payload],
      };

    case 'LINE_BREAK':
      return {
        ...state,
        lineBreak: true,
        currentPath: [],
        isDrawing: false,
      };

    case 'COMPLETE_TERRITORY': {
      const newTerritory = action.payload;
      return {
        ...state,
        territories: [...state.territories, newTerritory],
        isDrawing: false,
        currentPath: [],
        lineBreak: false,
      };
    }

    case 'COMPLETE_TERRITORY_LOCAL':
      return {
        ...state,
        isDrawing: false,
        currentPath: [],
        lineBreak: false,
      };

    case 'UPDATE_LOCATION':
      return {
        ...state,
        playerLocation: action.payload,
      };

    case 'FOCUS_MAP_COORDINATE':
      return {
        ...state,
        focusMapCoordinate: action.payload,
      };

    case 'CLEAR_MAP_FOCUS':
      return {
        ...state,
        focusMapCoordinate: null,
      };

    case 'UPDATE_SPEED': {
      const speed = action.payload;
      return {
        ...state,
        currentSpeed: speed,
        speedExceeded: speed > SPEED_LIMIT_MPH,
      };
    }

    case 'COLLECT_TOKEN': {
      const tokenId = action.payload;
      const token = state.tokens.find((t) => t.id === tokenId);
      if (!token || token.collected) return state;
      return {
        ...state,
        tokens: state.tokens.map((t) =>
          t.id === tokenId ? { ...t, collected: true } : t
        ),
        playerTokens: state.playerTokens + (token.value || 1),
      };
    }

    case 'CLAIM_LANDMARK': {
      const { id, team } = action.payload;
      return {
        ...state,
        landmarks: state.landmarks.map((l) =>
          l.id === id ? { ...l, claimed: true, claimedByTeam: team } : l
        ),
      };
    }

    case 'RESET':
      return { ...initialState };

    case 'BUY_BLIND_BOX': {
      if (state.playerTokens < BLIND_BOX_COST) return state;
      if (!state.player) return state;

      const newPet = {
        ...action.payload,
        instanceId: `${action.payload.id}_${Date.now()}`,
        obtainedAt: new Date().toISOString(),
      };

      return {
        ...state,
        playerTokens: state.playerTokens - BLIND_BOX_COST,
        ownedPets: [...state.ownedPets, newPet],
      };
    }

    case 'SET_PROFILE_COLOR':
      return {
        ...state,
        player: { ...state.player, profileColor: action.payload },
      };

    case 'SET_ACTIVE_PET':
      return {
        ...state,
        activePet: action.payload,
      };

    case 'SUBMIT_COMMUNITY_LANDMARK': {
      const landmark = {
        ...action.payload,
        id: `community_${Date.now()}`,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      return {
        ...state,
        communityLandmarks: [...state.communityLandmarks, landmark],
      };
    }

    case 'APPROVE_COMMUNITY_LANDMARK': {
      const approveId = action.payload;
      const approvedLandmark = state.communityLandmarks.find(
        (l) => l.id === approveId
      );
      if (!approvedLandmark) return state;

      return {
        ...state,
        communityLandmarks: state.communityLandmarks.map((l) =>
          l.id === approveId ? { ...l, status: 'approved' } : l
        ),
        landmarks: [
          ...state.landmarks,
          { ...approvedLandmark, status: 'approved' },
        ],
      };
    }

    case 'REJECT_COMMUNITY_LANDMARK': {
      const rejectId = action.payload;
      return {
        ...state,
        communityLandmarks: state.communityLandmarks.filter(
          (l) => l.id !== rejectId
        ),
      };
    }

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load local game data (tokens, leaderboard) on mount
  useEffect(() => {
    dispatch({ type: 'LOAD_GAME_DATA' });
  }, []);

  // Seed Firebase with sample data if empty, then subscribe to real-time updates
  useEffect(() => {
    seedInitialData({
      territories: SAMPLE_TERRITORIES,
      landmarks: SAMPLE_LANDMARKS,
      communityLandmarks: SAMPLE_COMMUNITY_LANDMARKS,
    }).catch((err) => console.warn('Firebase seed error:', err));

    const unsubTerritories = onTerritoriesChange((territories) => {
      const merged = mergeAllTeams(territories);
      dispatch({ type: 'SYNC_TERRITORIES', payload: merged });
    });

    const unsubLandmarks = onLandmarksChange((landmarks) => {
      dispatch({ type: 'SYNC_LANDMARKS', payload: landmarks });
    });

    const unsubCommunity = onCommunityLandmarksChange((landmarks) => {
      dispatch({ type: 'SYNC_COMMUNITY_LANDMARKS', payload: landmarks });
    });

    return () => {
      unsubTerritories();
      unsubLandmarks();
      unsubCommunity();
    };
  }, []);

  // Load saved player from AsyncStorage on mount
  useEffect(() => {
    const loadPlayer = async () => {
      try {
        const saved = await AsyncStorage.getItem('stride_player');
        if (saved) {
          const player = JSON.parse(saved);
          dispatch({ type: 'SET_PLAYER', payload: player });
        }
      } catch (error) {
        console.warn('Failed to load saved player:', error);
      }
    };
    loadPlayer();
  }, []);

  // Helper functions
  const joinTeam = async (name, team) => {
    const teamKeys = Object.keys(TEAMS);
    const assignedTeam = team || teamKeys[Math.floor(Math.random() * teamKeys.length)];
    const player = {
      id: `player_${Date.now()}`,
      name,
      team: assignedTeam,
    };
    try {
      await AsyncStorage.setItem('stride_player', JSON.stringify(player));
    } catch (error) {
      console.warn('Failed to save player:', error);
    }
    dispatch({ type: 'SET_PLAYER', payload: player });
    return player;
  };

  const startDrawing = () => {
    dispatch({ type: 'START_DRAWING' });
  };

  const addPathPoint = (coordinate) => {
    dispatch({ type: 'ADD_PATH_POINT', payload: coordinate });
  };

  const completeTerritoryCapture = (territory) => {
    // Subtract new territory from overlapping other-team territories
    const updatedTerritories = [];
    const removedIds = [];
    const newFragments = [];

    state.territories.forEach((existing) => {
      if (existing.team === territory.team) {
        updatedTerritories.push(existing);
        return;
      }
      const remaining = subtractTerritory(existing.polygon, territory.polygon);
      if (remaining.length === 0) {
        // Fully consumed — remove it
        removedIds.push(existing.id);
      } else {
        // First fragment keeps original id
        updatedTerritories.push({ ...existing, polygon: remaining[0] });
        if (remaining[0] !== existing.polygon) {
          newFragments.push({ ...existing, polygon: remaining[0] });
        }
        // Additional fragments get new ids
        for (let i = 1; i < remaining.length; i++) {
          const fragment = {
            ...existing,
            id: `${existing.id}_frag_${Date.now()}_${i}`,
            polygon: remaining[i],
          };
          updatedTerritories.push(fragment);
          newFragments.push(fragment);
        }
      }
    });

    // Add new territory
    updatedTerritories.push(territory);

    // Merge overlapping same-team territories into single polygons
    const beforeMergeSameTeam = updatedTerritories.filter((t) => t.team === territory.team);
    const mergedTerritories = mergeSameTeamTerritories(updatedTerritories, territory.team);

    // Figure out which same-team territories were merged away
    const afterMergeSameTeam = mergedTerritories.filter((t) => t.team === territory.team);
    const mergedAwayIds = beforeMergeSameTeam
      .filter((t) => !afterMergeSameTeam.some((m) => m.id === t.id))
      .map((t) => t.id);

    // Update local state with all territories at once
    dispatch({ type: 'SYNC_TERRITORIES', payload: mergedTerritories });
    dispatch({ type: 'COMPLETE_TERRITORY_LOCAL' });

    // Sync to Firebase — remove consumed other-team territories
    removedIds.forEach((id) => {
      fbRemoveTerritory(id).catch((err) =>
        console.warn('Failed to remove territory:', err)
      );
    });
    // Remove same-team territories that got merged into another
    mergedAwayIds.forEach((id) => {
      fbRemoveTerritory(id).catch((err) =>
        console.warn('Failed to remove merged territory:', err)
      );
    });
    // Sync updated/new fragments for other teams
    newFragments.forEach((frag) => {
      fbAddTerritory(frag).catch((err) =>
        console.warn('Failed to sync fragment:', err)
      );
    });
    // Sync the merged same-team territories (includes the new one merged in)
    afterMergeSameTeam.forEach((t) => {
      fbAddTerritory(t).catch((err) =>
        console.warn('Failed to sync merged territory:', err)
      );
    });
  };

  const claimLandmark = (id, team) => {
    dispatch({ type: 'CLAIM_LANDMARK', payload: { id, team } });
    // Sync to Firebase
    fbUpdateLandmark(id, { claimed: true, claimedByTeam: team }).catch((err) =>
      console.warn('Failed to sync landmark:', err)
    );
  };

  const collectToken = (tokenId) => {
    dispatch({ type: 'COLLECT_TOKEN', payload: tokenId });
  };

  const buyBlindBox = () => {
    if (state.playerTokens < BLIND_BOX_COST || !state.player) return null;
    const roll = Math.random();
    let cumulative = 0;
    let selectedRarity = 'common';
    for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
      cumulative += chance;
      if (roll <= cumulative) { selectedRarity = rarity; break; }
    }
    const petsOfRarity = PET_OPTIONS.filter((p) => p.rarity === selectedRarity);
    const pool = petsOfRarity.length > 0 ? petsOfRarity : PET_OPTIONS;
    const pet = pool[Math.floor(Math.random() * pool.length)];
    dispatch({ type: 'BUY_BLIND_BOX', payload: pet });
    return pet;
  };

  const setProfileColor = async (color) => {
    dispatch({ type: 'SET_PROFILE_COLOR', payload: color });
    try {
      const saved = await AsyncStorage.getItem('stride_player');
      if (saved) {
        const player = JSON.parse(saved);
        player.profileColor = color;
        await AsyncStorage.setItem('stride_player', JSON.stringify(player));
      }
    } catch (error) {
      console.warn('Failed to save profile color:', error);
    }
  };

  const setActivePet = (pet) => {
    dispatch({ type: 'SET_ACTIVE_PET', payload: pet });
  };

  const submitLandmark = (landmarkData) => {
    const landmark = {
      ...landmarkData,
      id: `community_${Date.now()}`,
      submittedBy: state.player?.name || 'unknown',
      submittedById: state.player?.id || 'unknown',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SYNC_COMMUNITY_LANDMARKS', payload: [...state.communityLandmarks, landmark] });
    // Sync to Firebase
    fbAddCommunityLandmark(landmark).catch((err) =>
      console.warn('Failed to sync community landmark:', err)
    );
  };

  const approveLandmark = (landmarkId) => {
    const cl = state.communityLandmarks.find((l) => l.id === landmarkId);
    if (!cl) return;

    // Prevent self-approval
    if (cl.submittedById === state.player?.id) {
      Alert.alert('Cannot Approve', 'You cannot approve your own landmark. Another player must review it.');
      return;
    }

    dispatch({ type: 'APPROVE_COMMUNITY_LANDMARK', payload: landmarkId });
    // Sync community landmark status to Firebase
    fbUpdateCommunityLandmark(landmarkId, { status: 'approved' }).catch((err) =>
      console.warn('Failed to sync landmark approval:', err)
    );
    // Add to main landmarks in Firebase so it shows on the map
    const newLandmark = {
      ...cl,
      id: landmarkId,
      status: 'approved',
      tokens: 15,
      claimed: false,
      claimedByTeam: null,
      type: 'community',
    };
    fbAddLandmark(newLandmark).catch((err) =>
      console.warn('Failed to add approved landmark:', err)
    );
  };

  const rejectLandmark = (landmarkId) => {
    dispatch({ type: 'REJECT_COMMUNITY_LANDMARK', payload: landmarkId });
    fbRemoveCommunityLandmark(landmarkId).catch((err) =>
      console.warn('Failed to remove rejected landmark:', err)
    );
  };

  const value = {
    state,
    dispatch,
    joinTeam,
    startDrawing,
    addPathPoint,
    completeTerritoryCapture,
    claimLandmark,
    collectToken,
    buyBlindBox,
    setProfileColor,
    setActivePet,
    submitLandmark,
    approveLandmark,
    rejectLandmark,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export default GameContext;
