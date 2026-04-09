import {memo, useCallback, useMemo, useState} from 'react';

import {GameVersion, validateGameVersion} from '../../common/game-version';
import {formatFloat} from '../../common/number-helper';
import {QueryParam} from '../../common/query-params';
import {getRankDefinitions, getRankIndexByAchievement} from '../../common/rank-functions';
import {calculateJudgementDisplayMap} from '../judgementsHelper';
import {calculateScoreInfo} from '../scoreCalc';
import {
  FullNoteType,
  Judgement,
  NoteType,
  ScoreInfo,
  ScorePerType,
  StrictJudgement,
} from '../types';
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
  noteJudgements: Map<NoteType, Record<StrictJudgement, number>>;
  difficulty?: string;
  track: string;
  date: string;
  place: string;
  highScore?: boolean;
  combo?: string;
  syncStatus?: string;
  rankImg: Map<string, string>;
  apFcImg?: string;
  syncImg?: string;
  fetchRankImage: (title: string) => void;
}

export const ScorePage = memo(
  ({
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
    noteJudgements,
    combo,
    syncStatus,
    fetchRankImage,
  }: ScorePageProps) => {
    const gameVerStr = new URLSearchParams(window.location.search).get(QueryParam.GameVersion);
    const gameVer = validateGameVersion(gameVerStr, 0);
    const [isDxMode, setIsDxMode] = useState(gameVer >= GameVersion.DX);
    const [showDetail, setShowDetail] = useState(true);

    const scoreInfo = useMemo(() => {
      return calculateScoreInfo(noteJudgements, achievement);
    }, [noteJudgements, achievement]);
    const {achvLossDetail, finaleBorder, finaleAchievement, maxFinaleScore, breakDistribution} =
      scoreInfo;
    const noteLoss = getNoteLoss(isDxMode, achvLossDetail);

    const judgementDisplayMap = useMemo(() => {
      return calculateJudgementDisplayMap(noteJudgements);
    }, [noteJudgements]);
    const apFcStatus = useMemo(() => {
      return calculateApFcStatus(judgementDisplayMap.get('total'), finaleBorder);
    }, [judgementDisplayMap, finaleBorder]);

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
            fetchRankImage={fetchRankImage}
          />
          <JudgementContainer
            judgementDisplayMap={judgementDisplayMap}
            noteLoss={noteLoss}
            breakDistribution={breakDistribution}
            scorePerType={getDisplayScorePerType(isDxMode, showDetail, scoreInfo)}
            nextRank={getNextRankEntry(isDxMode, achievement, scoreInfo)}
            combo={combo}
            isDxMode={isDxMode}
            showDetail={showDetail}
          />
        </div>
      </div>
    );
  },
);

function calculateApFcStatus(
  totalJudgements: Record<Judgement, number>,
  finaleBorder: Map<string, number>,
) {
  if (totalJudgements.miss) {
    return null;
  } else if (finaleBorder.get('AP+') === 0) {
    return 'AP+';
  } else if (totalJudgements.good) {
    return 'FC';
  } else if (totalJudgements.great) {
    return 'FC+';
  }
  return 'AP';
}

function getNextRankEntry(
  isDxMode: boolean,
  achievement: number,
  props: Pick<ScoreInfo, 'finaleAchievement' | 'finaleBorder'>,
) {
  const achv = isDxMode ? achievement : props.finaleAchievement;
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

function getNoteLoss(isDxMode: boolean, achvLossDetail: ScoreInfo['achvLossDetail']) {
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
  props: Pick<ScoreInfo, 'achvLossDetail' | 'dxAchvPerType' | 'playerScorePerType'>,
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
