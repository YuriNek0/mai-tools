import {ChartRecord} from '../common/chart-record';
import {getRankDefinitions, getRankTitle} from '../common/rank-functions';

export function getRankDistribution(
  scoreList: ReadonlyArray<ChartRecord>,
  includeAllPerfect: boolean,
): Map<string, number> {
  const rankDefs = getRankDefinitions();
  const countPerRank = new Map();
  if (includeAllPerfect) {
    countPerRank.set('AP', 0);
  }
  for (const r of rankDefs) {
    countPerRank.set(r.title, 0);
  }
  scoreList.forEach((record) => {
    const rankTitle = record.fcap?.includes('AP') ? 'AP' : getRankTitle(record.achievement);
    const rankCount = countPerRank.get(rankTitle);
    countPerRank.set(rankTitle, rankCount + 1);
  });
  return countPerRank;
}

export function getRankMap(
  records: ReadonlyArray<ChartRecord>,
  includeAllPerfect: boolean,
): Map<string, boolean> {
  const overallRankDistribution = getRankDistribution(records, includeAllPerfect);
  const rankMap = new Map<string, boolean>();
  let remaining = records.length;
  let started = false;
  for (const [rank, count] of overallRankDistribution) {
    // Exclude higher ranks that have zero count
    if (!started && count === 0) {
      continue;
    }
    started = true;
    if (remaining > 0) {
      rankMap.set(rank, true);
    }
    remaining -= count;
  }
  return rankMap;
}
