import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError('Unable to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, isWide && styles.contentWide]}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <Text style={styles.eyebrow}>INDEPENDENT LIVE NETWORK</Text>
          <Text style={styles.title}>Tube</Text>
          <Text style={styles.subtitle}>Go Live. Be Seen.</Text>
          <Text style={styles.heroCopy}>
            Live video built around creators, communities, and public-interest broadcasting.
          </Text>
        </View>

        <View style={[styles.authColumn, isWide && styles.authColumnWide]}>
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSubtitle}>Enter Tube and pick up where you left off.</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Sign in'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.voidBlack,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  contentWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 48,
    paddingVertical: 48,
  },
  hero: {
    justifyContent: 'center',
    marginBottom: 32,
  },
  heroWide: {
    flex: 1.35,
    marginBottom: 0,
    paddingRight: 64,
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    letterSpacing: 2.5,
    marginBottom: 18,
  },
  title: {
    fontSize: 64,
    lineHeight: 68,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 28,
    lineHeight: 34,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  heroCopy: {
    maxWidth: 720,
    marginTop: 24,
    fontSize: theme.typography.fontSize.lg,
    lineHeight: 28,
    color: theme.colors.textTertiary,
  },
  authColumn: {
    width: '100%',
    justifyContent: 'center',
  },
  authColumnWide: {
    flex: 0.75,
    maxWidth: 560,
  },
  glassCard: {
    width: '100%',
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: 30,
    ...theme.shadows.medium,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.darkGray,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  button: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadows.small,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
  },
});
