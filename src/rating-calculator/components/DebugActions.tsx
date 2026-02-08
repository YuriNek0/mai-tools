import {useCallback} from 'react';

import {clearMagicCache} from '../../common/infra/magic-api';
import {Language} from '../../common/lang';
import {useLanguage} from '../../common/lang-react';

const ClearCacheText = {
  [Language.en_US]: 'Clear cache',
  [Language.zh_TW]: '清除快取資料',
  [Language.ko_KR]: '캐시 삭제',
};

export const DebugActions = () => {
  const handleClearCache = useCallback(() => {
    clearMagicCache();
    window.location.reload();
  }, []);
  const lang = useLanguage();
  const clearCacheText = ClearCacheText[lang];
  return (
    <div>
      <button className="clearCacheBtn" onClick={handleClearCache}>
        {clearCacheText}
      </button>
    </div>
  );
};
