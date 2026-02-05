import React, { useEffect, useState } from 'react';
import PatientSidebar from './PatientSidebar';
import MobileHeader from './MobileHeader';
import { View } from '../types';
import { supabase } from '../lib/supabase';
import ProfileCompletionModal from './ProfileCompletionModal';

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        const checkProfileCompletion = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: patient, error } = await supabase
                    .from('patients')
                    .select('phone, birth_date')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error checking profile completion:', error);
                    return;
                }

                // Check if fields are missing (null, undefined, or empty string)
                if (!patient.phone || !patient.birth_date) {
                    setShowProfileModal(true);
                }

            } catch (err) {
                console.error('Unexpected error checking profile:', err);
            }
        };

        checkProfileCompletion();
    }, []);

    return (
        <div className="flex h-screen bg-[#FDFBF9] overflow-hidden animate-fade-in font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <PatientSidebar
                    currentView={currentView}
                    onChangeView={onChangeView}
                    onLogout={onLogout}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <PatientSidebar
                        currentView={currentView}
                        onChangeView={onChangeView}
                        onLogout={onLogout}
                        onClose={() => setIsMobileMenuOpen(false)}
                        className="relative z-50 h-full shadow-xl animate-slide-in-left"
                    />
                </div>
            )}

            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 overflow-y-auto w-full">
                    {children}
                </div>
            </main>

            {/* Profile Completion Modal */}
            <ProfileCompletionModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onComplete={() => {
                    setShowProfileModal(false);
                    onChangeView('patient-profile');
                }}
            />
        </div>
    );
};

export default PatientLayout;
