'use client';

import { useEffect } from 'react';
import { hotjar } from 'react-hotjar';

const HOTJAR_SITE_ID = 6428498;
const HOTJAR_VERSION = 6;

export default function HotjarInit() {
  useEffect(() => {
    hotjar.initialize({ id: HOTJAR_SITE_ID, sv: HOTJAR_VERSION });
  }, []);

  return null;
}
