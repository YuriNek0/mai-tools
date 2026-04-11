import {memo, ReactNode} from 'react';

import {ColumnType} from '../types';
import {ChartRecordCell} from './ChartRecordCell';

const SCORE_RECORD_ROW_CLASSNAME = 'scoreRecordRow';

interface Props {
  className?: string;
  columns: ReadonlyArray<ColumnType>;
  renderCell: (col: ColumnType) => ReactNode;
  isHeading?: boolean;
  onClickCell?: (col: ColumnType) => void;
}

export const ChartRecordRow = memo(
  ({className, columns, isHeading, renderCell, onClickCell}: Props) => {
    let rowClassName = SCORE_RECORD_ROW_CLASSNAME;
    if (className) {
      rowClassName += ' ' + className;
    }

    return (
      <tr className={rowClassName}>
        {columns.map((col, index) => (
          <ChartRecordCell key={index} column={col} isHeading={isHeading} onClickCell={onClickCell}>
            {renderCell(col)}
          </ChartRecordCell>
        ))}
      </tr>
    );
  },
);
