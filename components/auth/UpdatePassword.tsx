import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface UpdatePasswordProps {
    onSuccess: () => void;
}

const UpdatePassword: React.FC<UpdatePasswordProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            alert('Senha atualizada com sucesso!');
            onSuccess();
        } catch (err: any) {
            console.error('Error updating password:', err);
            setError(err.message || 'Erro ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#FDFBF9] p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fade-in border border-[#e3e0de]">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 p-3 rounded-xl inline-flex mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
                    </div>
                    <h1 className="font-serif text-2xl font-bold text-text-main">Redefinir Senha</h1>
                    <p className="text-text-muted mt-2 text-sm">Digite sua nova senha abaixo.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Nova Senha</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-[#e3e0de] focus:ring-primary/50 focus:border-primary focus:outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Confirmar Senha</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock_clock</span>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-[#e3e0de] focus:ring-primary/50 focus:border-primary focus:outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:translate-y-[-1px] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            'Atualizar Senha'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;
