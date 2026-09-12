import type { Lyrics, LyricsSection } from '@/types';
import type { FetchedLyrics } from './lyricsApi';

const SECTION_HEADER =
  /^(verse\s*\d*|chorus|pre-?chorus|bridge|outro|intro|hook|refrain)\s*:?\s*$/i;

function sectionTypeFromLabel(label: string): LyricsSection['type'] {
  const normalized = label.toLowerCase();
  if (normalized.startsWith('chorus') || normalized.startsWith('hook') || normalized.startsWith('refrain')) {
    return 'chorus';
  }
  if (normalized.startsWith('pre')) return 'pre-chorus';
  if (normalized.startsWith('bridge')) return 'bridge';
  if (normalized.startsWith('outro')) return 'outro';
  if (normalized.startsWith('intro')) return 'intro';
  return 'verse';
}

/**
 * Convert plain lyric text into structured sections for the UI.
 */
export function plainTextToLyrics(
  songId: string,
  fetched: FetchedLyrics,
): Lyrics {
  const lines = fetched.plainText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());

  const sections: LyricsSection[] = [];
  let currentLabel = 'Lyrics';
  let currentType: LyricsSection['type'] = 'verse';
  let currentLines: string[] = [];

  const pushCurrent = () => {
    const cleaned = currentLines.map((line) => line.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    sections.push({
      type: currentType,
      label: currentLabel,
      lines: cleaned,
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      // Blank line = soft break inside the same section.
      if (currentLines.length > 0 && currentLines[currentLines.length - 1] !== '') {
        currentLines.push('');
      }
      continue;
    }

    if (SECTION_HEADER.test(line)) {
      pushCurrent();
      currentLabel = line.replace(/:$/, '');
      currentType = sectionTypeFromLabel(currentLabel);
      currentLines = [];
      continue;
    }

    currentLines.push(line);
  }

  pushCurrent();

  if (sections.length === 0) {
    sections.push({
      type: 'verse',
      label: 'Lyrics',
      lines: ['Lyrics unavailable for this track.'],
    });
  }

  return {
    songId,
    songTitle: fetched.songTitle,
    artistName: fetched.artistName,
    albumTitle: fetched.albumTitle,
    sections,
  };
}
