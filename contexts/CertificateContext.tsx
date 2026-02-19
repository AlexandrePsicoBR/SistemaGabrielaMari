import React, { createContext, useContext, useState, ReactNode } from 'react';
import forge from 'node-forge';
import { supabase } from '../lib/supabase';
import { unlockCertificate, signData as signDataUtil } from '../lib/certificate';

interface CertificateContextType {
    privateKey: forge.pki.PrivateKey | null;
    isLoading: boolean;
    error: string | null;
    unlock: (password: string) => Promise<boolean>;
    sign: (data: string) => string | null;
    isUnlocked: boolean;
    clearError: () => void;
}

const CertificateContext = createContext<CertificateContextType | undefined>(undefined);

export function CertificateProvider({ children }: { children: ReactNode }) {
    const [privateKey, setPrivateKey] = useState<forge.pki.PrivateKey | null>(null);
    const [pfxBuffer, setPfxBuffer] = useState<ArrayBuffer | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPfx = async () => {
        if (pfxBuffer) return pfxBuffer;

        // Check if user is authenticated (admin)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            // If no session, we can't fetch. Just return null.
            return null;
        }

        const { data, error } = await supabase.storage
            .from('secure-files')
            .download('Certificado Gabriela COREN.pfx');

        if (error) {
            console.error('Error fetching certificate:', error);
            setError('Erro ao baixar certificado.');
            return null;
        }

        const buffer = await data.arrayBuffer();
        setPfxBuffer(buffer);
        return buffer;
    };

    const unlock = async (password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            let buffer = pfxBuffer;
            if (!buffer) {
                buffer = await fetchPfx();
            }

            if (!buffer) {
                // throw new Error('Certificado não disponível.');
                setIsLoading(false);
                return false;
            }

            try {
                const key = unlockCertificate(buffer, password);
                setPrivateKey(key);
                setIsLoading(false);
                return true;
            } catch (pfxError) {
                console.error("PFX Unlock Error", pfxError);
                throw new Error("Senha incorreta ou arquivo corrompido.");
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao desbloquear certificado.');
            setIsLoading(false);
            return false;
        }
    };

    // Auto-unlock on mount
    React.useEffect(() => {
        const autoUnlock = async () => {
            await unlock('Enfgabi9');
        };
        autoUnlock();
    }, []);

    const sign = (data: string) => {
        if (!privateKey) {
            setError('Certificado não desbloqueado.');
            return null;
        }
        try {
            return signDataUtil(privateKey, data);
        } catch (err: any) {
            console.error('Signing Error:', err);
            alert(`Erro interno na assinatura: ${err.message || err}`);
            return null;
        }
    };

    const clearError = () => setError(null);

    return (
        <CertificateContext.Provider value={{
            privateKey,
            isLoading,
            error,
            unlock,
            sign,
            isUnlocked: !!privateKey,
            clearError
        }}>
            {children}
        </CertificateContext.Provider>
    );
}

export function useCertificate() {
    const context = useContext(CertificateContext);
    if (context === undefined) {
        throw new Error('useCertificate must be used within a CertificateProvider');
    }
    return context;
}
