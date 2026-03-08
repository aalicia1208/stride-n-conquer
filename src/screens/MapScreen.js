import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import MapView, { Polygon, Polyline, Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useGame } from '../context/GameContext';
import { TEAMS, SPEED_LIMIT_MPH, MAP_INITIAL_REGION } from '../utils/constants';
import { getSpeed, getDistance, isPointInPolygon } from '../utils/geo';

const { width, height } = Dimensions.get('window');
const TOKEN_COLLECT_RADIUS = 30; // meters

// --- Smart Path: Nearest-neighbor route optimizer ---
function optimizeRoute(start, points) {
  if (points.length === 0) return [];
  const remaining = [...points];
  const route = [];
  let current = start;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = getDistance(
        current.latitude, current.longitude,
        remaining[i].coordinate.latitude, remaining[i].coordinate.longitude
      );
      // Weight by value: higher value POIs get a distance discount
      const weight = 1 - (remaining[i].priority || 0) * 0.3;
      if (d * weight < nearestDist) {
        nearestDist = d * weight;
        nearestIdx = i;
      }
    }
    route.push(remaining[nearestIdx]);
    current = remaining[nearestIdx].coordinate;
    remaining.splice(nearestIdx, 1);
  }

  // 2-opt improvement pass
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        const a = i === 0 ? start : route[i - 1].coordinate;
        const b = route[i].coordinate;
        const c = route[j].coordinate;
        const d = j + 1 < route.length ? route[j + 1].coordinate : route[route.length - 1].coordinate;

        const currentDist =
          getDistance(a.latitude, a.longitude, b.latitude, b.longitude) +
          getDistance(c.latitude, c.longitude, d.latitude, d.longitude);
        const newDist =
          getDistance(a.latitude, a.longitude, c.latitude, c.longitude) +
          getDistance(b.latitude, b.longitude, d.latitude, d.longitude);

        if (newDist < currentDist) {
          const reversed = route.slice(i, j + 1).reverse();
          route.splice(i, j + 1 - i, ...reversed);
          improved = true;
        }
      }
    }
  }

  return route;
}

// Make a color neon/bright
function neonColor(hex) {
  const neonMap = {
    '#FF4444': '#FF1A5E',
    '#44BB44': '#39FF14',
    '#4488FF': '#00D4FF',
    '#FFBB33': '#FFE500',
    '#AA44FF': '#BF00FF',
  };
  return neonMap[hex] || '#00FFFF';
}

