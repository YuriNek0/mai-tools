import React, {useCallback, useState} from 'react';

import {ChartRecord} from '../../common/chart-record';
import {Language} from '../../common/lang';
import {useLanguage} from '../../common/lang-react';
import {CommonMessages} from '../common-messages';

const MessagesByLang = {
  [Language.en_US]: {
    scoreInputHeading: 'Player Scores',
    scoreInputDescPrefix:
      'Please use "Analyze Self DX Rating" or "Analyze Friend\'s DX Rating" from ',
    bookmarketLinkLabel: 'maimai bookmarklets',
    scoreInputDescSuffix: ' to import scores.',
    importFromFile: 'Import from JSON file',
    uploadFile: 'Select file',
  },
  [Language.zh_TW]: {
    scoreInputHeading: '玩家成績輸入',
    scoreInputDescPrefix: '請用 ',
    bookmarketLinkLabel: 'maimai 書籤小工具',
    scoreInputDescSuffix: ' 中的「分析自己 DX Rating」或「分析好友 DX Rating」帶入資料。',
    importFromFile: '匯入 JSON 檔案',
    uploadFile: '選取檔案',
  },
  // TODO: update Korean translation
  [Language.ko_KR]: {
    scoreInputHeading: '플레이 기록',
    scoreInputDescPrefix: '아래 칸은 "',
    bookmarketLinkLabel: 'maimai 북마크',
    scoreInputDescSuffix:
      '의 "내 디럭스 레이팅 분석하기" 또는 "친구 디럭스 레이팅 분석하기"를 사용해서 채워주세요.',
    importFromFile: 'JSON 파일에서 가져오기',
    uploadFile: '파일 선택',
  },
};

interface Props {
  setPlayerScores: (records: ChartRecord[]) => void;
}

export const ScoreInput = ({setPlayerScores}: Props) => {
  const lang = useLanguage();
  const commonMessages = CommonMessages[lang];
  const messages = MessagesByLang[lang];
  const [showInput, setShowInput] = useState(false);
  const handleRadioChange = useCallback((evt: React.FormEvent<HTMLInputElement>) => {
    setShowInput(evt.currentTarget.value === '1');
  }, []);

  const loadFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event) => {
      const element = event.target;
      if (!(element instanceof HTMLInputElement)) return;

      const file = element.files ? element.files[0] : undefined;
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        if (!data) return;
        if (typeof data !== 'string') return;

        const records: ChartRecord[] = JSON.parse(data);
        if (!Array.isArray(records)) {
          console.error('ScoreInput error: file is not an array!');
          return;
        }

        setPlayerScores(records);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setPlayerScores]);
  return (
    <div className="w90">
      <h2 className="scoreInputHeading">{messages.scoreInputHeading}</h2>
      <form className="scoreInputSelector">
        <label className="radioLabel">
          <input
            className="radioInput"
            name="showScoreInput"
            value="0"
            type="radio"
            checked={!showInput}
            onChange={handleRadioChange}
          />
          {commonMessages.autofill}
        </label>
        <label className="radioLabel">
          <input
            className="radioInput"
            name="showScoreInput"
            value="1"
            type="radio"
            checked={showInput}
            onChange={handleRadioChange}
          />
          {messages.importFromFile}
        </label>
      </form>
      <div className={showInput ? 'hidden' : ''}>
        {messages.scoreInputDescPrefix}
        <a href="../#bookmarklets" target="_blank">
          {messages.bookmarketLinkLabel}
        </a>
        {messages.scoreInputDescSuffix}
      </div>
      <div className={showInput ? '' : 'hidden'}>
        <div>
          {messages.scoreInputHeading}:{' '}
          <a href="https://gist.github.com/myjian/a978fda8821beca682ec3a726e17b780" target="_blank">
            {commonMessages.example}
          </a>
        </div>
        <button className="selectFileBtn" onClick={loadFromFile}>
          {messages.uploadFile}…
        </button>
      </div>
    </div>
  );
};
