// Pre-populated data for Northern Virginia area
// Shows territory blocks for all 5 teams around Arlington, Falls Church, Tysons, McLean, Fairfax

export const SAMPLE_TERRITORIES = [];

export const SAMPLE_LANDMARKS = [
  {
    id: 'lm1',
    name: 'Iwo Jima Memorial',
    description: 'The Marine Corps War Memorial depicts the iconic flag-raising on Iwo Jima during WWII. Dedicated in 1954.',
    coordinate: { latitude: 38.8908, longitude: -77.0697 },
    tokens: 25,
    claimed: true,
    claimedByTeam: 'red',
    type: 'historical',
  },
  {
    id: 'lm2',
    name: 'Falls Church City Hall',
    description: 'Historic city hall of the independent City of Falls Church, one of the smallest independent cities in the US.',
    coordinate: { latitude: 38.8826, longitude: -77.1711 },
    tokens: 20,
    claimed: true,
    claimedByTeam: 'green',
    type: 'civic',
  },
  {
    id: 'lm3',
    name: 'Tysons Corner Center',
    description: 'One of the largest shopping malls in Virginia, opened in 1968. A major commercial hub of Northern Virginia.',
    coordinate: { latitude: 38.9178, longitude: -77.2225 },
    tokens: 15,
    claimed: true,
    claimedByTeam: 'blue',
    type: 'commercial',
  },
  {
    id: 'lm4',
    name: 'Claude Moore Colonial Farm',
    description: 'A living history museum in McLean depicting life on a small family farm in 1771 Virginia.',
    coordinate: { latitude: 38.9345, longitude: -77.1795 },
    tokens: 30,
    claimed: true,
    claimedByTeam: 'yellow',
    type: 'historical',
  },
  {
    id: 'lm5',
    name: 'Fairfax County Courthouse',
    description: 'Historic courthouse built in 1800. Served as a Confederate staging area during the Civil War.',
    coordinate: { latitude: 38.8500, longitude: -77.2960 },
    tokens: 20,
    claimed: true,
    claimedByTeam: 'purple',
    type: 'historical',
  },
  {
    id: 'lm6',
    name: 'W&OD Trail Bridge',
    description: 'Part of the Washington & Old Dominion Railroad Regional Park, a 45-mile rail trail through NoVA.',
    coordinate: { latitude: 38.8730, longitude: -77.1550 },
    tokens: 15,
    claimed: false,
    claimedByTeam: null,
    type: 'nature',
  },
  {
    id: 'lm7',
    name: 'Mosaic District',
    description: 'A vibrant mixed-use urban development in Merrifield with shops, restaurants, and a cinema.',
    coordinate: { latitude: 38.8715, longitude: -77.2290 },
    tokens: 20,
    claimed: false,
    claimedByTeam: null,
    type: 'commercial',
  },
  {
    id: 'lm8',
    name: 'Pentagon City',
    description: 'Major urban area adjacent to the Pentagon, home to shopping and residential towers.',
    coordinate: { latitude: 38.8630, longitude: -77.0600 },
    tokens: 25,
    claimed: false,
    claimedByTeam: null,
    type: 'civic',
  },
];

