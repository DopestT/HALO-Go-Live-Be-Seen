export type PreviewMediaItem = {
  id: string;
  title: string;
  category: string;
  videoUri: string;
  posterUri: string;
  sourcePage: string;
};

const poster = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;

export const previewMedia: PreviewMediaItem[] = [
  {
    id: 'morning-vibes',
    title: 'Morning Vibes',
    category: 'Just Chatting',
    videoUri: 'https://www.pexels.com/download/video/9032610/',
    posterUri: poster('photo-1524504388940-b1c1722653e1'),
    sourcePage: 'https://www.pexels.com/video/a-woman-recording-herself-with-a-camera-9032610/',
  },
  {
    id: 'acoustic-thursday',
    title: 'Acoustic Thursday',
    category: 'Music',
    videoUri: 'https://www.pexels.com/download/video/6670708/',
    posterUri: poster('photo-1510915361894-db8b60106cb1'),
    sourcePage: 'https://www.pexels.com/video/man-playing-an-acoustic-guitar-6670708/',
  },
  {
    id: 'workout-with-me',
    title: 'Workout With Me',
    category: 'Fitness',
    videoUri: 'https://www.pexels.com/download/video/3196428/',
    posterUri: poster('photo-1517836357463-d25dfeac3438'),
    sourcePage: 'https://www.pexels.com/video/woman-doing-lifting-exercises-in-a-gym-3196428/',
  },
  {
    id: 'game-night',
    title: 'Game Night',
    category: 'Gaming',
    videoUri: 'https://www.pexels.com/download/video/8128428/',
    posterUri: poster('photo-1542751371-adc38448a05e'),
    sourcePage: 'https://www.pexels.com/video/man-removing-the-headset-after-playing-computer-game-8128428/',
  },
  {
    id: 'beach-walk',
    title: 'Beach Walk',
    category: 'Travel',
    videoUri: 'https://www.pexels.com/download/video/32155949/',
    posterUri: poster('photo-1507525428034-b723cf961d3e'),
    sourcePage: 'https://www.pexels.com/video/man-strolling-by-the-beach-with-cityscape-view-32155949/',
  },
  {
    id: 'quick-recipe-hack',
    title: 'Quick Recipe Hack',
    category: 'Food',
    videoUri: 'https://www.pexels.com/download/video/12691853/',
    posterUri: poster('photo-1547592180-85f173990554'),
    sourcePage: 'https://www.pexels.com/video/a-food-vlogger-recording-a-video-in-her-kitchen-12691853/',
  },
  {
    id: 'art-time-lapse',
    title: 'Art Time Lapse',
    category: 'Art',
    videoUri: 'https://www.pexels.com/download/video/8037396/',
    posterUri: poster('photo-1541961017774-22349e4a1262'),
    sourcePage: 'https://www.pexels.com/video/a-painter-painting-on-a-canvas-8037396/',
  },
  {
    id: 'behind-the-scenes',
    title: 'Behind the Scenes',
    category: 'Photography',
    videoUri: 'https://www.pexels.com/download/video/31512161/',
    posterUri: poster('photo-1516035069371-29a1b244cc32'),
    sourcePage: 'https://www.pexels.com/video/professional-portrait-photoshoot-behind-the-scenes-31512161/',
  },
  {
    id: 'nscene-newsroom',
    title: 'NSCENE Newsroom',
    category: 'News',
    videoUri: 'https://www.pexels.com/download/video/38630315/',
    posterUri: poster('photo-1495020689067-958852a7765e'),
    sourcePage: 'https://www.pexels.com/video/professional-podcast-interview-in-modern-studio-38630315/',
  },
];

export const previewMediaByTitle = Object.fromEntries(
  previewMedia.map(item => [item.title, item]),
) as Record<string, PreviewMediaItem>;

export const previewMediaByCategory = Object.fromEntries(
  previewMedia.map(item => [item.category, item]),
) as Record<string, PreviewMediaItem>;
