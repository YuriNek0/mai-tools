import {memo, useCallback, useRef, useState} from 'react';

import {LevelDef} from '../common/level-helper';
import {RankDef} from '../common/rank-functions';
import {IntervalLines} from './IntervalLines';
import {LvRatingContainer} from './LvRatingContainer';
import {RatingAxis} from './RatingAxis';

interface Props {
  heightUnit: number;
  maxRating: number;
  levels: ReadonlyArray<LevelDef>;
  canZoomIn: boolean;
  topPadding: number;
  ranks: ReadonlyArray<RankDef>;
  onSetRange: (minLv: string, maxLv: string) => void;
  axisLabelStep: number;
}

export const RatingVisualizer = memo(
  ({
    axisLabelStep,
    canZoomIn,
    onSetRange,
    heightUnit,
    levels,
    maxRating,
    ranks,
    topPadding,
  }: Props) => {
    const [highlightInterval, setHighlightInterval] = useState<[number, number] | undefined>();
    const removeIntervalTimeoutRef = useRef<number>(0);

    const removeHighlightInterval = useCallback(() => {
      removeIntervalTimeoutRef.current = window.setTimeout(() => {
        setHighlightInterval(undefined);
        removeIntervalTimeoutRef.current = 0;
      }, 0);
    }, []);

    const cancelRemoveHighlightInterval = useCallback(() => {
      if (removeIntervalTimeoutRef.current) {
        clearTimeout(removeIntervalTimeoutRef.current);
        removeIntervalTimeoutRef.current = 0;
      }
    }, []);

    const handleHighlightInterval = useCallback(
      (minRt: number, maxRt: number) => {
        if (highlightInterval && highlightInterval[0] === minRt && highlightInterval[1] === maxRt) {
          removeHighlightInterval();
        } else {
          setHighlightInterval([minRt, maxRt]);
        }
      },
      [highlightInterval, setHighlightInterval, removeHighlightInterval],
    );

    const containerHeight = (maxRating + axisLabelStep) * heightUnit + topPadding;

    if (!heightUnit) {
      return null;
    }

    return (
      <div
        className="container"
        onBlur={removeHighlightInterval}
        onFocus={cancelRemoveHighlightInterval}
        tabIndex={-1}
      >
        <div className="ratingContainer">
          <RatingAxis
            maxRating={maxRating}
            heightUnit={heightUnit}
            containerHeight={containerHeight}
            step={axisLabelStep}
            onClick={removeHighlightInterval}
          />
          {levels.map((lv, i) => {
            return (
              <LvRatingContainer
                key={i}
                canZoomIn={canZoomIn}
                lvTitle={lv.title}
                minLv={lv.minLv}
                maxLv={lv.maxLv}
                heightUnit={heightUnit}
                containerHeight={containerHeight}
                ranks={ranks}
                onZoomIn={onSetRange}
                onHighlightInterval={handleHighlightInterval}
              />
            );
          })}
          {highlightInterval && (
            <IntervalLines
              interval={highlightInterval}
              heightUnit={heightUnit}
              onClick={removeHighlightInterval}
            />
          )}
        </div>
      </div>
    );
  },
);
