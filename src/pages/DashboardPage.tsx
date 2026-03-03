import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import type { ExpenseRow } from '../services/GoogleSheetsService';
import { getCurrentFacturationPeriod, isDateInPeriod } from '../utils/dateUtils';
import { SummaryWidget } from '../components/dashboard/SummaryWidget';
import { ChartsWidget } from '../components/dashboard/ChartsWidget';
import { TransactionsList } from '../components/dashboard/TransactionsList';
import { RefreshCw, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

export const DashboardPage: React.FC = () => {
    const { settings } = useSettings();
    const [activeTab, setActiveTab] = useState<'nacional' | 'internacional'>('nacional');
    const [dataNacional, setDataNacional] = useState<ExpenseRow[]>([]);
    const [dataInternacional, setDataInternacional] = useState<ExpenseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // New Filter States
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedOwner, setSelectedOwner] = useState<string>('All');

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(settings.sheetUrl);
            if (!spreadsheetId) throw new Error('Invalid URL in settings');

            const [nacional, internacional] = await Promise.all([
                GoogleSheetsService.fetchExpenses(spreadsheetId, 'nacional'),
                GoogleSheetsService.fetchExpenses(spreadsheetId, 'internacional')
            ]);

            setDataNacional(nacional);
            setDataInternacional(internacional);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (settings.sheetUrl) {
            fetchData();
        }
    }, [settings.sheetUrl]);

    // Handle Date Filtering with Offset
    const period = useMemo(() => {
        const basePeriod = getCurrentFacturationPeriod(settings.facturationStartDay);
        if (monthOffset === 0) return basePeriod;

        return {
            start: monthOffset > 0 ? addMonths(basePeriod.start, monthOffset) : subMonths(basePeriod.start, Math.abs(monthOffset)),
            end: monthOffset > 0 ? addMonths(basePeriod.end, monthOffset) : subMonths(basePeriod.end, Math.abs(monthOffset))
        };
    }, [settings.facturationStartDay, monthOffset]);

    const rawData = activeTab === 'nacional' ? dataNacional : dataInternacional;

    // Extract unique categories and owners for the current tab's data (regardless of date) to populate dropdowns
    const uniqueCategories = useMemo(() => {
        const cats = new Set(rawData.map(r => r.Categoría).filter(Boolean));
        return ['All', ...Array.from(cats)].sort();
    }, [rawData]);

    const uniqueOwners = useMemo(() => {
        const owners = new Set(rawData.map(r => r.Dueño).filter(Boolean));
        return ['All', ...Array.from(owners)].sort();
    }, [rawData]);

    // Apply all filters: Date, Category, and Owner
    const filteredData = useMemo(() => {
        return rawData.filter(row => {
            const inDate = isDateInPeriod(row.Fecha, period.start, period.end);
            const matchesCat = selectedCategory === 'All' || row.Categoría === selectedCategory;
            const matchesOwner = selectedOwner === 'All' || row.Dueño === selectedOwner;
            return inDate && matchesCat && matchesOwner;
        });
    }, [rawData, period, selectedCategory, selectedOwner]);

    const totalSpend = useMemo(() => {
        return filteredData.reduce((acc, curr) => acc + curr.Gasto, 0);
    }, [filteredData]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <RefreshCw size={40} className="animate-spin" style={{ color: 'var(--accent-color)' }} />
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading expenses data...</p>
                <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--danger-color)' }}>
                <p>Error loading data: {error}</p>
                <button className="btn btn-outline" onClick={fetchData} style={{ marginTop: '12px' }}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>

                {/* Tabs */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                    <button
                        onClick={() => setActiveTab('nacional')}
                        style={{
                            background: activeTab === 'nacional' ? 'var(--panel-bg)' : 'transparent',
                            color: activeTab === 'nacional' ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid',
                            borderColor: activeTab === 'nacional' ? 'rgba(255,255,255,0.15)' : 'transparent',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontFamily: 'var(--font-family)',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'nacional' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                        }}
                    >
                        Nacional
                    </button>
                    <button
                        onClick={() => setActiveTab('internacional')}
                        style={{
                            background: activeTab === 'internacional' ? 'var(--panel-bg)' : 'transparent',
                            color: activeTab === 'internacional' ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid',
                            borderColor: activeTab === 'internacional' ? 'rgba(255,255,255,0.15)' : 'transparent',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontFamily: 'var(--font-family)',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'internacional' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                        }}
                    >
                        Internacional
                    </button>
                </div>

                {/* Period info & Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)', backdropFilter: 'blur(10px)' }}>
                    <button onClick={() => setMonthOffset(prev => prev - 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }} title="Previous Month">
                        <ChevronLeft size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 8px' }}>
                        <Calendar size={18} />
                        <span style={{ fontSize: '0.9rem' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{format(period.start, 'MMM dd')}</strong> - <strong style={{ color: 'var(--text-primary)' }}>{format(period.end, 'MMM dd, yyyy')}</strong>
                        </span>
                    </div>

                    <button onClick={() => setMonthOffset(prev => prev + 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }} title="Next Month">
                        <ChevronRight size={20} />
                    </button>

                    <div style={{ width: '1px', height: '20px', background: 'var(--panel-border)', margin: '0 4px' }}></div>

                    <button onClick={() => { fetchData(); setMonthOffset(0); }} title="Refresh data & reset period" style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px 20px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Filter size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, marginRight: '8px' }}>Filters:</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', borderRadius: '6px', padding: '6px 10px', outline: 'none', fontFamily: 'var(--font-family)', fontSize: '0.9rem' }}
                    >
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Owner</label>
                    <select
                        value={selectedOwner}
                        onChange={(e) => setSelectedOwner(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', borderRadius: '6px', padding: '6px 10px', outline: 'none', fontFamily: 'var(--font-family)', fontSize: '0.9rem' }}
                    >
                        {uniqueOwners.map(owner => (
                            <option key={owner} value={owner}>{owner}</option>
                        ))}
                    </select>
                </div>

                {(selectedCategory !== 'All' || selectedOwner !== 'All') && (
                    <button
                        onClick={() => { setSelectedCategory('All'); setSelectedOwner('All'); }}
                        style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', marginLeft: 'auto', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            <SummaryWidget totalAmount={totalSpend} transactionCount={filteredData.length} currency={activeTab} />
            <ChartsWidget data={filteredData} />
            <TransactionsList data={filteredData} currency={activeTab} />

        </div>
    );
};
