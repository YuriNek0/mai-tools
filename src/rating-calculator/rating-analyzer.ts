import {ChartRecord} from '../common/chart-record';
import {ChartType} from '../common/chart-type';
import {GameRegion} from '../common/game-region';
import {GameVersion} from '../common/game-version';
import {getRating} from '../common/rating-functions';
import {getRemovedSongs} from '../common/removed-songs';
import {SongDatabase, SongProperties} from '../common/song-props';
import {compareSongsByRating} from './record-comparator';
import {ChartRecordWithRating, RatingData} from './types';

export const NUM_TOP_NEW_CHARTS = 15;
export const NUM_TOP_OLD_CHARTS = 35;

/**
 * Compute rating value based on the chart level and player achievement.
 * If we don't find the inner level for the chart, use its estimated level and move on.
 */
function getRecordWithRating(
  record: ChartRecord,
  songProps?: SongProperties
): ChartRecordWithRating {
  if (songProps) {
    const lv = songProps.lv[record.difficulty];
    if (typeof lv === 'number') {
      record.level = Math.abs(lv);
    }
  }
  return {
    ...record,
    rating: getRating(record.level, record.achievement),
  };
}

export function isNewChart(
  record: ChartRecord,
  songProps: SongProperties,
  gameVer: GameVersion,
  includePreviousVerInNewCharts: boolean
): boolean {
  if (!songProps) return record.chartType === ChartType.DX;
  if (songProps.debut === gameVer) return true;
  if (includePreviousVerInNewCharts) return songProps.debut === gameVer - 1;
  return false;
}

/**
 * @param excludeSongsWithNoProps Set this to true when you want to calculate rating for past
 *    versions but don't want to include new songs.
 */
export function analyzePlayerRating(
  songDb: SongDatabase,
  date: Date,
  playerName: string,
  playerScores: ReadonlyArray<ChartRecord>,
  gameRegion: GameRegion,
  gameVer: GameVersion,
  excludeSongsWithNoProps: boolean
): RatingData {
  // Since CiRCLE, charts debuted in the previous version (PRiSM PLUS) are treated as new charts.
  const includePreviousVerInNewCharts = gameVer >= GameVersion.CiRCLE;
  const newChartRecords = [];
  const oldChartRecords = [];
  const removedSongs = getRemovedSongs(gameRegion, gameVer);
  for (const record of playerScores) {
    if (removedSongs.includes(record.songName)) {
      continue;
    }
    const songProps = songDb.getSongProperties(record.songName, record.genre, record.chartType);
    if (excludeSongsWithNoProps && !songProps) {
      continue;
    }
    const recordWithRating = getRecordWithRating(record, songProps);
    if (isNewChart(record, songProps, gameVer, includePreviousVerInNewCharts)) {
      newChartRecords.push(recordWithRating);
    } else {
      oldChartRecords.push(recordWithRating);
    }
  }

  newChartRecords.sort(compareSongsByRating);
  oldChartRecords.sort(compareSongsByRating);

  let newChartsRating = 0;
  const newTopChartsCount = Math.min(NUM_TOP_NEW_CHARTS, newChartRecords.length);
  for (let i = 0; i < newTopChartsCount; i++) {
    const rec = newChartRecords[i];
    rec.isTarget = true;
    newChartsRating += Math.floor(rec.rating);
  }

  let oldChartsRating = 0;
  const oldTopChartsCount = Math.min(NUM_TOP_OLD_CHARTS, oldChartRecords.length);
  for (let i = 0; i < oldTopChartsCount; i++) {
    const rec = oldChartRecords[i];
    rec.isTarget = true;
    oldChartsRating += Math.floor(rec.rating);
  }

  return {
    date,
    newChartRecords,
    newChartsRating,
    newTopChartsCount,
    oldChartRecords,
    oldChartsRating,
    oldTopChartsCount,
    playerName,
  };
}