export const SAMPLE_TOKENS = [
  // Custis Trail near Rosslyn (public trail)
  { id: 'tk1', coordinate: { latitude: 38.8943, longitude: -77.0720 }, value: 5, collected: false },
  // Arlington Blvd sidewalk near Iwo Jima
  { id: 'tk2', coordinate: { latitude: 38.8905, longitude: -77.0665 }, value: 10, collected: false },
  // W&OD Trail near Falls Church (public rail trail)
  { id: 'tk3', coordinate: { latitude: 38.8822, longitude: -77.1695 }, value: 5, collected: false },
  // W&OD Trail near East Falls Church
  { id: 'tk4', coordinate: { latitude: 38.8762, longitude: -77.1565 }, value: 10, collected: false },
  // Tysons Corner sidewalk along Rt 7
  { id: 'tk5', coordinate: { latitude: 38.9185, longitude: -77.2200 }, value: 5, collected: false },
  // Jones Branch Dr sidewalk, Tysons (public sidewalk)
  { id: 'tk6', coordinate: { latitude: 38.9210, longitude: -77.2280 }, value: 15, collected: false },
  // Old Dominion Dr sidewalk, McLean
  { id: 'tk7', coordinate: { latitude: 38.9338, longitude: -77.1782 }, value: 5, collected: false },
  // Lewinsville Park path, McLean (public park)
  { id: 'tk8', coordinate: { latitude: 38.9275, longitude: -77.1720 }, value: 10, collected: false },
  // Old Town Fairfax sidewalk on Main St
  { id: 'tk9', coordinate: { latitude: 38.8493, longitude: -77.2945 }, value: 5, collected: false },
  // Fairfax City Park path (public park)
  { id: 'tk10', coordinate: { latitude: 38.8460, longitude: -77.2895 }, value: 10, collected: false },
  // Four Mile Run Trail (public trail)
  { id: 'tk11', coordinate: { latitude: 38.8610, longitude: -77.0910 }, value: 20, collected: false },
  // Bon Air Park path, Arlington (public park)
  { id: 'tk12', coordinate: { latitude: 38.8690, longitude: -77.1155 }, value: 15, collected: false },
  // Mosaic District sidewalk, Merrifield
  { id: 'tk13', coordinate: { latitude: 38.8725, longitude: -77.2265 }, value: 10, collected: false },
  // Vienna Town Green (public park)
  { id: 'tk14', coordinate: { latitude: 38.9010, longitude: -77.2645 }, value: 5, collected: false },
  // Lake Anne Plaza, Reston (public walkway)
  { id: 'tk15', coordinate: { latitude: 38.9605, longitude: -77.3410 }, value: 15, collected: false },
  // Reston Town Center sidewalk
  { id: 'tk16', coordinate: { latitude: 38.9585, longitude: -77.3590 }, value: 10, collected: false },
  // Burke Lake Park trail (public park)
  { id: 'tk17', coordinate: { latitude: 38.7615, longitude: -77.2975 }, value: 20, collected: false },
  // Centreville Historic District sidewalk
  { id: 'tk18', coordinate: { latitude: 38.8405, longitude: -77.4290 }, value: 5, collected: false },
  // Herndon Downtown sidewalk
  { id: 'tk19', coordinate: { latitude: 38.9695, longitude: -77.3860 }, value: 10, collected: false },
  // Chantilly Park path (public park)
  { id: 'tk20', coordinate: { latitude: 38.8810, longitude: -77.4315 }, value: 5, collected: false },
  // Pentagon City sidewalk
  { id: 'tk21', coordinate: { latitude: 38.8625, longitude: -77.0590 }, value: 15, collected: false },
  // Crystal City walkway (public)
  { id: 'tk22', coordinate: { latitude: 38.8565, longitude: -77.0505 }, value: 10, collected: false },
  // Clarendon Central Park (public park)
  { id: 'tk23', coordinate: { latitude: 38.8870, longitude: -77.0955 }, value: 5, collected: false },
  // Ballston Quarter sidewalk
  { id: 'tk24', coordinate: { latitude: 38.8825, longitude: -77.1115 }, value: 10, collected: false },
  // George Mason University campus walkway
  { id: 'tk25', coordinate: { latitude: 38.8315, longitude: -77.3075 }, value: 20, collected: false },
];

export const SAMPLE_LEADERBOARD = {
  teams: [
    { team: 'blue', area: 0.45, members: 234 },
    { team: 'red', area: 0.38, members: 219 },
    { team: 'green', area: 0.33, members: 198 },
    { team: 'yellow', area: 0.29, members: 187 },
    { team: 'purple', area: 0.25, members: 176 },
  ],
  players: [
    { name: 'runner_alex', team: 'blue', area: 0.082, tokens: 450 },
    { name: 'runner_mike', team: 'red', area: 0.071, tokens: 380 },
    { name: 'biker_lily', team: 'green', area: 0.065, tokens: 420 },
    { name: 'runner_zoe', team: 'purple', area: 0.058, tokens: 350 },
    { name: 'biker_nina', team: 'yellow', area: 0.055, tokens: 310 },
    { name: 'runner_sarah', team: 'red', area: 0.049, tokens: 290 },
    { name: 'walker_emma', team: 'green', area: 0.044, tokens: 270 },
    { name: 'runner_josh', team: 'green', area: 0.039, tokens: 250 },
    { name: 'walker_chloe', team: 'blue', area: 0.035, tokens: 230 },
    { name: 'biker_marcus', team: 'purple', area: 0.031, tokens: 200 },
  ],
};

export const SAMPLE_COMMUNITY_LANDMARKS = [
  {
    id: 'cl1',
    name: 'Vienna Town Green',
    description: 'A beloved community gathering space in historic Vienna, VA. Hosts farmers markets and concerts.',
    coordinate: { latitude: 38.9010, longitude: -77.2654 },
    submittedBy: 'walker_emma',
    status: 'approved',
    imageUri: null,
  },
  {
    id: 'cl2',
    name: 'Annandale Korean Bell Garden',
    description: 'Beautiful Korean bell and garden celebrating the Korean-American community in Annandale.',
    coordinate: { latitude: 38.8304, longitude: -77.1963 },
    submittedBy: 'runner_jake',
    status: 'pending',
    imageUri: null,
  },
];
