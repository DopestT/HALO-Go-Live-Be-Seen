import React from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, ScrollView } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY, LAYOUT } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  
  const isAdultVerified = (user?.age ?? 0) >= 18;
  const adultModeEnabled = user?.adultModeEnabled ?? false;
  
  const toggleAdultMode = () => {
    if (isAdultVerified) {
      updateUser({ adultModeEnabled: !adultModeEnabled });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Profile Settings</Text>
        
        <Text style={styles.sectionTitle}>Safety & Visibility</Text>
        
        <GlassPanel style={styles.settingsPanel}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Adult Mode (18+)</Text>
              <Text style={styles.settingDescription}>
                {isAdultVerified 
                  ? 'Access age-restricted content' 
                  : 'Requires age verification'}
              </Text>
            </View>
            <Switch
              value={adultModeEnabled}
              onValueChange={toggleAdultMode}
              trackColor={{ false: '#1e293b', true: PALETTE.haloBlue }}
              thumbColor={adultModeEnabled ? PALETTE.haloWhite : '#94a3b8'}
              disabled={!isAdultVerified}
              style={styles.switch}
            />
          </View>
          
          {!isAdultVerified && (
            <Text style={styles.warningText}>
              Age verification required to enable Adult Mode
            </Text>
          )}
        </GlassPanel>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.voidBlack,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 28,
    color: PALETTE.haloWhite,
    marginBottom: 32,
  },
  sectionTitle: {
    color: PALETTE.haloWhite,
    fontSize: 18,
    fontFamily: TYPOGRAPHY.bold,
    marginBottom: 16,
    letterSpacing: TYPOGRAPHY.tracking,
  },
  settingsPanel: {
    padding: 20,
    width: '100%',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontFamily: TYPOGRAPHY.bold,
    color: PALETTE.haloWhite,
    fontSize: 16,
    letterSpacing: TYPOGRAPHY.tracking,
  },
  settingDescription: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 4,
    fontFamily: TYPOGRAPHY.regular,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  warningText: {
    color: PALETTE.warning,
    fontSize: 12,
    marginTop: 12,
    fontFamily: TYPOGRAPHY.regular,
    letterSpacing: TYPOGRAPHY.tracking,
  },
});
