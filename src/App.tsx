import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ImportSettingsModal } from './components/ImportSettingsModal';
import type { SpreadsheetSettings } from './services/GoogleSheetsService';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isConfigured } = useSettings();
  if (!isConfigured) {
    return <Navigate to="/settings" replace />;
  }
  return <>{children}</>;
};

function AppContent() {
  const [pendingConfig, setPendingConfig] = useState<SpreadsheetSettings | null>(null);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const configParam = urlParams.get('config');
      if (configParam) {
        const decoded = atob(configParam);
        const parsed: SpreadsheetSettings = JSON.parse(decoded);
        if (parsed && parsed.sheetUrl && parsed.tabs) {
          setPendingConfig(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse incoming configuration link', e);
    }
  }, []);

  const handleAcceptImport = () => {
    if (pendingConfig) {
      localStorage.setItem('gastos-settings-v2', JSON.stringify(pendingConfig));
      // Remove query param
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
      window.history.replaceState({ path: newUrl }, '', newUrl);
      // Hard reload to initialize contexts properly
      window.location.reload();
    }
  };

  const handleRejectImport = () => {
    setPendingConfig(null);
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  };

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>

      {pendingConfig && (
        <ImportSettingsModal
          pendingConfig={pendingConfig}
          onAccept={handleAcceptImport}
          onReject={handleRejectImport}
        />
      )}
    </>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
