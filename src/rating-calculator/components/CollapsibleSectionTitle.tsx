import React, {memo, useCallback, useEffect, useState} from 'react';

interface Props {
  isCandidateList?: boolean;
  contentHidden: boolean;
  title: string;
  onClick: (evt: React.SyntheticEvent<HTMLElement>) => void;
}

export const CollapsibleSectionTitle = memo(
  ({isCandidateList, contentHidden, title, onClick}: Props) => {
    const [symbolClassName, setSymbolClassName] = useState<string>('');

    useEffect(() => {
      if (!contentHidden) {
        setSymbolClassName('cSecShow');
        const timeout = window.setTimeout(() => {
          setSymbolClassName('');
        }, 300);
        return () => clearTimeout(timeout);
      }
    }, [contentHidden]);

    const handleClick = useCallback(
      (evt: React.SyntheticEvent<HTMLElement>) => {
        evt.preventDefault();
        onClick(evt);
      },
      [onClick],
    );

    const handleKeyPress = useCallback(
      (evt: React.KeyboardEvent<HTMLElement>) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          onClick(evt);
        }
      },
      [onClick],
    );

    const symbol = isCandidateList ? '▷' : '▶';
    let finalSymbolClassName = symbolClassName + ' cSecTitleSymbol';
    if (contentHidden) {
      finalSymbolClassName += ' cSecHidden';
    }

    return (
      <h3 className="cSecTitleContainer">
        <span className="cSecTitle" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyPress}>
          <span className={finalSymbolClassName}>{symbol}</span>
          {title}
        </span>
      </h3>
    );
  },
);
