'use client';

import { useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { trackEvent } from '@/lib/analytics';

export function VisitorTracker() {
    const { firestore, user } = useFirebase();

    useEffect(() => {
        // Wait for firebase to be ready and not in an SSR context
        if (!firestore || typeof window === 'undefined') return;
        
        const today = new Date();
        const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        const sessionKey = `princesasPetShopVisited-${dateString}`;
        const hasVisitedToday = sessionStorage.getItem(sessionKey);

        const referrer = typeof document !== 'undefined' ? document.referrer || null : null;
        const path = typeof window !== 'undefined' ? window.location.pathname : null;
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const utm: Record<string, string> = {};
        try {
            const params = new URLSearchParams(search);
            params.forEach((value, key) => {
                if (key.startsWith('utm_')) utm[key] = value;
            });
        } catch (e) {
            // ignore
        }
        
        if (!hasVisitedToday) {
            const dailyCounterRef = doc(firestore, 'stats', `visits-${dateString}`);

            updateDoc(dailyCounterRef, { count: increment(1) })
                .then(() => {
                    sessionStorage.setItem(sessionKey, 'true');
                    // Log visit event
                    try { trackEvent('visit', { path, referrer, utm }, firestore, user ? user.uid : null); } catch (e) { console.warn(e); }
                })
                .catch((err) => {
                    if (err.code === 'not-found') {
                        // If the document doesn't exist, create it.
                        setDoc(dailyCounterRef, { count: 1 })
                            .then(() => {
                                sessionStorage.setItem(sessionKey, 'true');
                                try { trackEvent('visit', { path, referrer, utm }, firestore, user ? user.uid : null); } catch (e) { console.warn(e); }
                            })
                            .catch(console.error);
                    } else {
                        // For other errors (like permissions), log them but don't block.
                        console.error("Failed to update daily visitor count:", err);
                        try { trackEvent('visit_failed_update', { path, referrer, utm, error: String(err) }, firestore, user ? user.uid : null); } catch (e) { console.warn(e); }
                    }
                });
        }

    }, [firestore, user]);

    return null; // This component renders nothing.
}
