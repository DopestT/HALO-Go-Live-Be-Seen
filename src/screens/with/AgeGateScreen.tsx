import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PALETTE, TYPOGRAPHY, LAYOUT } from '../../constants/theme';

export default function AgeGateScreen({ navigation }: any) {
  const { verifyAge } = useAuth();
  const [year, setYear] = useState('');

  const handleVerify = () => {
    const y = parseInt(year);
    if (isNaN(y) || year.length !== 4) {
      Alert.alert("Invalid Entry", "Please enter a valid 4-digit year.");
      return;
    }

    // Construct a date (Assuming Jan 1 for coarse check, or add Month/Day inputs)
    const dob = new Date(y, 0, 1);
    const isLegal = verifyAge(dob);

    if (isLegal) {
      // Proceed to Sign Up / Login
      navigation.navigate('Login');
    } else {
      // Soft Rejection - Calm tone, no shame
      Alert.alert(
        "Access Restricted", 
        "HALO requires users to be 18+. We look forward to seeing you in the future."
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[PALETTE.voidBlack, '#1e293b']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.content}>
        <Text style={styles.brand}>HALO</Text>
        
        <GlassPanel style={styles.gatePanel}>
          <Text style={styles.label}>Confirm your birth year</Text>
          <Text style={styles.subLabel}>
            This establishes your protection level.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="YYYY"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="number-pad"
            maxLength={4}
            value={year}
            onChangeText={setYear}
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleVerify}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Enter</Text>
          </TouchableOpacity>
        </GlassPanel>

        <Text style={styles.footer}>
          By entering, you agree to our <Text style={styles.link}>Terms of Service</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: PALETTE.voidBlack,
  },
  content: {
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  brand: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 32,
    color: PALETTE.haloWhite,
    letterSpacing: 4,
    marginBottom: 32,
    opacity: 0.5,
  },
  gatePanel: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  label: {
    fontFamily: TYPOGRAPHY.bold,
    fontSize: 20,
    color: PALETTE.haloWhite,
    marginBottom: 8,
  },
  subLabel: {
    fontFamily: TYPOGRAPHY.regular,
    fontSize: 14,
    color: PALETTE.haloWhite,
    opacity: 0.6,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 16,
    color: PALETTE.haloCyan,
    fontSize: 24,
    fontFamily: TYPOGRAPHY.bold,
    textAlign: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  button: {
    width: '100%',
    backgroundColor: PALETTE.haloBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: PALETTE.haloBlue,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    fontFamily: TYPOGRAPHY.bold,
    color: PALETTE.voidBlack,
    fontSize: 16,
  },
  footer: {
    marginTop: 32,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  link: {
    color: PALETTE.haloWhite,
    textDecorationLine: 'underline',
  }
});