export default function MapScreen() {
  const {
    state,
    startDrawing,
    addPathPoint,
    completeTerritoryCapture,
    claimLandmark,
    collectToken,
    dispatch,
  } = useGame();

  const mapRef = useRef(null);
  const locationSub = useRef(null);
  const lastPoint = useRef(null);
  const locationBuffer = useRef([]);
  const [userLocation, setUserLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Smart Path state
  const [smartPath, setSmartPath] = useState(null); // array of POI stops
  const [smartPathCoords, setSmartPathCoords] = useState([]); // polyline coords
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStopIdx, setCurrentStopIdx] = useState(-1);
  const [showPathCard, setShowPathCard] = useState(false);
  const animTimerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Walking mode state
  const [isWalkingPath, setIsWalkingPath] = useState(false);
  const [walkingStopIdx, setWalkingStopIdx] = useState(0);
  const [walkedCoords, setWalkedCoords] = useState([]); // trail behind user
  const [nextStopDist, setNextStopDist] = useState(null);

  // Smooth GPS coordinates using a rolling average of recent points
  const smoothLocation = (coord) => {
    const buffer = locationBuffer.current;
    buffer.push(coord);
    if (buffer.length > 5) buffer.shift();
    const avg = buffer.reduce(
      (acc, pt) => ({
        latitude: acc.latitude + pt.latitude / buffer.length,
        longitude: acc.longitude + pt.longitude / buffer.length,
      }),
      { latitude: 0, longitude: 0 }
    );
    return { ...coord, latitude: avg.latitude, longitude: avg.longitude };
  };

  // Request location permissions and start tracking
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Stride \'n Conquer needs location access to track your movement!'
        );
        return;
      }

      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (location) => {
          if (!mounted) return;

          // Ignore inaccurate GPS readings (accuracy > 20 meters)
          if (location.coords.accuracy && location.coords.accuracy > 20) return;

          const rawCoord = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
          };

          const coord = smoothLocation(rawCoord);

          setUserLocation(coord);
          dispatch({ type: 'UPDATE_LOCATION', payload: { latitude: coord.latitude, longitude: coord.longitude } });

          // Calculate speed
          if (lastPoint.current) {
            const speed = getSpeed(lastPoint.current, coord);
            const speedMph = speed * 2.23694;
            dispatch({ type: 'UPDATE_SPEED', payload: speedMph });

            // Speed is tracked but does not break the line
          }

          lastPoint.current = coord;

          // Auto-add points when drawing
          if (state.isDrawing && !state.lineBreak) {
            addPathPoint(coord);
          }

          // Track walking path progress
          if (isWalkingPath && smartPath && walkingStopIdx < smartPath.length) {
            setWalkedCoords((prev) => [...prev, { latitude: coord.latitude, longitude: coord.longitude }]);
            const target = smartPath[walkingStopIdx];
            const distToStop = getDistance(
              coord.latitude, coord.longitude,
              target.coordinate.latitude, target.coordinate.longitude
            );
            setNextStopDist(Math.round(distToStop));

            // Reached the stop (within 30m)
            if (distToStop < 30) {
              const nextIdx = walkingStopIdx + 1;
              if (nextIdx >= smartPath.length) {
                // Finished the whole path
                Alert.alert('Path Complete!', 'You finished the Smart Explore loop!');
                stopWalkingPath();
              } else {
                setWalkingStopIdx(nextIdx);
                setCurrentStopIdx(nextIdx);
                // Pan to next stop
                if (mapRef.current) {
                  mapRef.current.fitToCoordinates(
                    [coord, smartPath[nextIdx].coordinate],
                    { edgePadding: { top: 120, right: 60, bottom: 250, left: 60 }, animated: true }
                  );
                }
              }
            }
          }

          // Check for token collection
          checkTokenCollection(coord);
        }
      );
    })();

    return () => {
      mounted = false;
      if (locationSub.current) {
        locationSub.current.remove();
      }
    };
  }, [state.isDrawing, state.lineBreak]);

  // Handle focus from other screens (e.g., tapping a landmark in Discover)
  useEffect(() => {
    if (state.focusMapCoordinate && mapRef.current && mapReady) {
      mapRef.current.animateToRegion({
        latitude: state.focusMapCoordinate.latitude,
        longitude: state.focusMapCoordinate.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 800);
      dispatch({ type: 'CLEAR_MAP_FOCUS' });
    }
  }, [state.focusMapCoordinate, mapReady]);

  const checkTokenCollection = useCallback(
    (coord) => {
      state.tokens.forEach((token) => {
        if (token.collected) return;
        const dist = getDistance(
          coord.latitude,
          coord.longitude,
          token.coordinate.latitude,
          token.coordinate.longitude
        );
        if (dist < TOKEN_COLLECT_RADIUS) {
          collectToken(token.id);
        }
      });
    },
    [state.tokens, collectToken]
  );

  const handleStartDrawing = () => {
    if (!userLocation) {
      Alert.alert('Waiting for GPS', 'Please wait for your location to be found.');
      return;
    }
    startDrawing();
    addPathPoint(userLocation);
  };

  const handleCompleteTerritoryCapture = () => {
    if (state.currentPath.length < 4) {
      Alert.alert('Too Small', 'You need to draw a larger area to claim territory!');
      return;
    }

    // Check if path returns to base (team territory)
    const lastPt = state.currentPath[state.currentPath.length - 1];
    const isBackAtBase = state.territories.some(
      (t) =>
        t.team === state.player.team &&
        isPointInPolygon(lastPt, t.polygon)
    );

    // For first territory or if near start point, allow claim
    const firstPt = state.currentPath[0];
    const distToStart = getDistance(
      lastPt.latitude,
      lastPt.longitude,
      firstPt.latitude,
      firstPt.longitude
    );

    const teamTerritories = state.territories.filter(
      (t) => t.team === state.player.team
    );

    if (!isBackAtBase && teamTerritories.length > 0 && distToStart > 50) {
      Alert.alert(
        'Return to Base!',
        'You must return to your team\'s territory (colored area) to claim new land!'
      );
      return;
    }

    const newTerritory = {
      id: `territory_${Date.now()}`,
      team: state.player.team,
      claimedBy: state.player.name,
      claimedAt: Date.now(),
      polygon: [...state.currentPath],
    };

    completeTerritoryCapture(newTerritory);

    // Check if any landmarks are now enclosed
    state.landmarks.forEach((lm) => {
      if (!lm.claimed && isPointInPolygon(lm.coordinate, newTerritory.polygon)) {
        claimLandmark(lm.id, state.player.team);
        Alert.alert(
          'Landmark Claimed!',
          `You claimed ${lm.name} for Team ${TEAMS[state.player.team].name}! +${lm.tokens} tokens`
        );
      }
    });
  };

  // --- Smart Path ---
  // Fetch walking route from OSRM (follows real sidewalks/paths)
  const fetchWalkingRoute = async (waypoints) => {
    try {
      const coordStr = waypoints
        .map((p) => `${p.longitude},${p.latitude}`)
        .join(';');
      const url = `https://router.project-osrm.org/route/v1/foot/${coordStr}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));
      }
    } catch (e) {
      console.warn('OSRM routing failed, using straight lines:', e);
    }
    // Fallback to straight lines
    return waypoints;
  };

  const generateSmartPath = async () => {
    if (!userLocation) {
      Alert.alert('Waiting for GPS', 'Please wait for your location to be found.');
      return;
    }

    // Gather all POIs: unclaimed landmarks, uncollected tokens, community landmarks
    const pois = [];

    state.landmarks.forEach((lm) => {
      if (!lm.claimed) {
        pois.push({
          id: `lm_${lm.id}`,
          name: lm.name,
          type: 'landmark',
          icon: '📍',
          detail: lm.description,
          reward: `${lm.tokens} tokens`,
          coordinate: lm.coordinate,
          priority: 1.0,
        });
      }
    });

    state.tokens.filter((t) => !t.collected).forEach((tk) => {
      pois.push({
        id: `tk_${tk.id}`,
        name: `Token (${tk.value})`,
        type: 'token',
        icon: '🪙',
        detail: `Worth ${tk.value} tokens`,
        reward: `${tk.value} tokens`,
        coordinate: tk.coordinate,
        priority: tk.value >= 15 ? 0.8 : 0.4,
      });
    });

    state.communityLandmarks
      .filter((cl) => cl.status === 'approved')
      .forEach((cl) => {
        pois.push({
          id: `cl_${cl.id}`,
          name: cl.name,
          type: 'community',
          icon: '🏘️',
          detail: cl.description,
          reward: 'Community spot',
          coordinate: cl.coordinate,
          priority: 0.6,
        });
      });

    if (pois.length === 0) {
      Alert.alert('No POIs Found', 'All landmarks are claimed and tokens collected!');
      return;
    }

    // Filter to nearby POIs only (within ~1.5km / ~15 min walk)
    const MAX_RANGE = 1000; // meters
    const nearby = pois
      .map((p) => ({
        ...p,
        dist: getDistance(
          userLocation.latitude, userLocation.longitude,
          p.coordinate.latitude, p.coordinate.longitude
        ),
      }))
      .filter((p) => p.dist < MAX_RANGE)
      .sort((a, b) => {
        // Sort by priority-weighted distance (landmarks first, then close tokens)
        const aScore = a.dist * (1 - a.priority * 0.5);
        const bScore = b.dist * (1 - b.priority * 0.5);
        return aScore - bScore;
      });

    // If nothing nearby, just pick the single closest POI
    if (nearby.length === 0) {
      const closest = pois
        .map((p) => ({
          ...p,
          dist: getDistance(
            userLocation.latitude, userLocation.longitude,
            p.coordinate.latitude, p.coordinate.longitude
          ),
        }))
        .sort((a, b) => a.dist - b.dist)[0];
      nearby.push(closest);
    }

    // Cap at 3 stops max for a walkable route
    const capped = nearby.slice(0, 3);

    // Optimize route order
    const optimized = optimizeRoute(userLocation, capped);

    // Build loop route: start -> stops -> back to start
    // Fetch outbound and return legs separately so OSRM picks different roads
    const start = { latitude: userLocation.latitude, longitude: userLocation.longitude };
    const stopCoords = optimized.map((p) => p.coordinate);

    // Outbound: start -> all stops
    const outboundWaypoints = [start, ...stopCoords];
    const outboundCoords = await fetchWalkingRoute(outboundWaypoints);

    // Return: last stop -> offset via point -> start
    // Add a via point offset perpendicular to the direct line so OSRM picks a different road
    const lastStop = stopCoords[stopCoords.length - 1];
    const midLat = (lastStop.latitude + start.latitude) / 2;
    const midLng = (lastStop.longitude + start.longitude) / 2;
    const dLat = start.latitude - lastStop.latitude;
    const dLng = start.longitude - lastStop.longitude;
    // Offset perpendicular to the direct line (~100m equivalent)
    const offsetAmount = 0.001;
    const viaPoint = {
      latitude: midLat + dLng * offsetAmount / (Math.abs(dLng) + Math.abs(dLat) + 0.0001) * 10,
      longitude: midLng - dLat * offsetAmount / (Math.abs(dLng) + Math.abs(dLat) + 0.0001) * 10,
    };
    const returnCoords = await fetchWalkingRoute([lastStop, viaPoint, start]);

    // Combine outbound + return (skip first point of return to avoid duplicate)
    const walkingCoords = [
      ...outboundCoords,
      ...returnCoords.slice(1),
    ];

    // Add a "Return" stop for the animation
    const optimizedWithReturn = [
      ...optimized,
      {
        id: 'return_start',
        name: 'Back to Start',
        type: 'return',
        detail: 'Loop complete! You\'re back where you started.',
        reward: 'Loop done',
        coordinate: start,
        priority: 0,
      },
    ];

    setSmartPath(optimizedWithReturn);
    setSmartPathCoords(walkingCoords);
    setCurrentStopIdx(-1);
    setShowPathCard(true);

    // Start the flyover animation
    startPathAnimation(optimized);
  };

  const startPathAnimation = (stops) => {
    setIsAnimating(true);
    setCurrentStopIdx(-1);

    // Start pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // First, zoom out to show the whole path
    if (mapRef.current && userLocation) {
      const allCoords = [
        userLocation,
        ...stops.map((s) => s.coordinate),
      ];
      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 120, right: 60, bottom: 200, left: 60 },
        animated: true,
      });
    }

    // Then animate through each stop
    let idx = 0;
    const animateNext = () => {
      if (idx >= stops.length) {
        // End animation
        setIsAnimating(false);
        setCurrentStopIdx(-1);
        pulseAnim.stopAnimation();
        return;
      }

      setCurrentStopIdx(idx);
      const stop = stops[idx];

      // Pan to this stop
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: stop.coordinate.latitude,
          longitude: stop.coordinate.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }, 1200);
      }

      idx++;
      animTimerRef.current = setTimeout(animateNext, 2500);
    };

    // Start after the overview
    animTimerRef.current = setTimeout(animateNext, 2000);
  };

  const stopPathAnimation = () => {
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
    setIsAnimating(false);
    setCurrentStopIdx(-1);
    pulseAnim.stopAnimation();
  };

  const clearSmartPath = () => {
    stopPathAnimation();
    stopWalkingPath();
    setSmartPath(null);
    setSmartPathCoords([]);
    setShowPathCard(false);
  };

  // --- Walking mode ---
  const startWalkingPath = () => {
    if (!smartPath || !userLocation) return;
    setIsWalkingPath(true);
    setWalkingStopIdx(0);
    setWalkedCoords([{ latitude: userLocation.latitude, longitude: userLocation.longitude }]);
    setCurrentStopIdx(0);
    setShowPathCard(true);

    // Zoom to show user and next stop
    const nextStop = smartPath[0];
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [userLocation, nextStop.coordinate],
        { edgePadding: { top: 120, right: 60, bottom: 250, left: 60 }, animated: true }
      );
    }
  };

  const stopWalkingPath = () => {
    setIsWalkingPath(false);
    setWalkingStopIdx(0);
    setWalkedCoords([]);
    setNextStopDist(null);
    setCurrentStopIdx(-1);
  };

  // Cleanup animation timer on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const team = state.player ? TEAMS[state.player.team] : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={MAP_INITIAL_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
        customMapStyle={darkMapStyle}
      >
        {/* Render all territories */}
        {state.territories.map((territory) => (
          <Polygon
            key={territory.id}
            coordinates={territory.polygon}
            fillColor={TEAMS[territory.team]?.lightColor || 'rgba(128,128,128,0.3)'}
            strokeColor={TEAMS[territory.team]?.color || '#888'}
            strokeWidth={2}
          />
        ))}

        {/* Current drawing path */}
        {state.isDrawing && state.currentPath.length > 1 && (
          <Polyline
            coordinates={state.currentPath}
            strokeColor={team?.color || '#fff'}
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Landmarks */}
        {state.landmarks.map((lm) => (
          <Marker
            key={lm.id}
            coordinate={lm.coordinate}
            title={lm.name}
            description={lm.description}
            pinColor={lm.claimed ? TEAMS[lm.claimedByTeam]?.color : '#888'}
          >
            <View style={styles.landmarkMarker}>
              <Image source={require('../../assets/pin.png')} style={styles.landmarkPinImage} />
              {lm.claimed && (
                <View
                  style={[
                    styles.landmarkClaimDot,
                    { backgroundColor: TEAMS[lm.claimedByTeam]?.color },
                  ]}
                />
              )}
            </View>
          </Marker>
        ))}

        {/* Tokens on map */}
        {state.tokens
          .filter((t) => !t.collected)
          .map((token) => (
            <Marker
              key={token.id}
              coordinate={token.coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.tokenMarker}>
                <Image source={require('../../assets/token.png')} style={styles.tokenImage} />
                <Text style={styles.tokenValue}>{token.value}</Text>
              </View>
            </Marker>
          ))}

        {/* Custom user location marker with profile color */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View style={styles.userMarkerOuter}>
              <View style={[styles.userMarkerInner, { backgroundColor: state.player?.profileColor || team?.color || '#4488FF' }]}>
                <Text style={styles.userMarkerText}>
                  {state.player?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Smart Path polyline */}
        {smartPathCoords.length > 1 && (
          <>
            {/* Glow effect - wider, more transparent line behind */}
            <Polyline
              coordinates={smartPathCoords}
              strokeColor={team ? neonColor(team.color) + '40' : '#00FFFF40'}
              strokeWidth={12}
            />
            <Polyline
              coordinates={smartPathCoords}
              strokeColor={team ? neonColor(team.color) : '#00FFFF'}
              strokeWidth={4}
              lineDashPattern={[12, 6]}
            />
          </>
        )}

        {/* Walked trail (solid line showing where user has been) */}
        {isWalkingPath && walkedCoords.length > 1 && (
          <Polyline
            coordinates={walkedCoords}
            strokeColor={team ? team.color : '#fff'}
            strokeWidth={5}
          />
        )}

        {/* Smart Path stop markers */}
        {smartPath && smartPath.map((stop, idx) => (
          <Marker
            key={`sp_${idx}_${stop.id}`}
            coordinate={stop.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[
              styles.smartStopMarker,
              currentStopIdx === idx && styles.smartStopActive,
              { borderColor: team ? neonColor(team.color) : '#00FFFF' },
            ]}>
              <Text style={styles.smartStopNumber}>{idx + 1}</Text>
            </View>
          </Marker>
        ))}

        {/* Active pet following player */}
        {state.activePet && userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude + 0.00003,
              longitude: userLocation.longitude + 0.00003,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {state.activePet.image ? (
              <Image source={state.activePet.image} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
            ) : (
              <Text style={{ fontSize: 36 }}>{state.activePet.icon}</Text>
            )}
          </Marker>
        )}
      </MapView>

      {/* HUD Overlay */}
      <View style={styles.hud}>
        <View style={styles.hudRow}>
          {team && (
            <View style={[styles.teamBadge, { backgroundColor: team.color }]}>
              <Text style={styles.teamBadgeText}>
                {team.emoji} {team.name}
              </Text>
            </View>
          )}
          <View style={styles.tokenBadge}>
            <Image source={require('../../assets/token.png')} style={styles.tokenBadgeIcon} />
            <Text style={styles.tokenBadgeText}>
              {state.playerTokens}
            </Text>
          </View>
        </View>

        {/* Speed indicator */}
        <View style={styles.speedBadge}>
          <Text
            style={[
              styles.speedText,
              state.currentSpeed > SPEED_LIMIT_MPH && styles.speedExceeded,
            ]}
          >
            {state.currentSpeed.toFixed(1)} mph
          </Text>
          <Text style={styles.speedLimit}>/ {SPEED_LIMIT_MPH} max</Text>
        </View>
      </View>

      {/* Smart Path POI card */}
      {showPathCard && smartPath && currentStopIdx >= 0 && currentStopIdx < smartPath.length && (
        <View style={styles.poiCard}>
          <View style={styles.poiCardHeader}>
            <View style={[styles.poiStopBadge, { backgroundColor: team ? neonColor(team.color) : '#00FFFF' }]}>
              <Text style={styles.poiStopBadgeText}>{currentStopIdx + 1}</Text>
            </View>
            <View style={styles.poiCardInfo}>
              <Text style={styles.poiCardName}>{smartPath[currentStopIdx].name}</Text>
              <Text style={styles.poiCardType}>
                {smartPath[currentStopIdx].type === 'landmark' ? 'Landmark' :
                 smartPath[currentStopIdx].type === 'token' ? 'Token' :
                 smartPath[currentStopIdx].type === 'return' ? 'Return' : 'Community Spot'}
              </Text>
            </View>
            <View style={styles.poiRewardBadge}>
              <Text style={styles.poiRewardText}>{smartPath[currentStopIdx].reward}</Text>
            </View>
          </View>
          <Text style={styles.poiCardDetail} numberOfLines={2}>
            {smartPath[currentStopIdx].detail}
          </Text>
          <View style={styles.poiProgressBar}>
            <View style={[
              styles.poiProgressFill,
              {
                width: `${((currentStopIdx + 1) / smartPath.length) * 100}%`,
                backgroundColor: team ? neonColor(team.color) : '#00FFFF',
              },
            ]} />
          </View>
          <Text style={styles.poiProgressText}>
            Stop {currentStopIdx + 1} of {smartPath.length}
          </Text>
        </View>
      )}

      {/* Drawing controls */}
      <View style={styles.controls}>
        <View style={styles.controlsRight}>
          <TouchableOpacity style={styles.locateBtn} onPress={handleCenterOnUser}>
            <Text style={styles.locateBtnText}>{'\u{1F4CD}'}</Text>
          </TouchableOpacity>
        </View>

        {smartPath ? (
          <View style={styles.smartPathControls}>
            {isAnimating ? (
              <TouchableOpacity
                style={[styles.drawBtn, { backgroundColor: '#ff4444' }]}
                onPress={stopPathAnimation}
              >
                <Text style={styles.drawBtnText}>Stop Preview</Text>
              </TouchableOpacity>
            ) : isWalkingPath ? (
              <View style={styles.smartPathButtons}>
                <View style={[styles.walkingStatusBar, { borderColor: team ? neonColor(team.color) : '#00FFFF' }]}>
                  <Text style={styles.walkingStatusText}>
                    {nextStopDist !== null ? `${nextStopDist}m to next stop` : 'Walking...'}
                  </Text>
                  <Text style={styles.walkingStopText}>
                    Stop {walkingStopIdx + 1}/{smartPath.length}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.drawBtn, { backgroundColor: '#ff4444', flex: 1, marginLeft: 8 }]}
                  onPress={() => { stopWalkingPath(); clearSmartPath(); }}
                >
                  <Text style={styles.drawBtnText}>End</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                <View style={[styles.smartPathButtons, { marginBottom: 8 }]}>
                  <TouchableOpacity
                    style={[styles.drawBtn, { backgroundColor: 'rgba(255,255,255,0.15)', flex: 1, marginRight: 8 }]}
                    onPress={() => startPathAnimation(smartPath)}
                  >
                    <Text style={styles.drawBtnText}>Replay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.drawBtn, { backgroundColor: '#ff4444', flex: 1 }]}
                    onPress={clearSmartPath}
                  >
                    <Text style={styles.drawBtnText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.drawBtn, {
                    backgroundColor: team ? neonColor(team.color) : '#00FFFF',
                    width: '100%',
                  }]}
                  onPress={startWalkingPath}
                >
                  <Text style={[styles.drawBtnText, { color: '#000' }]}>Start Path</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : !state.isDrawing ? (
          <View style={styles.mainButtons}>
            <TouchableOpacity
              style={[styles.exploreBtn, {
                borderColor: team ? neonColor(team.color) : '#00FFFF',
                shadowColor: team ? neonColor(team.color) : '#00FFFF',
              }]}
              onPress={generateSmartPath}
            >
              <Text style={styles.exploreBtnIcon}>✨</Text>
              <Text style={[styles.exploreBtnText, { color: team ? neonColor(team.color) : '#00FFFF' }]}>
                Smart Explore
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawBtn, { backgroundColor: team?.color || '#e94560' }]}
              onPress={handleStartDrawing}
            >
              <Text style={styles.drawBtnText}>Start Claiming</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.drawingControls}>
            <TouchableOpacity
              style={[styles.drawBtn, { backgroundColor: '#44bb44' }]}
              onPress={handleCompleteTerritoryCapture}
            >
              <Text style={styles.drawBtnText}>
                Claim Area ({state.currentPath.length} pts)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawBtn, { backgroundColor: '#ff4444', marginTop: 8 }]}
              onPress={() => dispatch({ type: 'LINE_BREAK' })}
            >
              <Text style={styles.drawBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Line break warning */}
      {state.lineBreak && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            Line broken! Slow down and try again.
          </Text>
        </View>
      )}
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  hud: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  teamBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tokenBadgeIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  tokenBadgeText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  speedText: {
    color: '#44bb44',
    fontWeight: 'bold',
    fontSize: 14,
  },
  speedExceeded: {
    color: '#ff4444',
  },
  speedLimit: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  controlsRight: {
    alignSelf: 'flex-end',
  },
  locateBtn: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  locateBtnText: {
    fontSize: 22,
  },
  drawBtn: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  drawBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  drawingControls: {
    alignItems: 'center',
  },
  warningBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 130 : 110,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,68,68,0.9)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  warningText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userMarkerOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  landmarkMarker: {
    alignItems: 'center',
  },
  landmarkPinImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  landmarkClaimDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 2,
  },
  tokenMarker: {
    alignItems: 'center',
  },
  tokenImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  tokenValue: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  // Smart Path styles
  mainButtons: {
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  exploreBtnIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  exploreBtnText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  smartStopMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartStopActive: {
    transform: [{ scale: 1.4 }],
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  smartStopNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  smartPathControls: {
    width: '100%',
    alignItems: 'center',
  },
  smartPathButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  poiCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 180 : 160,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  poiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  poiStopBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  poiStopBadgeText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  poiCardInfo: {
    flex: 1,
  },
  poiCardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  poiCardType: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  poiRewardBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  poiRewardText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  poiCardDetail: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  poiProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 6,
  },
  poiProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  poiProgressText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  walkingStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
  },
  walkingStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  walkingStopText: {
    color: '#aaa',
    fontSize: 12,
  },
});
