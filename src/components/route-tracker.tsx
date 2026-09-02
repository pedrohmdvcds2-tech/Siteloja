'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { firestore } = useFirebase();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const query = searchParams ? searchParams.toString() : '';
    const url = pathname + (query ? `?${query}` : '');

    // Send SPA page_view to Google Analytics (gtag)
    try {
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'page_view', { page_path: url });
      }
    } catch (err) {
      console.warn('gtag page_view error', err);
    }

    // Log a detailed visit record to Firestore
    if (firestore) {
      const visits = collection(firestore, 'detailed_visits');
      const referrer = typeof document !== 'undefined' ? document.referrer || null : null;
      const utm: Record<string, string> = {};
      try {
        const params = new URLSearchParams(query);
        params.forEach((value, key) => {
          if (key.startsWith('utm_')) utm[key] = value;
        });
      } catch (e) {
        // ignore
      }

      addDoc(visits, {
        path: pathname,
        url,
        referrer,
        utm,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        ts: serverTimestamp(),
      }).catch((e) => console.error('Failed to write visit:', e));
    }
  }, [pathname, searchParams, firestore]);

  return null;
}
