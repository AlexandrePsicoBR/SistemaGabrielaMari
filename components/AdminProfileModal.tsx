import React, { useState, useRef, useEffect } from 'react';

import { profileService } from '../lib/profile';
import { AdminData } from '../types';

interface AdminProfileModalProps {
    onClose: () => void;
    onSave?: (data: AdminData) => void;
    initialData?: AdminData;
    userId: string;
}



const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ onClose, onSave, initialData, userId }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<AdminData>({
        name: '',
        email: '',
        phone: '',
        gender: 'Feminino',
        registration: '',
        avatar: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            // Default Mock Data for Dra. Gabriela if none provided
            setFormData({
                name: 'Dra. Gabriela Mari',
                email: 'gabriela.mari@clinic.com',
                phone: '+55 11 99999-9999',
                gender: 'Feminino',
                registration: 'CRM/SP 123456',
                avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setLoading(true);
                const publicUrl = await profileService.uploadAvatar(file);
                setFormData(prev => ({ ...prev, avatar: publicUrl }));
            } catch (error) {
                console.error("Error uploading avatar", error);
                alert("Erro ao enviar foto. Tente novamente.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSave = async () => {
        if (!userId) {
            alert("ID de usuário não encontrado. Faça login novamente.");
            return;
        }

        try {
            setLoading(true);
            await profileService.updateProfile(userId, formData);
            if (onSave) {
                onSave(formData);
            }
            onClose();
        } catch (error: any) {
            console.error("Error saving profile", error);
            alert(`Erro ao salvar perfil: ${error.message || error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-fade-in">

                <div className="px-6 py-4 border-b border-[#e3e0de] flex justify-between items-center bg-white">
                    <h2 className="text-xl font-serif font-bold text-text-main">
                        Editar Perfil Admin
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-4 bg-[#FDFBF9] max-h-[70vh] overflow-y-auto">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-6">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <div
                            onClick={handlePhotoClick}
                            className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative group mb-2"
                        >
                            {formData.avatar ? (
                                <>
                                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white">edit</span>
                                    </div>
                                </>
                            ) : (
                                <span className="material-symbols-outlined text-gray-400 text-3xl">add_a_photo</span>
                            )}
                        </div>
                        <p className="text-sm font-medium text-primary cursor-pointer hover:underline" onClick={handlePhotoClick}>Alterar foto de perfil</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Nome Completo</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            type="text"
                            className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Telefone / WhatsApp</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                type="tel"
                                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Sexo</label>
                            <div className="relative">
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm text-gray-900 bg-white"
                                >
                                    <option value="Feminino">Feminino</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Outro">Outro</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Registro de Classe</label>
                        <input
                            name="registration"
                            value={formData.registration}
                            onChange={handleChange}
                            type="text"
                            placeholder="Ex: CRM/SP 123456"
                            className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Email</label>
                        <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            type="email"
                            className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                </div>

                <div className="px-6 py-4 border-t border-[#e3e0de] bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted hover:bg-gray-50 font-medium text-sm transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm shadow-md shadow-primary/20 flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminProfileModal;
