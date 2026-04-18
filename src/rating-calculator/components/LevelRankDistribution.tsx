import {memo, useCallback, useMemo, useState} from 'react';

import {ChartRecord} from '../../common/chart-record';
import {GameVersion} from '../../common/game-version';
import {getOfficialLevel} from '../../common/level-helper';
import {compareNumber} from '../../common/number-helper';
import {getRankDistribution, getRankMap} from '../rank-distribution';
import {RankDistributionDataRow} from './RankDistributionDataRow';
import {RankDistributionHeadRow} from './RankDistributionHeadRow';

const LEVEL_RANK_CELL_BASE_CLASSNAME = 'levelRankCell';
const LEVEL_RANK_CELL_CLASSNAMES = ['officialLevelCell'];

function getRecordsPerLevel(
  records: ReadonlyArray<ChartRecord>,
  getMapKey: (level: number) => string,
): Map<string, ChartRecord[]> {
  const levels = records.map((r) => r.level);
  levels.sort(compareNumber);
  levels.reverse();
  const recordsPerLevel = new Map<string, ChartRecord[]>();
  for (const lv of levels) {
    const lvText = getMapKey(lv);
    if (!recordsPerLevel.has(lvText)) {
      recordsPerLevel.set(lvText, []);
    }
  }
  for (const r of records) {
    const lvText = getMapKey(r.level);
    recordsPerLevel.get(lvText).push(r);
  }
  return recordsPerLevel;
}

interface Props {
  gameVer: GameVersion;
  chartRecords: ReadonlyArray<ChartRecord>;
  topChartsCount: number;
}

export const LevelRankDistribution = memo(({gameVer, chartRecords, topChartsCount}: Props) => {
  const [showMore, setShowMore] = useState<boolean>();
  const topRecords = chartRecords.slice(0, topChartsCount);
  const includeAllPerfect = gameVer >= GameVersion.CiRCLE;
  const ranks = Array.from(getRankMap(topRecords, includeAllPerfect).keys());
  const recordsPerLevel = useMemo(
    () =>
      showMore
        ? getRecordsPerLevel(topRecords, (lv) => lv.toFixed(1))
        : getRecordsPerLevel(topRecords, (lv) => getOfficialLevel(gameVer, lv)),
    [gameVer, showMore, topRecords],
  );

  const toggleShowMore = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      setShowMore(!showMore);
    },
    [showMore],
  );
  const firstCell = (
    <button className="expandRatingOverview" onClick={toggleShowMore}>
      {showMore ? '－' : '＋'}
    </button>
  );
  return (
    <table className="rankDistributionTable">
      <thead>
        <RankDistributionHeadRow
          columns={ranks}
          firstCell={firstCell}
          baseCellClassname={LEVEL_RANK_CELL_BASE_CLASSNAME}
          perColumnClassnames={LEVEL_RANK_CELL_CLASSNAMES}
        />
      </thead>
      <tbody>
        {Array.from(recordsPerLevel.entries()).map(([level, records]) => (
          <RankDistributionDataRow
            key={level}
            rowHead={level}
            columns={ranks}
            rankDist={getRankDistribution(records, includeAllPerfect)}
            baseCellClassname={LEVEL_RANK_CELL_BASE_CLASSNAME}
            perColumnClassnames={LEVEL_RANK_CELL_CLASSNAMES}
          />
        ))}
      </tbody>
    </table>
  );
});
