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
        <div className="summary-grid">

            <div className="glass-panel metric-card">
                <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-color)' }}>
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="metric-title">Total Spend</p>
                    <h2 className="metric-value">{formatCurrency(totalAmount)}</h2>
                </div>
            </div>

            <div className="glass-panel metric-card">
                <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-color)' }}>
                    <Activity size={24} />
                </div>
                <div>
                    <p className="metric-title">Transactions</p>
                    <h2 className="metric-value">{transactionCount}</h2>
                </div>
            </div>

        </div>
    );
};
