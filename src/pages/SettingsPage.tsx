import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Save, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleSheetsService } from '../services/GoogleSheetsService';

export const SettingsPage: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const navigate = useNavigate();

    const [sheetUrl, setSheetUrl] = useState(settings.sheetUrl || '');
    const [startDay, setStartDay] = useState(settings.facturationStartDay.toString());
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setSheetUrl(settings.sheetUrl);
        setStartDay(settings.facturationStartDay.toString());
    }, [settings]);

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

        updateSettings({
            sheetUrl,
            facturationStartDay: day
        });

        setSuccess(true);
        setTimeout(() => {
            navigate('/');
        }, 1500);
    };

    return (
        <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Configuration
            </h2>
            <p>Connect your expenses Google Sheet to start tracking your finances.</p>

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

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div>
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
                    <p style={{ fontSize: '0.85rem', marginTop: '6px', marginBottom: 0 }}>
                        Make sure the sheet is shared as "Anyone with the link can view". It must have tabs exactly named "nacional" and "internacional".
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        Facturation Start Day <span style={{ color: 'var(--danger-color)' }}>*</span>
                    </label>
                    <input
                        type="number"
                        className="input"
                        min="1" max="31"
                        value={startDay}
                        onChange={(e) => setStartDay(e.target.value)}
                        required
                        style={{ width: '100px' }}
                    />
                    <p style={{ fontSize: '0.85rem', marginTop: '6px', marginBottom: 0 }}>
                        The day of the month when your billing cycle resets (e.g., 20).
                    </p>
                </div>

                <button type="submit" className="btn" style={{ marginTop: '10px' }}>
                    <Save size={18} />
                    Save Settings
                </button>

            </form>
        </div>
    );
};
