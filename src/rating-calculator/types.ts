import {ChartRecord} from '../common/chart-record';

export interface ChartAchievementTarget {
  /** Can be AP, 100.5%, 100%, etc.  */
  name: string;
  /** Rating = absolute rating points if this target is achieved. */
  rating: number;
  /** Delta = rating increase if this target is achieved. */
  delta: number;
  /**
   * Cost = achievement needed to reach the target.
   * For example, if current achievement is 97.7 and target is 99.0, then cost = 1.3
   */
  cost: number;
}

export interface ChartRecordWithRating extends ChartRecord {
  /** Game version. -1 if unknown */
  version: number;
  /**
   * Usually rankTitle is SSS, SS+, etc.
   * But if game version >= CiRCLE and player has AP, we'll display AP/AP+.
   */
  rankTitle: string | null;
  rating: number;
  target?: ChartAchievementTarget;
  order?: number;
  isTarget?: boolean;
}

export interface RatingData {
  date: Date;
  playerName?: string | null;
  oldChartsRating: number;
  oldTopChartsCount: number;
  oldChartRecords: ChartRecordWithRating[];
  newChartsRating: number;
  newTopChartsCount: number;
  newChartRecords: ChartRecordWithRating[];
}

export const enum ColumnType {
  NO = 'no',
  SONG_TITLE = 'songTitle',
  VERSION = 'version',
  CHART_TYPE = 'chartType',
  LEVEL = 'level',
  ACHIEVEMENT = 'achievement',
  RANK = 'rank',
  TARGET = 'target',
  RATING = 'rating',
}
