// Pre-populated data for Northern Virginia area
// Shows territory blocks for all 5 teams around Arlington, Falls Church, Tysons, McLean, Fairfax

export const SAMPLE_TERRITORIES = [
  // === BLUE TEAM — Tysons Corner Center area ===
  {
    id: 'terr_blue_1',
    team: 'blue',
    claimedBy: 'runner_alex',
    claimedAt: Date.now() - 86400000 * 3,
    polygon: [
      { latitude: 38.9195, longitude: -77.2265 },
      { latitude: 38.9202, longitude: -77.2240 },
      { latitude: 38.9210, longitude: -77.2218 },
      { latitude: 38.9205, longitude: -77.2195 },
      { latitude: 38.9192, longitude: -77.2180 },
      { latitude: 38.9178, longitude: -77.2175 },
      { latitude: 38.9165, longitude: -77.2185 },
      { latitude: 38.9158, longitude: -77.2205 },
      { latitude: 38.9160, longitude: -77.2230 },
      { latitude: 38.9170, longitude: -77.2252 },
      { latitude: 38.9182, longitude: -77.2263 },
    ],
  },
  // Blue — Jones Branch Dr / Capital One HQ area
  {
    id: 'terr_blue_2',
    team: 'blue',
    claimedBy: 'walker_chloe',
    claimedAt: Date.now() - 86400000 * 2,
    polygon: [
      { latitude: 38.9228, longitude: -77.2290 },
      { latitude: 38.9238, longitude: -77.2268 },
      { latitude: 38.9245, longitude: -77.2242 },
      { latitude: 38.9240, longitude: -77.2218 },
      { latitude: 38.9230, longitude: -77.2205 },
      { latitude: 38.9215, longitude: -77.2210 },
      { latitude: 38.9208, longitude: -77.2235 },
      { latitude: 38.9210, longitude: -77.2260 },
      { latitude: 38.9218, longitude: -77.2282 },
    ],
  },

  // === RED TEAM — Cuts through Blue's Tysons territory (territory steal!) ===
  {
    id: 'terr_red_1',
    team: 'red',
    claimedBy: 'runner_mike',
    claimedAt: Date.now() - 86400000 * 1,
    polygon: [
      { latitude: 38.9210, longitude: -77.2245 },
      { latitude: 38.9218, longitude: -77.2228 },
      { latitude: 38.9215, longitude: -77.2205 },
      { latitude: 38.9205, longitude: -77.2190 },
      { latitude: 38.9190, longitude: -77.2185 },
      { latitude: 38.9180, longitude: -77.2195 },
      { latitude: 38.9175, longitude: -77.2215 },
      { latitude: 38.9180, longitude: -77.2235 },
      { latitude: 38.9192, longitude: -77.2248 },
      { latitude: 38.9202, longitude: -77.2250 },
    ],
  },
  // Red — Gallows Rd / Dunn Loring area
  {
    id: 'terr_red_2',
    team: 'red',
    claimedBy: 'runner_sarah',
    claimedAt: Date.now() - 86400000 * 4,
    polygon: [
      { latitude: 38.8840, longitude: -77.2195 },
      { latitude: 38.8852, longitude: -77.2172 },
      { latitude: 38.8858, longitude: -77.2148 },
      { latitude: 38.8850, longitude: -77.2125 },
      { latitude: 38.8835, longitude: -77.2112 },
      { latitude: 38.8818, longitude: -77.2118 },
      { latitude: 38.8808, longitude: -77.2140 },
      { latitude: 38.8810, longitude: -77.2165 },
      { latitude: 38.8820, longitude: -77.2188 },
      { latitude: 38.8832, longitude: -77.2198 },
    ],
  },
  // Red — Merrifield / Mosaic area
  {
    id: 'terr_red_3',
    team: 'red',
    claimedBy: 'runner_mike',
    claimedAt: Date.now() - 86400000 * 2,
    polygon: [
      { latitude: 38.8732, longitude: -77.2310 },
      { latitude: 38.8742, longitude: -77.2285 },
      { latitude: 38.8748, longitude: -77.2258 },
      { latitude: 38.8740, longitude: -77.2238 },
      { latitude: 38.8725, longitude: -77.2228 },
      { latitude: 38.8708, longitude: -77.2235 },
      { latitude: 38.8698, longitude: -77.2258 },
      { latitude: 38.8702, longitude: -77.2282 },
      { latitude: 38.8712, longitude: -77.2305 },
      { latitude: 38.8725, longitude: -77.2315 },
    ],
  },

  // === GREEN TEAM — Falls Church area ===
  {
    id: 'terr_green_1',
    team: 'green',
    claimedBy: 'biker_lily',
    claimedAt: Date.now() - 86400000 * 5,
    polygon: [
      { latitude: 38.8842, longitude: -77.1732 },
      { latitude: 38.8855, longitude: -77.1708 },
      { latitude: 38.8860, longitude: -77.1680 },
      { latitude: 38.8852, longitude: -77.1655 },
      { latitude: 38.8838, longitude: -77.1640 },
      { latitude: 38.8820, longitude: -77.1638 },
      { latitude: 38.8805, longitude: -77.1650 },
      { latitude: 38.8798, longitude: -77.1672 },
      { latitude: 38.8800, longitude: -77.1698 },
      { latitude: 38.8812, longitude: -77.1720 },
      { latitude: 38.8828, longitude: -77.1735 },
    ],
  },
  // Green — W&OD Trail / East Falls Church
  {
    id: 'terr_green_2',
    team: 'green',
    claimedBy: 'runner_josh',
    claimedAt: Date.now() - 86400000 * 3,
    polygon: [
      { latitude: 38.8782, longitude: -77.1590 },
      { latitude: 38.8792, longitude: -77.1565 },
      { latitude: 38.8795, longitude: -77.1538 },
      { latitude: 38.8788, longitude: -77.1515 },
      { latitude: 38.8772, longitude: -77.1505 },
      { latitude: 38.8758, longitude: -77.1512 },
      { latitude: 38.8748, longitude: -77.1535 },
      { latitude: 38.8750, longitude: -77.1560 },
      { latitude: 38.8760, longitude: -77.1582 },
      { latitude: 38.8772, longitude: -77.1592 },
    ],
  },
  // Green — Cuts into Red's Merrifield zone (steal!)
  {
    id: 'terr_green_3',
    team: 'green',
    claimedBy: 'walker_emma',
    claimedAt: Date.now() - 86400000 * 1,
    polygon: [
      { latitude: 38.8738, longitude: -77.2275 },
      { latitude: 38.8745, longitude: -77.2255 },
      { latitude: 38.8742, longitude: -77.2232 },
      { latitude: 38.8730, longitude: -77.2218 },
      { latitude: 38.8715, longitude: -77.2222 },
      { latitude: 38.8708, longitude: -77.2242 },
      { latitude: 38.8712, longitude: -77.2265 },
      { latitude: 38.8725, longitude: -77.2280 },
    ],
  },

  // === YELLOW TEAM — McLean area ===
  {
    id: 'terr_yellow_1',
    team: 'yellow',
    claimedBy: 'biker_nina',
    claimedAt: Date.now() - 86400000 * 4,
    polygon: [
      { latitude: 38.9355, longitude: -77.1815 },
      { latitude: 38.9368, longitude: -77.1790 },
      { latitude: 38.9372, longitude: -77.1762 },
      { latitude: 38.9365, longitude: -77.1738 },
      { latitude: 38.9350, longitude: -77.1722 },
      { latitude: 38.9332, longitude: -77.1720 },
      { latitude: 38.9318, longitude: -77.1735 },
      { latitude: 38.9312, longitude: -77.1758 },
      { latitude: 38.9315, longitude: -77.1782 },
      { latitude: 38.9325, longitude: -77.1800 },
      { latitude: 38.9340, longitude: -77.1812 },
    ],
  },
  // Yellow — Spring Hill area, cuts into Blue's north Tysons (steal!)
  {
    id: 'terr_yellow_2',
    team: 'yellow',
    claimedBy: 'biker_nina',
    claimedAt: Date.now() - 86400000 * 1,
    polygon: [
      { latitude: 38.9248, longitude: -77.2265 },
      { latitude: 38.9255, longitude: -77.2242 },
      { latitude: 38.9252, longitude: -77.2218 },
      { latitude: 38.9242, longitude: -77.2200 },
      { latitude: 38.9228, longitude: -77.2198 },
      { latitude: 38.9218, longitude: -77.2212 },
      { latitude: 38.9215, longitude: -77.2238 },
      { latitude: 38.9222, longitude: -77.2258 },
      { latitude: 38.9235, longitude: -77.2270 },
    ],
  },

  // === PURPLE TEAM — Fairfax City area ===
  {
    id: 'terr_purple_1',
    team: 'purple',
    claimedBy: 'runner_zoe',
    claimedAt: Date.now() - 86400000 * 6,
    polygon: [
      { latitude: 38.8518, longitude: -77.2985 },
      { latitude: 38.8530, longitude: -77.2960 },
      { latitude: 38.8535, longitude: -77.2932 },
      { latitude: 38.8528, longitude: -77.2908 },
      { latitude: 38.8512, longitude: -77.2895 },
      { latitude: 38.8495, longitude: -77.2898 },
      { latitude: 38.8482, longitude: -77.2918 },
      { latitude: 38.8480, longitude: -77.2945 },
      { latitude: 38.8488, longitude: -77.2968 },
      { latitude: 38.8502, longitude: -77.2985 },
    ],
  },
  // Purple — Vienna Town area
  {
    id: 'terr_purple_2',
    team: 'purple',
    claimedBy: 'biker_marcus',
    claimedAt: Date.now() - 86400000 * 3,
    polygon: [
      { latitude: 38.9028, longitude: -77.2672 },
      { latitude: 38.9040, longitude: -77.2650 },
      { latitude: 38.9042, longitude: -77.2625 },
      { latitude: 38.9035, longitude: -77.2602 },
      { latitude: 38.9020, longitude: -77.2592 },
      { latitude: 38.9005, longitude: -77.2598 },
      { latitude: 38.8995, longitude: -77.2618 },
      { latitude: 38.8998, longitude: -77.2645 },
      { latitude: 38.9008, longitude: -77.2665 },
      { latitude: 38.9020, longitude: -77.2675 },
    ],
  },
  // Purple — Cuts into Red's Dunn Loring zone (steal!)
  {
    id: 'terr_purple_3',
    team: 'purple',
    claimedBy: 'runner_zoe',
    claimedAt: Date.now() - 86400000 * 1,
    polygon: [
      { latitude: 38.8848, longitude: -77.2162 },
      { latitude: 38.8855, longitude: -77.2140 },
      { latitude: 38.8850, longitude: -77.2118 },
      { latitude: 38.8838, longitude: -77.2108 },
      { latitude: 38.8822, longitude: -77.2115 },
      { latitude: 38.8815, longitude: -77.2135 },
      { latitude: 38.8820, longitude: -77.2158 },
      { latitude: 38.8835, longitude: -77.2168 },
    ],
  },
];

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
