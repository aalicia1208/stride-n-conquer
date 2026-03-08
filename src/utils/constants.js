export const TEAMS = {
  red: { name: 'Red', color: '#FF4444', lightColor: 'rgba(255,68,68,0.3)', emoji: '🔴' },
  green: { name: 'Green', color: '#44BB44', lightColor: 'rgba(68,187,68,0.3)', emoji: '🟢' },
  blue: { name: 'Blue', color: '#4488FF', lightColor: 'rgba(68,136,255,0.3)', emoji: '🔵' },
  yellow: { name: 'Yellow', color: '#FFBB33', lightColor: 'rgba(255,187,51,0.3)', emoji: '🟡' },
  purple: { name: 'Purple', color: '#AA44FF', lightColor: 'rgba(170,68,255,0.3)', emoji: '🟣' },
};

export const SPEED_LIMIT_MPH = 12;
export const SPEED_LIMIT_MS = SPEED_LIMIT_MPH * 0.44704; // m/s

export const MAP_INITIAL_REGION = {
  latitude: 38.8816,
  longitude: -77.1710,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// Universal pet pool - same for all teams
// To use custom images, add them to assets/pets/ and set image: require('../../assets/pets/filename.png')
export const PET_OPTIONS = [
  { id: 'pet_fox', name: 'Fox', rarity: 'common', icon: '🦊', image: require('../../assets/pets/fox.png') },
  { id: 'pet_frog', name: 'Frog', rarity: 'common', icon: '🐸', image: require('../../assets/pets/frog.png') },
  { id: 'pet_butterfly', name: 'Butterfly', rarity: 'common', icon: '🦋', image: require('../../assets/pets/butterfly.png') },
  { id: 'pet_duckling', name: 'Duckling', rarity: 'common', icon: '🐥', image: require('../../assets/pets/duckling.png') },
  { id: 'pet_ladybug', name: 'Ladybug', rarity: 'common', icon: '🐞', image: require('../../assets/pets/ladybug.png') },
  { id: 'pet_blackcat', name: 'Black Cat', rarity: 'common', icon: '🐈‍⬛', image: require('../../assets/pets/blackcat.png') },
  { id: 'pet_bluebird', name: 'Bluebird', rarity: 'rare', icon: '🐦', image: require('../../assets/pets/bluebird.png') },
  { id: 'pet_redpanda', name: 'Red Panda', rarity: 'rare', icon: '🦝', image: require('../../assets/pets/redpanda.png') },
  { id: 'pet_cardinal', name: 'Cardinal', rarity: 'rare', icon: '🐦', image: require('../../assets/pets/cardinal.png') },
  { id: 'pet_parrot', name: 'Parrot', rarity: 'legendary', icon: '🦜', image: require('../../assets/pets/parrot.png') },
];

// Team color palettes for profile color picker
export const TEAM_COLOR_PALETTES = {
  red: ['#FF2222', '#FF4444', '#FF6666', '#CC3333', '#FF3355', '#E83030', '#FF5050', '#D44444'],
  green: ['#22BB22', '#44BB44', '#33CC33', '#22AA44', '#55CC55', '#2D9E2D', '#44DD44', '#33AA33'],
  blue: ['#2266FF', '#4488FF', '#3377EE', '#2255DD', '#5599FF', '#3366CC', '#4477DD', '#5588EE'],
  yellow: ['#FFAA00', '#FFBB33', '#FFCC44', '#EE9900', '#FFDD55', '#DDAA22', '#FFCC00', '#EEBB33'],
  purple: ['#8822FF', '#AA44FF', '#9933EE', '#7722DD', '#BB55FF', '#8833CC', '#9944DD', '#AA55EE'],
};

export const BLIND_BOX_COST = 50;

export const RARITY_CHANCES = {
  common: 0.60,
  rare: 0.30,
  legendary: 0.10,
};
