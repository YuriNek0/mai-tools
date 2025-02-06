import React, {useCallback, useState} from 'react';

import {ChartType} from '../../common/chart-type';
import {DIFFICULTIES, Difficulty, getDifficultyFromShortName} from '../../common/difficulties';
import {Language} from '../../common/lang';
import {useLanguage} from '../../common/lang-react';
import {SongProperties} from '../../common/song-props';
import {loadUserPreference, UserPreference} from '../../common/user-preference';
import {CommonMessages} from '../common-messages';

const MessagesByLang = {
  [Language.en_US]: {
    internalLvHeading: 'Chart Internal Level Data',
    manualInput: 'Manual input',
  },
  [Language.zh_TW]: {
    internalLvHeading: '譜面定數',
    manualInput: '手動輸入',
  },
  [Language.ko_KR]: {
    internalLvHeading: '채보 상수 데이터',
    manualInput: '직접입력',
  },
};

export const InternalLvInput = () => {
  const savedValue = loadUserPreference(UserPreference.InternalLvOverride) || '';
  const [showTextarea, setShowTextarea] = useState(savedValue.length > 0);

  const handleShowTextarea = useCallback(
    (evt: React.SyntheticEvent<HTMLInputElement>) => {
      setShowTextarea(evt.currentTarget.checked);
    },
    [showTextarea]
  );

  const lang = useLanguage();
  const commonMessages = CommonMessages[lang];
  const messages = MessagesByLang[lang];
  return (
    <div className="w90">
      <h2 className="lvInputHeading">{messages.internalLvHeading}</h2>
      <form>
        <label className="radioLabel">
          <input
            name="showLvInput"
            type="checkbox"
            checked={showTextarea}
            onChange={handleShowTextarea}
          />{' '}
          {messages.manualInput}
        </label>
      </form>
      {showTextarea && (
        <>
          <p>
            {commonMessages.example}:<br />
            <code style={{color: '#cc6900'}}>
              VIIIbit Explorer##std##exp##12.9
              <br />
              INTERNET OVERDOSE##dx##mas##13.5
              <br />
              フォニイ##dx##rem##13.3
            </code>
          </p>
          <textarea id="lvInput" className="lvInput" defaultValue={savedValue} />
        </>
      )}
    </div>
  );
};

export function parseInternalLvInput(input: string): Partial<SongProperties>[] {
  return input
    .split('\n')
    .map((line) => {
      const props: Partial<SongProperties> = {};
      const parts = line.trim().split('##');
      if (parts.length != 4) {
        if (parts[0].length > 0) {
          // title, chart type, difficulty, internal level
          console.warn(`Skip malformed line "${line}"`);
        }
        return null;
      }

      const difficulty = getDifficultyFromShortName(parts[2]);
      if (difficulty < 0 || difficulty > Difficulty.ReMASTER) {
        console.warn(`"${line}" contains invalid difficulty "${parts[2]}"`);
        return null;
      }

      const level = parseFloat(parts[3]);
      if (!(level > 0)) {
        // We intentionally use > 0 rather than <= 0 to handle NaN
        console.warn(`"${line}" contains invalid level "${parts[3]}"`);
        return;
      }

      props.name = parts[0].trim();
      props.dx = parts[1].toLowerCase() === 'dx' ? ChartType.DX : ChartType.STANDARD;
      props.lv = DIFFICULTIES.map((_, idx) => (idx === difficulty ? level : NaN));
      return props;
    })
    .filter((props) => props != null);
}
