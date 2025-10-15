import {addToCache, cached, expireCache} from '../cache';
import {GameVersion} from '../game-version';
import {getGenreFromNickname} from '../song-name-helper';
import {SongProperties} from '../song-props';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day
const CACHE_KEY_PREFIX = 'magicVer';
const OLD_KEYS_TO_CLEANUP = [
  'dxLv15',
  'dxLv16',
  'dxLv17',
  'dxLv18',
  'dxLv19',
  'dxLv20',
  'magicExpire',
];

interface OldSongProperties extends SongProperties {
  nickname?: string;
}

const MagicSauceByVersion: Map<GameVersion, string> = new Map([
  [
    GameVersion.UNIVERSE_PLUS,
    'aHR0cHM6Ly9naXN0LmdpdGh1YnVzZXJjb250ZW50LmNvbS9teWppYW4vZWU1NjlkNzRmNDIyZDRlMjU1MDY1ZDhiMDJlYTI5NGEvcmF3L21haWR4X2x2X3VuaXZlcnNlcGx1cy5qc29u',
  ],
  [
    GameVersion.FESTiVAL,
    'aHR0cHM6Ly9naXN0LmdpdGh1YnVzZXJjb250ZW50LmNvbS9teWppYW4vMDg1NWM4OTQ3YjU0N2Q3YjliODg4MTU4NTEyZGRlNjkvcmF3L21haWR4X2x2X2Zlc3RpdmFsLmpzb24=',
  ],
  [
    GameVersion.FESTiVAL_PLUS,
    'aHR0cHM6Ly9naXN0LmdpdGh1YnVzZXJjb250ZW50LmNvbS9teWppYW4vYWQyNjg1ODcyZmQ3ZjVjZDdhNDdlY2IzNDA1MTRlNmIvcmF3L21haWR4X2x2X2Zlc3RpdmFscGx1cy5qc29u',
  ],
  [
    GameVersion.BUDDiES,
    'aHR0cHM6Ly9naXN0LmdpdGh1YnVzZXJjb250ZW50LmNvbS9teWppYW4vZThkOGJiMjcyZjMyYzJjOGE2ODU0MTQzZGUxY2FhZDEvcmF3Lw==',
  ],
  [
    GameVersion.BUDDiES_PLUS,
    'aHR0cHM6Ly9naXN0LmdpdGh1YnVzZXJjb250ZW50LmNvbS9teWppYW4vZjA1OTMzMWViOWRhZWZlYjBkYzU3Y2UxNWU2ZjczZTkvcmF3Lw==',
  ],
  [
    GameVersion.PRiSM,
    'aHR0cHM6Ly9teWppYW4uZ2l0aHViLmlvL1RhaXdhbi1pbmRlcGVuZGVuY2UvZXh0ZXJuYWwvbWFnaWMtcHJpc20uanNvbg==',
  ],
  [
    GameVersion.PRiSM_PLUS,
    'aHR0cHM6Ly9teWppYW4uZ2l0aHViLmlvL1RhaXdhbi1pbmRlcGVuZGVuY2UvZXh0ZXJuYWwvbWFnaWMtcHJpc20tcGx1cy5qc29u',
  ],
  [
    GameVersion.CiRCLE,
    'aHR0cHM6Ly9teWppYW4uZ2l0aHViLmlvL1RhaXdhbi1pbmRlcGVuZGVuY2UvZXh0ZXJuYWwvbWFnaWMuanNvbg==',
  ],
]);

export const RATING_CALCULATOR_SUPPORTED_VERSIONS: GameVersion[] = Array.from(
  MagicSauceByVersion.keys()
).sort();

const FALLBACK_VERSION = GameVersion.PRiSM_PLUS;

export class MagicApi {
  private async fetchMagic(gameVer: GameVersion): Promise<OldSongProperties[]> {
    const sauce = MagicSauceByVersion.get(gameVer);
    if (!sauce) {
      return this.fetchMagic(FALLBACK_VERSION);
    }
    const res = await fetch(atob(sauce));
    if (!res.ok) {
      const error = new Error(`Failed to load magic ${gameVer}`);
      console.warn(error.message);
      return Promise.reject(error);
    }
    try {
      return await res.json();
    } catch (err) {
      console.warn(`Failed to parse magic ${gameVer}`, err);
      return [];
    }
  }

  async loadMagic(gameVer: GameVersion): Promise<SongProperties[]> {
    const songs = await cached<OldSongProperties[]>(
      CACHE_KEY_PREFIX + gameVer,
      CACHE_DURATION,
      async (expiredValue) => {
        try {
          const newValue = await this.fetchMagic(gameVer);
          addToCache(CACHE_KEY_PREFIX + gameVer, newValue, CACHE_DURATION);
          return newValue;
        } catch (err) {
          console.warn(`Use expired cached magic ${gameVer}`);
          return expiredValue;
        }
      },
      () => this.fetchMagic(gameVer).catch<SongProperties[]>(() => [])
    );
    if (!songs.length) {
      expireCache(CACHE_KEY_PREFIX + gameVer);
    }
    OLD_KEYS_TO_CLEANUP.map(expireCache);
    songs.forEach((s) => {
      if (!s.genre) {
        // Convert nickname to genre
        s.genre = getGenreFromNickname(s.nickname || s.name);
      }
    });
    return songs;
  }
}

export function clearMagicCache() {
  RATING_CALCULATOR_SUPPORTED_VERSIONS.forEach((ver) => {
    const localStorageKey = `${CACHE_KEY_PREFIX}${ver}`;
    console.log(`Removing ${localStorageKey} from cache`);
    expireCache(localStorageKey);
  });
}
