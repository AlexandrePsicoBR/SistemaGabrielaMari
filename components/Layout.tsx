import React from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import { View } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    currentView: View;
    onChangeView: (view: View) => void;
    onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
    children,
    currentView,
    onChangeView,
    onLogout
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="flex h-screen bg-background-light overflow-hidden animate-fade-in print:h-auto print:overflow-visible">
            {/* Desktop Sidebar */}
            <div className="hidden md:block print:hidden">
                <Sidebar
                    currentView={currentView}
                    onChangeView={onChangeView}
                    onLogout={onLogout}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex print:hidden">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <Sidebar
                        currentView={currentView}
                        onChangeView={onChangeView}
                        onLogout={onLogout}
                        onClose={() => setIsMobileMenuOpen(false)}
                        className="relative z-50 h-full shadow-xl animate-slide-in-left"
                    />
                </div>
            )}

            <main className="flex-1 flex flex-col h-full relative overflow-hidden print:h-auto print:overflow-visible print:block">
                <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

                <div
                    className="flex-1 overflow-y-auto w-full print:h-auto print:overflow-visible print:block"
                >
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
