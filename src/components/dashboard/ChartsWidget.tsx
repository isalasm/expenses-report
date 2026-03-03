import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ExpenseRow } from '../../services/GoogleSheetsService';
import { format, parseISO } from 'date-fns';

interface ChartsWidgetProps {
    data: ExpenseRow[];
    currency: string;
}

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export const ChartsWidget: React.FC<ChartsWidgetProps> = ({ data, currency }) => {
    const categoryData = useMemo(() => {
        const grouped = data.reduce((acc, curr) => {
            const cat = curr.Categoría || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + curr.Gasto;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [data]);

    const timelineData = useMemo(() => {
        const grouped = data.reduce((acc, curr) => {
            if (!curr.Fecha) return acc;
            try {
                const dateStr = format(parseISO(curr.Fecha), 'MMM dd');
                acc[dateStr] = (acc[dateStr] || 0) + curr.Gasto;
            } catch (e) {
                // ignore invalid dates
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped)
            .map(([date, amount]) => ({ date, amount }));
    }, [data]);

    const formatCurrency = (val: number | string | undefined) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency || 'USD',
            maximumFractionDigits: currency === 'CLP' ? 0 : 2
        }).format(Number(val || 0));
    };

    if (data.length === 0) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginTop: 0, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Expenses by Category</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {categoryData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(10px)' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={formatCurrency}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginTop: 0, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Timeline</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timelineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} width={80} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(10px)' }}
                                formatter={(value) => [formatCurrency(Array.isArray(value) ? value[0] : value as string | number), 'Amount']}
                            />
                            <Bar dataKey="amount" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};
