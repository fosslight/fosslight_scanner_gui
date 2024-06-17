import { RefObject, useEffect, useRef } from 'react';

interface IUseScrollToBottom {
  containerRef: RefObject<HTMLDivElement>;
}

const useScrollToBottom = (deps: any[]): IUseScrollToBottom => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, deps);

  return { containerRef };
};

export default useScrollToBottom;
