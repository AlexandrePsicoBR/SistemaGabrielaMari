import React from 'react';
import { View, AdminData } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  onLogout: () => void;
  onClose?: () => void;
  className?: string;
}

import { supabase } from '../lib/supabase';
import { profileService } from '../lib/profile';
import AdminProfileModal from './AdminProfileModal';

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  onLogout,
  onClose,
  className = ""
}) => {
  const [showAdminModal, setShowAdminModal] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [adminData, setAdminData] = React.useState<AdminData>({
    name: 'Carregando...',
    email: '',
    phone: '',
    gender: '',
    registration: '',
    avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
  });

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadProfile(session.user.id);
      }
    });
  }, []);

  const loadProfile = async (id: string) => {
    const profile = await profileService.getProfile(id);
    if (profile) {
      setAdminData({
        name: profile.full_name || 'Admin',
        email: profile.email || '',
        phone: profile.phone || '',
        gender: profile.gender || 'Feminino',
        registration: profile.registration_number || '',
        avatar: profile.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
      });
    }
  };

  const menuItems: { id: View; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'blog', label: 'News & Promoções', icon: 'star' },
    { id: 'agenda', label: 'Agenda', icon: 'calendar_month' },
    { id: 'patients', label: 'Pacientes', icon: 'group' },
    { id: 'services', label: 'Serviços', icon: 'medical_services' },
    { id: 'financial', label: 'Financeiro', icon: 'payments' },
    { id: 'inventory', label: 'Estoque', icon: 'inventory_2' },
  ];

  const handleItemClick = (viewId: View) => {
    onChangeView(viewId);
    if (onClose) onClose();
  };

  const handleSaveAdmin = async (newData: AdminData) => {
    // Optimistic update
    setAdminData(newData);
    // Reload to ensure consistency if needed, but optimistic is fine for UI
    setShowAdminModal(false);
  };

  return (
    <aside className={`w-64 bg-white border-r border-[#f3f2f1] flex flex-col h-full shrink-0 ${className}`}>
      {/* ... Header remains same ... */}
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
              : 'text-text-muted hover:bg-background-light hover:text-text-main'
              }`}
          >
            <span className={`material-symbols-outlined ${currentView === item.id ? 'filled' : ''}`}>
              {item.icon}
            </span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-[#f3f2f1]">
        <div className="flex items-center gap-3">
          <div
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors group"
          >
            <div
              className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200"
              style={{ backgroundImage: `url("${adminData.avatar}")` }}
            ></div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{adminData.name}</span>
              <span className="text-xs text-text-muted">Admin</span>
            </div>
          </div>
          <button onClick={onLogout} className="ml-auto text-text-muted hover:text-red-500" title="Sair">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>

      {showAdminModal && (
        <AdminProfileModal
          onClose={() => setShowAdminModal(false)}
          onSave={handleSaveAdmin}
          initialData={adminData}
          userId={userId || ''}
        />
      )}
    </aside>
  );
};

export default Sidebar;