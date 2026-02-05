import React from 'react';
import { FlatList, StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { StreamCard } from '../../components/ui/StreamCard';
import { PALETTE, TYPOGRAPHY } from '../../constants/theme';

const MOCK_DATA = [
  { id: '1', creator: 'SereneSky', title: 'Midnight Rain Ambience', viewers: 1240, isAdult: false },
  { id: '2', creator: 'Guardian_Alpha', title: 'Community Q&A', viewers: 850, isAdult: false },
  { id: '3', creator: 'AfterHours', title: 'Late Night Conversations', viewers: 2100, isAdult: true },
];

export default function HomeScreen() {
  const { adultModeEnabled } = useAuth();

  // Filter out adult content if opt-in is disabled
  const filteredStreams = MOCK_DATA.filter(s => !s.isAdult || adultModeEnabled);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>HALO</Text>
        {adultModeEnabled && <View style={styles.adultIndicator} />}
      </View>

      <FlatList
        data={filteredStreams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <StreamCard 
            creatorName={item.creator}
            title={item.title}
            viewerCount={item.viewers}
            isAdult={item.isAdult}
            thumbnail=""
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.voidBlack,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 24,
    color: PALETTE.haloWhite,
    letterSpacing: 2,
  },
  adultIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.warning,
    shadowColor: PALETTE.warning,
    shadowRadius: 5,
    shadowOpacity: 0.8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for the floating tab bar
  }
});
