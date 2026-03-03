import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface HeaderMap {
    id: string;
    date: string;
    amount: string;
    description: string;
    category: string;
    owner: string;
}

export interface TabConfig {
    id: string;
    name: string; // Sheet name
    currency: string;
    customLocalRate?: number; // Optional manual override for conversion to Local Currency
    headers: HeaderMap;
}

export interface SettingsData {
    sheetUrl: string;
    facturationStartDay: number;
    localCurrency: string;
    tabs: TabConfig[];
}

interface SettingsContextType {
    settings: SettingsData;
    updateSettings: (newSettings: Partial<SettingsData>) => void;
    isConfigured: boolean;
}

const defaultSettings: SettingsData = {
    sheetUrl: '',
    facturationStartDay: 1,
    localCurrency: 'USD',
    tabs: [],
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useLocalStorage<SettingsData>('gastos-settings-v2', defaultSettings);

    const updateSettings = (newSettings: Partial<SettingsData>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    const isConfigured = Boolean(settings.sheetUrl && settings.tabs.length > 0);

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
