import {shuffleArray} from '../common/array-util';
import {DIFFICULTIES} from '../common/difficulties';
import {LevelDef} from '../common/level-helper';
import {
  getRankDefinitions,
  getRankIndexByAchievement,
  RANK_S,
  RANK_SSS_PLUS,
} from '../common/rank-functions';
import {calculateRatingRange} from '../common/rating-functions';
import {getSheetIdForDxRatingNet} from '../common/song-name-helper';
import {SongProperties} from '../common/song-props';
import {compareCandidate, compareSongsByLevel} from './record-comparator';
import {ChartAchievementTarget, ChartRecordWithRating} from './types';

const LOWEST_RANK_FOR_CANDIDATE = getRankIndexByAchievement(94);

type NextRatingCandidate = Pick<ChartRecordWithRating, 'achievement' | 'level' | 'fcap'>;

function getNextRating(
  includeAllPerfect: boolean,
  record: NextRatingCandidate,
  lowestRating: number,
  numOfRanks: number,
): Map<string, ChartAchievementTarget> {
  const ratingByRank = new Map<string, ChartAchievementTarget>();

  if (record.achievement >= RANK_SSS_PLUS.minAchv) {
    if (!includeAllPerfect) {
      return ratingByRank;
    } else if (!record.fcap || !record.fcap.includes('AP')) {
      const [minRt] = calculateRatingRange(record.level, RANK_SSS_PLUS);
      const rating = 1 + minRt;
      if (rating > lowestRating) {
        // Because achievement of AP can be lower than 101% (usually 100.8%~100.9%), we divide
        // the delta by 2 to make the cost lower.
        const cost = (101 - record.achievement) / 2;
        ratingByRank.set('AP', {
          delta: rating - lowestRating,
          rating,
          target: 'AP',
          cost,
        });
      }
    }
    return ratingByRank;
  }

  // Choose the higher one (if 50% vs 94%, choose 94%; if 98% vs 94%. choose 98%)
  let rankDefIdx = Math.min(
    getRankIndexByAchievement(record.achievement),
    LOWEST_RANK_FOR_CANDIDATE,
  );
  const ranks = getRankDefinitions();
  for (let i = rankDefIdx - 1; i >= 0; i--) {
    const rank = ranks[i];
    if (rank.title === ranks[i + 1].title) {
      continue;
    }
    const [minRt] = calculateRatingRange(record.level, rank);
    if (minRt > lowestRating) {
      ratingByRank.set(rank.title, {
        delta: minRt - lowestRating,
        rating: minRt,
        target: rank.minAchv + '%',
        cost: rank.minAchv - record.achievement,
      });
      if (ratingByRank.size >= numOfRanks) {
        break;
      }
    }
  }
  return ratingByRank;
}

export function getCandidateCharts(
  includeAllPerfect: boolean,
  records: ReadonlyArray<ChartRecordWithRating>,
  topCount: number,
  count: number,
  requiredLv?: LevelDef,
) {
  const candidates: ChartRecordWithRating[] = [];
  if (topCount <= 0) {
    return candidates;
  }
  for (let i = 0; i < topCount; i++) {
    const record = records[i];
    if (requiredLv && (record.level < requiredLv.minLv || record.level > requiredLv.maxLv))
      continue;
    const ratingByRank = getNextRating(includeAllPerfect, record, Math.floor(record.rating), 2);
    if (!ratingByRank.size) {
      continue;
    }
    record.nextRanks = ratingByRank;
    candidates.push(record);
  }
  const minRating = Math.floor(records[topCount - 1].rating);
  for (let i = topCount; i < records.length; i++) {
    const record = records[i];
    if (requiredLv && (record.level < requiredLv.minLv || record.level > requiredLv.maxLv))
      continue;
    const ratingByRank = getNextRating(includeAllPerfect, record, minRating, 2);
    if (!ratingByRank.size) {
      continue;
    }
    record.nextRanks = ratingByRank;
    candidates.push(record);
    if (candidates.length >= count) {
      break;
    }
  }
  candidates.sort(compareCandidate);
  return candidates;
}

/**
 * @param songList List of all available songs
 * @param records Played charts
 * @param count Number of not played charts to return
 * @param requiredLv Required level (choose only charts of this level)
 */
export function getNotPlayedCharts(
  includeAllPerfect: boolean,
  songList: ReadonlyArray<SongProperties>,
  records: ReadonlyArray<ChartRecordWithRating>,
  minRating: number,
  count: number,
  requiredLv?: LevelDef,
) {
  const playedCharts = new Set<string>();
  for (const r of records) {
    const key = getSheetIdForDxRatingNet(r.songName, r.genre, r.chartType, r.difficulty);
    playedCharts.add(key);
  }
  const maxRating = records.length ? Math.ceil(records[0].rating) : 0;
  const hardestLv = requiredLv
    ? requiredLv.maxLv
    : maxRating
      ? maxRating / (RANK_S.factor * RANK_S.minAchv)
      : 15;
  const easiestLv = requiredLv
    ? requiredLv.minLv
    : minRating / (RANK_SSS_PLUS.factor * RANK_SSS_PLUS.minAchv);
  const candidates: ChartRecordWithRating[] = [];
  const shuffledSongList = shuffleArray(songList);
  for (const s of shuffledSongList) {
    // index 1 means ADVANCED (skip BASIC)
    for (let index = 1; index < s.lv.length; index++) {
      const level = s.lv[index];
      const positiveLv = Math.abs(level);
      // Math.min is hack for newly added Re:MASTER charts.
      // I think the hack is no longer needed as I made parseSongProperties check lv array length,
      // but just want to stay safe.
      const diff = DIFFICULTIES[Math.min(index, DIFFICULTIES.length - 1)];
      const key = getSheetIdForDxRatingNet(s.name, s.genre, s.dx, diff);
      if (playedCharts.has(key) || positiveLv < easiestLv || positiveLv > hardestLv) {
        continue; // skip played, too easy, or too hard charts
      }
      const record: ChartRecordWithRating = {
        songName: s.name,
        version: s.debut,
        difficulty: diff,
        level,
        genre: '',
        chartType: s.dx,
        rankTitle: '',
        rating: 0,
        achievement: 0,
        fcap: null,
      };
      const ratingByRank = getNextRating(includeAllPerfect, record, minRating, 1);
      if (!ratingByRank.size) {
        continue;
      }
      record.nextRanks = ratingByRank;
      candidates.push(record);
    }
    if (candidates.length >= count) {
      break;
    }
  }
  candidates.sort(compareSongsByLevel);
  return candidates;
}
