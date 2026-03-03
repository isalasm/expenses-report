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

            <div style={{ minWidth: '100%' }}>
                <div className="data-grid-header data-grid">
                    <div>Date</div>
                    <div>Category</div>
                    <div>Description</div>
                    <div>Owner</div>
                    <div style={{ textAlign: 'right' }}>Amount</div>
                </div>
                <div>
                    {sortedData.map((row, idx) => (
                        <div key={row.ID || idx} className="data-grid">
                            <div className="cell-date">
                                {formatDate(row.Fecha)}
                            </div>
                            <div className="cell-category">
                                <span style={{
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: 'var(--accent-hover)',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'inline-block'
                                }}>
                                    {row.Categoría || 'N/A'}
                                </span>
                            </div>
                            <div className="cell-desc">{row.Descipcion || '-'}</div>
                            <div className="cell-owner">{row.Dueño || '-'}</div>
                            <div className="cell-amount" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                <div>{formatCurrency(row.Gasto)}</div>
                                {isSummary && (row as any)._originalCurrency && (row as any)._originalCurrency !== currency && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '4px' }}>
                                        (from {(row as any)._originalCurrency})
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
