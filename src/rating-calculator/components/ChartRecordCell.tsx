import {KeyboardEvent, useCallback} from 'react';

import {ColumnType} from '../types';

const SCORE_RECORD_CELL_BASE_CLASSNAME = 'scoreRecordCell';
const SCORE_RECORD_CELL_CLASSNAMES: Record<ColumnType, string> = {
  [ColumnType.NO]: 'orderCell',
  [ColumnType.SONG_TITLE]: 'songTitleCell',
  [ColumnType.VERSION]: 'versionCell',
  [ColumnType.CHART_TYPE]: 'chartTypeCell',
  [ColumnType.LEVEL]: 'levelCell',
  [ColumnType.ACHIEVEMENT]: 'achievementCell',
  [ColumnType.RANK]: 'rankCell',
  [ColumnType.NEXT_RANK]: 'rankCell',
  [ColumnType.RATING]: 'ratingCell',
  [ColumnType.NEXT_RATING]: 'nextRatingCell',
};

interface Props {
  column: ColumnType;
  isHeading?: boolean;
  onClickCell?: (col: ColumnType) => void;
  children?: React.ReactNode;
}

export const ChartRecordCell = ({column, isHeading, onClickCell, children}: Props) => {
  const handleCellClick = useCallback(() => {
    onClickCell?.(column);
  }, [onClickCell, column]);

  const handleCellKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        onClickCell?.(column);
      }
    },
    [onClickCell, column],
  );

  const cellClassName =
    SCORE_RECORD_CELL_BASE_CLASSNAME + ' ' + SCORE_RECORD_CELL_CLASSNAMES[column];
  const clickProps = onClickCell
    ? {
        tabIndex: 0,
        onClick: handleCellClick,
        onKeyDown: handleCellKeyDown,
      }
    : {};
  if (isHeading) {
    return (
      <th className={cellClassName} {...clickProps}>
        {children}
      </th>
    );
  }
  return (
    <td className={cellClassName} {...clickProps}>
      {children}
    </td>
  );
};
