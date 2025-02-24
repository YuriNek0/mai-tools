import './recent-play-downloader.css';

import domtoimage from 'dom-to-image';

import {ChartRecord} from '../common/chart-record';
import {ChartType, getChartType} from '../common/chart-type';
import {fixTimezone, formatDate} from '../common/date-util';
import {Difficulty, getDifficultyByName, getDifficultyClassName} from '../common/difficulties';
import {calculateDetailedDxStar, getDxStarText} from '../common/dx-star';
import {getGameRegionFromOrigin} from '../common/game-region';
import {getInitialLanguage, Language} from '../common/lang';
import {getDisplayLv} from '../common/level-helper';
import {addLvToSongTitle, fetchGameVersion, removeScrollControl} from '../common/net-helpers';
import {getSongGenreFromImg, getSongNicknameWithChartType} from '../common/song-name-helper';
import {loadSongDatabase, SongDatabase} from '../common/song-props';

interface ScoreRecord extends ChartRecord {
  date: Date;
  songName: string;
  songImgSrc: string;
  chartType: ChartType;
  difficulty: Difficulty;
  // lv: string;
  achievement: number;
  rank: string;
  marks: string;
  isNewRecord: boolean;
}
type Options = {
  dates?: Set<string>;
  showAll?: boolean;
  olderFirst?: boolean;
};
enum Column {
  DATE,
  SONG,
  LV,
  ACHV,
  MARKS,
}
(function (d) {
  const LANG = getInitialLanguage();
  const UIString = {
    [Language.zh_TW]: {
      date: '日期',
      songName: '歌曲',
      difficulty: '難度',
      level: '等級',
      achievement: '達成率',
      marks: '成就',
      playDate: '遊玩日期：',
      newRecordToggleHeading: '顯示：',
      sortBy: '排序方式：',
      newRecordsOnly: '只顯示新高分紀錄',
      allRecords: '全部',
      olderFirst: '由舊到新',
      newerFirst: '由新到舊',
      copy: '複製',
      copied: '已複製到剪貼簿',
      downloadAsImage: '存成圖片',
    },
    [Language.en_US]: {
      date: 'Date',
      songName: 'Song',
      difficulty: 'Difficulty',
      level: 'Lv',
      achievement: 'Achv',
      marks: 'Marks',
      playDate: 'Play date:',
      newRecordToggleHeading: 'Display:',
      sortBy: 'Sort by:',
      newRecordsOnly: 'New records only',
      allRecords: 'All',
      olderFirst: 'Older first',
      newerFirst: 'Newer first',
      copy: 'Copy',
      copied: 'Copied to clipboard',
      downloadAsImage: 'Save as image',
    },
    [Language.ko_KR]: {
      date: '날짜',
      songName: '노래',
      difficulty: '난이도',
      level: '레벨',
      achievement: '정확도',
      marks: '성취도',
      playDate: '플레이 일:',
      newRecordToggleHeading: '표시:',
      sortBy: '정렬 순서:',
      newRecordsOnly: '새 기록만',
      allRecords: '전부',
      olderFirst: '옛날 기록부터',
      newerFirst: '최근 기록부터',
      copy: '복사',
      copied: '클립보드에 복사되었습니다',
      downloadAsImage: '이미지로 저장하기',
    },
  }[LANG];

  const AP_FC_IMG_NAME_TO_TEXT = new Map([
    ['fc', 'FC'],
    ['fcplus', 'FC+'],
    ['ap', 'AP'],
    ['applus', 'AP+'],
  ]);

  const SYNC_IMG_NAME_TO_TEXT = new Map([
    ['fs', 'FS'],
    ['fsplus', 'FS+'],
    ['fsd', 'FSD'],
    ['fsdplus', 'FSD+'],
  ]);
  const DATE_CHECKBOX_CLASSNAME = 'dateCheckbox';
  const NEW_RECORD_RADIO_NAME = 'newRecordRadio';
  const SORT_BY_RADIO_NAME = 'sortByRadio';
  const SCORE_RECORD_ROW_CLASSNAME = 'recordRow';
  const SCORE_RECORD_CELL_BASE_CLASSNAME = 'recordCell';
  const SCORE_RECORD_CELL_CLASSNAME_BY_COL: Record<Column, string> = {
    [Column.DATE]: 'dateCell',
    [Column.SONG]: 'songTitleCell',
    [Column.LV]: 'lvCell',
    [Column.ACHV]: 'achievementCell',
    [Column.MARKS]: 'marksCell',
  };

  const ce = d.createElement.bind(d);

  const tableHeadCellRenderer: Record<Column, () => HTMLElement> = {
    [Column.DATE]: () => {
      const cell = ce('th');
      cell.append(UIString.date);
      return cell;
    },
    [Column.SONG]: () => {
      const cell = ce('th');
      cell.append(UIString.songName);
      return cell;
    },
    [Column.LV]: () => {
      const cell = ce('th');
      cell.append(UIString.level);
      return cell;
    },
    [Column.ACHV]: () => {
      const cell = ce('th');
      cell.append(UIString.achievement);
      return cell;
    },
    [Column.MARKS]: () => {
      const cell = ce('th');
      cell.append(UIString.marks);
      return cell;
    },
  };

  const tableBodyCellRenderer: Record<
    Column,
    (record: ScoreRecord, songDb: SongDatabase) => HTMLElement
  > = {
    [Column.DATE]: (record) => {
      const cell = ce('td');
      cell.append(formatDate(record.date));
      return cell;
    },
    [Column.SONG]: (record, songDb) => {
      const cell = ce('td');
      cell.classList.add('songImg');
      cell.style.backgroundImage = `url("${record.songImgSrc}")`;
      const genre = getSongGenreFromImg(record.songName, record.songImgSrc);
      const nickname = songDb.hasDualCharts(record.songName, genre)
        ? getSongNicknameWithChartType(record.songName, genre, record.chartType)
        : record.songName;
      cell.append(nickname);
      return cell;
    },
    [Column.LV]: (record) => {
      const cell = ce('td');
      cell.append(getDisplayLv(record.level));
      return cell;
    },
    [Column.ACHV]: (record) => {
      const cell = ce('td');
      // Avoid <br> to keep it copyable as TSV.
      const rankSpan = document.createElement('span');
      rankSpan.className = 'd_b';
      rankSpan.append(record.rank);
      cell.append(rankSpan, '\t', record.achievement.toFixed(4) + '%');
      return cell;
    },
    [Column.MARKS]: (record) => {
      const cell = ce('td');
      cell.append(record.marks);
      return cell;
    },
  };

  function getPlayDate(row: HTMLElement) {
    const playDateText = (row.querySelector('.sub_title').children[1] as HTMLElement).innerText;
    const m = playDateText.match(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+)/);
    const japanDt = new Date(
      parseInt(m[1]),
      parseInt(m[2]) - 1,
      parseInt(m[3]),
      parseInt(m[4]),
      parseInt(m[5])
    );
    return fixTimezone(japanDt);
  }

  function getSongName(row: HTMLElement) {
    try {
      return Array.from((row.querySelector('.m_5.p_5.f_13') as HTMLElement).childNodes).find(
        (node) => node instanceof Text
      ).textContent;
    } catch (e) {
      console.log(e);
      console.log(row);
      return '';
    }
  }

  function getSongImgSrc(row: HTMLElement): string {
    const img = row.querySelector('.music_img') as HTMLImageElement;
    return img ? img.src : '';
  }

  function getDifficulty(row: HTMLElement) {
    const recordBody = row.children[1];
    const cn = recordBody.className;
    let diff = cn.substring(cn.indexOf('_') + 1, cn.lastIndexOf('_'));
    return getDifficultyByName(diff);
  }

  function getAchievement(row: HTMLElement) {
    return parseFloat((row.querySelector('.playlog_achievement_txt') as HTMLElement).innerText);
  }

  function getDxStar(row: HTMLElement): string {
    const dxStarIndex = calculateDetailedDxStar(row);
    return getDxStarText(dxStarIndex);
  }

  function getRank(row: HTMLElement): string {
    const rankImgSrc = (row.querySelector('img.playlog_scorerank') as HTMLImageElement).src.replace(
      /\?ver=.*$/,
      ''
    );
    return rankImgSrc
      .substring(rankImgSrc.lastIndexOf('/') + 1, rankImgSrc.lastIndexOf('.'))
      .replace('plus', '+')
      .toUpperCase();
  }

  function getMarks(row: HTMLElement): string {
    const results = [];
    // FC/AP
    const stampImgs = row.querySelectorAll(
      '.playlog_result_innerblock > img'
    ) as NodeListOf<HTMLImageElement>;
    const fcapSrc = stampImgs[0].src.replace(/\?ver=.*$/, '');
    const fcapImgName = fcapSrc.substring(fcapSrc.lastIndexOf('/') + 1, fcapSrc.lastIndexOf('.'));
    if (AP_FC_IMG_NAME_TO_TEXT.has(fcapImgName)) {
      results.push(AP_FC_IMG_NAME_TO_TEXT.get(fcapImgName));
    }

    // SYNC
    const fullSyncSrc = stampImgs[1].src.replace(/\?ver=.*$/, '');
    const fullSyncImgName = fullSyncSrc.substring(
      fullSyncSrc.lastIndexOf('/') + 1,
      fullSyncSrc.lastIndexOf('.')
    );
    if (SYNC_IMG_NAME_TO_TEXT.has(fullSyncImgName)) {
      results.push(SYNC_IMG_NAME_TO_TEXT.get(fullSyncImgName));
    }

    // DX Star
    const dxStar = getDxStar(row);
    if (dxStar) {
      results.push(dxStar);
    }
    return results.join(' ');
  }

  function getIsNewRecord(row: HTMLElement) {
    return !!row.querySelector(
      '.playlog_achievement_label_block + img.playlog_achievement_newrecord'
    );
  }

  function renderScoreHeadRow(columns: ReadonlyArray<Column>) {
    const tr = ce('tr');
    tr.classList.add(SCORE_RECORD_ROW_CLASSNAME);
    columns.forEach((col) => {
      const cell = tableHeadCellRenderer[col]();
      cell.classList.add(SCORE_RECORD_CELL_BASE_CLASSNAME);
      cell.classList.add(SCORE_RECORD_CELL_CLASSNAME_BY_COL[col]);
      tr.append(cell);
    });
    return tr;
  }

  function renderScoreRow(
    columns: ReadonlyArray<Column>,
    record: ScoreRecord,
    songDb: SongDatabase
  ) {
    const tr = ce('tr');
    tr.classList.add(SCORE_RECORD_ROW_CLASSNAME);
    tr.classList.add(getDifficultyClassName(record.difficulty));
    columns.forEach((col) => {
      const cell = tableBodyCellRenderer[col](record, songDb);
      cell.classList.add(SCORE_RECORD_CELL_BASE_CLASSNAME);
      const colClassName = SCORE_RECORD_CELL_CLASSNAME_BY_COL[col];
      cell.classList.add(colClassName);
      tr.append(cell);
    });
    return tr;
  }

  function renderTopScores(
    records: ReadonlyArray<ScoreRecord>,
    songDb: SongDatabase,
    container: HTMLElement,
    thead: HTMLTableSectionElement,
    tbody: HTMLTableSectionElement
  ) {
    const columns = [Column.DATE, Column.SONG, Column.LV, Column.ACHV, Column.MARKS];
    thead.innerHTML = '';
    tbody.innerHTML = '';
    thead.append(renderScoreHeadRow(columns));
    records.forEach((r) => {
      tbody.append(renderScoreRow(columns, r, songDb));
    });
    container.style.paddingBottom = Math.floor(records.length / 2) + 2 + 'px';
  }

  function getSelectedDates(): Set<string> {
    const dateOptions = d.querySelectorAll(
      'input.' + DATE_CHECKBOX_CLASSNAME
    ) as NodeListOf<HTMLInputElement>;
    const selectedDates = new Set<string>();
    dateOptions.forEach((op) => {
      if (op.checked) {
        selectedDates.add(op.value);
      }
    });
    return selectedDates;
  }

  function getFilterAndOptions(): Options {
    const selectedDates = getSelectedDates();
    let showAllRecords = false;
    const newRecordRadios = d.getElementsByName(
      NEW_RECORD_RADIO_NAME
    ) as NodeListOf<HTMLInputElement>;
    newRecordRadios.forEach((r) => {
      if (r.checked) {
        showAllRecords = r.value === 'allRecords';
      }
    });
    let olderFirst = true;
    const sortByRadios = d.getElementsByName(SORT_BY_RADIO_NAME) as NodeListOf<HTMLInputElement>;
    sortByRadios.forEach((r) => {
      if (r.checked) {
        olderFirst = r.value === 'olderFirst';
      }
    });
    return {dates: selectedDates, showAll: showAllRecords, olderFirst};
  }

  function filterRecords(allRecords: ReadonlyArray<ScoreRecord>, options: Options): ScoreRecord[] {
    let records = allRecords.slice();
    console.log(options);
    if (options.dates) {
      records = records.filter((r) => {
        return options.dates.has(formatDate(r.date).split(' ')[0]);
      });
    }
    if (options.showAll) {
      return options.olderFirst ? records.reverse() : records;
    }

    // Keep the best record for each song + chart type + difficulty
    records.reverse(); // oldest -> newest, so newer records can overwrite older ones.
    const nameRecordMap = new Map();
    records.forEach((r) => {
      if (r.isNewRecord) {
        const mapKey = r.songName + '\t' + r.chartType + '\t' + r.difficulty;
        nameRecordMap.delete(mapKey);
        nameRecordMap.set(mapKey, r);
      }
    });
    records = [];
    nameRecordMap.forEach((r) => {
      records.push(r);
    });
    return options.olderFirst ? records : records.reverse();
  }

  function createDateOptions(playDates: Set<string>, onChange: (evt: Event) => void) {
    const div = ce('div');
    div.className = 'm_b_10 dateOptionsContainer';
    const heading = ce('div');
    heading.className = 't_c m_5';
    heading.append(UIString.playDate);
    div.append(heading);
    playDates.forEach((d) => {
      const label = ce('label');
      label.className = 'f_14 dateOptionLabel';
      const checkbox = ce('input');
      checkbox.type = 'checkbox';
      checkbox.className = DATE_CHECKBOX_CLASSNAME;
      checkbox.value = d;
      checkbox.checked = true;
      checkbox.addEventListener('change', onChange);
      label.append(checkbox, d);
      div.append(label);
    });
    return div;
  }

  function createNewRecordToggle(onChange: (evt: Event) => void) {
    const div = ce('div');
    div.className = 'm_b_10 newRecordToggleContainer';
    const heading = ce('div');
    heading.className = 't_c m_5';
    heading.append(UIString.newRecordToggleHeading);
    div.append(heading);
    ['newRecordsOnly', 'allRecords'].forEach((op, idx) => {
      const label = ce('label');
      label.className = 'f_14 newRecordLabel';
      const input = ce('input');
      input.type = 'radio';
      input.name = NEW_RECORD_RADIO_NAME;
      input.className = NEW_RECORD_RADIO_NAME;
      input.value = op;
      input.checked = idx === 0;
      input.addEventListener('change', onChange);
      label.append(input, UIString[op as keyof typeof UIString]);
      div.append(label);
    });
    return div;
  }

  function createSortByRadio(onChange: (evt: Event) => void) {
    const div = ce('div');
    div.className = 'm_b_10 sortByRadioContainer';
    const heading = ce('div');
    heading.className = 't_c m_5';
    heading.append(UIString.sortBy);
    div.append(heading);
    ['newerFirst', 'olderFirst'].forEach((op, idx) => {
      const label = ce('label');
      label.className = 'f_14 sortByLabel';
      const input = ce('input');
      input.type = 'radio';
      input.name = SORT_BY_RADIO_NAME;
      input.className = SORT_BY_RADIO_NAME;
      input.value = op;
      input.checked = idx === 0;
      input.addEventListener('change', onChange);
      label.append(input, UIString[op as keyof typeof UIString]);
      div.append(label);
    });
    return div;
  }

  function createCopyButton(onClick: (evt: Event) => void) {
    const div = ce('div');
    div.className = 'copyBtnContainer';

    const copyTextBtn = ce('button');
    copyTextBtn.className = 'copyBtn';
    copyTextBtn.append(UIString.copy);
    div.append(copyTextBtn);

    let snackbarContainer = d.querySelector('.snackbarContainer') as HTMLDivElement;
    let snackbar = d.querySelector('.snackbar') as HTMLDivElement;
    if (!snackbarContainer) {
      snackbarContainer = ce('div');
      snackbarContainer.className = 'snackbarContainer';
      snackbarContainer.style.display = 'none';
      d.body.append(snackbarContainer);
    }
    if (!snackbar) {
      snackbar = ce('div');
      snackbar.className = 'wrapper snackbar';
      snackbar.innerText = UIString.copied;
      snackbarContainer.append(snackbar);
    }

    copyTextBtn.addEventListener('click', (evt) => {
      onClick(evt);
      d.execCommand('copy');
      snackbarContainer.style.display = 'block';
      snackbar.style.opacity = '1';
      setTimeout(() => {
        snackbar.style.opacity = '0';
        setTimeout(() => {
          snackbarContainer.style.display = 'none';
        }, 500);
      }, 4000);
    });

    const downloadBtn = ce('button');
    downloadBtn.className = 'downloadImgBtn';
    downloadBtn.append(UIString.downloadAsImage);
    downloadBtn.addEventListener('click', () => {
      const elem = d.querySelector('.playRecordContainer');
      domtoimage.toPng(elem).then((dataUrl: string) => {
        const dtStr = Array.from(getSelectedDates()).join(',');
        const filename = 'record_' + dtStr + '.png';
        const a = ce('a');
        a.href = dataUrl;
        a.download = filename;
        //console.log(a);
        a.click();
        //a.innerText = filename;
        //a.target = "_blank";
        //a.style.fontSize = "16px";
        //a.style.color = "blue";
        //a.style.display = "block";
        //d.querySelector(".title.m_10").insertAdjacentElement("beforebegin", a);
      });
    });
    div.append(downloadBtn);
    return div;
  }

  function createOutputElement(
    allRecords: ReadonlyArray<ScoreRecord>,
    songDb: SongDatabase,
    insertBefore: HTMLElement
  ) {
    const playDates = allRecords.reduce((s, r) => {
      s.add(formatDate(r.date).split(' ')[0]);
      return s;
    }, new Set<string>());

    let dv = d.getElementById('recordSummary');
    if (dv) {
      dv.innerHTML = '';
    } else {
      dv = ce('div');
      dv.id = 'recordSummary';
    }

    const playRecordContainer = ce('div');
    playRecordContainer.className = 'playRecordContainer';
    const table = ce('table'),
      thead = ce('thead'),
      tbody = ce('tbody');
    table.className = 'playRecordTable';
    table.append(thead, tbody);
    playRecordContainer.append(table);

    const handleOptionChange = () => {
      renderTopScores(
        filterRecords(allRecords, getFilterAndOptions()),
        songDb,
        playRecordContainer,
        thead,
        tbody
      );
    };
    dv.append(createDateOptions(playDates, handleOptionChange));
    dv.append(createNewRecordToggle(handleOptionChange));
    dv.append(createSortByRadio(handleOptionChange));

    const btn = createCopyButton(() => {
      const selection = window.getSelection();
      const range = d.createRange();
      range.selectNodeContents(tbody);
      selection.removeAllRanges();
      selection.addRange(range);
    });
    dv.append(btn);

    renderTopScores(
      filterRecords(allRecords, {olderFirst: false}),
      songDb,
      playRecordContainer,
      thead,
      tbody
    );
    dv.append(playRecordContainer);
    insertBefore.insertAdjacentElement('beforebegin', dv);
  }

  function addLvToRow(
    row: HTMLElement,
    record: Pick<ScoreRecord, 'songName' | 'songImgSrc' | 'chartType' | 'difficulty'>,
    songDb: SongDatabase
  ): number {
    const genre = getSongGenreFromImg(record.songName, record.songImgSrc);
    const props = songDb.getSongProperties(record.songName, genre, record.chartType);
    const lv = props ? props.lv[record.difficulty] : 0;
    if (lv) {
      addLvToSongTitle(row, record.difficulty, getDisplayLv(lv));
    }
    return lv;
  }

  const titleImg = d.querySelector('.main_wrapper > img.title') as HTMLImageElement;
  if (titleImg) {
    (async () => {
      removeScrollControl(d);
      const rows = Array.from(
        d.querySelectorAll('.main_wrapper .p_10.t_l.f_0.v_b')
      ) as HTMLElement[];
      try {
        const gameVer = await fetchGameVersion(d.body);
        const gameRegion = getGameRegionFromOrigin(d.location.origin);
        const songDb = await loadSongDatabase(gameVer, gameRegion);
        const records: ScoreRecord[] = rows.map((row) => {
          const baseRecord = {
            songName: getSongName(row),
            songImgSrc: getSongImgSrc(row),
            chartType: getChartType(row),
            difficulty: getDifficulty(row),
          };
          const level =
            baseRecord.difficulty !== Difficulty.UTAGE ? addLvToRow(row, baseRecord, songDb) : 0;
          return {
            ...baseRecord,
            level,
            date: getPlayDate(row),
            genre: getSongGenreFromImg(baseRecord.songName, baseRecord.songImgSrc),
            achievement: getAchievement(row),
            rank: getRank(row),
            marks: getMarks(row),
            isNewRecord: getIsNewRecord(row),
          };
        });
        createOutputElement(records, songDb, titleImg);
      } catch (e) {
        const footer = d.getElementsByTagName('footer')[0];
        const textarea = ce('textarea');
        footer.append(textarea);
        textarea.value = e instanceof Error ? e.message + '\n' + e.stack : String(e);
      }
    })().then((_) => {});
  }
})(document);
