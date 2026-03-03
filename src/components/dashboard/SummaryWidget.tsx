import React from 'react';
import { DollarSign, Activity } from 'lucide-react';

interface SummaryWidgetProps {
    totalAmount: number;
    transactionCount: number;
    currency: string;
}

export const SummaryWidget: React.FC<SummaryWidgetProps> = ({ totalAmount, transactionCount, currency }) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency || 'USD',
            maximumFractionDigits: currency === 'CLP' ? 0 : 2
        }).format(val);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '50%', color: 'var(--accent-color)' }}>
                    <DollarSign size={28} />
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Total Spend</p>
                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem' }}>{formatCurrency(totalAmount)}</h2>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '50%', color: 'var(--success-color)' }}>
                    <Activity size={28} />
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Transactions</p>
                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem' }}>{transactionCount}</h2>
                </div>
            </div>

        </div>
    );
};
