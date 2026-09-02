'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function RouteTracker() {
  const pathname = usePathname();
  // Avoid useSearchParams hook here to prevent CSR bailout on server-rendered pages.
  // We'll read the search string from window.location in the client effect below.
  const { firestore } = useFirebase();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const search = typeof window !== 'undefined' ? window.location.search : '';
    const query = search.startsWith('?') ? search.slice(1) : search;
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
