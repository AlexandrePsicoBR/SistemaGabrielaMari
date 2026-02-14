import React, { useEffect, useState } from 'react';
import { View } from '../types';
import { supabase } from '../lib/supabase';
import { profileService } from '../lib/profile';

interface PatientSidebarProps {
    currentView: View;
    onChangeView: (view: View) => void;
    onLogout: () => void;
    onClose?: () => void;
    className?: string;
}

const PatientSidebar: React.FC<PatientSidebarProps> = ({
    currentView,
    onChangeView,
    onLogout,
    onClose,
    className = ""
}) => {
    const [name, setName] = useState('Paciente');
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const profile = await profileService.getPatientProfile(user.id, user.email);
                if (profile) {
                    setName(profile.name || 'Paciente');
                    setAvatar(profile.avatar_url);
                }
            }
        };
        loadProfile();
    }, []);

    const menuItems: { id: View; label: string; icon: string }[] = [
        { id: 'patient-dashboard', label: 'Início', icon: 'home' },
        { id: 'patient-appointments', label: 'Minhas Consultas', icon: 'calendar_today' },
        { id: 'patient-documents', label: 'Documentos', icon: 'description' },
        { id: 'patient-history', label: 'Histórico de fotos', icon: 'photo_library' },
        { id: 'patient-news', label: 'News e Promoções', icon: 'newspaper' },
        { id: 'patient-profile', label: 'Meu Perfil', icon: 'person' },
    ];

    const handleItemClick = (viewId: View) => {
        onChangeView(viewId);
        if (onClose) onClose();
    };

    return (
        <aside className={`w-64 bg-white border-r border-[#f3f2f1] flex flex-col h-full shrink-0 font-sans ${className}`}>
            <div className="p-8 pb-4 flex flex-col items-center border-b border-[#f3f2f1]">
                <div className="bg-primary/20 p-2 rounded-lg mb-3">
                    <span className="material-symbols-outlined text-primary text-3xl">spa</span>
                </div>
                <h1 className="font-serif font-bold text-xl tracking-tight text-text-main">Gabriela Mari</h1>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mt-1">Estética Avançada</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentView === item.id
                            ? 'bg-primary/10 text-primary font-medium shadow-sm'
                            : 'text-text-muted hover:bg-gray-50 hover:text-text-main'
                            }`}
                    >
                        <span className={`material-symbols-outlined ${currentView === item.id ? 'filled' : ''}`} style={currentView === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            {item.icon}
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-6 border-t border-[#f3f2f1]">
                <div className="flex items-center gap-3">
                    {avatar ? (
                        <div
                            className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200"
                            style={{ backgroundImage: `url('${avatar}')` }}
                        ></div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200 bg-gray-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400">person</span>
                        </div>
                    )}

                    <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-sm font-bold text-text-main truncate w-full" title={name}>{name}</span>
                        <span className="text-xs text-text-muted">Portal do Paciente</span>
                    </div>
                    <button onClick={onLogout} className="ml-auto text-text-muted hover:text-red-500 transition-colors" title="Sair">
                        <span className="material-symbols-outlined text-xl">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default PatientSidebar;
