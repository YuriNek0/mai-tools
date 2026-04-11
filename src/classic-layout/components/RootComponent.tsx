import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {formatDate} from '../../common/date-util';
import {getDifficultyName} from '../../common/difficulties';
import {isMaimaiNetOrigin, MAIMAI_NET_ORIGINS} from '../../common/game-region';
import {QueryParam} from '../../common/query-params';
import {parseJudgements} from '../parser';
import {NoteType, StrictJudgement} from '../types';
import {CreditInfo} from './CreditInfo';
import {PageFooter} from './PageFooter';
import {PageTitle} from './PageTitle';
import {ScorePage} from './ScorePage';
import {SectionSep} from './SectionSeparator';

const defaultPlayRecord = {
  date: String(Date.now()),
  track: 'TRACK ' + (Math.floor(Math.random() * 3) + 1),
  // difficulty: 3,
  songTitle: '分からない',
  achievement: '95.3035%', // finale: "94.87%",
  highScore: Math.random() > 0.9 ? '1' : '0',
  // combo: "234/953",
  noteDetails: '654-96-31-28\n25-0-0-0\n78-0-0-1\n\n37-2-1-0',
};

type MessageType = {
  action: string;
  payload?: string;
  img?: Blob;
  imgSrc?: string;
};

function getQueryParam(qp: URLSearchParams, key: string, fallback?: string) {
  const value = qp.get(key);
  if (!value) {
    console.warn('URL does not contain "' + key + '", using default value "' + fallback + '"');
    return fallback;
  }
  return value;
}

function parseQueryParams(qp: URLSearchParams, dft = defaultPlayRecord): PlayRecord {
  const date = getQueryParam(qp, QueryParam.Date, dft.date);
  const place = getQueryParam(qp, QueryParam.Place, 'DX');
  const track = getQueryParam(qp, QueryParam.Track, dft.track);
  const rawDifficulty = getQueryParam(qp, QueryParam.Difficulty);
  const songTitle = getQueryParam(qp, QueryParam.SongTitle, dft.songTitle);
  const achievement = getQueryParam(qp, QueryParam.Achievement, dft.achievement);
  const highScore = getQueryParam(qp, QueryParam.HighScore, dft.highScore);
  const combo = getQueryParam(qp, QueryParam.Combo);
  const noteDetails = getQueryParam(qp, QueryParam.NoteDetails, dft.noteDetails);
  const syncStatus = getQueryParam(qp, QueryParam.SyncStatus);
  // TODO: handling NaN for parseInt
  const difficulty = getDifficultyName(parseInt(rawDifficulty));
  return {
    date: formatDate(new Date(parseInt(date))),
    place,
    track,
    songTitle,
    difficulty,
    syncStatus,
    noteJudgements: parseJudgements(noteDetails),
    combo: combo && combo.replace('/', ' / '),
    highScore: highScore === '1',
    achievement: parseFloat(achievement),
  };
}

interface PlayRecord {
  songTitle: string;
  achievement: number;
  noteJudgements: Map<NoteType, Record<StrictJudgement, number>>;
  difficulty: string | undefined;
  track: string;
  date: string;
  place: string;
  highScore: boolean;
  combo: string;
  syncStatus: string;
}

export const RootComponent = () => {
  const referrerRef = useRef(document.referrer && new URL(document.referrer).origin);
  const [showError, setShowError] = useState(false);
  const [rankImg, setRankImg] = useState(new Map<string, string>());
  const [songImg, setSongImg] = useState<string>();
  const [apFcImg, setApFcImg] = useState<string>();
  const [syncImg, setSyncImg] = useState<string>();

  const playRecord = useMemo<PlayRecord>(() => {
    const qp = new URLSearchParams(location.search);
    try {
      return parseQueryParams(qp);
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message);
        console.error(e.stack);
      } else {
        console.error(e);
      }
      setShowError(true);
      return parseQueryParams(new URLSearchParams());
    }
  }, [location.search]);

  useEffect(() => {
    document.title = playRecord.songTitle + ' - maimai classic score layout';
  }, [playRecord.songTitle]);

  const sendMessageToOpener = useCallback(
    (data: MessageType) => {
      if (window.opener) {
        console.log('sending message to opener', data);
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
    },
    [],
  );

  const fetchRankImage = useCallback(
    (title: string) => {
      console.log('fetchRankImage ' + title);
      setRankImg(prev => new Map(prev).set(title, null));
      sendMessageToOpener({action: 'getRankImage', payload: title});
    },
    [sendMessageToOpener],
  );

  const handleWindowMessage = useCallback((evt: MessageEvent) => {
    if (isMaimaiNetOrigin(evt.origin)) {
      referrerRef.current = evt.origin;
      switch (evt.data.action) {
        case 'songImage':
          setSongImg(evt.data.imgSrc);
          break;
        case 'apFcImage':
          setApFcImg(URL.createObjectURL(evt.data.img));
          break;
        case 'syncImage':
          setSyncImg(URL.createObjectURL(evt.data.img));
          break;
        case 'rankImage':
          setRankImg(prev => {
            const existingUrl = prev.get(evt.data.title);
            if (existingUrl) {
              URL.revokeObjectURL(existingUrl);
            }
            const map = new Map(prev);
            map.set(evt.data.title, URL.createObjectURL(evt.data.img));
            return map;
          });
          break;
        default:
          console.log(evt.data);
          break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleWindowMessage);
    sendMessageToOpener({action: 'ready'});
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [handleWindowMessage, sendMessageToOpener]);

  const {
    achievement,
    combo,
    date,
    place,
    difficulty,
    highScore,
    noteJudgements,
    songTitle,
    track,
    syncStatus,
  } = playRecord;

  return (
    <>
      <div className="widthLimit">
        <div className="container">
          <PageTitle />
          <SectionSep />
          {showError ? (
            <div className="error">Failed to parse input. Please contact the developer!</div>
          ) : (
            <ScorePage
              achievement={achievement}
              combo={combo}
              date={date}
              place={place}
              difficulty={difficulty}
              highScore={highScore}
              noteJudgements={noteJudgements}
              songTitle={songTitle}
              track={track}
              syncStatus={syncStatus}
              songImgSrc={songImg}
              apFcImg={apFcImg}
              rankImg={rankImg}
              syncImg={syncImg}
              fetchRankImage={fetchRankImage}
            />
          )}
          <SectionSep />
          <PageFooter />
        </div>
      </div>
      <CreditInfo />
    </>
  );
};
