import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGame } from '../context/GameContext';
import { TEAMS } from '../utils/constants';

export default function LandmarksScreen({ navigation }) {
  const { state, submitLandmark, approveLandmark, rejectLandmark, dispatch } = useGame();
  const [tab, setTab] = useState('discover'); // 'discover' | 'submit' | 'pending'
  const [submitName, setSubmitName] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');
  const [submitImage, setSubmitImage] = useState(null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll access to add landmark photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setSubmitImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (submitName.trim().length < 3) {
      Alert.alert('Name required', 'Please enter a landmark name (at least 3 characters).');
      return;
    }
    if (submitDesc.trim().length < 20) {
      Alert.alert('Description required', 'Please explain why this place is important (at least 20 characters).');
      return;
    }

    submitLandmark({
      name: submitName.trim(),
      description: submitDesc.trim(),
      imageUri: submitImage,
      coordinate: {
        latitude: state.playerLocation?.latitude ?? 38.9,
        longitude: state.playerLocation?.longitude ?? -77.2,
      },
    });

    Alert.alert('Submitted!', 'Your landmark request has been submitted for community review.');
    setSubmitName('');
    setSubmitDesc('');
    setSubmitImage(null);
    setTab('pending');
  };

  const handleApprove = (id) => {
    approveLandmark(id);
    Alert.alert('Approved!', 'This landmark is now active on the map.');
  };

  const handleReject = (id) => {
    Alert.alert(
      'Reject Landmark?',
      'This will remove the submission. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => rejectLandmark(id),
        },
      ]
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'historical': return '\u{1F3DB}';
      case 'nature': return '\u{1F333}';
      case 'civic': return '\u{1F3E2}';
      case 'commercial': return '\u{1F3EA}';
      default: return '\u{1F4CD}';
    }
  };

  const renderDiscover = () => (
    <View>
      <Text style={styles.sectionDesc}>
        Landmarks are invisible infrastructure around you. Walk near them to learn about local history and culture. Circle around them to claim them for your team!
      </Text>
      {state.landmarks.map((lm) => (
        <TouchableOpacity key={lm.id} style={styles.landmarkCard} onPress={() => {
          dispatch({ type: 'FOCUS_MAP_COORDINATE', payload: lm.coordinate });
          navigation.navigate('Map');
        }}>
          <View style={styles.landmarkHeader}>
            <Text style={styles.landmarkTypeIcon}>{getTypeIcon(lm.type)}</Text>
            <View style={styles.landmarkHeaderInfo}>
              <Text style={styles.landmarkName}>{lm.name}</Text>
              <Text style={styles.landmarkType}>{lm.type}</Text>
            </View>
            {lm.claimed ? (
              <View style={[styles.claimedBadge, { backgroundColor: TEAMS[lm.claimedByTeam]?.color }]}>
                <Text style={styles.claimedText}>
                  {TEAMS[lm.claimedByTeam]?.emoji}
                </Text>
              </View>
            ) : (
              <View style={styles.unclaimedBadge}>
                <Text style={styles.unclaimedText}>Unclaimed</Text>
              </View>
            )}
          </View>
          <Text style={styles.landmarkDesc}>{lm.description}</Text>
          {lm.imageUri && (
            <Image source={{ uri: lm.imageUri }} style={styles.landmarkImage} />
          )}
          <View style={styles.landmarkFooter}>
            <Text style={styles.tokenReward}>
              {'\u{1FA99}'} {lm.tokens} tokens
            </Text>
            {lm.claimed && (
              <Text style={styles.claimedByText}>
                Claimed by Team {TEAMS[lm.claimedByTeam]?.name}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Special Events Section */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>Special Events</Text>
        <View style={styles.eventCard}>
          <Text style={styles.eventIcon}>{'\u{1F3C6}'}</Text>
          <View style={styles.eventInfo}>
            <Text style={styles.eventName}>NoVA Heritage Trail</Text>
            <Text style={styles.eventDesc}>
              Claim 5 historical landmarks in Northern Virginia to earn 100 bonus tokens!
            </Text>
            <View style={styles.eventProgress}>
              <View style={[styles.eventProgressBar, { width: '40%' }]} />
            </View>
            <Text style={styles.eventProgressText}>2/5 landmarks claimed</Text>
          </View>
        </View>
        <View style={styles.eventCard}>
          <Text style={styles.eventIcon}>{'\u{1F30D}'}</Text>
          <View style={styles.eventInfo}>
            <Text style={styles.eventName}>Team Territory Race</Text>
            <Text style={styles.eventDesc}>
              Your team needs to claim 1 sq mi in the local area this week!
            </Text>
            <View style={styles.eventProgress}>
              <View style={[styles.eventProgressBar, { width: '65%', backgroundColor: '#44bb44' }]} />
            </View>
            <Text style={styles.eventProgressText}>0.65 / 1.0 sq mi</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSubmit = () => (
    <View>
      <Text style={styles.sectionDesc}>
        Know an interesting place? Submit it as a community landmark! Include a photo and explain why it's important. Another player will review and approve it.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Landmark Name</Text>
        <TextInput
          style={styles.formInput}
          placeholder="e.g., Old Stone Bridge"
          placeholderTextColor="#555"
          value={submitName}
          onChangeText={setSubmitName}
          maxLength={50}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Why is this place important?</Text>
        <TextInput
          style={[styles.formInput, styles.formTextArea]}
          placeholder="Describe the history, cultural significance, or community importance..."
          placeholderTextColor="#555"
          value={submitDesc}
          onChangeText={setSubmitDesc}
          multiline
          numberOfLines={4}
          maxLength={300}
        />
        <Text style={styles.charCount}>{submitDesc.length}/300</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Photo</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
          {submitImage ? (
            <Image source={{ uri: submitImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>{'\u{1F4F7}'}</Text>
              <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>Submit Landmark</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPending = () => (
    <View>
      <Text style={styles.sectionDesc}>
        Review and approve community-submitted landmarks. Help build the map!
      </Text>
      {state.communityLandmarks.length === 0 ? (
        <Text style={styles.emptyText}>No community landmarks submitted yet.</Text>
      ) : (
        state.communityLandmarks.map((cl) => (
          <View key={cl.id} style={styles.landmarkCard}>
            <View style={styles.landmarkHeader}>
              <Text style={styles.landmarkTypeIcon}>{'\u{1F4CD}'}</Text>
              <View style={styles.landmarkHeaderInfo}>
                <Text style={styles.landmarkName}>{cl.name}</Text>
                <Text style={styles.landmarkType}>
                  by {cl.submittedBy}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      cl.status === 'approved' ? '#44bb44' : '#ff8800',
                  },
                ]}
              >
                <Text style={styles.statusText}>{cl.status}</Text>
              </View>
            </View>
            <Text style={styles.landmarkDesc}>{cl.description}</Text>
            {cl.imageUri && (
              <Image source={{ uri: cl.imageUri }} style={styles.clImage} />
            )}
            {cl.status === 'pending' && cl.submittedById !== state.player?.id && (
              <View style={styles.reviewButtons}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(cl.id)}
                >
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(cl.id)}
                >
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
            {cl.status === 'pending' && cl.submittedById === state.player?.id && (
              <View style={styles.reviewButtons}>
                <Text style={styles.ownSubmissionText}>Awaiting approval from another player</Text>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(cl.id)}
                >
                  <Text style={styles.rejectBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Landmarks</Text>

      <View style={styles.tabs}>
        {[
          { key: 'discover', label: 'Discover' },
          { key: 'submit', label: 'Submit' },
          { key: 'pending', label: 'Review' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.activeTab]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.activeTabText]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'discover' && renderDiscover()}
        {tab === 'submit' && renderSubmit()}
        {tab === 'pending' && renderPending()}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#e94560',
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
  },
  sectionDesc: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  landmarkCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  landmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  landmarkTypeIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  landmarkHeaderInfo: {
    flex: 1,
  },
  landmarkName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  landmarkType: {
    color: '#666',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  claimedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimedText: {
    fontSize: 16,
  },
  unclaimedBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  unclaimedText: {
    color: '#888',
    fontSize: 11,
  },
  landmarkDesc: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  landmarkImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  landmarkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenReward: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  claimedByText: {
    color: '#666',
    fontSize: 12,
  },
  eventsSection: {
    marginTop: 20,
  },
  eventsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  eventIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDesc: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  eventProgress: {
    height: 8,
    backgroundColor: '#0f3460',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  eventProgressBar: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 4,
  },
  eventProgressText: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#16213e',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#555',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  imagePickerBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  imagePlaceholderText: {
    color: '#555',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  clImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  reviewButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#44bb44',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ownSubmissionText: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    padding: 40,
  },
});
