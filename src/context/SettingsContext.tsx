import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SettingsData {
    sheetUrl: string;
    facturationStartDay: number;
}

interface SettingsContextType {
    settings: SettingsData;
    updateSettings: (newSettings: Partial<SettingsData>) => void;
    isConfigured: boolean;
}

const defaultSettings: SettingsData = {
    sheetUrl: '',
    facturationStartDay: 1, // Default billing cycle starts on 1st of month
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useLocalStorage<SettingsData>('gastos-settings', defaultSettings);

    const updateSettings = (newSettings: Partial<SettingsData>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    const isConfigured = Boolean(settings.sheetUrl);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isConfigured }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
