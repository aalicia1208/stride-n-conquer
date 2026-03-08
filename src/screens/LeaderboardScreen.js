import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { TEAMS } from '../utils/constants';
import { calculatePolygonArea, sqMetersToSqMiles } from '../utils/geo';

export default function LeaderboardScreen() {
  const { state } = useGame();
  const [tab, setTab] = useState('teams'); // 'teams' | 'players' | 'tokens'

  // Compute real territory areas per team from actual polygon data
  const teamStats = useMemo(() => {
    const stats = Object.keys(TEAMS).map((teamKey) => {
      const teamTerritories = state.territories.filter((t) => t.team === teamKey);
      const areaSqM = teamTerritories.reduce(
        (sum, t) => sum + calculatePolygonArea(t.polygon), 0
      );
      return {
        team: teamKey,
        area: sqMetersToSqMiles(areaSqM),
        territories: teamTerritories.length,
      };
    });
    return stats.sort((a, b) => b.area - a.area);
  }, [state.territories]);

  const renderTeamLeaderboard = () => (
    <View>
      {teamStats.map((entry, index) => {
        const team = TEAMS[entry.team];
        return (
          <View key={entry.team} style={styles.row}>
            <View style={styles.rank}>
              <Text style={styles.rankText}>
                {index === 0 ? '\u{1F947}' : index === 1 ? '\u{1F948}' : index === 2 ? '\u{1F949}' : `#${index + 1}`}
              </Text>
            </View>
            <View style={[styles.teamColor, { backgroundColor: team.color }]} />
            <View style={styles.info}>
              <Text style={[styles.name, { color: team.color }]}>
                Team {team.name}
              </Text>
              <Text style={styles.stat}>
                {entry.area.toFixed(3)} sq mi claimed
              </Text>
            </View>
            <View style={styles.members}>
              <Text style={styles.memberCount}>{entry.territories}</Text>
              <Text style={styles.memberLabel}>zones</Text>
            </View>
          </View>
        );
      })}

      {/* Team territory bar chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Territory Distribution</Text>
        {teamStats.map((entry) => {
          const team = TEAMS[entry.team];
          const maxArea = Math.max(...teamStats.map((t) => t.area));
          const barWidth = maxArea > 0 ? (entry.area / maxArea) * 100 : 0;
          return (
            <View key={entry.team} style={styles.chartRow}>
              <Text style={[styles.chartLabel, { color: team.color }]}>
                {team.emoji}
              </Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { width: `${barWidth}%`, backgroundColor: team.color },
                  ]}
                />
              </View>
              <Text style={styles.chartValue}>{entry.area.toFixed(3)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  // Build player list from real territory data + include current player
  const playerStats = useMemo(() => {
    // Group territories by claimedBy
    const playerMap = {};
    state.territories.forEach((t) => {
      const name = t.claimedBy || 'unknown';
      if (!playerMap[name]) {
        playerMap[name] = { name, team: t.team, area: 0 };
      }
      playerMap[name].area += sqMetersToSqMiles(calculatePolygonArea(t.polygon));
    });

    // Ensure current player is included
    if (state.player && !playerMap[state.player.name]) {
      playerMap[state.player.name] = {
        name: state.player.name,
        team: state.player.team,
        area: 0,
      };
    }

    return Object.values(playerMap).sort((a, b) => b.area - a.area);
  }, [state.territories, state.player]);

  // Build token ranking — current player + sample players
  const tokenRanking = useMemo(() => {
    const players = state.leaderboard.players.map((p) => ({
      ...p,
      isMe: state.player && p.name === state.player.name,
    }));

    // Add current player if not already in the list
    if (state.player && !players.some((p) => p.name === state.player.name)) {
      players.push({
        name: state.player.name,
        team: state.player.team,
        tokens: state.playerTokens,
        area: 0,
        isMe: true,
      });
    } else {
      // Update current player's token count to real value
      const me = players.find((p) => p.isMe);
      if (me) me.tokens = state.playerTokens;
    }

    return players.sort((a, b) => b.tokens - a.tokens);
  }, [state.leaderboard.players, state.player, state.playerTokens]);

  const renderPlayerLeaderboard = () => (
    <View>
      {playerStats.map((player, index) => {
        const team = TEAMS[player.team];
        const isMe = state.player && player.name === state.player.name;
        return (
          <View
            key={player.name}
            style={[styles.row, isMe && styles.myRow]}
          >
            <View style={styles.rank}>
              <Text style={styles.rankText}>
                {index === 0 ? '\u{1F947}' : index === 1 ? '\u{1F948}' : index === 2 ? '\u{1F949}' : `#${index + 1}`}
              </Text>
            </View>
            <View style={[styles.teamColor, { backgroundColor: team.color }]} />
            <View style={styles.info}>
              <Text style={[styles.name, isMe && styles.myName]}>
                {player.name} {isMe ? '(you)' : ''}
              </Text>
              <Text style={styles.stat}>
                {player.area.toFixed(3)} sq mi
              </Text>
            </View>
            <View style={styles.areaValue}>
              <Text style={[styles.areaText, { color: team.color }]}>
                {team.emoji}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderTokenLeaderboard = () => (
    <View>
      {tokenRanking.map((player, index) => {
          const team = TEAMS[player.team];
          const isMe = player.isMe;
          return (
            <View
              key={player.name}
              style={[styles.row, isMe && styles.myRow]}
            >
              <View style={styles.rank}>
                <Text style={styles.rankText}>
                  {index === 0 ? '\u{1F947}' : index === 1 ? '\u{1F948}' : index === 2 ? '\u{1F949}' : `#${index + 1}`}
                </Text>
              </View>
              <View style={[styles.teamColor, { backgroundColor: team.color }]} />
              <View style={styles.info}>
                <Text style={[styles.name, isMe && styles.myName]}>
                  {player.name} {isMe ? '(you)' : ''}
                </Text>
                <Text style={styles.stat}>{team.name} Team</Text>
              </View>
              <View style={styles.tokenValue}>
                <Image source={require('../../assets/token.png')} style={styles.tokenIcon} />
                <Text style={styles.tokenText}>
                  {player.tokens}
                </Text>
              </View>
            </View>
          );
        })}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>

      {/* Tab selector */}
      <View style={styles.tabs}>
        {[
          { key: 'teams', label: 'Teams' },
          { key: 'players', label: 'Area' },
          { key: 'tokens', label: 'Tokens' },
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

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {tab === 'teams' && renderTeamLeaderboard()}
        {tab === 'players' && renderPlayerLeaderboard()}
        {tab === 'tokens' && renderTokenLeaderboard()}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
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
    fontSize: 15,
  },
  activeTabText: {
    color: '#fff',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  myRow: {
    borderWidth: 1,
    borderColor: '#e94560',
  },
  rank: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    color: '#fff',
  },
  teamColor: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  myName: {
    color: '#e94560',
  },
  stat: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  members: {
    alignItems: 'center',
  },
  memberCount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberLabel: {
    color: '#666',
    fontSize: 11,
  },
  areaValue: {
    alignItems: 'center',
  },
  areaText: {
    fontSize: 22,
  },
  tokenValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tokenIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  tokenText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 18,
    width: 30,
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#0f3460',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 10,
    opacity: 0.8,
  },
  chartValue: {
    color: '#aaa',
    fontSize: 13,
    width: 40,
    textAlign: 'right',
  },
});
