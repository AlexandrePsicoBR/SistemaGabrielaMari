import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { profileService } from '../../lib/profile';

const PatientProfile: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        birthdate: '',
        cpf: '',
        phone: '',
        email: '', // Read-only mostly, but used for re-auth
        address_zip: '',
        address_street: '',
        address_city: '',
        address_state: '',
        pref_whatsapp: true,
        pref_email: true,
        avatar_url: ''
    });

    // Password Update State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    const profile = await profileService.getPatientProfile(user.id, user.email);
                    if (profile) {
                        setFormData({
                            full_name: profile.name || '',
                            birthdate: profile.birth_date || '',
                            cpf: profile.cpf || '',
                            phone: profile.phone || '',
                            email: profile.email || user.email || '',
                            address_zip: profile.zip_code || '',
                            address_street: profile.street || '',
                            address_city: profile.city || '',
                            address_state: profile.state || '',
                            pref_whatsapp: profile.marketing_pref_whatsapp ?? true,
                            pref_email: profile.marketing_pref_email ?? true,
                            avatar_url: profile.avatar_url || ''
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (userId) {
                await profileService.updatePatientProfile(userId, formData);
                alert('Perfil atualizado com sucesso!');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Erro ao atualizar perfil.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            const file = e.target.files[0];
            const publicUrl = await profileService.uploadAvatar(file);

            setFormData(prev => ({
                ...prev,
                avatar_url: publicUrl
            }));

            if (userId) {
                await profileService.updatePatientProfile(userId, { ...formData, avatar_url: publicUrl });
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Erro ao fazer upload da foto.');
        }
    };

    // Password Handlers
    const handlePasswordChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('A nova senha e a confirmação não conferem.');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            alert('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setPasswordLoading(true);

        try {
            // 1. Verify old password by attempting a sign-in (re-authentication)
            // Note: This relies on the user's email being correct in formData/auth.
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: passwordForm.oldPassword
            });

            if (signInError) {
                alert('A senha antiga está incorreta.');
                setPasswordLoading(false);
                return;
            }

            // 2. Update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            });

            if (updateError) {
                alert('Erro ao atualizar senha: ' + updateError.message);
            } else {
                alert('Senha alterada com sucesso!');
                setShowPasswordModal(false);
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }

        } catch (error) {
            console.error('Error updating password:', error);
            alert('Ocorreu um erro inesperado.');
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto h-full p-6 lg:p-12 animate-fade-in font-sans">
            <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8">
                <header className="mb-10">
                    <h1 className="text-4xl font-display font-bold text-text-main tracking-tight leading-tight">Meu Perfil</h1>
                    <p className="text-text-muted mt-2 text-lg font-light">Gerencie suas informações e preferências</p>
                </header>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
                    <div className="relative group cursor-pointer overflow-hidden rounded-full">
                        <div
                            className="h-28 w-28 bg-cover bg-center border-4 border-white shadow-md"
                            style={{ backgroundImage: `url('${formData.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}')` }}
                        ></div>
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white">photo_camera</span>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <div className="text-center sm:text-left pt-2">
                        <h2 className="text-2xl font-display font-bold text-text-main">{formData.full_name || 'Paciente'}</h2>
                        <p className="text-text-muted text-sm mb-2">Paciente</p>
                        <div className="relative">
                            <button className="text-sm font-medium text-primary hover:text-primary-dark hover:underline transition-colors">Alterar foto de perfil</button>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[#eceae8] overflow-hidden">
                    <form className="p-8" onSubmit={handleSubmit}>
                        {/* ... Existing Personal Data Forms ... */}
                        <div className="mb-10">
                            <h3 className="text-lg font-display font-bold text-text-main mb-6 border-b border-[#eceae8] pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">badge</span>
                                Dados Pessoais
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="full_name">Nome Completo</label>
                                    <input
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] text-text-main shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all text-sm py-2.5 px-3 outline-none"
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="birthdate">Data de Nascimento</label>
                                    <input
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] text-text-main shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all text-sm py-2.5 px-3 outline-none"
                                        id="birthdate"
                                        name="birthdate"
                                        type="date"
                                        value={formData.birthdate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="cpf">CPF</label>
                                    <input
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] text-text-main shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all text-sm py-2.5 px-3 outline-none"
                                        id="cpf"
                                        name="cpf"
                                        type="text"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-lg font-display font-bold text-text-main mb-6 border-b border-[#eceae8] pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">contact_phone</span>
                                Contato
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="phone">WhatsApp / Celular</label>
                                    <input
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] text-text-main shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all text-sm py-2.5 px-3 outline-none"
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="email">E-mail</label>
                                    <input
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] text-text-main shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all text-sm py-2.5 px-3 outline-none"
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-lg font-display font-bold text-text-main mb-6 border-b border-[#eceae8] pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                                Endereço
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="address_zip">CEP</label>
                                    <input
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] text-text-main shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all text-sm py-2.5 px-3 outline-none"
                                        id="address_zip"
                                        name="address_zip"
                                        type="text"
                                        value={formData.address_zip}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="address_street">Rua</label>
                                    <input
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] text-text-main shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all text-sm py-2.5 px-3 outline-none"
                                        id="address_street"
                                        name="address_street"
                                        type="text"
                                        value={formData.address_street}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="address_city">Cidade</label>
                                    <input
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] text-text-main shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all text-sm py-2.5 px-3 outline-none"
                                        id="address_city"
                                        name="address_city"
                                        type="text"
                                        value={formData.address_city}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-text-muted mb-1.5" htmlFor="address_state">Estado</label>
                                    <input
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] text-text-main shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all text-sm py-2.5 px-3 outline-none"
                                        id="address_state"
                                        name="address_state"
                                        type="text"
                                        value={formData.address_state}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-lg font-display font-bold text-text-main mb-6 border-b border-[#eceae8] pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">notifications</span>
                                Preferências de Contato
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-[#fcf9f6] border border-primary/10">
                                    <div>
                                        <h4 className="text-sm font-medium text-text-main">Lembretes por WhatsApp</h4>
                                        <p className="text-xs text-text-muted mt-0.5">Receber confirmações de agendamento e lembretes 24h antes.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            name="pref_whatsapp"
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.pref_whatsapp}
                                            onChange={handleChange}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-[#fcf9f6] border border-primary/10">
                                    <div>
                                        <h4 className="text-sm font-medium text-text-main">Novidades por E-mail</h4>
                                        <p className="text-xs text-text-muted mt-0.5">Receber informações sobre novos tratamentos e promoções exclusivas.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            name="pref_email"
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.pref_email}
                                            onChange={handleChange}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-lg font-display font-bold text-text-main mb-6 border-b border-[#eceae8] pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">lock</span>
                                Segurança
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-text-main">Senha de Acesso</h4>
                                    <p className="text-xs text-text-muted mt-1">Recomendamos alterar sua senha a cada 6 meses.</p>
                                </div>
                                <button
                                    className="px-4 py-2 text-sm font-medium text-text-main bg-white border border-[#e5e0dc] rounded hover:bg-gray-50 transition-colors"
                                    type="button"
                                    onClick={() => setShowPasswordModal(true)}
                                >
                                    Alterar Senha
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end pt-8 border-t border-[#e5e0dc]">
                            <button className="px-6 py-2.5 rounded-md text-sm font-medium text-text-muted hover:text-text-main hover:bg-gray-50 transition-colors" type="button">
                                Cancelar
                            </button>
                            <button
                                className="px-6 py-2.5 rounded-md bg-primary hover:bg-primary-dark text-white text-sm font-medium shadow-md shadow-primary/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>

                <footer className="mt-12 text-center text-xs text-text-muted opacity-60">
                    <p>© 2024 Gabriela Mari Clínica de Estética. Todos os direitos reservados.</p>
                </footer>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-[#eceae8] flex justify-between items-center bg-[#FDFBF9]">
                            <h3 className="text-xl font-bold text-text-main">Alterar Senha</h3>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="text-text-muted hover:text-text-main transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handlePasswordUpdate}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">Senha Atual</label>
                                    <input
                                        type="password"
                                        name="oldPassword"
                                        value={passwordForm.oldPassword}
                                        onChange={handlePasswordChangeInput}
                                        required
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] shadow-sm focus:border-primary focus:ring focus:ring-primary/20 px-3 py-2 outline-none"
                                    />
                                    <p className="text-xs text-text-muted mt-1">Para sua segurança, confirme sua senha atual.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">Nova Senha</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChangeInput}
                                        required
                                        minLength={6}
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] shadow-sm focus:border-primary focus:ring focus:ring-primary/20 px-3 py-2 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChangeInput}
                                        required
                                        minLength={6}
                                        className="w-full rounded-md border border-[#e5e0dc] bg-[#fcfbf9] shadow-sm focus:border-primary focus:ring focus:ring-primary/20 px-3 py-2 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-[#eceae8] bg-[#fcfbf9] flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-70"
                                >
                                    {passwordLoading ? 'Atualizando...' : 'Confirmar Alteração'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientProfile;
