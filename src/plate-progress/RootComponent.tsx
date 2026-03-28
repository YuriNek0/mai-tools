import {SyntheticEvent, useCallback, useEffect, useRef, useState} from 'react';

import {FullChartRecord} from '../common/chart-record';
import {
  GameRegion,
  getGameRegionFromOrigin,
  getGameRegionFromShortString,
  isMaimaiNetOrigin,
  MAIMAI_NET_ORIGINS,
} from '../common/game-region';
import {LATEST_VERSION, validateGameVersion} from '../common/game-version';
import {getInitialLanguage, Language} from '../common/lang';
import {QueryParam} from '../common/query-params';
import {PlateProgress} from './PlateProgress';
import {VersionSelect} from './VersionSelect';

export const RootComponent = () => {
  const referrerRef = useRef<string | null>(document.referrer && new URL(document.referrer).origin);

  const queryParams = new URLSearchParams(location.search);
  const friendIdx = queryParams.get(QueryParam.FriendIdx);
  const playerName = queryParams.get(QueryParam.PlayerName);
  const gameVerParam = queryParams.get(QueryParam.GameVersion);
  const latestVer = validateGameVersion(gameVerParam, LATEST_VERSION);
  const lang = getInitialLanguage();

  const [region, setRegion] = useState(() =>
    getGameRegionFromShortString(queryParams.get(QueryParam.GameRegion)),
  );
  const [version, setVersion] = useState((latestVer - 1).toString());
  const [progress, setProgress] = useState('');
  const [playerScores, setPlayerScores] = useState<FullChartRecord[]>([]);

  useEffect(() => {
    updateDocumentTitle(lang);
  }, [lang]);

  const postMessageToOpener = useCallback((data: {action: string; payload?: string | number}) => {
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

  const handleWindowMessage = useCallback(
    (evt: MessageEvent) => {
      if (isMaimaiNetOrigin(evt.origin)) {
        referrerRef.current = evt.origin;
        console.log(evt.origin, evt.data);
        switch (evt.data.action) {
          case 'showProgress':
            setProgress(evt.data.payload);
            break;
          case 'setPlayerScore':
            setPlayerScores(evt.data.payload);
            setRegion(getGameRegionFromOrigin(evt.origin));
            break;
        }
      }
    },
    [referrerRef, setProgress, setPlayerScores, setRegion],
  );

  useEffect(() => {
    if (window.opener) {
      window.addEventListener('message', handleWindowMessage);
      if (friendIdx) {
        postMessageToOpener({action: 'fetchFriendScoresFull', payload: friendIdx});
      } else {
        postMessageToOpener({action: 'fetchScoresFull', payload: lang});
      }
      return () => {
        window.removeEventListener('message', handleWindowMessage);
      };
    }
  }, [friendIdx, lang, postMessageToOpener, handleWindowMessage]);

  const handleSelectRegion = useCallback(
    (evt: SyntheticEvent<HTMLSelectElement>) => {
      setRegion(evt.currentTarget.value as GameRegion);
    },
    [setRegion],
  );

  const handleSelectVersion = useCallback(
    (evt: SyntheticEvent<HTMLSelectElement>) => {
      setVersion(evt.currentTarget.value);
    },
    [setVersion],
  );

  return (
    <div>
      <select onChange={handleSelectRegion} value={region}>
        <option value="" disabled>
          == Game Region ==
        </option>
        <option value={GameRegion.Jp}>Japan</option>
        <option value={GameRegion.Intl}>International</option>
      </select>
      <br />
      <VersionSelect version={version} onChange={handleSelectVersion} />
      <br />
      <h2>Player: {playerName}</h2>
      {progress ? <div>{progress}</div> : null}
      <PlateProgress
        region={region}
        latestVersion={latestVer}
        selectedVersion={version}
        playerScores={playerScores}
      />
    </div>
  );
};

function updateDocumentTitle(lang: Language) {
  document.title = {
    [Language.en_US]: 'maimai Plate Progress',
    [Language.zh_TW]: 'maimai 名牌板進度分析',
    [Language.ko_KR]: 'maimai Plate Progress', // TODO
  }[lang];
}
