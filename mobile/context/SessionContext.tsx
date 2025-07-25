import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as Location from 'expo-location';
import { Session } from '@/types/Session';
import { initiateSessionForUser } from '@/api/searchProducts';
import { Platform } from 'react-native';

interface SessionContextData {
    location: { lat: number; lng: number };
    session: Session | undefined;
    loading: boolean;
    error: string | null;
    locationDenied: boolean;
    requestLocationPermission: () => void;
    manualLocationUpdate: (lat: number, lng: number) => void;
}

const FALLBACK_COORDS = { lat: 28.4595, lng: 77.0266 }; // Gurugram

const SessionContext = createContext<SessionContextData | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [location, setLocation] = useState<{ lat: number; lng: number }>(FALLBACK_COORDS);
    const [session, setSession] = useState<Session | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [locationDenied, setLocationDenied] = useState(false);

    // common fallback
    const fallback = () => {
        console.log("Fallback")
        setLocationDenied(false);
        initiateSessionForUser(FALLBACK_COORDS.lat, FALLBACK_COORDS.lng)
            .then((sess: Session) => {
                setSession(sess);
                setLoading(false);
            })
            .catch((err) => {
                console.log('Sess Err', err);
                setError('Sess Err' + err);
            });
    };

    // initial geolocation + session
    const initGeolocation = async () => {
        try {
            if (Platform.OS === 'web') {
                if (!navigator.geolocation) throw new Error('No geolocation');
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setLocationDenied(false);
                        const { latitude, longitude } = pos.coords;
                        setLocation({ lat: latitude, lng: longitude });
                        initiateSessionForUser(latitude, longitude)
                            .then((sess: Session) => {
                                setSession(sess);
                                setLoading(false);
                            })
                            .catch((err) => {
                                console.log('Sess Err', err);
                                setError('Sess Err' + err);
                            });
                    },
                    (_) => fallback(),
                    { enableHighAccuracy: true, timeout: 10000 },
                );
            } else {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') throw new Error('Permission denied');
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                setLocationDenied(false);
                setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
                initiateSessionForUser(loc.coords.latitude, loc.coords.longitude)
                    .then((sess: Session) => {
                        setSession(sess);
                        setLoading(false);
                    })
                    .catch((err) => {
                        console.log('Sess Err', err);
                        setError('Sess Err' + err);
                    });
            }
        } catch {
            fallback();
        }
    };

    useEffect(() => {
        void initGeolocation();
    }, []);

    // exposed to let the user retry
    const requestLocationPermission = () => {
        if(locationDenied){
            alert("You have previously disabled location for Comparely. Go to Site Settings to enable it now or enter manually.")
            return
        }
        setLoading(true);
        void initGeolocation();
    };

    const manualLocationUpdate = (lat: number, lng: number) => {
        setLocation({
            lat: lat, lng: lng
        })
        setLocationDenied(false)
        initiateSessionForUser(lat, lng)
            .then((sess: Session) => {
                setSession(sess);
                setLoading(false);
            })
            .catch((err) => {
                console.log('Sess Err', err);
                setError('Sess Err' + err);
            });
    }

    return (
        <SessionContext.Provider
            value={{
                location,
                session,
                loading,
                error,
                locationDenied,
                requestLocationPermission,
                manualLocationUpdate,
            }}>
            {children}
        </SessionContext.Provider>
    );
};

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be inside SessionProvider');
    return ctx;
}
