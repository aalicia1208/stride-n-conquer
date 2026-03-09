import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  update,
  get,
} from 'firebase/database';

// TODO: Replace with your Firebase config from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyDDolHwM7vr-cFXQDwjV888oZ4gzyKWYeI",
  authDomain: "hacktj26.firebaseapp.com",
  databaseURL: "https://hacktj26-default-rtdb.firebaseio.com",
  projectId: "hacktj26",
  storageBucket: "hacktj26.firebasestorage.app",
  messagingSenderId: "219582573341",
  appId: "1:219582573341:web:0196e16f325e4a41ffcff4",
  measurementId: "G-GTRTXQQGXL"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Territories ---
export function onTerritoriesChange(callback) {
  const territoriesRef = ref(db, 'territories');
  return onValue(territoriesRef, (snapshot) => {
    const data = snapshot.val();
    const territories = data ? Object.values(data) : [];
    callback(territories);
  });
}

export async function addTerritory(territory) {
  const territoriesRef = ref(db, `territories/${territory.id}`);
  await set(territoriesRef, territory);
}

export async function removeTerritory(territoryId) {
  const territoryRef = ref(db, `territories/${territoryId}`);
  await set(territoryRef, null);
}

// --- Landmarks ---
export function onLandmarksChange(callback) {
  const landmarksRef = ref(db, 'landmarks');
  return onValue(landmarksRef, (snapshot) => {
    const data = snapshot.val();
    const landmarks = data ? Object.values(data) : [];
    callback(landmarks);
  });
}

export async function updateLandmark(id, updates) {
  const landmarkRef = ref(db, `landmarks/${id}`);
  await update(landmarkRef, updates);
}

export async function addLandmark(landmark) {
  const landmarkRef = ref(db, `landmarks/${landmark.id}`);
  await set(landmarkRef, landmark);
}

// --- Community Landmarks ---
export function onCommunityLandmarksChange(callback) {
  const clRef = ref(db, 'communityLandmarks');
  return onValue(clRef, (snapshot) => {
    const data = snapshot.val();
    const landmarks = data ? Object.values(data) : [];
    callback(landmarks);
  });
}

export async function addCommunityLandmark(landmark) {
  const clRef = ref(db, `communityLandmarks/${landmark.id}`);
  await set(clRef, landmark);
}

export async function updateCommunityLandmark(id, updates) {
  const clRef = ref(db, `communityLandmarks/${id}`);
  await update(clRef, updates);
}

export async function removeCommunityLandmark(id) {
  const clRef = ref(db, `communityLandmarks/${id}`);
  await set(clRef, null);
}

// --- Seed initial data (run once) ---
export async function seedInitialData(sampleData) {
  const { territories, landmarks, communityLandmarks } = sampleData;
  const seedData = {};

  // Seed sample territories — always overwrite sample entries (terr_ prefix)
  // but preserve user-created territories
  if (territories.length > 0) {
    const terrSnap = await get(ref(db, 'territories'));
    const existing = terrSnap.exists() ? terrSnap.val() : {};
    // Remove old sample territories (terr_ and frag variants)
    Object.keys(existing).forEach((key) => {
      if (key.startsWith('terr_')) {
        seedData[`territories/${key}`] = null;
      }
    });
    // Write processed sample territories
    territories.forEach((t) => {
      if (t.id.startsWith('terr_')) {
        seedData[`territories/${t.id}`] = t;
      } else if (!existing[t.id]) {
        seedData[`territories/${t.id}`] = t;
      }
    });
  }

  // Seed landmarks if none exist
  const lmSnap = await get(ref(db, 'landmarks'));
  if (!lmSnap.exists()) {
    landmarks.forEach((l) => {
      seedData[`landmarks/${l.id}`] = l;
    });
  }

  // Seed community landmarks if none exist
  const clSnap = await get(ref(db, 'communityLandmarks'));
  if (!clSnap.exists()) {
    communityLandmarks.forEach((cl) => {
      seedData[`communityLandmarks/${cl.id}`] = cl;
    });
  }

  if (Object.keys(seedData).length > 0) {
    await update(ref(db), seedData);
  }
}

export { db };
