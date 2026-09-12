/**
 * Curated artist + song catalog used for Artists / Songs browse defaults.
 * Replaces the old small featured ID lists.
 */

export interface CatalogEntry {
  artist: string;
  songs: string[];
}

const RAW_CATALOG: CatalogEntry[] = [
  { artist: 'Taylor Swift', songs: ['Blank Space', 'Cruel Summer', 'Anti-Hero'] },
  { artist: 'The Weeknd', songs: ['Blinding Lights', 'Starboy', 'Save Your Tears'] },
  { artist: 'Bruno Mars', songs: ['Just the Way You Are', 'Uptown Funk', 'Locked Out of Heaven', 'Grenade', '24K Magic', 'When I Was Your Man'] },
  { artist: 'Ariana Grande', songs: ['7 rings', 'thank u, next', 'Into You'] },
  { artist: 'Billie Eilish', songs: ['bad guy', 'lovely', 'BIRDS OF A FEATHER'] },
  { artist: 'Drake', songs: ["God's Plan", 'One Dance', 'Hotline Bling'] },
  { artist: 'Justin Bieber', songs: ['Sorry', 'Love Yourself', 'Baby'] },
  { artist: 'Ed Sheeran', songs: ['Perfect', 'Shape of You', 'Photograph'] },
  { artist: 'Rihanna', songs: ['Diamonds', 'Umbrella', 'We Found Love'] },
  { artist: 'Lady Gaga', songs: ['Poker Face', 'Bad Romance', 'Shallow'] },
  { artist: 'Beyoncé', songs: ['Halo', 'Crazy in Love', 'Single Ladies'] },
  { artist: 'Eminem', songs: ['Lose Yourself', 'Mockingbird', 'Without Me'] },
  { artist: 'Adele', songs: ['Hello', 'Someone Like You', 'Rolling in the Deep'] },
  { artist: 'Dua Lipa', songs: ['Levitating', 'New Rules', "Don't Start Now"] },
  { artist: 'Bad Bunny', songs: ['Tití Me Preguntó', 'Moscow Mule', 'DtMF'] },
  { artist: 'Kendrick Lamar', songs: ['HUMBLE.', 'DNA.', 'Not Like Us'] },
  { artist: 'SZA', songs: ['Kill Bill', 'Snooze', 'Good Days'] },
  { artist: 'Post Malone', songs: ['Circles', 'Sunflower', 'Rockstar'] },
  { artist: 'Harry Styles', songs: ['As It Was', 'Watermelon Sugar', 'Sign of the Times'] },
  { artist: 'Miley Cyrus', songs: ['Flowers', 'Wrecking Ball', 'Party in the U.S.A.'] },
  { artist: 'Selena Gomez', songs: ['Lose You to Love Me', 'Wolves', 'Hands to Myself', 'Rare', 'Good for You'] },
  { artist: 'Katy Perry', songs: ['Firework', 'Roar', 'Dark Horse'] },
  { artist: 'Maroon 5', songs: ['Sugar', 'Girls Like You', 'Memories', 'This Love', 'Payphone'] },
  { artist: 'Coldplay', songs: ['Yellow', 'Viva La Vida', 'A Sky Full of Stars'] },
  { artist: 'Imagine Dragons', songs: ['Believer', 'Thunder', 'Demons'] },
  { artist: 'OneRepublic', songs: ['Counting Stars', 'Apologize', "I Ain't Worried"] },
  { artist: 'Shawn Mendes', songs: ['Treat You Better', 'Stitches', "There's Nothing Holdin' Me Back"] },
  { artist: 'Camila Cabello', songs: ['Havana', 'Señorita', 'Never Be the Same'] },
  { artist: 'Olivia Rodrigo', songs: ['drivers license', 'good 4 u', 'vampire'] },
  { artist: 'Sabrina Carpenter', songs: ['Espresso', 'Please Please Please', 'Taste'] },
  { artist: 'Doja Cat', songs: ['Say So', 'Woman', 'Paint The Town Red'] },
  { artist: 'Nicki Minaj', songs: ['Super Bass', 'Starships', 'Anaconda'] },
  { artist: 'Cardi B', songs: ['Bodak Yellow', 'I Like It', 'WAP'] },
  { artist: 'Travis Scott', songs: ['SICKO MODE', 'Goosebumps', 'Highest in the Room'] },
  { artist: 'Future', songs: ['Mask Off', 'Life Is Good', 'Wait for U'] },
  { artist: 'Metro Boomin', songs: ["Creepin'", 'Superhero', 'Am I Dreaming'] },
  { artist: '21 Savage', songs: ['a lot', 'Bank Account', 'redrum'] },
  { artist: 'J. Cole', songs: ['No Role Modelz', 'Middle Child', 'Wet Dreamz'] },
  { artist: 'Nick Jonas', songs: ['Jealous', 'Chains', 'Close'] },
  { artist: 'Jonas Brothers', songs: ['Sucker', "Burnin' Up", 'What a Man Gotta Do'] },
  { artist: 'BTS', songs: ['Dynamite', 'Butter', 'Boy With Luv'] },
  { artist: 'BLACKPINK', songs: ['DDU-DU DDU-DU', 'How You Like That', 'Kill This Love'] },
  { artist: 'Jungkook', songs: ['Seven', 'Standing Next to You', '3D'] },
  { artist: 'Jimin', songs: ['Like Crazy', 'Who', 'Set Me Free Pt.2'] },
  { artist: 'V', songs: ['Love Me Again', 'Slow Dancing', 'FRI(END)S'] },
  { artist: 'ROSÉ', songs: ['APT.', 'On The Ground', 'Gone'] },
  { artist: 'Jennie', songs: ['SOLO', 'Mantra', 'like JENNIE'] },
  { artist: 'Lisa', songs: ['MONEY', 'LALISA', 'Rockstar'] },
  { artist: 'TWICE', songs: ['What Is Love?', 'TT', 'Feel Special'] },
  { artist: 'NewJeans', songs: ['Hype Boy', 'Super Shy', 'OMG'] },
  { artist: 'Arijit Singh', songs: ['Tum Hi Ho', 'Chaleya', 'Kesariya'] },
  { artist: 'A.R. Rahman', songs: ['Jai Ho', 'Kun Faya Kun', 'Chaiyya Chaiyya'] },
  { artist: 'Shreya Ghoshal', songs: ['Manwa Laage', 'Agar Tum Mil Jao', 'Teri Ore'] },
  { artist: 'Atif Aslam', songs: ['Tera Hone Laga Hoon', 'Jeena Jeena', 'Tajdar-e-Haram'] },
  { artist: 'Pritam', songs: ['Kesariya', 'Tum Se Hi', 'Gerua'] },
  { artist: 'Neha Kakkar', songs: ['Aankh Marey', 'Dilbar', 'Kala Chashma'] },
  { artist: 'Diljit Dosanjh', songs: ['Lover', 'Born to Shine', 'Do You Know'] },
  { artist: 'Karan Aujla', songs: ['Tauba Tauba', 'Softly', '52 Bars'] },
  { artist: 'AP Dhillon', songs: ['Excuses', 'Brown Munde', 'Insane'] },
  { artist: 'Sidhu Moose Wala', songs: ['295', 'So High', 'The Last Ride'] },
  { artist: 'Shakira', songs: ["Hips Don't Lie", 'Waka Waka', 'Whenever, Wherever'] },
  { artist: 'Jennifer Lopez', songs: ['On the Floor', "Love Don't Cost a Thing", 'Jenny from the Block'] },
  { artist: 'Pitbull', songs: ['Give Me Everything', 'Timber', 'International Love'] },
  { artist: 'Daddy Yankee', songs: ['Gasolina', 'Dura', 'Con Calma'] },
  { artist: 'J Balvin', songs: ['Mi Gente', 'Ginza', 'Safari'] },
  { artist: 'Karol G', songs: ['Tusa', 'Provenza', 'QLONA'] },
  { artist: 'Maluma', songs: ['Hawái', 'Felices los 4', 'Borro Cassette'] },
  { artist: 'Ozuna', songs: ['Caramelo', 'Taki Taki', 'Se Preparó'] },
  { artist: 'Anuel AA', songs: ['China', 'Bebé', 'Secreto'] },
  { artist: 'Feid', songs: ['Feliz Cumpleaños Ferxxo', 'LUNA', 'CHORRITO PA LAS ANIMAS'] },
  { artist: 'Luis Fonsi', songs: ['Despacito', 'Échame la Culpa', 'Aquí Estoy Yo'] },
  { artist: 'Enrique Iglesias', songs: ['Hero', 'Bailando', 'Subeme la Radio'] },
  { artist: 'Ricky Martin', songs: ["Livin' la Vida Loca", 'La Copa de la Vida', "Vente Pa' Ca"] },
  { artist: 'Marc Anthony', songs: ['Vivir Mi Vida', 'Flor Pálida', 'Qué Precio Tiene el Cielo'] },
  { artist: 'Romeo Santos', songs: ['Propuesta Indecente', 'Eres Mía', 'Imitadora'] },
  { artist: 'Becky G', songs: ['MAMIII', 'Mayores', 'Sin Pijama'] },
  { artist: 'Nicky Jam', songs: ['El Perdón', 'X', 'Hasta el Amanecer'] },
  { artist: 'Don Omar', songs: ['Danza Kuduro', 'Dile', 'Pobre Diabla'] },
  { artist: 'Wisin & Yandel', songs: ['Rakata', 'Algo Me Gusta de Ti', 'Noche de Entierro'] },
  { artist: 'Farruko', songs: ['Pepas', 'Chillax', 'Krippy Kush'] },
  { artist: 'Michael Jackson', songs: ['Billie Jean', 'Thriller', 'Beat It'] },
  { artist: 'Madonna', songs: ['Like a Prayer', 'Vogue', 'Material Girl'] },
  { artist: 'Elvis Presley', songs: ["Can't Help Falling in Love", 'Jailhouse Rock', 'Hound Dog'] },
  { artist: 'Whitney Houston', songs: ['I Will Always Love You', 'I Wanna Dance with Somebody', 'Greatest Love of All'] },
  { artist: 'Céline Dion', songs: ['My Heart Will Go On', 'The Power of Love', "It's All Coming Back to Me Now", 'Because You Loved Me'] },
  { artist: 'Mariah Carey', songs: ['Hero', 'We Belong Together', 'All I Want for Christmas Is You'] },
  { artist: 'Britney Spears', songs: ['Toxic', "Oops!... I Did It Again", 'Baby One More Time'] },
  { artist: 'Christina Aguilera', songs: ['Beautiful', 'Genie in a Bottle', 'Fighter'] },
  { artist: 'Jennifer Hudson', songs: ['Spotlight', 'And I Am Telling You', 'Feeling Good'] },
  { artist: 'Usher', songs: ['Yeah!', 'U Got It Bad', "DJ Got Us Fallin' in Love"] },
  { artist: 'Justin Timberlake', songs: ['Cry Me a River', 'Mirrors', 'SexyBack'] },
  { artist: 'The Beatles', songs: ['Hey Jude', 'Let It Be', 'Yesterday'] },
  { artist: 'Queen', songs: ['Bohemian Rhapsody', 'We Will Rock You', 'Another One Bites the Dust'] },
  { artist: 'ABBA', songs: ['Dancing Queen', 'Mamma Mia', 'Gimme! Gimme! Gimme!'] },
  { artist: 'Elton John', songs: ['Your Song', 'Rocket Man', "I'm Still Standing"] },
  { artist: 'The Rolling Stones', songs: ["(I Can't Get No) Satisfaction", 'Paint It Black', 'Angie'] },
  { artist: 'David Bowie', songs: ['Heroes', 'Space Oddity', "Let's Dance"] },
  { artist: 'Prince', songs: ['Purple Rain', 'Kiss', 'When Doves Cry'] },
  { artist: 'Bob Marley', songs: ['One Love', 'Three Little Birds', 'Is This Love?'] },
  { artist: 'Bob Dylan', songs: ['Like a Rolling Stone', "Knockin' on Heaven's Door", "Blowin' in the Wind"] },
  { artist: 'Bruce Springsteen', songs: ['Dancing in the Dark', 'Born to Run', "I'm on Fire"] },
  { artist: 'Sting', songs: ['Englishman in New York', 'Fields of Gold', 'Shape of My Heart'] },
  { artist: 'Phil Collins', songs: ['In the Air Tonight', 'Another Day in Paradise', 'Against All Odds'] },
  { artist: 'George Michael', songs: ['Careless Whisper', 'Faith', "Freedom! '90"] },
  { artist: 'Wham!', songs: ['Last Christmas', 'Wake Me Up Before You Go-Go', 'Careless Whisper'] },
  { artist: 'Bon Jovi', songs: ["Livin' on a Prayer", "It's My Life", 'Always'] },
  { artist: 'Aerosmith', songs: ['Dream On', 'Crazy', "I Don't Want to Miss a Thing"] },
  { artist: 'Metallica', songs: ['Enter Sandman', 'Nothing Else Matters', 'Master of Puppets'] },
  { artist: "Guns N' Roses", songs: ["Sweet Child o' Mine", 'November Rain', 'Paradise City'] },
  { artist: 'Linkin Park', songs: ['In the End', 'Numb', "What I've Done"] },
  { artist: 'Green Day', songs: ['Boulevard of Broken Dreams', '21 Guns', 'Wake Me Up When September Ends'] },
  { artist: 'Nirvana', songs: ['Smells Like Teen Spirit', 'Come as You Are', 'Heart-Shaped Box'] },
  { artist: 'Red Hot Chili Peppers', songs: ['Californication', 'Under the Bridge', "Can't Stop"] },
  { artist: 'Foo Fighters', songs: ['Everlong', 'The Pretender', 'Best of You'] },
  { artist: 'One Direction', songs: ['What Makes You Beautiful', 'Story of My Life', 'Night Changes'] },
  { artist: 'The Chainsmokers', songs: ['Closer', 'Something Just Like This', "Don't Let Me Down"] },
  { artist: 'Avicii', songs: ['Wake Me Up', 'Levels', 'The Nights'] },
  { artist: 'Calvin Harris', songs: ['Summer', 'This Is What You Came For', 'Feel So Close'] },
  { artist: 'David Guetta', songs: ['Titanium', 'Memories', 'Play Hard'] },
  { artist: 'Martin Garrix', songs: ['Animals', 'Scared to Be Lonely', 'In the Name of Love'] },
  { artist: 'Marshmello', songs: ['Happier', 'Alone', 'Silence'] },
  { artist: 'Alan Walker', songs: ['Faded', 'Alone', 'The Spectre'] },
  { artist: 'DJ Snake', songs: ['Taki Taki', 'Turn Down for What', 'Let Me Love You'] },
  { artist: 'Kygo', songs: ['Firestone', "It Ain't Me", 'Stole the Show'] },
  { artist: 'Zedd', songs: ['Clarity', 'Stay', 'The Middle'] },
  { artist: 'Sia', songs: ['Chandelier', 'Cheap Thrills', 'Unstoppable'] },
  { artist: 'Ellie Goulding', songs: ['Love Me Like You Do', 'Burn', 'Lights'] },
  { artist: 'Lana Del Rey', songs: ['Summertime Sadness', 'Young and Beautiful', 'Video Games'] },
  { artist: 'Lorde', songs: ['Royals', 'Green Light', 'Team'] },
  { artist: 'Halsey', songs: ['Without Me', 'Colors', 'Closer'] },
  { artist: 'Demi Lovato', songs: ['Sorry Not Sorry', 'Heart Attack', 'Skyscraper'] },
  { artist: 'Kesha', songs: ['Tik Tok', 'Die Young', 'Praying'] },
  { artist: 'P!nk', songs: ['Just Give Me a Reason', 'Try', 'What About Us'] },
  { artist: 'Kelly Clarkson', songs: ['Since U Been Gone', 'Stronger', 'Because of You'] },
  { artist: 'Avril Lavigne', songs: ['Complicated', 'Sk8er Boi', 'Girlfriend'] },
  { artist: 'Alanis Morissette', songs: ['You Oughta Know', 'Ironic', 'Hand in My Pocket'] },
  { artist: 'Fergie', songs: ["Big Girls Don't Cry", 'Glamorous', 'Fergalicious'] },
  { artist: '50 Cent', songs: ['In Da Club', 'Candy Shop', 'Many Men'] },
  { artist: 'Snoop Dogg', songs: ['Drop It Like It’s Hot', 'Young, Wild & Free', 'Beautiful'] },
  { artist: 'Dr. Dre', songs: ['Still D.R.E.', 'The Next Episode', 'Forgot About Dre'] },
  { artist: 'Tupac', songs: ['California Love', 'Changes', 'Dear Mama'] },
  { artist: 'The Notorious B.I.G.', songs: ['Juicy', 'Big Poppa', 'Hypnotize'] },
  { artist: 'Jay-Z', songs: ['Empire State of Mind', '99 Problems', 'Run This Town'] },
  { artist: 'Nas', songs: ['N.Y. State of Mind', 'If I Ruled the World', 'The World Is Yours'] },
  { artist: 'Lil Wayne', songs: ['Lollipop', 'A Milli', '6 Foot 7 Foot'] },
  { artist: 'Megan Thee Stallion', songs: ['Savage', 'HISS', 'Body'] },
  { artist: 'Tyga', songs: ['Taste', 'Rack City', 'Ayo'] },
  { artist: 'Wiz Khalifa', songs: ['See You Again', 'Black and Yellow', 'Young, Wild & Free'] },
  { artist: 'A$AP Rocky', songs: ['Praise the Lord', 'L$D', "F**kin' Problems"] },
  { artist: 'Lil Nas X', songs: ['Old Town Road', 'MONTERO', 'INDUSTRY BABY'] },
  { artist: 'Jack Harlow', songs: ['First Class', 'Lovin on Me', 'WHATS POPPIN'] },
  { artist: 'Central Cee', songs: ['Doja', 'Sprinter', 'Let Go'] },
  { artist: 'Stormzy', songs: ['Vossi Bop', 'Big For Your Boots', 'Blinded by Your Grace'] },
  { artist: 'Skepta', songs: ['Shutdown', 'Praise the Lord', "That's Not Me"] },
  { artist: 'Rema', songs: ['Calm Down', 'Dumebi', 'Charm'] },
  { artist: 'Burna Boy', songs: ['Last Last', 'On the Low', 'Ye'] },
  { artist: 'Wizkid', songs: ['Essence', 'Ojuelegba', 'Come Closer'] },
  { artist: 'Tems', songs: ['Free Mind', 'Essence', 'Love Me JeJe'] },
  { artist: 'Davido', songs: ['Fall', 'Unavailable', 'If'] },
  { artist: 'CKay', songs: ['Love Nwantiti', 'Emiliana', 'Hallelujah'] },
  { artist: 'Ayra Starr', songs: ['Rush', 'Sability', 'Bloody Samaritan'] },
  { artist: 'Tyla', songs: ['Water', 'Truth or Dare', 'Jump'] },
  { artist: 'Master KG', songs: ['Jerusalema', 'Skeleton Move', 'Shine Your Light'] },
  { artist: 'Diamond Platnumz', songs: ['Jeje', 'Waah!', 'Inama'] },
  { artist: 'Yemi Alade', songs: ['Johnny', 'Tumbum', 'Oh My Gosh'] },
  { artist: 'Omah Lay', songs: ['Soso', 'Understand', 'Bad Influence'] },
  { artist: 'Stromae', songs: ['Alors on danse', 'Papaoutai', 'Formidable'] },
  { artist: 'Aya Nakamura', songs: ['Djadja', 'Pookie', 'Copines'] },
  { artist: 'ROSALÍA', songs: ['DESPECHÁ', 'MALAMENTE', 'Con Altura'] },
  { artist: 'Maneskin', songs: ["Beggin'", 'I WANNA BE YOUR SLAVE', 'The Loneliest'] },
  { artist: 'Tate McRae', songs: ['greedy', 'you broke me first', 'exes'] },
  { artist: 'Gracie Abrams', songs: ["That's So True", "I miss you, I'm sorry", 'Close to You'] },
  { artist: 'Alex Warren', songs: ['Ordinary', 'Burning Down', 'Carry You Home'] },
  { artist: 'Hozier', songs: ['Take Me to Church', 'Too Sweet', 'Someone New'] },
  { artist: 'Teddy Swims', songs: ['Lose Control', 'The Door', 'Bad Dreams'] },
  { artist: 'Sam Smith', songs: ['Stay With Me', 'Too Good at Goodbyes', 'Unholy'] },
  { artist: 'Lewis Capaldi', songs: ['Someone You Loved', 'Before You Go', 'Wish You the Best'] },
  { artist: 'James Arthur', songs: ["Say You Won't Let Go", 'Impossible', "Car's Outside"] },
  { artist: 'Tom Odell', songs: ['Another Love', 'Heal', 'Magnetised'] },
  { artist: 'Passenger', songs: ['Let Her Go', 'Young as the Morning', "Heart's on Fire"] },
  { artist: 'Vance Joy', songs: ['Riptide', 'Georgia', 'Saturday Sun'] },
  { artist: 'The Kid LAROI', songs: ['STAY', 'Without You', 'Thousand Miles'] },
  { artist: 'Charlie Puth', songs: ['Attention', "We Don't Talk Anymore", 'One Call Away'] },
  { artist: 'Niall Horan', songs: ['Slow Hands', 'This Town', 'Nice to Meet Ya'] },
  { artist: 'Zayn', songs: ['PILLOWTALK', 'Dusk Till Dawn', 'Let Me'] },
  { artist: 'Liam Payne', songs: ['Strip That Down', 'For You', 'Bedroom Floor'] },
  { artist: 'Conan Gray', songs: ['Heather', 'Maniac', 'Memories'] },
  { artist: 'Troye Sivan', songs: ['Rush', 'Youth', 'Angel Baby'] },
  { artist: 'Lauv', songs: ['I Like Me Better', 'Paris in the Rain', 'The Other'] },
  { artist: 'Benson Boone', songs: ['Beautiful Things', 'In the Stars', 'Slow It Down'] },
  { artist: 'Tori Kelly', songs: ['Nobody Love', "Should've Been Us", 'Paper Hearts'] },
  { artist: 'Norah Jones', songs: ["Don't Know Why", 'Come Away With Me', 'Sunrise'] },
  { artist: 'John Legend', songs: ['All of Me', 'Ordinary People', 'Tonight'] },
  { artist: 'Sam Fender', songs: ['Seventeen Going Under', 'Rein Me In', 'Hypersonic Missiles'] },
];

