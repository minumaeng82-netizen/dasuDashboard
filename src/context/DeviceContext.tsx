import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceMode } from '../types';

interface DeviceContextType {
    mode: DeviceMode;
    setMode: (mode: DeviceMode) => void;
    isManual: boolean;
    resetToAuto: () => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setModeState] = useState<DeviceMode>('PC');
    const [isManual, setIsManual] = useState(false);

    const getModeFromWidth = (width: number): DeviceMode => {
        if (width < 640) return 'Mobile';
        if (width < 1024) return 'Tablet';
        return 'PC';
    };

    useEffect(() => {
        // Initial detection
        const savedMode = localStorage.getItem('deviceMode') as DeviceMode;
        if (savedMode && ['PC', 'Tablet', 'Mobile'].includes(savedMode)) {
            setModeState(savedMode);
            setIsManual(true);
        } else {
            setModeState(getModeFromWidth(window.innerWidth));
        }

        // Handle resize
        const handleResize = () => {
            // Only auto-update if not in manual mode
            const saved = localStorage.getItem('deviceMode');
            if (!saved) {
                setModeState(getModeFromWidth(window.innerWidth));
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const setMode = (newMode: DeviceMode) => {
        setModeState(newMode);
        setIsManual(true);
        localStorage.setItem('deviceMode', newMode);
    };

    const resetToAuto = () => {
        setIsManual(false);
        localStorage.removeItem('deviceMode');
        setModeState(getModeFromWidth(window.innerWidth));
    };

    return (
        <DeviceContext.Provider value={{ mode, setMode, isManual, resetToAuto }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDeviceMode = () => {
    const context = useContext(DeviceContext);
    if (context === undefined) {
        throw new Error('useDeviceMode must be used within a DeviceProvider');
    }
    return context;
};
