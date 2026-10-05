import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

export const AccountScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <View style={[styles.container, isWide && styles.containerWide]}>
      <View style={styles.identity}>
        <Text style={styles.eyebrow}>ACCOUNT</Text>
        <Text style={styles.title}>{user?.username ?? 'HALO member'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <View style={[styles.panel, isWide && styles.panelWide]}>
        <Text style={styles.panelTitle}>Your network</Text>
        <Text style={styles.copy}>
          Following, subscriptions, creator tools, connected audiences, security, and export controls will live here.
        </Text>
        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.voidBlack,
    padding: 24,
  },
  containerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 64,
    paddingVertical: 48,
  },
  identity: {
    flex: 1,
    paddingRight: 32,
  },
  eyebrow: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 14,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700',
  },
  email: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginTop: 10,
  },
  panel: {
    width: '100%',
    marginTop: 28,
    padding: 26,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    backgroundColor: theme.colors.deepGray,
  },
  panelWide: {
    flex: 1,
    maxWidth: 620,
    marginTop: 0,
  },
  panelTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  copy: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  button: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
