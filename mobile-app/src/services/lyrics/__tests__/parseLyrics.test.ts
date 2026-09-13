import { plainTextToLyrics } from '../parseLyrics';

describe('plainTextToLyrics', () => {
  it('keeps explicit section headers in order', () => {
    const lyrics = plainTextToLyrics('s1', {
      songTitle: 'Demo',
      artistName: 'Artist',
      plainText: [
        'Verse:',
        'Line one',
        'Line two',
        '',
        'Pre-Chorus:',
        'Rising up',
        '',
        'Chorus:',
        'Sing it loud',
        '',
        'Verse 2:',
        'Next part',
        '',
        'Bridge:',
        'Hold on',
      ].join('\n'),
      source: 'lrclib',
    });

    expect(lyrics.sections.map((s) => s.label)).toEqual([
      'Verse',
      'Pre-Chorus',
      'Chorus',
      'Verse 2',
      'Bridge',
    ]);
  });

  it('parses bracket headers', () => {
    const lyrics = plainTextToLyrics('s2', {
      songTitle: 'Demo',
      artistName: 'Artist',
      plainText: '[Verse 1]\nA\n\n[Chorus]\nB\nB',
      source: 'lrclib',
    });

    expect(lyrics.sections.map((s) => s.label)).toEqual(['Verse 1', 'Chorus']);
  });

  it('infers verse / chorus structure from repeated stanzas', () => {
    const chorus = 'We climb\nWe fall';
    const lyrics = plainTextToLyrics('s3', {
      songTitle: 'Demo',
      artistName: 'Artist',
      plainText: [
        'Speak soft',
        'Stay close',
        '',
        'Our smiles hanging',
        'On the wall',
        '',
        chorus,
        '',
        'No mystery',
        'No guessing',
        '',
        chorus,
      ].join('\n'),
      source: 'lrclib',
    });

    expect(lyrics.sections.map((s) => s.label)).toEqual([
      'Verse 1',
      'Pre-Chorus',
      'Chorus',
      'Verse 2',
      'Chorus',
    ]);
  });
});
