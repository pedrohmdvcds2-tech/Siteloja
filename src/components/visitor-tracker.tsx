'use client';

import { useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';

export function VisitorTracker() {
    const { firestore } = useFirebase();

    useEffect(() => {
        // Wait for firebase to be ready and not in an SSR context
        if (!firestore || typeof window === 'undefined') return;

        const hasVisited = sessionStorage.getItem('princesasPetShopVisited');
        if (!hasVisited) {
            const counterRef = doc(firestore, 'stats', 'visits');

            updateDoc(counterRef, { count: increment(1) })
                .then(() => {
                    sessionStorage.setItem('princesasPetShopVisited', 'true');
                })
                .catch((err) => {
                    if (err.code === 'not-found') {
                        // If the document doesn't exist, create it.
                        setDoc(counterRef, { count: 1 })
                            .then(() => {
                                sessionStorage.setItem('princesasPetShopVisited', 'true');
                            })
                            .catch(console.error);
                    } else {
                        // For other errors (like permissions), log them but don't block.
                        console.error("Failed to update visitor count:", err);
                    }
                });
        }

    }, [firestore]);

    return null; // This component renders nothing.
}
