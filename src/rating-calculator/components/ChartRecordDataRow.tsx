import {memo, ReactNode, useCallback} from 'react';

import {getChartTypeName} from '../../common/chart-type';
import {Difficulty, getDifficultyClassName} from '../../common/difficulties';
import {getVersionName} from '../../common/game-version';
import {getDisplayLv} from '../../common/level-helper';
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

const RECORD_RENDERER: Record<
  ColumnType,
  (record: ChartRecordWithRating, idx: number, isCandidate?: boolean) => ReactNode
> = {
  [ColumnType.NO]: (_, idx) => idx.toString(),
  [ColumnType.SONG_TITLE]: (record, _, isCandidate) => getSongNameCell(record, isCandidate),
  [ColumnType.VERSION]: (record) => getVersionName(record.version).replace(/ PLUS$/, '+'),
  [ColumnType.CHART_TYPE]: (record) => getChartTypeName(record.chartType),
  [ColumnType.LEVEL]: (record) =>
    getDisplayLv(record.level, record.difficulty === Difficulty.UTAGE),
  [ColumnType.ACHIEVEMENT]: (record, _, isCandidate) =>
    isCandidate && record.rating ? (
      <>
        <div className="textAlignRight">{record.achievement.toFixed(4) + '%'}</div>
        <div className="textAlignCenter">{Math.floor(record.rating)}</div>
      </>
    ) : (
      record.achievement.toFixed(4) + '%'
    ),
  [ColumnType.RANK]: (record) => record.rankTitle,
  [ColumnType.NEXT_RANK]: (record) =>
    record.nextRanks
      ? Array.from(record.nextRanks.values()).map((r, idx) => <div key={idx}>{r.target}</div>)
      : '',
  [ColumnType.NEXT_RATING]: (record) =>
    record.nextRanks
      ? Array.from(record.nextRanks.values()).map((r, idx) => (
          <div key={idx}>
            {Math.floor(r.rating)}
            &nbsp;(+{r.delta.toFixed(0)})
          </div>
        ))
      : '',
  [ColumnType.RATING]: (record) => Math.floor(record.rating).toString(),
};

export const ChartRecordDataRow = memo((props: Props) => {
  const {record, index, columns, isCandidate} = props;
  const renderColumn = useCallback(
    (c: ColumnType) => {
      return RECORD_RENDERER[c]?.(record, index, isCandidate) || '';
    },
    [index, record, isCandidate],
  );
  return (
    <ChartRecordRow
      className={getDifficultyClassName(record.difficulty)}
      columns={columns}
      renderCell={renderColumn}
    />
  );
});
