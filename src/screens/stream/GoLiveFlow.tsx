import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, useWindowDimensions } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import LiveRoom from './LiveRoom';

export default function GoLiveFlow() {
  const { isAdultVerified } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [isAdultStream, setIsAdultStream] = useState(false);
  const [step, setStep] = useState<'setup' | 'check' | 'live'>('setup');

  if (step === 'live') {
    return <LiveRoom isCreator />;
  }

  return (
    <View style={styles.container}>
      {step === 'setup' && (
        <View style={[styles.content, isWide && styles.contentWide]}>
          <View style={[styles.intro, isWide && styles.introWide]}>
            <Text style={styles.eyebrow}>CREATOR STUDIO</Text>
            <Text style={styles.title}>Prepare your broadcast.</Text>
            <Text style={styles.description}>
              Set the room, verify your safety controls, then enter a full-screen live environment.
            </Text>
          </View>

          <View style={[styles.setupColumn, isWide && styles.setupColumnWide]}>
            <GlassPanel style={styles.formPanel}>
              <Text style={styles.sectionTitle}>Stream setup</Text>
              <Text style={styles.label}>Stream category</Text>
              <View style={styles.categoryPlaceholder}>
                <Text style={styles.categoryPlaceholderText}>Choose category</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Adult Mode (18+)</Text>
                  <Text style={styles.subLabel}>Requires verified age status</Text>
                </View>
                <Switch
                  value={isAdultStream}
                  onValueChange={(val) => {
                    if (isAdultVerified) setIsAdultStream(val);
                  }}
                  trackColor={{ false: '#1e293b', true: PALETTE.warning }}
                  disabled={!isAdultVerified}
                />
              </View>
            </GlassPanel>

            <TouchableOpacity style={styles.actionButton} onPress={() => setStep('check')}>
              <Text style={styles.buttonText}>Next: Tech Check</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'check' && (
        <View style={[styles.checkContainer, isWide && styles.checkContainerWide]}>
          <View style={styles.checkVisual}>
            <View style={styles.haloPlaceholder} />
          </View>
          <View style={styles.checkCopy}>
            <Text style={styles.eyebrow}>PRE-FLIGHT</Text>
            <Text style={styles.checkText}>Camera, microphone, connection, safety.</Text>
            <Text style={styles.description}>Confirm the essentials before the room opens to viewers.</Text>
            <TouchableOpacity style={styles.actionButton} onPress={() => setStep('live')}>
              <Text style={styles.buttonText}>Go Live Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: PALETTE.voidBlack,
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    padding: 24,
  },
  contentWide: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 56,
    paddingVertical: 40,
  },
  intro: {
    marginBottom: 28,
  },
  introWide: {
    flex: 1.2,
    paddingRight: 64,
    marginBottom: 0,
  },
  eyebrow: {
    color: PALETTE.haloCyan,
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 11,
    letterSpacing: 2.4,
    marginBottom: 14,
  },
  title: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 40,
    lineHeight: 46,
    color: PALETTE.haloWhite,
  },
  description: {
    maxWidth: 660,
    color: 'rgba(255,255,255,0.58)',
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  setupColumn: {
    width: '100%',
  },
  setupColumnWide: {
    flex: 0.8,
    maxWidth: 620,
  },
  formPanel: {
    padding: 24,
    width: '100%',
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.bold,
    color: PALETTE.haloWhite,
    fontSize: 20,
    marginBottom: 22,
  },
  label: {
    fontFamily: TYPOGRAPHY.bold,
    color: PALETTE.haloWhite,
    fontSize: 15,
  },
  subLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  categoryPlaceholder: {
    height: 52,
    marginTop: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  categoryPlaceholderText: {
    color: 'rgba(255,255,255,0.42)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 26,
  },
  rowCopy: {
    flex: 1,
    paddingRight: 20,
  },
  actionButton: {
    width: '100%',
    backgroundColor: PALETTE.haloCyan,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonText: {
    fontFamily: TYPOGRAPHY.bold,
    color: PALETTE.voidBlack,
    fontSize: 16,
  },
  checkContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  checkContainerWide: {
    flexDirection: 'row',
    paddingHorizontal: 72,
  },
  checkVisual: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloPlaceholder: {
    width: 280,
    height: 140,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: PALETTE.haloCyan,
    shadowColor: PALETTE.haloCyan,
    shadowRadius: 28,
    shadowOpacity: 1,
  },
  checkCopy: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
  },
  checkText: {
    fontFamily: TYPOGRAPHY.bold,
    color: PALETTE.haloWhite,
    fontSize: 34,
    lineHeight: 40,
  },
});
