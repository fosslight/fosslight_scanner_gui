import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

const useMeasure = (): {
  ref: RefObject<HTMLDivElement>;
  width: number;
  height: number;
} => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  const handleResize = useCallback(() => {
    if (ref.current) {
      setWidth(ref.current.offsetWidth);
      setHeight(ref.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { ref, width, height };
};

export default useMeasure;