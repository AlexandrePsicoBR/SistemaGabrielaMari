import forge from 'node-forge';
import { supabase } from './supabase';

export interface CertificateService {
    fetchAndUnlock(password: string): Promise<forge.pki.PrivateKey>;
    sign(privateKey: forge.pki.PrivateKey, data: string): string;
}

export async function fetchCertificateBlob(): Promise<ArrayBuffer> {
    const { data, error } = await supabase.storage
        .from('secure-files')
        .download('Certificado Gabriela COREN.pfx'); // Ensure filename matches upload

    if (error) {
        console.error('Error fetching certificate:', error);
        throw new Error('Erro ao baixar certificado. Verifique conexao e permissoes.');
    }

    return await data.arrayBuffer();
}

export function unlockCertificate(pfxBuffer: ArrayBuffer, password: string): forge.pki.PrivateKey {
    // Convert ArrayBuffer to binary string for node-forge
    let binaryString = '';
    const bytes = new Uint8Array(pfxBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }

    const pfxDer = forge.util.createBuffer(binaryString, 'raw');
    const p12Asn1 = forge.asn1.fromDer(pfxDer);

    try {
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

        // Find the private key
        // We look for pkcs8ShroudedKeyBag (encrypted) or keyBag (clear)
        const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];

        if (keyBag && keyBag.key) {
            return keyBag.key;
        }

        // Try normal keyBag
        const bags2 = p12.getBags({ bagType: forge.pki.oids.keyBag });
        const keyBag2 = bags2[forge.pki.oids.keyBag]?.[0];

        if (keyBag2 && keyBag2.key) {
            return keyBag2.key;
        }

        throw new Error('Chave privada não encontrada no certificado.');
    } catch (error: any) {
        console.error('Certificate unlock error:', error);
        if (error.message?.includes('password') || error.message?.includes('MAC')) {
            throw new Error('Senha do certificado incorreta.');
        }
        throw new Error('Falha ao processar certificado: ' + error.message);
    }
}

export function signData(privateKey: forge.pki.PrivateKey, data: string): string {
    const md = forge.md.sha256.create();
    md.update(data, 'utf8');
    const signature = privateKey.sign(md);
    // Return base64 encoded signature
    return forge.util.encode64(signature);
}
