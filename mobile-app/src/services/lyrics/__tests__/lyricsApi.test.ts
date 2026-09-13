import { normalizeForLyricsLookup } from '../lyricsApi';

describe('normalizeForLyricsLookup', () => {
  it('strips piano cover channel noise', () => {
    expect(
      normalizeForLyricsLookup(
        'Taylor Swift Piano Covers',
        'Evermore - Piano Cover',
      ),
    ).toEqual({
      artistName: 'Taylor Swift',
      songTitle: 'Evermore',
    });
  });

  it('strips nested album crumbs from cover artist names', () => {
    expect(
      normalizeForLyricsLookup(
        'Taylor Swift - Evermore - Piano Covers',
        'Evermore - Piano Cover',
      ),
    ).toEqual({
      artistName: 'Taylor Swift',
      songTitle: 'Evermore',
    });
  });

  it('leaves clean metadata unchanged', () => {
    expect(normalizeForLyricsLookup('Taylor Swift', 'Evermore')).toEqual({
      artistName: 'Taylor Swift',
      songTitle: 'Evermore',
    });
  });
});