function mergeCatalog(entries: CatalogEntry[]): CatalogEntry[] {
  const byArtist = new Map<string, Set<string>>();
  entries.forEach((entry) => {
    const key = entry.artist.trim();
    if (!byArtist.has(key)) byArtist.set(key, new Set());
    entry.songs.forEach((song) => byArtist.get(key)!.add(song));
  });
  return Array.from(byArtist.entries())
    .map(([artist, songs]) => ({ artist, songs: Array.from(songs) }))
    .sort((a, b) => a.artist.localeCompare(b.artist));
}

export const FEATURED_CATALOG = mergeCatalog(RAW_CATALOG);

export const CATALOG_ARTIST_NAMES = FEATURED_CATALOG.map((entry) => entry.artist);

export const CATALOG_SONG_QUERIES = FEATURED_CATALOG.flatMap((entry) =>
  entry.songs.map((song) => `${song} ${entry.artist}`),
);

export const HOME_FEATURED_SONGS = [
  { title: 'Anti-Hero', artist: 'Taylor Swift' },
  { title: 'Cruel Summer', artist: 'Taylor Swift' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
  { title: 'Espresso', artist: 'Sabrina Carpenter' },
  { title: 'Flowers', artist: 'Miley Cyrus' },
  { title: 'Levitating', artist: 'Dua Lipa' },
  { title: 'Hello', artist: 'Adele' },
  { title: 'Shape of You', artist: 'Ed Sheeran' },
] as const;

export const CATALOG_ARTIST_PREFIX = 'cat-artist:';
export const CATALOG_SONG_PREFIX = 'cat-song:';

export function toCatalogArtistId(artistName: string): string {
  return `${CATALOG_ARTIST_PREFIX}${encodeURIComponent(artistName)}`;
}

export function toCatalogSongId(artistName: string, songTitle: string): string {
  return `${CATALOG_SONG_PREFIX}${encodeURIComponent(artistName)}:${encodeURIComponent(songTitle)}`;
}

export function parseCatalogArtistId(id: string): string | null {
  if (!id.startsWith(CATALOG_ARTIST_PREFIX)) return null;
  return decodeURIComponent(id.slice(CATALOG_ARTIST_PREFIX.length));
}

export function parseCatalogSongId(
  id: string,
): { artistName: string; songTitle: string } | null {
  if (!id.startsWith(CATALOG_SONG_PREFIX)) return null;
  const payload = id.slice(CATALOG_SONG_PREFIX.length);
  const splitAt = payload.indexOf(':');
  if (splitAt < 0) return null;
  return {
    artistName: decodeURIComponent(payload.slice(0, splitAt)),
    songTitle: decodeURIComponent(payload.slice(splitAt + 1)),
  };
}

export function getCatalogEntry(artistName: string): CatalogEntry | undefined {
  const wanted = artistName.trim().toLowerCase();
  return FEATURED_CATALOG.find((entry) => entry.artist.toLowerCase() === wanted);
}

export function buildLocalCatalogArtists(filter?: {
  query?: string;
  startsWith?: string;
}): Array<{ id: string; name: string; songCount: number }> {
  const query = filter?.query?.trim().toLowerCase() ?? '';
  const startsWith = filter?.startsWith?.trim().toLowerCase() ?? '';

  return FEATURED_CATALOG.filter((entry) => {
    const name = entry.artist.toLowerCase();
    if (query && !name.includes(query)) return false;
    if (startsWith && !name.startsWith(startsWith)) return false;
    return true;
  }).map((entry) => ({
    id: toCatalogArtistId(entry.artist),
    name: entry.artist,
    songCount: entry.songs.length,
  }));
}

export function buildLocalCatalogSongs(filter?: {
  query?: string;
  artistName?: string;
}): Array<{
  id: string;
  title: string;
  artistId: string;
  artistName: string;
}> {
  const query = filter?.query?.trim().toLowerCase() ?? '';
  const artistName = filter?.artistName?.trim().toLowerCase() ?? '';

  return FEATURED_CATALOG.flatMap((entry) => {
    if (artistName && entry.artist.toLowerCase() !== artistName) return [];
    return entry.songs
      .filter((song) => {
        if (!query) return true;
        const haystack = `${song} ${entry.artist}`.toLowerCase();
        return haystack.includes(query);
      })
      .map((song) => ({
        id: toCatalogSongId(entry.artist, song),
        title: song,
        artistId: toCatalogArtistId(entry.artist),
        artistName: entry.artist,
      }));
  });
}

/** Run async work with limited concurrency. */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await worker(items[current], current);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(runners);
  return results;
}
