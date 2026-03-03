import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import type { ExpenseRow } from '../services/GoogleSheetsService';
import { getCurrentFacturationPeriod, isDateInPeriod } from '../utils/dateUtils';
import { SummaryWidget } from '../components/dashboard/SummaryWidget';
import { ChartsWidget } from '../components/dashboard/ChartsWidget';
import { TransactionsList } from '../components/dashboard/TransactionsList';
import { RefreshCw, Calendar, ChevronLeft, ChevronRight, Filter, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

export const DashboardPage: React.FC = () => {
    const { settings } = useSettings();
    const [activeTabId, setActiveTabId] = useState<string>('summary'); // 'summary' or a tab.id

    const [dataByTab, setDataByTab] = useState<Record<string, ExpenseRow[]>>({});
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter States
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedOwner, setSelectedOwner] = useState<string>('All');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(settings.sheetUrl);
            if (!spreadsheetId) throw new Error('Invalid URL in settings');

            // Fetch exchange rates
            try {
                if (settings.localCurrency) {
                    const rateRes = await fetch(`https://api.exchangerate-api.com/v4/latest/${settings.localCurrency}`);
                    if (rateRes.ok) {
                        const rateData = await rateRes.json();
                        setExchangeRates(rateData.rates || {});
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch exchange rates, will fallback to custom rates or 1.");
            }

            // Fetch Sheets
            const promises = settings.tabs.map(tab =>
                GoogleSheetsService.fetchExpenses(spreadsheetId, tab.name, tab.headers)
                    .then(data => ({ id: tab.id, data }))
            );

            const results = await Promise.all(promises);
            const newData: Record<string, ExpenseRow[]> = {};
            results.forEach(res => {
                newData[res.id] = res.data;
            });

            setDataByTab(newData);

            // If active tab was deleted from settings, fallback to summary
            if (activeTabId !== 'summary' && !settings.tabs.find(t => t.id === activeTabId)) {
                setActiveTabId('summary');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (settings.sheetUrl && settings.tabs.length > 0) {
            fetchData();
        }
    }, [settings.sheetUrl, settings.tabs]);

    // Handle Date Filtering with Offset
    const period = useMemo(() => {
        const basePeriod = getCurrentFacturationPeriod(settings.facturationStartDay);
        if (monthOffset === 0) return basePeriod;

        return {
            start: monthOffset > 0 ? addMonths(basePeriod.start, monthOffset) : subMonths(basePeriod.start, Math.abs(monthOffset)),
            end: monthOffset > 0 ? addMonths(basePeriod.end, monthOffset) : subMonths(basePeriod.end, Math.abs(monthOffset))
        };
    }, [settings.facturationStartDay, monthOffset]);


    // Data Aggregation
    const activeData = useMemo(() => {
        // Returns an array of items, mapping Gasto to local equivalent if in summary mode.
        if (activeTabId === 'summary') {
            const allItems: (ExpenseRow & { _originalCurrency: string })[] = [];

            settings.tabs.forEach(tab => {
                const rows = dataByTab[tab.id] || [];

                // Rate calculation
                // API rate is how many units of tab.currency = 1 localCurrency
                let toLocalRate = tab.customLocalRate;
                if (!toLocalRate) {
                    const apiRate = exchangeRates[tab.currency];
                    // If apiRate is e.g. 900 (900 tabCurrency = 1 localCurrency), then 1 tabCurrency = 1/900 localCurrency.
                    toLocalRate = apiRate ? (1 / apiRate) : 1;
                }

                rows.forEach(row => {
                    const inLocal = row.Gasto * toLocalRate!;

                    allItems.push({
                        ...row,
                        Gasto: inLocal,
                        _originalCurrency: tab.currency
                    });
                });
            });
            return allItems;
        } else {
            // Specific tab
            return dataByTab[activeTabId] || [];
        }
    }, [activeTabId, dataByTab, settings.tabs, settings.localCurrency, exchangeRates]);

    // Derive active currency for formatting
    const currentCurrency = useMemo(() => {
        if (activeTabId === 'summary') return settings.localCurrency || 'USD';
        const tab = settings.tabs.find(t => t.id === activeTabId);
        return tab?.currency || 'USD';
    }, [activeTabId, settings.tabs, settings.localCurrency]);

    // Extract unique categories and owners for dropdowns
    const uniqueCategories = useMemo(() => {
        const cats = new Set(activeData.map(r => r.Categoría).filter(Boolean));
        return ['All', ...Array.from(cats)].sort();
    }, [activeData]);

    const uniqueOwners = useMemo(() => {
        const owners = new Set(activeData.map(r => r.Dueño).filter(Boolean));
        return ['All', ...Array.from(owners)].sort();
    }, [activeData]);

    // Apply all filters: Date, Category, and Owner
    const filteredData = useMemo(() => {
        return activeData.filter(row => {
            const inDate = isDateInPeriod(row.Fecha, period.start, period.end);
            const matchesCat = selectedCategory === 'All' || row.Categoría === selectedCategory;
            const matchesOwner = selectedOwner === 'All' || row.Dueño === selectedOwner;
            return inDate && matchesCat && matchesOwner;
        });
    }, [activeData, period, selectedCategory, selectedOwner]);

    const totalSpend = useMemo(() => {
        return filteredData.reduce((acc, curr) => acc + curr.Gasto, 0);
    }, [filteredData]);

    if (!settings.tabs || settings.tabs.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No tabs configured. Please go to settings to map your sheet tabs.</p>
            </div>
        );
    }

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
                <div className="scroll-x-mobile" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                    <button
                        onClick={() => setActiveTabId('summary')}
                        style={{
                            background: activeTabId === 'summary' ? 'var(--panel-bg)' : 'transparent',
                            color: activeTabId === 'summary' ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid',
                            borderColor: activeTabId === 'summary' ? 'rgba(255,255,255,0.15)' : 'transparent',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontFamily: 'var(--font-family)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: activeTabId === 'summary' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                        }}
                    >
                        <Globe size={16} /> Summary ({settings.localCurrency})
                    </button>

                    <div style={{ width: '1px', background: 'var(--panel-border)', margin: '4px 0' }} />

                    {settings.tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            style={{
                                background: activeTabId === tab.id ? 'var(--panel-bg)' : 'transparent',
                                color: activeTabId === tab.id ? '#fff' : 'var(--text-secondary)',
                                border: '1px solid',
                                borderColor: activeTabId === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontFamily: 'var(--font-family)',
                                transition: 'all 0.2s',
                                boxShadow: activeTabId === tab.id ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Period info & Navigation */}
                <div className="period-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)', backdropFilter: 'blur(10px)' }}>
                    <button onClick={() => setMonthOffset(prev => prev - 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }} title="Previous Month">
                        <ChevronLeft size={20} />
                    </button>

                    <div className="period-nav-dates" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 8px' }}>
                        <Calendar size={18} />
                        <span style={{ fontSize: '0.9rem' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{format(period.start, 'MMM dd')}</strong> - <strong style={{ color: 'var(--text-primary)' }}>{format(period.end, 'MMM dd, yyyy')}</strong>
                        </span>
                    </div>

                    <button onClick={() => setMonthOffset(prev => prev + 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }} title="Next Month">
                        <ChevronRight size={20} />
                    </button>

                    <div className="period-nav-divider" style={{ width: '1px', height: '20px', background: 'var(--panel-border)', margin: '0 4px' }}></div>

                    <button onClick={() => { fetchData(); setMonthOffset(0); }} title="Refresh data & reset period" style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
                <div
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Filters {(selectedCategory !== 'All' || selectedOwner !== 'All') ? '(Active)' : ''}</span>
                    </div>
                    <div className="mobile-only-icon" style={{ display: 'flex' }}>
                        {isFiltersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>

                <div className="filters-content-desktop" style={{
                    display: isFiltersOpen ? 'flex' : 'none',
                    gap: '16px',
                    marginTop: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '16px'
                }}>
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
            </div>

            <SummaryWidget totalAmount={totalSpend} transactionCount={filteredData.length} currency={currentCurrency} />

            <div className="swipe-container">
                <div className="swipe-item">
                    <TransactionsList data={filteredData} currency={currentCurrency} isSummary={activeTabId === 'summary'} />
                </div>
                <div className="swipe-item">
                    <ChartsWidget data={filteredData} currency={currentCurrency} />
                </div>
            </div>

        </div>
    );
};
