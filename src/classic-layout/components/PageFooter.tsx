import {SyntheticEvent, useCallback} from 'react';

export const PageFooter = () => {
  const handleClick = useCallback((evt: SyntheticEvent) => {
    evt.preventDefault();
    window.close();
  }, []);

  return (
    <div className="pageFooter">
      <a className="closePage" href="#" onClick={handleClick}>
        戻る
      </a>
    </div>
  );
};
