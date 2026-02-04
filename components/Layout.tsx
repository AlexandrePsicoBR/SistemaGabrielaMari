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
    return (
        <div className="flex h-screen bg-background-light overflow-hidden animate-fade-in print:h-auto print:overflow-visible">
            <div className="print:hidden">
                <Sidebar
                    currentView={currentView}
                    onChangeView={onChangeView}
                    onLogout={onLogout}
                />
            </div>
            <main className="flex-1 flex flex-col h-full relative overflow-hidden print:h-auto print:overflow-visible print:block">
                <MobileHeader />

                <div className="flex-1 overflow-y-auto w-full print:h-auto print:overflow-visible print:block">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
