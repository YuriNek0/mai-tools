import {memo, useCallback, useEffect, useMemo, useState} from 'react';

import {LangSwitcher} from '../common/components/LangSwitcher';
import {GameVersion} from '../common/game-version';
import {getInitialLanguage, Language} from '../common/lang';
import {LangContext} from '../common/lang-react';
import {
  getMaxConstant,
  getMinConstant,
  getMinMinorOfPlus,
  getOfficialLevel,
  LevelDef,
  MAX_LEVEL,
} from '../common/level-helper';
import {getRankDefinitions} from '../common/rank-functions';
import {loadUserPreference, saveUserPreference, UserPreference} from '../common/user-preference';
import {MultiplierTable} from './MultiplierTable';
import {OptionsInput} from './OptionsInput';
import {DisplayValue, RatingTable} from './RatingTable';
import {RatingVisualizer} from './RatingVisualizer';
import {RecommendedLevels} from './RecommendedLevels';

export const RootComponent = memo(() => {
  const lang = getInitialLanguage();
  const [minLv, setMinLv] = useState(() => loadUserPreference(UserPreference.MinLv) || '10');
  const [minRank, setMinRank] = useState(() => loadUserPreference(UserPreference.MinRank) || 'SS');
  const [maxLv, setMaxLv] = useState(() => loadUserPreference(UserPreference.MaxLv) || '14+');
  const [heightUnit, setHeightUnit] = useState(() => {
    const savedHeightUnit = parseInt(loadUserPreference(UserPreference.HeightUnit));
    // Hide visualizer by default
    return isNaN(savedHeightUnit) ? 0 : savedHeightUnit;
  });
  const [tableDisplay, setTableDisplay] = useState<DisplayValue>(() => {
    return (loadUserPreference(UserPreference.TableDisplay) as DisplayValue) || DisplayValue.RANGE;
  });
  const topPadding = heightUnit * 2 + 50;
  const axisLabelStep = 5;
  const levels = useMemo(() => getLevelsInRange(minLv, maxLv), [minLv, maxLv]);
  const maxRating = calculateMaxRating(levels[levels.length - 1].maxLv);
  const canZoomIn = levels[0].minLv + 1 < levels[levels.length - 1].maxLv;
  const allRanks = getRankDefinitions();
  const ranksEndIndex = allRanks.findIndex((rank) => rank.title == minRank);
  const ranks = allRanks.slice(0, ranksEndIndex + 1);

  useEffect(() => {
    updateDocumentTitle(lang);
  }, [lang]);

  const handleChangeHeightUnit = useCallback(
    (unit: number) => {
      saveUserPreference(UserPreference.HeightUnit, unit.toFixed(0));
      setHeightUnit(unit);
    },
    [setHeightUnit],
  );

  const handleSetRange = useCallback(
    (newMinLv: string, newMaxLv: string) => {
      saveUserPreference(UserPreference.MinLv, newMinLv);
      saveUserPreference(UserPreference.MaxLv, newMaxLv);
      setMinLv(newMinLv);
      setMaxLv(newMaxLv);
    },
    [setMinLv, setMaxLv],
  );

  const handleSetMinRank = useCallback(
    (newMinRank: string) => {
      saveUserPreference(UserPreference.MinRank, newMinRank);
      setMinRank(newMinRank);
    },
    [setMinRank],
  );

  const handleSetTableDisplay = useCallback(
    (newTableDisplay: DisplayValue) => {
      saveUserPreference(UserPreference.TableDisplay, newTableDisplay);
      setTableDisplay(newTableDisplay);
    },
    [setTableDisplay],
  );

  return (
    <LangContext.Provider value={lang}>
      <div className="ratingVisualizer">
        <OptionsInput
          heightUnit={heightUnit}
          maxLv={maxLv}
          minLv={minLv}
          minRank={minRank}
          tableDisplay={tableDisplay}
          onChangeUnit={handleChangeHeightUnit}
          onSetMinRank={handleSetMinRank}
          onSetRange={handleSetRange}
          onSetTableDisplay={handleSetTableDisplay}
        />
        <RatingVisualizer
          canZoomIn={canZoomIn}
          heightUnit={heightUnit}
          maxRating={maxRating}
          levels={levels}
          topPadding={topPadding}
          axisLabelStep={axisLabelStep}
          ranks={ranks}
          onSetRange={handleSetRange}
        />
        <div className="container">
          <RatingTable ranks={ranks} levels={levels} displayValue={tableDisplay} />
          <RecommendedLevels />
          <hr className="sectionSep" />
          <MultiplierTable />
          <footer className="footer">
            <hr className="sectionSep" />
            <LangSwitcher />
            <br />
            <span>Made by </span>
            <a className="authorLink" href="https://github.com/myjian" target="_blank">
              myjian
            </a>
            <span>.</span>
          </footer>
        </div>
      </div>
    </LangContext.Provider>
  );
});

function getLevelsInRange(minLv: string, maxLv: string): LevelDef[] {
  const startLv = getMinConstant(GameVersion.PRiSM, minLv);
  const endLv = getMaxConstant(GameVersion.PRiSM, maxLv);
  const minMinor = getMinMinorOfPlus(GameVersion.PRiSM);
  const lvs = [];
  let currentLv = startLv;
  const showEachConstant = endLv - startLv < 1;
  while (currentLv <= endLv) {
    const nextLv =
      showEachConstant || currentLv === MAX_LEVEL
        ? currentLv + 0.1
        : Math.round(currentLv) === currentLv
          ? currentLv + minMinor
          : currentLv + 1 - minMinor;
    lvs.push({
      title: showEachConstant
        ? currentLv.toFixed(1)
        : getOfficialLevel(GameVersion.PRiSM, currentLv),
      minLv: currentLv,
      maxLv: nextLv - 0.1,
    });
    currentLv = nextLv;
  }
  return lvs;
}

function calculateMaxRating(maxLv: number) {
  const maxRank = getRankDefinitions()[0];
  return Math.floor(maxRank.minAchv * maxRank.factor * maxLv);
}

function updateDocumentTitle(lang: Language) {
  switch (lang) {
    case Language.en_US:
      document.title = 'maimai DX Rating Lookup Table & Visualization';
      break;
    case Language.zh_TW:
      document.title = 'maimai DX R值圖表';
      break;
    case Language.ko_KR:
      document.title = 'maimai DX 레이팅 상수 표 & 시각화';
      break;
  }
}
