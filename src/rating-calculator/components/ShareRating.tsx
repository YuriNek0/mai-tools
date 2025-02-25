import React, {useCallback, useEffect, useState} from 'react';

import {GameRegion} from '../../common/game-region';
import {GameVersion} from '../../common/game-version';
import {Language} from '../../common/lang';
import {useLanguage} from '../../common/lang-react';
import {QueryParam} from '../../common/query-params';
import {getSheetIdForDxRatingNet} from '../../common/song-name-helper';
import {SongDatabase} from '../../common/song-props';
import {RatingData} from '../types';

const MessagesByLang = {
  [Language.en_US]: {
    share: 'Share',
    exportAsJson: 'Export as JSON (all records)',
    exportAllForDxRatingNet: 'Export as DXRating.net format (all records)',
    exportTopForDxRatingNet: 'Export as DXRating.net format (only b15 & b35)',
  },
  [Language.zh_TW]: {
    share: '分享',
    exportAsJson: '匯出成 JSON 格式 (所有歌曲)',
    exportAllForDxRatingNet: '匯出成 DXRating.net 格式 (所有歌曲)',
    exportTopForDxRatingNet: '匯出成 DXRating.net 格式 (R 值對象曲)',
  },
  [Language.ko_KR]: {
    share: '공유',
    exportAsJson: 'JSON 형식으로 내보내기 (모든 기록)',
    exportAllForDxRatingNet: 'DXRating.net 형식으로 내보내기 (모든 기록)',
    exportTopForDxRatingNet: 'DXRating.net 형식으로 내보내기 (베스트 15 & 베스트 35)',
  },
};

function downloadJson(fileContent: string, filename: string) {
  const file = new Blob([fileContent], {type: 'application/json'});
  const url = URL.createObjectURL(file);
  console.log(url);

  const anchor = document.createElement('a');
  anchor.href = url;
  // `dxrating.export-${new Date().toISOString()}.json`
  anchor.download = filename + '.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadPlayerScores(ratingData: RatingData) {
  const recordsToDownload = ratingData.newChartRecords.concat(ratingData.oldChartRecords);
  const records = recordsToDownload.map((r) => {
    return {
      songName: r.songName,
      chartType: r.chartType,
      difficulty: r.difficulty,
      achievement: r.achievement,
      genre: r.genre,
      level: r.level,
    };
  });
  const filename = `maimai-scores-${new Date().toISOString()}`;
  downloadJson(JSON.stringify(records, null, 2), filename);
}

function downloadAsDxRatingNetJson(ratingData: RatingData, onlyTopRecords: boolean) {
  const recordsToDownload = onlyTopRecords
    ? ratingData.newChartRecords
        .slice(0, ratingData.newTopChartsCount)
        .concat(ratingData.oldChartRecords.slice(0, ratingData.oldTopChartsCount))
    : ratingData.newChartRecords.concat(ratingData.oldChartRecords);
  const sheets = recordsToDownload.map((r) => {
    const sheetId = getSheetIdForDxRatingNet(r.songName, r.genre, r.chartType, r.difficulty);
    return {
      sheetId,
      achievementRate: r.achievement,
    };
  });
  const filename = onlyTopRecords
    ? `dxrating-top-${new Date().toISOString()}`
    : `dxrating-all-${new Date().toISOString()}`;
  downloadJson(JSON.stringify(sheets, null, 2), filename);
}

export function ShareRating(props: {
  gameRegion: GameRegion;
  gameVer: GameVersion;
  ratingData: RatingData;
  songDb: SongDatabase;
}) {
  const {gameRegion, gameVer, ratingData, songDb} = props;
  const [encodedSongImages, setEncodedSongImages] = useState<string>('');
  const [encodedChartTypes, setEncodedChartTypes] = useState<string>('');
  const [encodedDifficulties, setEncodedDifficulties] = useState<string>('');
  const [encodedAchievements, setEncodedAchievements] = useState<string>('');

  useEffect(() => {
    const topRecords = ratingData.newChartRecords
      .slice(0, ratingData.newTopChartsCount)
      .concat(ratingData.oldChartRecords.slice(0, ratingData.oldTopChartsCount));

    const songProps = topRecords
      .map((record) => songDb.getSongProperties(record.songName, record.genre, record.chartType))
      .filter((sp) => sp?.ico);

    if (songProps.length < topRecords.length) {
      // We can only create URL if we have ico for every song.
      setEncodedSongImages('');
      setEncodedChartTypes('');
      setEncodedDifficulties('');
      setEncodedAchievements('');
      return;
    }

    setEncodedSongImages(songProps.map((sp) => sp.ico).join('_'));
    setEncodedChartTypes(topRecords.reduce<string>((acc, rec) => acc + rec.chartType, ''));
    setEncodedDifficulties(topRecords.reduce<string>((acc, rec) => acc + rec.difficulty, ''));
    setEncodedAchievements(topRecords.map((res) => res.achievement).join('_'));
  }, [ratingData, songDb]);

  const downloadAllPlayerScores = useCallback(
    (evt: React.SyntheticEvent) => {
      evt.preventDefault();
      downloadPlayerScores(ratingData);
    },
    [ratingData]
  );

  const downloadTopAsDxRatingNetJson = useCallback(
    (evt: React.SyntheticEvent) => {
      evt.preventDefault();
      downloadAsDxRatingNetJson(ratingData, true);
    },
    [ratingData]
  );

  const downloadAllAsDxRatingNetJson = useCallback(
    (evt: React.SyntheticEvent) => {
      evt.preventDefault();
      downloadAsDxRatingNetJson(ratingData, false);
    },
    [ratingData]
  );

  const messages = MessagesByLang[useLanguage()];

  let shareLink = '';
  if (encodedSongImages && encodedChartTypes && encodedDifficulties && encodedAchievements) {
    const queryParams = new URLSearchParams();
    queryParams.set(QueryParam.GameRegion, gameRegion);
    queryParams.set(QueryParam.GameVersion, gameVer.toString());
    if (ratingData.playerName) {
      queryParams.set(QueryParam.PlayerName, ratingData.playerName);
    }
    queryParams.set(QueryParam.Date, ratingData.date.getTime().toString());

    // We choose to use image name to identify songs because it makes the URL shorter than 2000 bytes.
    // In local testing the URL length was around 1600.
    queryParams.set(QueryParam.SongImage, encodedSongImages);
    queryParams.set(QueryParam.ChartType, encodedChartTypes);
    queryParams.set(QueryParam.Difficulty, encodedDifficulties);
    queryParams.set(QueryParam.Achievement, encodedAchievements);
    shareLink = '?' + queryParams;
  }
  return (
    <div>
      {shareLink ? (
        <p className="shareLinkItem">
          <a href={shareLink} target="_blank">
            {messages.share}
          </a>
        </p>
      ) : null}
      <p className="shareLinkItem">
        <a href="#" onClick={downloadAllPlayerScores}>
          {messages.exportAsJson}
        </a>
      </p>
      <p className="shareLinkItem">
        <a href="#" onClick={downloadTopAsDxRatingNetJson}>
          {messages.exportTopForDxRatingNet}
        </a>
      </p>
      <p className="shareLinkItem">
        <a href="#" onClick={downloadAllAsDxRatingNetJson}>
          {messages.exportAllForDxRatingNet}
        </a>
      </p>
    </div>
  );
}
