import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY, LAYOUT } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function GoLiveFlow() {
  const { isAdultVerified } = useAuth();
  const [isAdultStream, setIsAdultStream] = useState(false);
  const [step, setStep] = useState<'setup' | 'check' | 'live'>('setup');

  const startTechCheck = () => setStep('check');

  return (
    <View style={styles.container}>
      {step === 'setup' && (
        <View style={styles.content}>
          <Text style={styles.title}>Prepare your Presence</Text>
          
          <GlassPanel style={styles.formPanel}>
            <Text style={styles.label}>Stream Category</Text>
            {/* Category selection logic here */}

            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Adult Mode (18+)</Text>
                <Text style={styles.subLabel}>Requires verified age status</Text>
              </View>
              <Switch
                value={isAdultStream}
                onValueChange={(val) => isAdultVerified ? setIsAdultStream(val) : null}
                trackColor={{ false: '#1e293b', true: PALETTE.warning }}
                disabled={!isAdultVerified}
              />
            </View>
          </GlassPanel>

          <TouchableOpacity style={styles.actionButton} onPress={startTechCheck}>
            <Text style={styles.buttonText}>Next: Tech Check</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'check' && (
        <View style={styles.checkContainer}>
          {/* Breathing Halo Animation would be rendered here */}
          <View style={styles.haloPlaceholder} />
          
          <Text style={styles.checkText}>Calibrating Protection...</Text>
          <Text style={styles.subLabel}>Ensure your environment is safe</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { marginTop: 40 }]} 
            onPress={() => setStep('live')}
          >
            <Text style={styles.buttonText}>Go Live Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.voidBlack },
  content: { padding: 24, justifyContent: 'center', flex: 1 },
  title: { 
    fontFamily: TYPOGRAPHY.bold, 
    fontSize: 28, 
    color: PALETTE.haloWhite, 
    marginBottom: 32 
  },
  formPanel: { padding: 20, width: '100%' },
  label: { fontFamily: TYPOGRAPHY.bold, color: PALETTE.haloWhite, fontSize: 16 },
  subLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 24 
  },
  actionButton: {
    backgroundColor: PALETTE.haloCyan,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: { fontFamily: TYPOGRAPHY.bold, color: PALETTE.voidBlack, fontSize: 16 },
  checkContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  haloPlaceholder: {
    width: 200,
    height: 100,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: PALETTE.haloCyan,
    shadowColor: PALETTE.haloCyan,
    shadowRadius: 20,
    shadowOpacity: 1,
    marginBottom: 40,
  },
  checkText: { fontFamily: TYPOGRAPHY.bold, color: PALETTE.haloWhite, fontSize: 20 }
});
