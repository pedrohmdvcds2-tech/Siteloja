'use client';

import { useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';

export function VisitorTracker() {
    const { firestore } = useFirebase();

    useEffect(() => {
        // Wait for firebase to be ready and not in an SSR context
        if (!firestore || typeof window === 'undefined') return;
        
        const today = new Date();
        const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        const sessionKey = `princesasPetShopVisited-${dateString}`;
        const hasVisitedToday = sessionStorage.getItem(sessionKey);
        
        if (!hasVisitedToday) {
            const dailyCounterRef = doc(firestore, 'stats', `visits-${dateString}`);

            updateDoc(dailyCounterRef, { count: increment(1) })
                .then(() => {
                    sessionStorage.setItem(sessionKey, 'true');
                })
                .catch((err) => {
                    if (err.code === 'not-found') {
                        // If the document doesn't exist, create it.
                        setDoc(dailyCounterRef, { count: 1 })
                            .then(() => {
                                sessionStorage.setItem(sessionKey, 'true');
                            })
                            .catch(console.error);
                    } else {
                        // For other errors (like permissions), log them but don't block.
                        console.error("Failed to update daily visitor count:", err);
                    }
                });
        }

    }, [firestore]);

    return null; // This component renders nothing.
}
