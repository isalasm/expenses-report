import React from 'react';
import type { SpreadsheetSettings } from '../services/GoogleSheetsService';
import { Download, AlertTriangle } from 'lucide-react';

interface ImportSettingsModalProps {
    pendingConfig: SpreadsheetSettings;
    onAccept: () => void;
    onReject: () => void;
}

export const ImportSettingsModal: React.FC<ImportSettingsModalProps> = ({ pendingConfig, onAccept, onReject }) => {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999, padding: '20px'
        }}>
            <div className="glass-panel animate-fade-in" style={{
                background: 'var(--panel-bg)',
                maxWidth: '500px', width: '100%',
                padding: '32px', borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(5b, 130, 246, 0.2)', color: '#3b82f6', padding: '12px', borderRadius: '50%' }}>
                        <Download size={32} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Import Configuration</h2>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                    You have opened a link containing a Gastos configuration. Would you like to import it?
                </p>

                <div style={{
                    background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px',
                    border: '1px solid var(--panel-border)', marginBottom: '24px'
                }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Incoming Settings</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '0.9rem', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>Sheet URL:</strong>
                        <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pendingConfig.sheetUrl}>{pendingConfig.sheetUrl}</span>

                        <strong style={{ color: 'var(--text-secondary)' }}>Local Currency:</strong>
                        <span style={{ color: 'var(--text-primary)' }}>{pendingConfig.localCurrency}</span>

                        <strong style={{ color: 'var(--text-secondary)' }}>Start Day:</strong>
                        <span style={{ color: 'var(--text-primary)' }}>{pendingConfig.startDay}</span>

                        <strong style={{ color: 'var(--text-secondary)' }}>Configured Tabs:</strong>
                        <span style={{ color: 'var(--text-primary)' }}>{pendingConfig.tabs.length} tabs </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
                    <AlertTriangle size={20} color="var(--danger-color)" style={{ flexShrink: 0 }} />
                    <p style={{ margin: 0, color: 'var(--danger-color)', fontSize: '0.85rem' }}>
                        Accepting will <strong>overwrite</strong> any existing configuration stored on this device.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onReject}
                        style={{
                            padding: '12px 24px', borderRadius: '8px',
                            background: 'transparent', color: 'var(--text-primary)',
                            border: '1px solid var(--panel-border)',
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                        Reject
                    </button>
                    <button
                        onClick={onAccept}
                        style={{
                            padding: '12px 24px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))', color: '#fff',
                            border: 'none', fontWeight: 600, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                        Accept Import
                    </button>
                </div>
            </div>
        </div>
    );
};
