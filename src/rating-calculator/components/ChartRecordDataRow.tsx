import React, {ReactNode, useCallback} from 'react';

import {getChartTypeName} from '../../common/chart-type';
import {Difficulty, getDifficultyClassName} from '../../common/difficulties';
import {getDisplayLv} from '../../common/level-helper';
import {getRankTitle} from '../../common/rank-functions';
import {getSongNickname, RATING_TARGET_SONG_NAME_PREFIX} from '../../common/song-name-helper';
import {getArcadeSongLink} from '../../common/wiki-link';
import {ChartRecordWithRating, ColumnType} from '../types';
import {ChartRecordRow} from './ChartRecordRow';

function getSongNameCell(record: ChartRecordWithRating, isCandidate?: boolean): ReactNode {
  const prefix = isCandidate && record.isTarget ? RATING_TARGET_SONG_NAME_PREFIX : '';
  const displayName = prefix + getSongNickname(record.songName, record.genre);

  return (
    <a
      className="songWikiLink"
      href={getArcadeSongLink(record.songName, record.chartType, record.difficulty)}
      target="_blank"
    >
      {displayName}
    </a>
  );
}

interface Props {
  record: ChartRecordWithRating;
  columns: ReadonlyArray<ColumnType>;
  index: number;
  isCandidate?: boolean;
}

export const ChartRecordDataRow = React.memo((props: Props) => {
  const {record, index, columns, isCandidate} = props;
  const renderColumn = useCallback(
    (c: ColumnType) => {
      switch (c) {
        case ColumnType.NO:
          return index.toString();
        case ColumnType.SONG_TITLE:
          return getSongNameCell(record, isCandidate);
        case ColumnType.CHART_TYPE:
          return getChartTypeName(record.chartType);
        case ColumnType.LEVEL:
          return getDisplayLv(record.level, record.difficulty === Difficulty.UTAGE);
        case ColumnType.ACHIEVEMENT:
          return isCandidate && record.rating ? (
            <>
              <div className="textAlignRight">{record.achievement.toFixed(4) + '%'}</div>
              <div className="textAlignCenter">{Math.floor(record.rating)}</div>
            </>
          ) : (
            record.achievement.toFixed(4) + '%'
          );
        case ColumnType.RANK:
          return getRankTitle(record.achievement);
        case ColumnType.NEXT_RANK:
          return record.nextRanks
            ? Array.from(record.nextRanks.values()).map((r, idx) => (
                <div key={idx}>{r.rank.minAchv + '%'}</div>
              ))
            : '';
        case ColumnType.NEXT_RATING:
          return record.nextRanks
            ? Array.from(record.nextRanks.values()).map((r, idx) => (
                <div key={idx}>
                  {Math.floor(record.level * r.rank.factor * r.rank.minAchv).toFixed(0)}
                  &nbsp;(+{r.minRt.toFixed(0)})
                </div>
              ))
            : '';
        case ColumnType.RATING:
          return Math.floor(record.rating).toString();
      }
    },
    [index, record, isCandidate]
  );
  return (
    <ChartRecordRow
      className={getDifficultyClassName(record.difficulty)}
      columns={columns}
      renderCell={renderColumn}
    />
  );
});
