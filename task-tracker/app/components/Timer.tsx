'use client';

import { useEffect, useState } from 'react';

export default function Timer({ startIso }: { startIso: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const startMs = new Date(startIso).getTime();
    const id = setInterval(() => {
      setSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    setSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    return () => clearInterval(id);
  }, [startIso]);
  return <span>{Math.floor(seconds/60)}m {seconds%60}s</span>;
}


