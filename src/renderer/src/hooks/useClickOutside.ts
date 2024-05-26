import { RefObject, useEffect } from 'react';

const useClickOutside = (
  ref: RefObject<HTMLElement>,
  callback: () => void,
  ignoreRefs?: RefObject<HTMLElement>[]
) => {
  const handleClick = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      if (
        ignoreRefs &&
        ignoreRefs.some((ignoreRef) => ignoreRef.current?.contains(e.target as Node))
      ) {
        return;
      }
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [ref, callback]);
};

export default useClickOutside;
