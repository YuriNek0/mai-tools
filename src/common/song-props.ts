import {ChartType} from './chart-type';
import {GameRegion} from './game-region';
import {GameVersion} from './game-version';
import {MagicApi} from './infra/magic-api';
import {MaiToolsApi} from './infra/mai-tools-api';
import {SongDatabaseFactory} from './infra/song-database-factory';
import {getMaiToolsBaseUrl} from './script-host';
import {getSongNickname} from './song-name-helper';

export interface BasicSongProps {
  dx: ChartType;
  name: string;
  genre: string;
  ico?: string;
}

export interface RegionOverride {
  debut: number;
  lv: number[];
}

export interface SongProperties extends BasicSongProps {
  debut: number; // from 0 to latest version number
  lv: ReadonlyArray<number>;
  regionOverrides?: Record<string, RegionOverride>;
}

export class SongDatabase {
  constructor(
    readonly gameVer: GameVersion = null,
    readonly region: GameRegion = null,
    private readonly verbose = true,
    private dxMap: Map<string, SongProperties> = new Map(),
    private standardMap: Map<string, SongProperties> = new Map(),
    private nameByIco: Map<string, string> = new Map()
  ) {}

  insertOrUpdateSong(song: SongProperties) {
    if (this.updateSong(song)) {
      return;
    }
    const map = song.dx === ChartType.DX ? this.dxMap : this.standardMap;
    const key = getSongNickname(song.name, song.genre);
    if (song.ico) {
      this.nameByIco.set(song.ico, key);
    }
    if (map.has(key)) {
      console.warn(
        `Found existing song properties for ${key} ${song.dx}: ${JSON.stringify(map.get(key))}`
      );
      console.warn(`Will ignore ${song}`);
      return;
    }
    if (song.regionOverrides && song.regionOverrides[this.region]) {
      const regionOverride = song.regionOverrides[this.region];
      if (regionOverride.debut >= 0) {
        song.debut = regionOverride.debut;
      }
      if (Array.isArray(regionOverride.lv)) {
        song.lv = song.lv.map((lvItem, idx) =>
          regionOverride.lv[idx] > 0 ? regionOverride.lv[idx] : lvItem
        );
      }
    }
    map.set(key, song);
  }

  /**
   * @return true if song prop is successfully updated.
   */
  updateSong(update: Partial<SongProperties>): boolean {
    const map = update.dx === ChartType.DX ? this.dxMap : this.standardMap;
    const key = map.has(update.name) ? update.name : getSongNickname(update.name, update.genre);
    const existing = map.get(key);
    if (!existing) {
      return false;
    }

    let levels = existing.lv;
    if (update.lv instanceof Array) {
      levels = existing.lv.map((oldLevel, i) => {
        const newLevel = update.lv[i];
        // NaN > 0 will evaluate to false
        return typeof newLevel === 'number' && newLevel > 0 ? newLevel : oldLevel;
      });
    }
    if (update.ico) {
      this.nameByIco.set(update.ico, key);
    }
    map.set(key, {...existing, ...update, lv: levels});
    return true;
  }

  deleteSong(name: string) {
    this.dxMap.delete(name);
    this.standardMap.delete(name);
  }

  hasDualCharts(songName: string): boolean {
    if (songName === 'Link') return true;
    return this.dxMap.has(songName) && this.standardMap.has(songName);
  }

  getSongPropsByIco(ico: string, chartType: ChartType) {
    const name = this.nameByIco.get(ico);
    return this.getSongProperties(name, '', chartType);
  }

  getSongProperties(
    songName: string,
    genre: string,
    chartType: ChartType = ChartType.STANDARD
  ): SongProperties | undefined {
    if (songName == null) {
      return;
    }
    const map = chartType === ChartType.DX ? this.dxMap : this.standardMap;
    let songProps = map.get(songName);
    if (songProps) {
      return songProps;
    }
    const nickname = getSongNickname(songName, genre);
    songProps = map.get(nickname);
    if (songProps) {
      return songProps;
    }
    if (this.verbose) {
      console.warn(`Could not find song properties for ${songName} ${chartType}`);
    }
  }

  getAllProps(): SongProperties[] {
    return Array.from(this.dxMap.values()).concat(Array.from(this.standardMap.values()));
  }

  getPropsForSongs(songs: ReadonlyArray<BasicSongProps>): SongProperties[] {
    return songs
      .map((s) => {
        const props = this.getSongProperties(s.name, s.genre, s.dx);
        if (!props) {
          console.warn('Could not find song properties for', s);
        }
        return props;
      })
      .filter((props) => !!props);
  }

  toString(): string {
    return String({dxMap: this.dxMap, standardMap: this.standardMap});
  }
}

export async function loadSongDatabase(
  gameVer: GameVersion,
  gameRegion: GameRegion
): Promise<SongDatabase> {
  const factory = new SongDatabaseFactory(new MaiToolsApi(getMaiToolsBaseUrl()), new MagicApi());

  return factory.create(gameVer, gameRegion);
}
