import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { loadNews, newsAge, NewsItem } from '../api/news';
import { previewMediaByTitle } from '../content/previewMedia';
import { PreviewVideoCard } from './PreviewVideoCard';

const newsroomPreview = previewMediaByTitle['NSCENE Newsroom'];

export function NewsDesk() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [category, setCategory] = useState('All');
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [trackWidth, setTrackWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [linkError, setLinkError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const fetchItems = async () => {
      controller?.abort();
      controller = new AbortController();
      timeout = setTimeout(() => controller?.abort(), 10000);
      try {
        const records = await loadNews(controller.signal);
        if (active) { setItems(records); setStatus('ready'); }
      } catch { if (active) { setItems([]); setStatus('error'); } }
      finally { clearTimeout(timeout); }
    };
    void fetchItems();
    const timer = setInterval(() => { void fetchItems(); }, 5 * 60 * 1000);
    return () => { active = false; clearInterval(timer); clearTimeout(timeout); controller?.abort(); };
  }, [refresh]);

  useEffect(() => {
    offset.setValue(0);
    if (paused || reduceMotion || !trackWidth || !viewportWidth || !items.length) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(offset, { toValue: -trackWidth, duration: Math.max(15000, (trackWidth + viewportWidth) * 28), easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(offset, { toValue: viewportWidth, duration: 0, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [paused, reduceMotion, trackWidth, viewportWidth, items, offset]);

  const open = async (item: NewsItem) => {
    setLinkError('');
    try { await Linking.openURL(item.url); } catch { setLinkError('Could not open this source. Please try again.'); }
  };
  const categories = ['All', ...Array.from(new Set(items.map(item => item.category)))];
  const selected = categories.includes(category) ? category : 'All';
  const visible = items.filter(item => selected === 'All' || item.category === selected);
  const idle = status === 'loading' ? 'Loading headlines…' : status === 'error' ? 'News feed unavailable — retry below.' : 'Your news desk is ready. No headlines published yet.';
  return <View style={s.desk}>
    <View style={s.chyron}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle news feed" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={s.badge}><Text style={s.badgeText}>NSCENE NEWS</Text></TouchableOpacity>
      <View style={s.trackWindow} onLayout={event => setViewportWidth(event.nativeEvent.layout.width)}>
        {items.length ? <Animated.View onLayout={event => setTrackWidth(event.nativeEvent.layout.width)} style={[s.track, { transform: [{ translateX: offset }] }]}>{items.map(item => <TouchableOpacity key={item.id} accessibilityRole="link" onPress={() => void open(item)}><Text numberOfLines={1} style={s.headline}>{item.title}  <Text style={s.source}>— {item.source} · {newsAge(item.publishedAt)}</Text>   <Text style={s.separator}>◆</Text>   </Text></TouchableOpacity>)}</Animated.View> : <Text style={s.idle}>{idle}</Text>}
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={paused ? 'Play news ticker' : 'Pause news ticker'} accessibilityState={{ disabled: reduceMotion || !items.length }} disabled={reduceMotion || !items.length} onPress={() => setPaused(!paused)} style={s.control}><Text style={s.controlText}>{reduceMotion ? 'STATIC' : paused ? 'PLAY' : 'PAUSE'}</Text></TouchableOpacity>
    </View>
    {expanded && <View style={s.feed}>
      <View style={s.heading}><View><Text accessibilityRole="header" style={s.title}>The News Feed</Text><Text style={s.sub}>Headlines. Original sources. The wider picture.</Text></View><TouchableOpacity accessibilityRole="button" onPress={() => setRefresh(refresh + 1)} style={s.refresh}><Text style={s.gold}>Refresh ↻</Text></TouchableOpacity></View>
      <View style={s.newsroomPreview}><PreviewVideoCard media={newsroomPreview} height={180} /></View>
      {items.length ? <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{categories.map(name => <TouchableOpacity key={name} accessibilityRole="button" accessibilityState={{ selected: selected === name }} onPress={() => setCategory(name)} style={[s.filter, selected === name && s.selected]}><Text style={selected === name ? s.badgeText : s.source}>{name}</Text></TouchableOpacity>)}</ScrollView>
        <View style={s.cards}>{visible.map(item => <TouchableOpacity key={item.id} accessibilityRole="link" accessibilityLabel={`${item.title}. Read at ${item.source}`} onPress={() => void open(item)} style={s.card}><Text style={s.gold}>{item.category.toUpperCase()}</Text><Text style={s.cardTitle}>{item.title}</Text><Text style={s.source}>{item.source} · {newsAge(item.publishedAt)}</Text><Text style={s.date}>{new Date(item.publishedAt).toLocaleString()}{Date.now() - Date.parse(item.publishedAt) > 86400000 ? ' · Older story' : ''}</Text><Text style={s.read}>Read original ↗</Text></TouchableOpacity>)}</View></> : <View style={s.empty}><Text style={s.idle}>{idle}</Text><Text style={s.sub}>Source-linked stories will appear here when the news feed is connected.</Text></View>}
      {!!linkError && <Text accessibilityLiveRegion="polite" style={s.sub}>{linkError}</Text>}
    </View>}
  </View>;
}
const s = StyleSheet.create({
  desk: { marginTop: 12, borderWidth: 1, borderColor: '#34382c', borderRadius: 7, overflow: 'hidden' },
  chyron: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#101713', minHeight: 46 },
  badge: { alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#ffda77' }, badgeText: { color: '#17160f', fontSize: 11, fontWeight: '900' },
  trackWindow: { flex: 1, overflow: 'hidden', minHeight: 46, justifyContent: 'center' }, track: { flexDirection: 'row', alignSelf: 'flex-start', flexShrink: 0, paddingLeft: 16 }, headline: { color: '#fff', fontSize: 13 }, source: { color: '#abb5ae', fontSize: 11 }, separator: { color: '#ffda77' },
  control: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' }, controlText: { color: '#ffda77', fontSize: 10, fontWeight: '700' },
  idle: { color: '#d8dfda', fontSize: 13, paddingHorizontal: 12, lineHeight: 20 },
  feed: { padding: 18, backgroundColor: '#080d0a' }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, title: { color: '#fff', fontSize: 23, fontWeight: '800' }, sub: { color: '#96a39a', fontSize: 12, lineHeight: 19, marginTop: 6 }, refresh: { minHeight: 44, justifyContent: 'center' }, gold: { color: '#ffda77', fontSize: 11, fontWeight: '700' },
  newsroomPreview: { width: '100%', maxWidth: 380, marginTop: 16, marginBottom: 2 },
  filters: { gap: 8, paddingVertical: 16 }, filter: { paddingHorizontal: 14, minHeight: 34, justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#384039' }, selected: { backgroundColor: '#ffda77', borderColor: '#ffda77' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { flexBasis: 240, flexGrow: 1, padding: 18, borderWidth: 1, borderColor: '#27342a', borderRadius: 7 }, cardTitle: { color: '#fff', fontSize: 18, lineHeight: 25, fontWeight: '700', marginVertical: 12 }, date: { color: '#8f9c93', fontSize: 10, marginTop: 5 }, read: { color: '#ffda77', fontSize: 12, marginTop: 18 }, empty: { paddingVertical: 18 },
});
