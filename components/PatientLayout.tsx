import React from 'react';
import PatientSidebar from './PatientSidebar';
import MobileHeader from './MobileHeader';
import { View } from '../types';

interface PatientLayoutProps {
    children: React.ReactNode;
    currentView: View;
    onChangeView: (view: View) => void;
    onLogout: () => void;
}

const PatientLayout: React.FC<PatientLayoutProps> = ({
    children,
    currentView,
    onChangeView,
    onLogout
}) => {
    return (
        <div className="flex h-screen bg-[#FDFBF9] overflow-hidden animate-fade-in font-sans">
            <div className="hidden md:block">
                <PatientSidebar
                    currentView={currentView}
                    onChangeView={onChangeView}
                    onLogout={onLogout}
                />
            </div>
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                <MobileHeader />
                <div className="flex-1 overflow-y-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default PatientLayout;
