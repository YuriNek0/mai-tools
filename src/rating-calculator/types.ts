import {ChartRecord} from '../common/chart-record';

export interface ChartAchievementTarget {
  minRt: number;
  rating: number;
  target: string;
  /**
   * Cost = achievement needed to reach the target.
   * For example, if current achievement is 97.7 and target is 99.0, then cost = 1.3
   */
  cost: number;
}

export interface ChartRecordWithRating extends ChartRecord {
  rating: number;
  nextRanks?: Map<string, ChartAchievementTarget>;
  order?: number;
  isTarget?: boolean;
}

export interface RatingData {
  date: Date;
  playerName?: string;
  oldChartsRating: number;
  oldTopChartsCount: number;
  oldChartRecords: ChartRecordWithRating[];
  newChartsRating: number;
  newTopChartsCount: number;
  newChartRecords: ChartRecordWithRating[];
}

export const enum ColumnType {
  NO,
  SONG_TITLE,
  CHART_TYPE,
  LEVEL,
  ACHIEVEMENT,
  RANK,
  NEXT_RANK,
  RATING,
  NEXT_RATING,
}
