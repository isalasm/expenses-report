import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Wallet } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const Layout: React.FC = () => {
    const { isConfigured } = useSettings();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <header className="glass-panel" style={{ margin: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))',
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'flex',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                    }}>
                        <Wallet size={24} color="#fff" />
                    </div>
                    <h2 style={{ margin: 0, letterSpacing: '-0.5px' }}>Expenses</h2>
                </div>

                <nav style={{ display: 'flex', gap: '24px' }}>
                    {isConfigured && (
                        <NavLink
                            to="/"
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: '8px',
                                textDecoration: 'none',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: isActive ? 600 : 400,
                                transition: 'all 0.2s',
                                textShadow: isActive ? '0 0 10px rgba(255,255,255,0.3)' : 'none'
                            })}
                        >
                            <LayoutDashboard size={20} />
                            <span className="hide-mobile">Dashboard</span>
                        </NavLink>
                    )}

                    <NavLink
                        to="/settings"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '8px',
                            textDecoration: 'none',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 600 : 400,
                            transition: 'all 0.2s',
                            textShadow: isActive ? '0 0 10px rgba(255,255,255,0.3)' : 'none'
                        })}
                    >
                        <Settings size={20} />
                        <span className="hide-mobile">Settings</span>
                    </NavLink>
                </nav>
            </header>

            <main className="container animate-fade-in" style={{ flex: 1, width: '100%', boxSizing: 'border-box', paddingTop: '8px' }}>
                <Outlet />
            </main>

            <style>{`
        header.glass-panel {
          padding: 16px 24px;
        }
        @media (max-width: 600px) {
          .hide-mobile { display: none; }
          header.glass-panel {
            padding: 12px 16px;
            margin: 12px;
          }
        }
      `}</style>
        </div>
    );
};
