import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { GlassPanel } from './GlassPanel';
import { PALETTE, TYPOGRAPHY, LAYOUT } from '../../constants/theme';

interface StreamCardProps {
  creatorName: string;
  title: string;
  viewerCount: number;
  isAdult: boolean;
  thumbnail: string;
}

export const StreamCard = ({ creatorName, title, viewerCount, isAdult }: StreamCardProps) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.container}>
      {/* Background Image Placeholder */}
      <View style={styles.imagePlaceholder}>
         {/* Live Indicator */}
         <View style={styles.liveBadge}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>LIVE</Text>
         </View>
         
         {isAdult && (
           <View style={styles.adultBadge}>
             <Text style={styles.adultText}>18+</Text>
           </View>
         )}
      </View>

      <GlassPanel style={styles.infoPanel} intensity={15}>
        <Text style={styles.creator}>{creatorName}</Text>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.viewers}>{viewerCount.toLocaleString()} presence</Text>
      </GlassPanel>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380, // High density would be 150-200. We go large.
    marginBottom: 24,
    borderRadius: LAYOUT.radius,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 16,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    height: 90,
  },
  creator: {
    fontFamily: TYPOGRAPHY.bold,
    color: PALETTE.haloCyan,
    fontSize: 14,
  },
  title: {
    fontFamily: TYPOGRAPHY.regular,
    color: PALETTE.haloWhite,
    fontSize: 18,
    marginTop: 4,
  },
  viewers: {
    fontFamily: TYPOGRAPHY.regular,
    color: PALETTE.haloWhite,
    opacity: 0.5,
    fontSize: 12,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4b4b',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: TYPOGRAPHY.bold,
  },
  adultBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderColor: PALETTE.warning,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adultText: {
    color: PALETTE.warning,
    fontSize: 10,
    fontFamily: TYPOGRAPHY.bold,
  }
});
