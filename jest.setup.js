// Jest setup file.
// React Native Testing Library provides its supported matchers directly.

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    VideoView: props => React.createElement(View, props),
    useVideoPlayer: (_source, setup) => {
      const player = {
        loop: false,
        muted: false,
        currentTime: 0,
        play: jest.fn(),
        pause: jest.fn(),
      };
      setup?.(player);
      return player;
    },
  };
});
