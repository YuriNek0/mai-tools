import {ChartRecord} from '../common/chart-record';
import {Difficulty} from '../common/difficulties';
import {getPlayerGrade, getPlayerName} from '../common/fetch-score-util';
import {fetchScores, fetchScoresFull, SELF_SCORE_URLS} from '../common/fetch-self-score';
import {getGameRegionFromOrigin, isMaimaiNetOrigin} from '../common/game-region';
import {GameVersion} from '../common/game-version';
import {getInitialLanguage, Language, saveLanguage} from '../common/lang';
import {fetchGameVersion, fetchPage} from '../common/net-helpers';
import {
  getChartRecordFromPlayRecordRow,
  getIsNewRecord,
  PLAY_HISTORY_PATH,
} from '../common/play-history';
import {QueryParam} from '../common/query-params';
import {statusText} from '../common/score-fetch-progress';
import {getScriptHost} from '../common/script-host';
import {getSongNickname, getSongNicknameWithChartType} from '../common/song-name-helper';
import {SongDatabase} from '../common/song-props';
import {ALLOWED_ORIGINS, fetchAllSongs, getPostMessageFunc, handleError} from '../common/util';

declare global {
  interface Window {
    ratingCalcMsgListener?: (evt: MessageEvent) => void;
  }
}

