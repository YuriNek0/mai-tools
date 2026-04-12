import {SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {ChartRecord} from '../../common/chart-record';
import {
  GameRegion,
  getGameRegionFromOrigin,
  getGameRegionFromShortString,
  isMaimaiNetOrigin,
  MAIMAI_NET_ORIGINS,
} from '../../common/game-region';
import {GameVersion, validateGameVersion} from '../../common/game-version';
import {RATING_CALCULATOR_SUPPORTED_VERSIONS} from '../../common/infra/magic-api';
import {getInitialLanguage, Language, saveLanguage} from '../../common/lang';
import {LangContext} from '../../common/lang-react';
import {QueryParam} from '../../common/query-params';
import {
  BasicSongProps,
  loadSongDatabase,
  SongDatabase,
  SongProperties,
} from '../../common/song-props';
import {loadUserPreference, saveUserPreference, UserPreference} from '../../common/user-preference';
import {analyzePlayerRating} from '../rating-analyzer';
import {RatingData} from '../types';
import {DebugActions} from './DebugActions';
import {InternalLvInput, parseInternalLvInput} from './InternalLvInput';
import {LanguageChooser} from './LanguageChooser';
import {OtherTools} from './OtherTools';
import {PageFooter} from './PageFooter';
import {RatingOutput} from './RatingOutput';
import {RegionSelect} from './RegionSelect';
import {ScoreInput} from './ScoreInput';
import {VersionSelect} from './VersionSelect';

const MessagesByLang = {
  [Language.en_US]: {
    computeRating: 'Calculate Rating',
  },
  [Language.zh_TW]: {
    computeRating: '計算 Rating 值',
  },
  [Language.ko_KR]: {
    computeRating: '레이팅 계산하기',
  },
};

export const RootComponent = () => {
  const referrerRef = useRef(document.referrer && new URL(document.referrer).origin);
  const readySentRef = useRef(false);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const gameVerParam = queryParams.get(QueryParam.GameVersion);
  const latestGameVer = validateGameVersion(
    gameVerParam,
    RATING_CALCULATOR_SUPPORTED_VERSIONS[0],
    RATING_CALCULATOR_SUPPORTED_VERSIONS[RATING_CALCULATOR_SUPPORTED_VERSIONS.length - 1],
  );
  const [region, setRegion] = useState(() =>
    getGameRegionFromShortString(queryParams.get(QueryParam.GameRegion)),
  );
  const friendIdx = queryParams.get(QueryParam.FriendIdx);
  const playerName = queryParams.get(QueryParam.PlayerName);
  const date = useMemo(() => {
    const timestamp = parseInt(queryParams.get(QueryParam.Date) || '');
    return timestamp > 0 ? new Date(timestamp) : new Date();
  }, [queryParams]);

  const [lang, setLang] = useState(getInitialLanguage());
  const [playerScores, setPlayerScores] = useState<ChartRecord[]>([]);
  const [playerGradeIndex, setPlayerGradeIndex] = useState(0);
  const [songDatabase, setSongDatabase] = useState<SongDatabase | undefined>(undefined);
  const [lvOverrides, setLvOverrides] = useState(() => loadLvOverrides());
  const [progress, setProgress] = useState('');
  const [gameVer, setGameVer] = useState(latestGameVer);
  const [allSongs, setAllSongs] = useState<ReadonlyArray<BasicSongProps> | undefined>(undefined);
  const ratingData = useMemo<RatingData>(
    () =>
      createRatingData(
        date,
        playerName,
        latestGameVer,
        gameVer,
        region,
        songDatabase,
        lvOverrides,
        playerScores,
      ),
    [date, playerName, latestGameVer, gameVer, region, songDatabase, lvOverrides, playerScores],
  );

  useEffect(() => {
    updateDocumentTitle(lang);
  }, [lang]);

  useEffect(() => {
    loadSongDatabase(gameVer, region).then((songDb) => {
      setSongDatabase(songDb);
      console.log('Song database:', songDb);
      if (playerScores.length === 0) {
        setPlayerScores(readPlayerScoresFromQueryParams(queryParams, songDb));
      }
    });
  }, [gameVer, region, queryParams, setSongDatabase, setPlayerScores]);

  const postMessageToOpener = useCallback((data: {action: string; payload?: any}) => {
    if (window.opener) {
      if (referrerRef.current) {
        window.opener.postMessage(data, referrerRef.current);
      } else {
        // Unfortunately, document.referrer is not set when mai-tools is run on localhost.
        // Send message to all maimai net origins and pray that one of them will respond.
        for (const origin of MAIMAI_NET_ORIGINS) {
          window.opener.postMessage(data, origin);
        }
      }
    }
  }, []);

  const handleWindowMessage = useCallback((evt: MessageEvent) => {
    if (!isMaimaiNetOrigin(evt.origin) && evt.origin !== window.origin) {
      return;
    }
    referrerRef.current = evt.origin;
    console.log(evt.origin, evt.data);
    if (typeof evt.data !== 'object') {
      return;
    }
    switch (evt.data.action) {
      case 'gameVersion':
        setRegion(getGameRegionFromOrigin(evt.origin));
        setGameVer(
          validateGameVersion(
            evt.data.payload,
            RATING_CALCULATOR_SUPPORTED_VERSIONS[0],
            RATING_CALCULATOR_SUPPORTED_VERSIONS[RATING_CALCULATOR_SUPPORTED_VERSIONS.length - 1],
          ),
        );
        break;
      case 'playerGrade':
        const gradeIndex = parseInt(evt.data.payload);
        if (gradeIndex >= 0) {
          setPlayerGradeIndex(gradeIndex);
        }
        break;
      case 'showProgress':
        setProgress(evt.data.payload);
        break;
      case 'setPlayerScore':
        setPlayerScores(evt.data.payload);
        break;
      case 'allSongs':
        setAllSongs(evt.data.payload);
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleWindowMessage);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [handleWindowMessage]);

  useEffect(() => {
    // Avoid sending 'getFriendRecords' or 'ready' multiple times. It is expensive.
    if (readySentRef.current) {
      return;
    }
    if (friendIdx) {
      postMessageToOpener({action: 'getFriendRecords', payload: friendIdx});
    } else {
      postMessageToOpener({action: 'ready', payload: lang});
    }
    readySentRef.current = true;
  }, [friendIdx, lang, postMessageToOpener]);

  useEffect(() => {
    if (ratingData) {
      setTimeout(() => location.assign('#ratingOutput'), 0);
    }
  }, [ratingData]);

  const changeLanguage = useCallback(
    (newLang: Language) => {
      setLang(newLang);
      saveLanguage(newLang);
      postMessageToOpener({action: 'saveLanguage', payload: newLang});
    },
    [postMessageToOpener],
  );

  const handleClickAnalyzeRating = useCallback((evt: SyntheticEvent) => {
    evt.preventDefault();
    const lvInputTextarea = document.querySelector('#lvInput');
    if (lvInputTextarea instanceof HTMLTextAreaElement) {
      saveUserPreference(UserPreference.InternalLvOverride, lvInputTextarea.value);
      const overrides = parseInternalLvInput(lvInputTextarea.value);
      console.log(overrides);
      setLvOverrides(overrides);
    }
  }, []);

  const messages = MessagesByLang[lang];
  return (
    <LangContext.Provider value={lang}>
      <table className="inputSelectTable">
        <tbody>
          <LanguageChooser activeLanguage={lang} changeLanguage={changeLanguage} />
          <RegionSelect gameRegion={region} handleRegionSelect={setRegion} />
          <VersionSelect gameVer={gameVer} handleVersionSelect={setGameVer} />
        </tbody>
      </table>
      <ScoreInput setPlayerScores={setPlayerScores} />
      <InternalLvInput />
      <div className="actionArea">
        <button className="analyzeRatingBtn" onClick={handleClickAnalyzeRating}>
          {messages.computeRating}
        </button>
      </div>
      {progress ? <p>{progress}</p> : null}
      {ratingData && songDatabase && (
        <RatingOutput
          gameRegion={region}
          gameVer={gameVer}
          songDatabase={songDatabase}
          ratingData={ratingData}
          playerGradeIndex={playerGradeIndex}
          allSongs={allSongs}
        />
      )}
      <hr className="sectionSep" />
      <DebugActions />
      <hr className="sectionSep" />
      <PageFooter />
      <OtherTools gameVer={gameVer} />
    </LangContext.Provider>
  );
};

function createRatingData(
  date: Date,
  playerName: string | null,
  latestGameVer: GameVersion,
  targetGameVer: GameVersion,
  targetRegion: GameRegion,
  songDb: SongDatabase | undefined,
  lvOverrides: Partial<SongProperties>[],
  records: ChartRecord[],
): RatingData | null {
  if (!songDb || songDb.gameVer !== targetGameVer || songDb.region !== targetRegion) {
    // song database for the target version/region is still loading
    return null;
  }

  if (records.length === 0) {
    // no scores
    return null;
  }

  lvOverrides.forEach((override) => songDb.updateSong(override));
  console.log('Song database with overrides:', songDb);
  console.log('Player scores:', records);
  const ratingData = analyzePlayerRating(
    songDb,
    date,
    playerName,
    records,
    targetRegion,
    targetGameVer,
    targetGameVer < latestGameVer,
  );
  console.log('Rating Data:', ratingData);
  return ratingData;
}

function updateDocumentTitle(lang: Language) {
  switch (lang) {
    case Language.en_US:
      document.title = 'maimai DX Rating Analyzer';
      break;
    case Language.zh_TW:
      document.title = 'maimai DX R 値分析工具';
      break;
  }
}

function loadLvOverrides(): Partial<SongProperties>[] {
  let rawOverrides = loadUserPreference(UserPreference.InternalLvOverride) || '';
  const lvInputTextarea = document.querySelector('#lvInput');
  if (lvInputTextarea instanceof HTMLTextAreaElement) {
    // When textarea exists, its value takes precedence.
    rawOverrides = lvInputTextarea.value;
  }
  const overrides = parseInternalLvInput(rawOverrides);
  console.log(overrides);
  return overrides;
}

function readPlayerScoresFromQueryParams(qp: URLSearchParams, songDb: SongDatabase): ChartRecord[] {
  // Query params must exist
  const rawImages = qp.get(QueryParam.SongImage);
  const rawChartTypes = qp.get(QueryParam.ChartType);
  const rawDifficulties = qp.get(QueryParam.Difficulty);
  const rawAchievements = qp.get(QueryParam.Achievement);
  if (!rawImages || !rawChartTypes || !rawDifficulties || !rawAchievements) {
    return [];
  }

  // Query params must have valid values
  const images = rawImages.split('_');
  const chartTypeAndAps = Array.from(rawChartTypes)
    .map((ct) => parseInt(ct))
    .filter((ct) => !isNaN(ct));
  const difficulties = Array.from(rawDifficulties)
    .map((df) => parseInt(df))
    .filter((df) => !isNaN(df));
  const achievements = rawAchievements
    .split('_')
    .map((ac) => parseFloat(ac))
    .filter((ac) => !isNaN(ac));
  if (
    images.length !== chartTypeAndAps.length ||
    images.length !== difficulties.length ||
    images.length !== achievements.length
  ) {
    return [];
  }

  // All records must exist in SongDatabase
  let failed = false;
  const records = images.map<ChartRecord>((ico, i) => {
    const chartType = chartTypeAndAps[i] & 3; // Lower 2 bits for chart type
    const isAp = (chartTypeAndAps[i] & 4) !== 0; // 3rd bit for AP status
    const difficulty = difficulties[i];
    const achievement = achievements[i];
    const props = songDb.getSongPropsByIco(ico, chartType);
    if (!props) {
      console.warn('Could not find song for', ico, chartType, difficulty, achievement);
      failed = true;
      return;
    }
    const lv = props.lv[difficulty];
    const r: ChartRecord = {
      songName: props.name,
      genre: props.genre,
      difficulty,
      chartType,
      level: lv,
      achievement,
      fcap: achievement >= 101 ? 'AP+' : isAp ? 'AP' : null,
    };
    return r;
  });
  return failed ? [] : records;
}
