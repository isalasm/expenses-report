import React from 'react';
import type { ExpenseRow } from '../../services/GoogleSheetsService';
import { format, parseISO } from 'date-fns';

interface TransactionsListProps {
    data: ExpenseRow[];
    currency: string;
    isSummary?: boolean;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ data, currency, isSummary }) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency || 'USD',
            maximumFractionDigits: currency === 'CLP' ? 0 : 2
        }).format(val);
    };

    const formatDate = (isoString: string) => {
        try {
            return format(parseISO(isoString), 'MMM dd, yyyy HH:mm');
        } catch {
            return isoString;
        }
    };

    if (data.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                <p>No transactions found for this period.</p>
            </div>
        );
    }

    const sortedData = [...data].sort((a, b) => {
        return new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime();
    });

    return (
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Recent Transactions</h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 8px', fontWeight: 500 }}>Date</th>
                        <th style={{ padding: '12px 8px', fontWeight: 500 }}>Category</th>
                        <th style={{ padding: '12px 8px', fontWeight: 500 }}>Description</th>
                        <th style={{ padding: '12px 8px', fontWeight: 500 }}>Owner</th>
                        <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, idx) => (
                        <tr key={row.ID || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {formatDate(row.Fecha)}
                            </td>
                            <td style={{ padding: '16px 8px' }}>
                                <span style={{
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: 'var(--accent-hover)',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600
                                }}>
                                    {row.Categoría || 'N/A'}
                                </span>
                            </td>
                            <td style={{ padding: '16px 8px' }}>{row.Descipcion || '-'}</td>
                            <td style={{ padding: '16px 8px' }}>{row.Dueño || '-'}</td>
                            <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                                <div>{formatCurrency(row.Gasto)}</div>
                                {isSummary && (row as any)._originalCurrency && (row as any)._originalCurrency !== currency && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '4px' }}>
                                        (from {(row as any)._originalCurrency})
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
