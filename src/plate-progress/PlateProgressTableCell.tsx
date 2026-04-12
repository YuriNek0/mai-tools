import {KeyboardEvent, useCallback} from 'react';

import {Difficulty, getDifficultyClassName} from '../common/difficulties';
import {PlateType} from './plate_info';

interface Props {
  useTh?: boolean;
  className?: string;
  d: Difficulty;
  plateType?: PlateType;
  selected?: boolean;
  value: string | number;
  onClick?: (plate: PlateType, d: Difficulty) => void;
}
export function PlateProgressTableCell(props: Props) {
  const {onClick, plateType, d} = props;
  const handleClick = useCallback(() => {
    if (plateType) {
      onClick(plateType, d);
    }
  }, [onClick, plateType, d]);
  const handleKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.ctrlKey || evt.altKey || evt.metaKey || evt.shiftKey) {
        return;
      }
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );
  const clickableProps =
    plateType && onClick
      ? {
          onClick: handleClick,
          onKeyDown: handleKeyDown,
          tabIndex: 0,
        }
      : {};
  let tdClassName = props.className || '';
  if (props.selected) {
    tdClassName += ' selected';
  }
  return props.useTh ? (
    <th className={getDifficultyClassName(props.d)} {...clickableProps}>
      {props.value}
    </th>
  ) : (
    <td className={tdClassName} {...clickableProps}>
      {props.value}
    </td>
  );
}
