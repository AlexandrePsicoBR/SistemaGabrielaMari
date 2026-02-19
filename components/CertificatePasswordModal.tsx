import React, { useState, useEffect } from 'react';
import { useCertificate } from '../contexts/CertificateContext';

interface CertificatePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CertificatePasswordModal({ isOpen, onClose, onSuccess }: CertificatePasswordModalProps) {
    const [password, setPassword] = useState('');
    const { unlock, isLoading, error, clearError } = useCertificate();

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setPassword('');
            clearError();
        }
    }, [isOpen, clearError]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await unlock(password);
        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zs-50" style={{ zIndex: 1000 }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4">Assinatura Digital</h2>
                <p className="mb-4 text-gray-600">
                    Para assinar digitalmente, informe a senha do certificado.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha do Certificado
                        </label>
                        <input
                            type="password"
                            className="w-full border rounded p-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite a senha..."
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={isLoading || !password}
                        >
                            {isLoading ? 'Desbloqueando...' : 'Desbloquear & Assinar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
