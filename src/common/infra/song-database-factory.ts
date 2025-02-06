import {GameRegion} from '../game-region';
import {GameVersion, LATEST_VERSION} from '../game-version';
import {getRemovedSongs} from '../removed-songs';
import {SongDatabase, SongProperties} from '../song-props';
import {MagicApi} from './magic-api';
import {MaiToolsApi} from './mai-tools-api';

export class SongDatabaseFactory {
  constructor(private readonly maiToolsApi: MaiToolsApi, private readonly magicApi: MagicApi) {}

  async create(gameVer: GameVersion, gameRegion: GameRegion): Promise<SongDatabase> {
    const dxMap = new Map<string, SongProperties>();
    const standardMap = new Map<string, SongProperties>();
    const nameByIco = new Map<string, string>();
    const database = new SongDatabase(gameVer, gameRegion, true, dxMap, standardMap, nameByIco);

    const songs = await this.magicApi.loadMagic(gameVer);
    for (const song of songs) {
      database.insertOrUpdateSong(song);
    }

    const chartLevelOverrides = await this.maiToolsApi.fetchChartLevelOverrides(gameVer);
    // console.log('chartLevelOverrides', chartLevelOverrides);
    for (const songProps of chartLevelOverrides) {
      database.insertOrUpdateSong(songProps);
    }

    const regionOverrides = await this.maiToolsApi.fetchRegionOverrides(gameRegion);
    // console.log('regionOverrides', regionOverrides);
    for (const songProps of regionOverrides) {
      database.updateSong(songProps);
    }

    const removedSongs = getRemovedSongs(gameRegion, gameVer);
    for (const songName of removedSongs) {
      database.deleteSong(songName);
    }

    this.validate(dxMap, standardMap);
    return database;
  }

  // validation: every song must have debut and lv
  private validate(dxMap: Map<string, SongProperties>, standardMap: Map<string, SongProperties>) {
    for (const map of [dxMap, standardMap]) {
      map.forEach((song) => {
        console.assert(song.debut != null);
        console.assert(song.debut >= 0 && song.debut <= LATEST_VERSION);
        console.assert(song.lv.length >= 4);
      });
    }
  }
}
