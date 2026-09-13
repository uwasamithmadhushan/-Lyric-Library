import type { Lyrics, LyricsSection } from '@/types';
import type { FetchedLyrics } from './lyricsApi';

/** Matches Genius / manuscript headers: Verse:, [Pre-Chorus], Chorus 2, etc. */
const SECTION_HEADER =
  /^\[?\s*(verse\s*\d*|pre[-\s]?chorus\s*\d*|chorus\s*\d*|bridge\s*\d*|outro|intro|hook|refrain)\s*\]?\s*:?\s*$/i;

function sectionTypeFromLabel(label: string): LyricsSection['type'] {
  const normalized = label.toLowerCase().replace(/[[\]]/g, '').trim();
  if (
    normalized.startsWith('chorus') ||
    normalized.startsWith('hook') ||
    normalized.startsWith('refrain')
  ) {
    return 'chorus';
  }
  if (normalized.startsWith('pre')) return 'pre-chorus';
  if (normalized.startsWith('bridge')) return 'bridge';
  if (normalized.startsWith('outro')) return 'outro';
  if (normalized.startsWith('intro')) return 'intro';
  return 'verse';
}

function normalizeHeaderLabel(raw: string): string {
  return raw
    .replace(/^\[|\]$/g, '')
    .replace(/:$/, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function stanzaKey(lines: string[]): string {
  return lines.map((line) => line.trim().toLowerCase()).filter(Boolean).join('\n');
}

/**
 * When the source has no Verse/Chorus markers, infer a manuscript structure
 * from blank-line stanzas (chorus = most repeated block).
 */
function structureUnlabeledStanzas(stanzas: string[][]): LyricsSection[] {
  if (stanzas.length === 0) return [];

  if (stanzas.length === 1) {
    return [{ type: 'verse', label: 'Verse', lines: stanzas[0] }];
  }

  const keys = stanzas.map(stanzaKey);
  const counts = new Map<string, number>();
  for (const key of keys) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let chorusKey: string | null = null;
  let maxCount = 1;
  for (const [key, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      chorusKey = key;
    }
  }
  if (maxCount < 2) chorusKey = null;

  const sections: LyricsSection[] = [];
  let verseCount = 0;
  let seenChorus = false;

  for (let index = 0; index < stanzas.length; index += 1) {
    const lines = stanzas[index];
    const key = keys[index];
    const nextKey = keys[index + 1];
    const hasChorusLater =
      Boolean(chorusKey) && keys.slice(index + 1).some((item) => item === chorusKey);

    if (chorusKey && key === chorusKey) {
      sections.push({ type: 'chorus', label: 'Chorus', lines });
      seenChorus = true;
      continue;
    }

    const nextIsChorus = Boolean(chorusKey) && nextKey === chorusKey;

    // Short block right before the first chorus → Pre-Chorus
    if (
      nextIsChorus &&
      !seenChorus &&
      verseCount >= 1 &&
      lines.filter(Boolean).length <= 4
    ) {
      sections.push({ type: 'pre-chorus', label: 'Pre-Chorus', lines });
      continue;
    }

    // Unique block between choruses after Verse 2 → Bridge
    if (seenChorus && hasChorusLater && verseCount >= 2) {
      sections.push({ type: 'bridge', label: 'Bridge', lines });
      continue;
    }

    // Final unique block after chorus → Outro
    if (seenChorus && index === stanzas.length - 1 && !hasChorusLater) {
      sections.push({ type: 'outro', label: 'Outro', lines });
      continue;
    }

    verseCount += 1;
    sections.push({
      type: 'verse',
      label: `Verse ${verseCount}`,
      lines,
    });
  }

  return sections;
}

function splitPlainStanzas(lines: string[]): string[][] {
  const stanzas: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    const cleaned = current.map((line) => line.trim()).filter(Boolean);
    if (cleaned.length > 0) stanzas.push(cleaned);
    current = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();
  return stanzas;
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
  let currentLabel = '';
  let currentType: LyricsSection['type'] = 'verse';
  let currentLines: string[] = [];
  let sawExplicitHeader = false;

  const pushCurrent = () => {
    const cleaned = currentLines.map((line) => line.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    sections.push({
      type: currentType,
      label: currentLabel || 'Verse',
      lines: cleaned,
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (currentLines.length > 0 && currentLines[currentLines.length - 1] !== '') {
        currentLines.push('');
      }
      continue;
    }

    if (SECTION_HEADER.test(line)) {
      pushCurrent();
      sawExplicitHeader = true;
      currentLabel = normalizeHeaderLabel(line);
      currentType = sectionTypeFromLabel(currentLabel);
      currentLines = [];
      continue;
    }

    currentLines.push(line);
  }

  pushCurrent();

  const resolvedSections =
    !sawExplicitHeader && sections.length <= 1
      ? structureUnlabeledStanzas(splitPlainStanzas(lines))
      : sections;

  const finalSections =
    resolvedSections.length > 0
      ? resolvedSections
      : [
          {
            type: 'verse' as const,
            label: 'Lyrics',
            lines: ['Lyrics unavailable for this track.'],
          },
        ];

  return {
    songId,
    songTitle: fetched.songTitle,
    artistName: fetched.artistName,
    albumTitle: fetched.albumTitle,
    sections: finalSections,
  };
}
