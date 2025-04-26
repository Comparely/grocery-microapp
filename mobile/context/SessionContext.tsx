import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as Location from 'expo-location';

type Session = {
    id: string;
    createdAt: string;
    // …any other session fields
};

interface SessionContextData {
    location: Location.LocationObject | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
}

const SessionContext = createContext<SessionContextData | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                // 1) ask permission
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    throw new Error('Location permission denied');
                }

                // 2) get the current position
                const loc = await Location.getCurrentPositionAsync();
                setLocation(loc);

                // 3) create a session on your server
                const resp = await fetch('https://your.api/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                    }),
                });
                if (!resp.ok) {
                    throw new Error(`Server error: ${resp.status}`);
                }
                const sessionData: Session = await resp.json();
                setSession(sessionData);
            } catch (err) {
                setError(String(err));
            } finally {
                setLoading(false);
            }
        })().catch((_) => {});
    }, []);

    return (
        <SessionContext.Provider value={{ location, session, loading, error }}>
            {children}
        </SessionContext.Provider>
    );
};

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be inside SessionProvider');
    return ctx;
}