(function () {
  const BASE_URL = getScriptHost('analyze-rating-in-newtab');
  let LANG = getInitialLanguage();
  const UIString = {
    [Language.zh_TW]: {
      pleaseLogIn: '請登入 maimai NET',
      analyze: '分析 Rating',
      plateProgress: '名牌板',
    },
    [Language.en_US]: {
      pleaseLogIn: 'Please log in to maimai DX NET.',
      analyze: 'Analyze Rating',
      plateProgress: 'Plates',
    },
    [Language.ko_KR]: {
      pleaseLogIn: 'maimai DX NET에 로그인 해 주세요.',
      analyze: '레이팅 분석하기',
      plateProgress: 'Plates', // TODO
    },
  };

  const isOnFriendPage = location.pathname.includes('friend');
  const domCache = new Map<Difficulty, Document>();

  async function fetchRecentPlays(
    domCache: Map<Difficulty, Document>,
    songDb: SongDatabase,
    visitedCharts: Set<string>
  ): Promise<ChartRecord[]> {
    let dom = domCache.get(null);
    if (!dom) {
      dom = await fetchPage(PLAY_HISTORY_PATH);
      domCache.set(null, dom);
    }
    // Keep only new records
    const rows = Array.from(
      dom.querySelectorAll<HTMLElement>('.main_wrapper .p_10.t_l.f_0.v_b')
    ).filter((row) => getIsNewRecord(row));
    return rows
      .map((row) => getChartRecordFromPlayRecordRow(row, songDb))
      .filter((record) => {
        if (record.difficulty === Difficulty.UTAGE) {
          return false;
        }
        // When multiple records of one chart exist, keep the most recent one
        const key =
          getSongNicknameWithChartType(record.songName, record.genre, record.chartType) +
          record.difficulty;
        if (visitedCharts.has(key)) {
          return false;
        }
        visitedCharts.add(key);
        return true;
      });
  }

  /**
   * Load self scores and send them via the callback provided.
   * @return recent play records
   */
  async function fetchSelfRecords(
    gameVer: GameVersion,
    send: (action: string, payload: unknown) => void,
    fullRecords: boolean = false
  ): Promise<ChartRecord[]> {
    // Fetch player grade
    const playerGrade = isOnFriendPage ? null : getPlayerGrade(document.body);
    if (playerGrade) {
      send('playerGrade', playerGrade);
    }
    const songDb = new SongDatabase(gameVer, null, false);
    // Fetch recent plays
    const visitedCharts = new Set<string>();
    send('showProgress', statusText(LANG, null, false));
    const recentScoreList = await fetchRecentPlays(domCache, songDb, visitedCharts);
    let scoreList = recentScoreList;
    // Fetch scores by difficulty
    for (const difficulty of SELF_SCORE_URLS.keys()) {
      send('showProgress', statusText(LANG, difficulty, false));
      const scoresByDifficulty = await (fullRecords ? fetchScoresFull : fetchScores)(
        difficulty,
        domCache,
        songDb
      );
      scoreList = scoreList.concat(
        scoresByDifficulty.filter((r) => {
          const key = getSongNicknameWithChartType(r.songName, r.genre, r.chartType) + r.difficulty;
          return !visitedCharts.has(key);
        })
      );
    }
    send('showProgress', '');
    send('setPlayerScore', scoreList);
    return recentScoreList;
  }

  function insertAnalyzeButton(gameVer: GameVersion, playerName: string) {
    const region = getGameRegionFromOrigin(window.location.origin);
    const urlSearch = new URLSearchParams({
      [QueryParam.GameVersion]: gameVer.toString(),
      [QueryParam.GameRegion]: region,
    });
    if (playerName) {
      urlSearch.set(QueryParam.PlayerName, playerName);
    }
    const profileBlock = document.body.querySelector('.basic_block.p_10.f_0');
    if (!profileBlock) {
      return;
    }
    let analyzeSpan = document.querySelector('.analyzeLinks') as HTMLSpanElement;
    if (analyzeSpan) {
      analyzeSpan.remove();
    }
    analyzeSpan = document.createElement('span');
    analyzeSpan.className = 'analyzeLinks';

    const analyzeRatingLink = document.createElement('a');
    analyzeRatingLink.className = 'f_14';
    analyzeRatingLink.style.color = '#1477e6';
    analyzeRatingLink.target = 'selfRating';
    analyzeRatingLink.append(UIString[LANG].analyze);
    analyzeRatingLink.href = BASE_URL + '/rating-calculator/?' + urlSearch;

    const analyzePlatesLink = document.createElement('a');
    analyzePlatesLink.className = 'f_14';
    analyzePlatesLink.style.color = '#1477e6';
    analyzePlatesLink.target = 'plateProgress';
    analyzePlatesLink.append(UIString[LANG].plateProgress);
    analyzePlatesLink.href = BASE_URL + '/plate-progress/?' + urlSearch;

    analyzeSpan.append(analyzeRatingLink, ' / ', analyzePlatesLink, document.createElement('br'));

    if (location.pathname.indexOf('/maimai-mobile/playerData/') >= 0) {
      analyzeSpan.className += ' f_l';
      const playCountDiv = document.querySelector('.m_5.t_r.f_12');
      playCountDiv.insertAdjacentElement('afterbegin', analyzeSpan);
    } else if (location.pathname.indexOf('/maimai-mobile/home/') >= 0) {
      const playCommentDiv = document.querySelector('.comment_block.f_l.f_12');
      playCommentDiv.insertAdjacentElement('afterbegin', analyzeSpan);
    } else {
      profileBlock.querySelector('.name_block').parentElement.append(analyzeSpan);
    }
  }

  async function main() {
    if (!isMaimaiNetOrigin(document.location.origin)) {
      handleError(UIString[LANG].pleaseLogIn);
      return;
    }
    const gameVer = await fetchGameVersion(document.body);
    const playerName = isOnFriendPage ? null : getPlayerName(document.body);
    insertAnalyzeButton(gameVer, playerName);
    if (window.ratingCalcMsgListener) {
      window.removeEventListener('message', window.ratingCalcMsgListener);
    }
    window.ratingCalcMsgListener = async (
      evt: MessageEvent<string | {action: string; payload?: string | number}>
    ) => {
      console.log(evt.origin, evt.data);
      if (ALLOWED_ORIGINS.includes(evt.origin)) {
        const send = getPostMessageFunc(evt.source as WindowProxy, evt.origin);
        if (typeof evt.data === 'object') {
          if (evt.data.action === 'ready') {
            send('gameVersion', gameVer);
            if (typeof evt.data.payload === 'string') {
              LANG = evt.data.payload as Language;
            }
            const recentRecords = await fetchSelfRecords(gameVer, send);
            const basicSongs = await fetchAllSongs(domCache.get(Difficulty.BASIC));
            const visitedSongs = new Set<string>();
            basicSongs.forEach((s) => visitedSongs.add(s.dx + (s.nickname || s.name)));
            const allSongs = basicSongs.concat(
              recentRecords
                .map((r) => ({
                  dx: r.chartType,
                  name: r.songName,
                  nickname: getSongNickname(r.songName, r.genre),
                }))
                .filter((s) => !visitedSongs.has(s.dx + (s.nickname || s.name)))
            );
            send('allSongs', allSongs);
          } else if (evt.data.action === 'fetchScoresFull') {
            if (typeof evt.data.payload === 'string') {
              LANG = evt.data.payload as Language;
            }
            fetchSelfRecords(gameVer, send, true);
          } else if (evt.data.action === 'saveLanguage') {
            LANG = evt.data.payload as Language;
            saveLanguage(LANG);
          }
        }
      }
    };
    window.addEventListener('message', window.ratingCalcMsgListener);
  }

  main();
})();
