import React, {useCallback} from 'react';

import {GameVersion, getVersionName} from '../../common/game-version';
import {RATING_CALCULATOR_SUPPORTED_VERSIONS} from '../../common/infra/magic-api';
import {Language} from '../../common/lang';
import {useLanguage} from '../../common/lang-react';

const MessagesByLang = {
  [Language.en_US]: {
    gameVer: 'Game version:',
    dataSource: 'Chart data source:',
  },
  [Language.zh_TW]: {
    gameVer: '遊戲版本：',
    dataSource: '譜面定數來源：',
  },
  [Language.ko_KR]: {
    gameVer: '게임 버전：',
    dataSource: '게임 데이터 소스：',
  },
};

interface Props {
  handleVersionSelect: (ver: GameVersion) => void;
  gameVer: GameVersion;
}

export const VersionSelect = ({gameVer, handleVersionSelect}: Props) => {
  const handleChange = useCallback(
    (evt: React.FormEvent<HTMLSelectElement>) => {
      handleVersionSelect(parseInt(evt.currentTarget.value));
    },
    [handleVersionSelect]
  );
  const messages = MessagesByLang[useLanguage()];
  return (
    <tr>
      <td>
        <label htmlFor="versionSelect">{messages.gameVer}</label>
      </td>
      <td>
        <select id="versionSelect" onChange={handleChange} value={gameVer}>
          {RATING_CALCULATOR_SUPPORTED_VERSIONS.map((ver) => {
            const verStr = ver.toFixed(0);
            return (
              <option key={verStr} value={verStr}>
                {getVersionName(ver)}
              </option>
            );
          })}
        </select>

        <span>
          {messages.dataSource}{' '}
          {gameVer >= GameVersion.PRiSM ? (
            <>
              <a href="https://arcade-songs.zetaraku.dev/maimai/about/" target="_blank">
                zetaraku
              </a>{' '}
              &{' '}
              <a href="https://github.com/zvuc/otoge-db" target="_blank">
                otoge-db
              </a>
            </>
          ) : (
            <a href="https://sgimera.github.io/mai_RatingAnalyzer/" target="_blank">
              sgimera
            </a>
          )}
        </span>
      </td>
    </tr>
  );
};
