import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import type { TabConfig, HeaderMap } from '../context/SettingsContext';
import { Save, CheckCircle, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleSheetsService } from '../services/GoogleSheetsService';

const defaultHeaderMap: HeaderMap = {
    id: 'ID',
    date: 'Fecha',
    amount: 'Gasto',
    description: 'Descipcion',
    category: 'Categoría',
    owner: 'Dueño'
};

export const SettingsPage: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const navigate = useNavigate();

    const [sheetUrl, setSheetUrl] = useState(settings.sheetUrl || '');
    const [startDay, setStartDay] = useState(settings.facturationStartDay.toString());
    const [localCurrency, setLocalCurrency] = useState(settings.localCurrency || 'USD');
    const [tabs, setTabs] = useState<TabConfig[]>(settings.tabs || []);
    const [expandedTabId, setExpandedTabId] = useState<string | null>(null);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setSheetUrl(settings.sheetUrl);
        setStartDay(settings.facturationStartDay.toString());
        setLocalCurrency(settings.localCurrency || 'USD');
        setTabs(settings.tabs || []);
    }, [settings]);

    const handleAddTab = () => {
        const newTab: TabConfig = {
            id: Date.now().toString(),
            name: 'New Tab',
            currency: 'USD',
            headers: { ...defaultHeaderMap }
        };
        setTabs([...tabs, newTab]);
        setExpandedTabId(newTab.id);
    };

    const handleRemoveTab = (id: string) => {
        setTabs(tabs.filter(t => t.id !== id));
    };

    const updateTab = (id: string, updates: Partial<TabConfig>) => {
        setTabs(tabs.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const updateTabHeader = (id: string, key: keyof HeaderMap, value: string) => {
        setTabs(tabs.map(t => {
            if (t.id === id) {
                return { ...t, headers: { ...t.headers, [key]: value } };
            }
            return t;
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(sheetUrl);

        if (!spreadsheetId) {
            setError('Invalid Google Sheets URL. Please make sure you copy the entire link.');
            return;
        }

        const day = parseInt(startDay, 10);
        if (isNaN(day) || day < 1 || day > 31) {
            setError('Facturation start day must be between 1 and 31.');
            return;
        }

        if (tabs.length === 0) {
            setError('Please add at least one tab to track.');
            return;
        }

        updateSettings({
            sheetUrl,
            facturationStartDay: day,
            localCurrency,
            tabs
        });

        setSuccess(true);
        setTimeout(() => {
            navigate('/');
        }, 1500);
    };

    return (
        <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                Configuration
            </h2>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>Connect your expenses Google Sheet, set your local currency, and map your spreadsheet tabs.</p>

            {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                    <CheckCircle size={20} /> Settings saved successfully!
                </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* General Settings */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            Google Sheet Link <span style={{ color: 'var(--danger-color)' }}>*</span>
                        </label>
                        <input
                            type="url"
                            className="input"
                            placeholder="https://docs.google.com/spreadsheets/d/1N1wG4vX_..."
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            required
                        />
                        <p style={{ fontSize: '0.85rem', marginTop: '6px', marginBottom: 0, color: 'var(--text-secondary)' }}>
                            Make sure the sheet is shared as "Anyone with the link can view".
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            Billing Start Day <span style={{ color: 'var(--danger-color)' }}>*</span>
                        </label>
                        <input
                            type="number"
                            className="input"
                            min="1" max="31"
                            value={startDay}
                            onChange={(e) => setStartDay(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            Local Currency <span style={{ color: 'var(--danger-color)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g. USD, EUR, CLP"
                            value={localCurrency}
                            onChange={(e) => setLocalCurrency(e.target.value.toUpperCase())}
                            required
                        />
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '16px 0' }} />

                {/* Tabs Configuration */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Sheet Tabs Map</h3>
                        <button type="button" onClick={handleAddTab} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.9rem' }}>
                            <Plus size={16} /> Add Tab
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {tabs.map((tab) => (
                            <div key={tab.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '12px', overflow: 'hidden' }}>
                                {/* Accordion Header */}
                                <div
                                    style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedTabId === tab.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                                    onClick={() => setExpandedTabId(expandedTabId === tab.id ? null : tab.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {expandedTabId === tab.id ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{tab.name || 'Unnamed Tab'}</span>
                                        <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-hover)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {tab.currency}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveTab(tab.id); }}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {/* Accordion Body */}
                                {expandedTabId === tab.id && (
                                    <div style={{ padding: '16px', borderTop: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sheet Tab Name</label>
                                                <input type="text" className="input" value={tab.name} onChange={(e) => updateTab(tab.id, { name: e.target.value })} required />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Currency Code</label>
                                                <input type="text" className="input" placeholder="e.g. CLP" value={tab.currency} onChange={(e) => updateTab(tab.id, { currency: e.target.value.toUpperCase() })} required />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Custom Rate to {localCurrency} (Optional)</label>
                                                <input type="number" step="0.000001" className="input" placeholder="e.g. 0.0012" value={tab.customLocalRate || ''} onChange={(e) => updateTab(tab.id, { customLocalRate: e.target.value ? parseFloat(e.target.value) : undefined })} />
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--panel-border)' }}>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Column Headers Map</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID Column</label>
                                                    <input type="text" className="input" value={tab.headers.id} onChange={(e) => updateTabHeader(tab.id, 'id', e.target.value)} required />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Date Column</label>
                                                    <input type="text" className="input" value={tab.headers.date} onChange={(e) => updateTabHeader(tab.id, 'date', e.target.value)} required />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount Column</label>
                                                    <input type="text" className="input" value={tab.headers.amount} onChange={(e) => updateTabHeader(tab.id, 'amount', e.target.value)} required />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description Column</label>
                                                    <input type="text" className="input" value={tab.headers.description} onChange={(e) => updateTabHeader(tab.id, 'description', e.target.value)} required />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category Column</label>
                                                    <input type="text" className="input" value={tab.headers.category} onChange={(e) => updateTabHeader(tab.id, 'category', e.target.value)} required />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Owner Column</label>
                                                    <input type="text" className="input" value={tab.headers.owner} onChange={(e) => updateTabHeader(tab.id, 'owner', e.target.value)} required />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        ))}

                        {tabs.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(0,0,0,0.1)', border: '1px dashed var(--panel-border)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                No tabs configured. Click "Add Tab" to map a sheet.
                            </div>
                        )}
                    </div>
                </div>

                <button type="submit" className="btn" style={{ marginTop: '10px', alignSelf: 'flex-start' }}>
                    <Save size={18} />
                    Save Settings
                </button>

            </form>
        </div>
    );
};
