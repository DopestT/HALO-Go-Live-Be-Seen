import React, { useRef, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { NewsDesk } from './NewsDesk';
import type { PublicSection } from '../product';

const photo = (id: string, width = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
const images = {
  coast: photo('photo-1507525428034-b723cf961d3e', 1800),
  portrait: photo('photo-1524504388940-b1c1722653e1', 1800),
  music: photo('photo-1510915361894-db8b60106cb1'),
  fitness: photo('photo-1517836357463-d25dfeac3438'),
  gaming: photo('photo-1542751371-adc38448a05e'),
  food: photo('photo-1547592180-85f173990554'),
  art: photo('photo-1541961017774-22349e4a1262'),
  camera: photo('photo-1516035069371-29a1b244cc32'),
  mountains: photo('photo-1464822759023-fed622ff2c3b'),
};
const clips = [
  ['Sunset in Santorini', 'Travel', images.coast], ['Guitar Loop', 'Music', images.music],
  ['Quick Recipe Hack', 'Food', images.food], ['Daily Motivation', 'Fitness', images.fitness],
  ['Art Time Lapse', 'Art', images.art], ['Behind the Scenes', 'Photography', images.camera],
];
const shows = [
  ['Creators Unfiltered', 'Weekly conversations with creators.', images.portrait],
  ['Travel Sessions', 'Real places. Real people.', images.mountains],
  ['The Creative Room', 'Ideas, art, and what’s next.', images.art],
  ['Fit Life', 'Movement. Wellness. Everyday.', images.fitness],
];
const communities = [
  ['Travel Life', images.coast], ['Fitness Crew', images.fitness], ['Creative Minds', images.art],
  ['Food Lovers', images.food], ['Gaming Hub', images.gaming], ['Photography', images.camera],
];
type Props = { children: React.ReactNode; previewLive?: boolean; onSection?: (section: PublicSection) => void };

export function DiscoveryShowcase({ children, previewLive, onSection }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const [slide, setSlide] = useState(0);
  const [query, setQuery] = useState('');
  const scroll = useRef<ScrollView>(null);
  const liveY = useRef(0);
  const heroImages = [images.portrait, images.coast, images.mountains];
  const visibleCommunities = communities.filter(([name]) => name.toLowerCase().includes(query.toLowerCase()));
  const heading = (title: string, section: PublicSection) => (
    <View style={s.heading}><Text accessibilityRole="header" style={s.sectionTitle}>{title}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => onSection?.(section)} style={s.viewAll}><Text style={s.secondary}>View All  ›</Text></TouchableOpacity>
    </View>
  );
  return (
    <ScrollView ref={scroll} style={s.page} contentContainerStyle={s.content}>
      <ImageBackground source={{ uri: heroImages[slide] }} resizeMode="cover" style={[s.hero, compact && s.heroMobile]} imageStyle={s.heroImage}>
        <View style={s.shade} />
        <View style={[s.heroCopy, compact && s.heroCopyMobile]}>
          <Text accessibilityRole="header" style={[s.wordmark, compact && s.wordmarkMobile]}>NSCENE</Text>
          <Text style={s.tagline}>SEE IT. SHARE IT. LIVE IT.</Text>
          <Text style={s.description}>Live streams, original creators, short clips, and communities — all in one place.</Text>
          <View style={s.actions}>
            <TouchableOpacity accessibilityRole="button" style={s.goldButton} onPress={() => scroll.current?.scrollTo({ y: liveY.current, animated: true })}><Text style={s.darkText}>▶  Watch Live</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={s.outlineButton} onPress={() => onSection?.('creators')}><Text style={s.buttonText}>Explore</Text></TouchableOpacity>
          </View>
        </View>
        <View style={s.carousel}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous featured image" onPress={() => setSlide((slide + 2) % 3)} style={s.arrow}><Text style={s.arrowText}>‹</Text></TouchableOpacity>
          <View style={s.dots}>{heroImages.map((_, index) => <TouchableOpacity key={index} accessibilityRole="button" accessibilityLabel={`Featured image ${index + 1}`} accessibilityState={{ selected: slide === index }} onPress={() => setSlide(index)} style={s.dotTarget}><View style={[s.dot, slide === index && s.activeDot]} /></TouchableOpacity>)}</View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next featured image" onPress={() => setSlide((slide + 1) % 3)} style={s.arrow}><Text style={s.arrowText}>›</Text></TouchableOpacity>
        </View>
      </ImageBackground>
      <NewsDesk />
      <View style={s.section} onLayout={(event) => { liveY.current = event.nativeEvent.layout.y; }}>
        {heading('Live Now', 'live')}{children}
        {previewLive && <><Text style={s.previewNote}>Discover the possibilities · Preview cards, not live broadcasts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{[
            ['Morning Vibes', 'Just Chatting', images.portrait], ['Acoustic Thursday', 'Music', images.music], ['Workout With Me', 'Fitness', images.fitness], ['Game Night', 'Gaming', images.gaming], ['Beach Walk', 'Travel', images.coast],
          ].map(([title, category, uri]) => <TouchableOpacity accessibilityRole="button" key={title} style={{ width: compact ? 230 : Math.max(210, Math.min(265, (width - 100) / 5)) }} onPress={() => onSection?.('creators')}><ImageBackground source={{ uri }} style={[s.thumbnail, { height: 155 }]} imageStyle={s.rounded}><Text style={s.previewBadge}>PREVIEW</Text></ImageBackground><Text style={s.cardTitle}>{title}</Text><Text style={s.category}>{category}</Text></TouchableOpacity>)}</ScrollView></>}

      </View>
      <View style={s.section}>
        {heading('Trending Clips', 'clips')}
        <Text style={s.previewNote}>Preview collection · Illustrative content, not published clips</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {clips.map(([title, category, uri]) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Explore ${category.toLowerCase()} clips`} key={title} style={[s.clip, { width: compact ? 176 : Math.max(170, Math.min(216, (width - 116) / 6)) }]} onPress={() => onSection?.('clips')}>
            <ImageBackground source={{ uri }} style={s.thumbnail} imageStyle={s.rounded}><Text style={s.previewBadge}>PREVIEW</Text></ImageBackground>
            <Text numberOfLines={1} style={s.cardTitle}>{title}</Text><Text style={s.category}>{category}</Text>
          </TouchableOpacity>)}
        </ScrollView>
      </View>
      <View style={s.section}>
        {heading('Featured Shows', 'shows')}
        <Text style={s.previewNote}>Series concepts · Not yet streaming</Text>
        <View style={s.showGrid}>{shows.map(([title, copy, uri]) => <TouchableOpacity accessibilityRole="button" key={title} onPress={() => onSection?.('shows')} style={[s.show, { width: compact ? '48%' : '23.8%' }]}>
          <ImageBackground source={{ uri }} style={s.showImage} imageStyle={s.rounded}><View style={s.showShade} /><Text style={[s.showTitle, compact && { fontSize: 24 }]}>{title}</Text><View><Text style={s.showCopy}>{copy}</Text><Text style={s.showExplore}>Explore  ↗</Text></View></ImageBackground>
        </TouchableOpacity>)}</View>
      </View>
      <View style={[s.section, s.communitySection]}>
        <View style={s.communityHeading}><View><Text accessibilityRole="header" style={s.sectionTitle}>Communities</Text><Text style={s.descriptionSmall}>Find your people. Share what you love.</Text></View>
          <View style={s.communityTools}><TextInput accessibilityLabel="Search community previews" placeholder="Search communities…" placeholderTextColor="#9a9e9d" value={query} onChangeText={setQuery} style={s.search} /><TouchableOpacity accessibilityRole="button" onPress={() => onSection?.('communities')} style={s.goldButton}><Text style={s.darkText}>Create Community</Text></TouchableOpacity></View>
        </View>
        <Text style={s.previewNote}>Community previews · Membership is not yet available</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{visibleCommunities.map(([name, uri]) => <View key={name} style={[s.community, { width: compact ? 176 : Math.max(170, Math.min(216, (width - 116) / 6)) }]}><ImageBackground source={{ uri }} style={s.thumbnail} imageStyle={s.rounded} /><Text style={s.cardTitle}>{name}</Text><Text style={s.category}>Coming soon</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Explore ${name}`} style={s.join} onPress={() => onSection?.('communities')}><Text style={s.buttonText}>Explore</Text></TouchableOpacity></View>)}</ScrollView>
        {!visibleCommunities.length && <Text style={s.secondary}>No communities match “{query}”.</Text>}
      </View>
      <Text style={s.footer}>NSCENE  ·  SEE IT. SHARE IT. LIVE IT.</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#030706' }, content: { width: '100%', maxWidth: 1440, alignSelf: 'center', padding: 12, paddingBottom: 32 },
  hero: { height: 400, justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }, heroMobile: { height: 390 }, heroImage: { borderRadius: 8 },
  shade: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,.34)' },
  heroCopy: { padding: 44, maxWidth: 650, backgroundColor: 'rgba(0,0,0,.18)' }, heroCopyMobile: { padding: 24 },
  wordmark: { color: '#fff', fontWeight: '900', fontSize: 76, letterSpacing: -3 }, wordmarkMobile: { fontSize: 51 },
  tagline: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 2 }, description: { color: '#fff', fontSize: 16, lineHeight: 24, maxWidth: 370, marginTop: 14 },
  actions: { flexDirection: 'row', gap: 14, marginTop: 24 }, goldButton: { minHeight: 44, paddingHorizontal: 22, backgroundColor: '#ffda77', borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, darkText: { color: '#17160f', fontSize: 13, fontWeight: '800' },
  outlineButton: { borderColor: '#b5b8b5', borderWidth: 1, borderRadius: 7, paddingHorizontal: 28, minHeight: 44, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.35)' }, buttonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  carousel: { position: 'absolute', bottom: 10, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, arrow: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#929995', backgroundColor: '#0c1214', alignItems: 'center', justifyContent: 'center' }, arrowText: { color: '#fff', fontSize: 28 }, dots: { flexDirection: 'row' }, dotTarget: { width: 26, height: 32, alignItems: 'center', justifyContent: 'center' }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#888' }, activeDot: { width: 18, backgroundColor: '#fff' },
  section: { marginTop: 24, paddingHorizontal: 8 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, sectionTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -.6 }, viewAll: { minHeight: 36, justifyContent: 'center' }, secondary: { color: '#c9cecb', fontSize: 12 }, previewNote: { color: '#959d98', fontSize: 11, marginBottom: 12 }, row: { gap: 16 }, clip: { flexShrink: 0 }, thumbnail: { height: 125, overflow: 'hidden', borderRadius: 6 }, rounded: { borderRadius: 6 }, previewBadge: { position: 'absolute', right: 6, bottom: 6, backgroundColor: '#141a18', color: '#eee', padding: 4, borderRadius: 3, fontSize: 9, fontWeight: '700' }, cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 9 }, category: { color: '#9da6a0', fontSize: 11, marginTop: 5 },
  showGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 }, show: { overflow: 'hidden', borderRadius: 6 }, showImage: { height: 222, padding: 20, justifyContent: 'space-between' }, showShade: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,.46)' }, showTitle: { color: '#fff', fontSize: 32, lineHeight: 35, fontWeight: '900', maxWidth: 200 }, showCopy: { color: '#fff', fontSize: 12, lineHeight: 18 }, showExplore: { color: '#ffda77', fontSize: 13, fontWeight: '700', marginTop: 12 },
  communitySection: { borderTopWidth: 1, borderColor: '#424943', paddingTop: 22 }, communityHeading: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', marginBottom: 14 }, descriptionSmall: { color: '#d8ddd9', fontSize: 13, marginTop: 6 }, communityTools: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }, search: { color: '#fff', backgroundColor: '#121917', borderRadius: 24, paddingHorizontal: 16, height: 44, width: 230 }, community: { borderWidth: 1, borderColor: '#202922', borderRadius: 7, padding: 8 }, join: { marginTop: 16, minHeight: 38, borderWidth: 1, borderColor: '#a58b4c', borderRadius: 5, alignItems: 'center', justifyContent: 'center' }, footer: { color: '#737d76', fontSize: 10, letterSpacing: 2, textAlign: 'center', marginTop: 40 },
});
