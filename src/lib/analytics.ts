'use client';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function trackEvent(
  name: string,
  params: Record<string, any> = {},
  firestore?: any,
  userId?: string | null
) {
  // Send to Google Analytics (gtag) if available
  try {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', name, params);
    }
  } catch (e) {
    console.warn('gtag send failed', e);
  }

  // Persist event to Firestore if a firestore instance was provided
  if (firestore) {
    try {
      const col = collection(firestore, 'events');
      await addDoc(col, {
        name,
        params,
        userId: userId || null,
        ts: serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to write analytics event:', e);
    }
  }
}

export default trackEvent;
