import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PublicCreator } from '../../api/types';
import { theme } from '../../theme';

export const CreatorCard = ({
  creator,
  onOpen,
}: {
  creator: PublicCreator;
  onOpen: (creatorId: number) => void;
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={`Open creator ${creator.display_name || creator.username}`}
    onPress={() => onOpen(creator.id)}
    style={styles.card}
  >
    {creator.avatar_url ? (
      <Image
        accessibilityLabel={`Avatar for ${creator.display_name || creator.username}`}
        source={{ uri: creator.avatar_url }}
        style={styles.avatar}
      />
    ) : (
      <View accessibilityLabel="No creator avatar available" style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitial}>{(creator.display_name || creator.username).slice(0, 1).toUpperCase()}</Text>
      </View>
    )}
    <View style={styles.copy}>
      <Text style={styles.name}>{creator.display_name || creator.username}</Text>
      <Text style={styles.username}>@{creator.username}</Text>
      {creator.bio ? <Text numberOfLines={3} style={styles.bio}>{creator.bio}</Text> : null}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: 420,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.elevated,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.elevated,
  },
  avatarInitial: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  username: {
    marginTop: 3,
    color: theme.colors.signalBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  bio: {
    marginTop: 9,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
