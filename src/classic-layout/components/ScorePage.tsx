import {useCallback, useState} from 'react';

import {GameVersion, validateGameVersion} from '../../common/game-version';
import {formatFloat} from '../../common/number-helper';
import {QueryParam} from '../../common/query-params';
import {getRankDefinitions, getRankIndexByAchievement} from '../../common/rank-functions';
import {BreakScoreMap, FullNoteType, Judgement, ScorePerType} from '../types';
import {AchievementInfo} from './AchievementInfo';
import {DateAndPlace} from './DateAndPlace';
import {JudgementContainer} from './JudgementContainer';
import {SongImg} from './SongImg';
import {SongInfo} from './SongInfo';

function formatLossNumber(loss: number, digits: number) {
  return loss == 0
    ? ''
    : '-' + (digits ? formatFloat(loss, digits) + '%' : loss.toLocaleString('en'));
}

interface ScorePageProps {
  songTitle: string;
  songImgSrc?: string;
  achievement: number;
  apFcImg?: string;
  combo?: string;
  date: string;
  place: string;
  difficulty?: string;
  finaleAchievement: number;
  finaleBorder: Map<string, number>;
  highScore?: boolean;
  judgementDisplayMap: Map<FullNoteType, Record<Judgement, number>>;
  rankImg: Map<string, string>;
  syncImg?: string;
  syncStatus?: string;
  track: string;
  maxFinaleScore: number;
  breakDistribution: BreakScoreMap;
  pctPerNoteType: Map<string, number>;
  playerScorePerType: ScorePerType;
  dxAchvPerType: ScorePerType;
  apFcStatus: string | null;
  achvLossDetail: {
    dx: Map<FullNoteType, Record<Judgement | 'total', number>>;
    finale: Map<FullNoteType, Record<Judgement | 'total', number>>;
  };
  fetchRankImage: (title: string) => void;
}

export const ScorePage = (props: ScorePageProps) => {
  const {
    achievement,
    apFcImg,
    rankImg,
    syncImg,
    highScore,
    date,
    place,
    songTitle,
    track,
    difficulty,
    songImgSrc,
    judgementDisplayMap,
    combo,
    syncStatus,
    apFcStatus,
    finaleAchievement,
    maxFinaleScore,
    breakDistribution,
  } = props;
  const gameVerStr = new URLSearchParams(window.location.search).get(QueryParam.GameVersion);
  const gameVer = validateGameVersion(gameVerStr, 0);
  const [isDxMode, setIsDxMode] = useState(gameVer >= GameVersion.DX);
  const [showDetail, setShowDetail] = useState(true);
  const noteLoss = getNoteLoss(isDxMode, props.achvLossDetail);

  const toggleDxMode = useCallback(() => {
    setIsDxMode(!isDxMode);
  }, [isDxMode, setIsDxMode]);

  const toggleDisplayMode = useCallback(() => {
    setShowDetail(!showDetail);
  }, [showDetail, setShowDetail]);

  return (
    <div className="songScoreContainer">
      <DateAndPlace
        actualPlace={place}
        date={date}
        isDxMode={isDxMode}
        toggleDxMode={toggleDxMode}
      />
      <div className="songScoreBody">
        <hr className="trackTopLine" />
        <SongInfo songTitle={songTitle} track={track} difficulty={difficulty} />
        <SongImg imgSrc={songImgSrc} />
        <AchievementInfo
          apFcStatus={apFcStatus}
          apFcImg={apFcImg}
          rankImgMap={rankImg}
          syncStatus={syncStatus}
          syncImg={syncImg}
          isDxMode={isDxMode}
          isHighScore={highScore}
          dxAchv={achievement}
          finaleAchv={finaleAchievement}
          maxFinaleAchv={maxFinaleScore}
          showMaxAchv={showDetail}
          toggleDisplayMode={toggleDisplayMode}
          fetchRankImage={props.fetchRankImage}
        />
        <JudgementContainer
          judgementDisplayMap={judgementDisplayMap}
          noteLoss={noteLoss}
          breakDistribution={breakDistribution}
          scorePerType={getDisplayScorePerType(isDxMode, showDetail, props)}
          nextRank={getNextRankEntry(isDxMode, props)}
          combo={combo}
          isDxMode={isDxMode}
          showDetail={showDetail}
        />
      </div>
    </div>
  );
};

function getNextRankEntry(
  isDxMode: boolean,
  props: Pick<ScorePageProps, 'achievement' | 'finaleAchievement' | 'finaleBorder'>
) {
  const achv = isDxMode ? props.achievement : props.finaleAchievement;
  if (isDxMode) {
    if (achv === 101) {
      return undefined;
    } else if (achv >= 100.5) {
      return {
        title: 'AP+',
        diff: 101 - achv,
      };
    }
    const nextRankDef = getRankDefinitions()[getRankIndexByAchievement(achv) - 1];
    return {
      title: nextRankDef.title,
      diff: nextRankDef.minAchv - achv,
    };
  }
  let nextRank: {title: string; diff: number} | undefined;
  props.finaleBorder.forEach((diff, title) => {
    if (diff > 0 && !nextRank) {
      nextRank = {title, diff};
    }
  });
  return nextRank;
}

function getNoteLoss(isDxMode: boolean, achvLossDetail: ScorePageProps['achvLossDetail']) {
  const lossDetail = isDxMode ? achvLossDetail.dx : achvLossDetail.finale;
  const digits = isDxMode ? 2 : 0;
  const map = new Map<FullNoteType, Record<Judgement, string>>();
  lossDetail.forEach((d, noteType) => {
    map.set(noteType, {
      perfect: formatLossNumber(d.perfect, digits),
      great: formatLossNumber(d.great, digits),
      good: formatLossNumber(d.good, digits),
      miss: formatLossNumber(d.miss, digits),
    });
  });
  return map;
}

function getDisplayScorePerType(
  isDxMode: boolean,
  showDetail: boolean,
  props: Pick<ScorePageProps, 'achvLossDetail' | 'dxAchvPerType' | 'playerScorePerType'>
): ScorePerType {
  const lossDetail = isDxMode ? props.achvLossDetail.dx : props.achvLossDetail.finale;
  if (showDetail) {
    const digits = isDxMode ? 4 : 0;
    const displayScorePerType = new Map();
    lossDetail.forEach((detail, noteType) => {
      const isMax = detail.total === 0;
      const score = formatLossNumber(detail.total, digits);
      displayScorePerType.set(noteType, {isMax, score});
    });
    return displayScorePerType;
  }
  return isDxMode ? props.dxAchvPerType : props.playerScorePerType;
}
