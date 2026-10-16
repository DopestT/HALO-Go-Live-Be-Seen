import React from 'react';
import { render } from '@testing-library/react-native';
import { AsyncState } from '../src/components/media/AsyncState';

describe('AsyncState', () => {
  it.each([
    ['loading', 'LOADING', 'Checking NSCENE for verified content.'],
    ['empty', 'NOTHING HERE YET', 'No verified content is available in this lane yet.'],
    ['unavailable', 'UNAVAILABLE', 'NSCENE data is not available from this deployment right now.'],
    ['error', 'COULD NOT LOAD', 'NSCENE could not load this content.'],
    ['not-found', 'NOT FOUND', 'The requested NSCENE record was not found.'],
  ] as const)('renders honest %s copy', (state, title, message) => {
    const { getByText } = render(<AsyncState state={state} />);
    getByText(title);
    getByText(message);
  });
});
