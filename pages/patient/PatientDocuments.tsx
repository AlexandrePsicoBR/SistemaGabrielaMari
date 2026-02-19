import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { profileService } from '../../lib/profile';
import { formatDate } from '../../lib/dateUtils';
import { SignatureModal } from '../../components';

// Document Components
import { default as TermoBotox } from '../../components/TermoBotox';
import { TermoBioestimulador } from '../../components/TermoBioestimulador';
import TermoFioPDO from '../../components/TermoFioPDO';
import CartaHialuronidase from '../../components/CartaHialuronidase';
import TermoHidrolipo from '../../components/TermoHidrolipo';
import TermoIntradermo from '../../components/TermoIntradermo';
import TermoLifting from '../../components/TermoLifting';
import TermoMicroagulhamento from '../../components/TermoMicroagulhamento';
import TermoPeeling from '../../components/TermoPeeling';
import TermoPreenchimento from '../../components/TermoPreenchimento';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PatientDocument {
    id: string;
    title: string;
    type: string;
    status: 'pending' | 'signed';
    created_at: string;
    signed_at?: string;
    signature_url?: string;
    content?: any;
}

const PatientDocuments: React.FC = () => {
    const [documents, setDocuments] = useState<PatientDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<PatientDocument | null>(null);
    const [viewingDoc, setViewingDoc] = useState<PatientDocument | null>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [patientProfile, setPatientProfile] = useState<any>(null);

    const fetchDocuments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const profile = await profileService.getPatientProfile(user.id, user.email);
            if (!profile) return;

            setPatientProfile(profile);

            const { data, error } = await supabase
                .from('patient_documents')
                .select('*')
                .eq('patient_id', profile.id)
                .order('created_at', { ascending: false });

            if (data) {
                setDocuments(data);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const getIconForType = (type: string) => {
        switch (type) {
            case 'anamnese': return 'medical_information';
            case 'contract': return 'description';
            case 'checkup': return 'health_and_safety';
            default: return 'article';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Pendente
                    </span>
                );
            case 'signed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        Assinado
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        {status}
                    </span>
                );
        }
    };

    const handleSignClick = (doc: PatientDocument) => {
        setSelectedDocument(doc);
        setShowSignatureModal(true);
    };

    const handleSignatureComplete = async () => {
        setShowSignatureModal(false);
        setSelectedDocument(null);
        await fetchDocuments();
        alert('Documento assinado com sucesso!');
    };

    const getSignedUrl = async (fullUrl: string) => {
        try {
            const bucketName = 'fotos-pacientes';
            let path = '';
            if (fullUrl.includes(`${bucketName}/`)) {
                path = fullUrl.split(`${bucketName}/`)[1];
            } else {
                return fullUrl;
            }

            const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(path, 3600);

            if (error) {
                console.error('Error creating signed URL:', error);
                return fullUrl;
            }

            return data.signedUrl;
        } catch (e) {
            console.error('Error in getSignedUrl:', e);
            return fullUrl;
        }
    };

    const handleViewDocument = async (doc: PatientDocument) => {
        if (doc.signature_url) {
            const url = await getSignedUrl(doc.signature_url);
            setSignedUrl(url);
        } else {
            setSignedUrl(null);
        }
        setViewingDoc(doc);
    };

    const handleDownloadPDF = async (doc: PatientDocument) => {
        // Since we are rendering React components, true PDF generation is complex client-side.
        // For now, we will suggest the user print to PDF from the view modal, 
        // or effectively implement a "Download" that opens the view and triggers print.

        // However, if the user specifically asked for "Download", and we have the view modal...
        // Let's open the view modal and provide a print button there. 
        // Or if we want to auto-print:
        handleViewDocument(doc);
    };

    const renderDocumentContent = (doc: PatientDocument) => {
        // Use the fetched patient profile or a fallback
        const patientData = patientProfile ? {
            nome: patientProfile.nome || patientProfile.name || "Paciente",
            dataNascimento: patientProfile.dataNascimento || patientProfile.date_of_birth || patientProfile.birth_date || "",
            telefone: patientProfile.telefone || patientProfile.phone || "",
            cpf: patientProfile.cpf || "",
            rg: patientProfile.rg || "",
            endereco: patientProfile.endereco || patientProfile.address || (patientProfile.street ? `${patientProfile.street}, ${patientProfile.city || ''}` : "") || "",
            alergias: patientProfile.alergias || []
        } : {
            nome: "Carregando...",
            dataNascimento: "",
            telefone: "",
            cpf: "",
            alergias: []
        };

        const renderSignature = () => (
            <div className="mt-8 border-t pt-4 break-inside-avoid">
                <p className="mb-2 font-bold">Assinado digitalmente em: {doc.signed_at ? new Date(doc.signed_at).toLocaleString('pt-BR') : 'Data desconhecida'}</p>
            </div>
        );

        // Wrap components to inject signature
        const WithSignature = ({ children }: { children: React.ReactNode }) => (
            <div className="print:w-full">
                {children}
            </div>
        );

        switch (doc.type) {
            case 'botox': return <WithSignature><TermoBotox paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            case 'bioestimulador': return <WithSignature><TermoBioestimulador paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            case 'fio-pdo': return <WithSignature><TermoFioPDO paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            case 'hialuronidase': return <WithSignature><CartaHialuronidase paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            case 'hidrolipo': return <WithSignature><TermoHidrolipo paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            case 'intradermo': return <WithSignature><TermoIntradermo paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            case 'lifting': return <WithSignature><TermoLifting paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            case 'microagulhamento': return <WithSignature><TermoMicroagulhamento paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            case 'peeling': return <WithSignature><TermoPeeling paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            case 'preenchimento': return <WithSignature><TermoPreenchimento paciente={patientData} signatureUrl={signedUrl} signatureDate={doc.signed_at} /></WithSignature>;
            default: return <div>Documento não suportado para visualização.</div>;
        }
    };

    return (
        <div className="h-full flex flex-col bg-background-light animate-fade-in relative">
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative pt-12 px-10 pb-8 flex justify-between items-end">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-text-main tracking-tight">
                        Meus Documentos
                    </h1>
                    <div className="h-1.5 w-24 bg-primary rounded-full" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Intro section */}
                    <div className="flex flex-col gap-2">
                        <p className="text-text-main/60 text-sm max-w-2xl leading-relaxed">
                            Aqui você encontra seus termos de consentimento, contratos e questionários de saúde.
                            Mantenha seus documentos em dia para facilitar seu atendimento na clínica.
                        </p>
                    </div>

                    {/* Documents Table Container */}
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-2xl border border-primary/5 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-primary/5 text-primary text-xs uppercase tracking-[0.1em] font-bold">
                                        <th className="px-8 py-5">Nome do Documento</th>
                                        <th className="px-8 py-5">Data de Emissão</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-primary/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-10 text-center text-text-muted">
                                                Carregando documentos...
                                            </td>
                                        </tr>
                                    ) : documents.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-10 text-center text-text-muted">
                                                Nenhum documento encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        documents.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-primary/2 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-primary/60 group-hover:text-primary transition-colors">
                                                            <span className="material-symbols-outlined">{getIconForType(doc.type)}</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-text-main">{doc.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-sm text-text-main/60">
                                                    {formatDate(new Date(doc.created_at))}
                                                </td>
                                                <td className="px-8 py-6">
                                                    {getStatusBadge(doc.status)}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {doc.status === 'pending' ? (
                                                        <div className="flex justify-end gap-2 items-center">
                                                            <button
                                                                onClick={() => handleViewDocument(doc)}
                                                                className="text-primary hover:text-primary/70 font-bold text-xs uppercase tracking-wider transition-colors px-3 py-2 mr-2"
                                                            >
                                                                Visualizar
                                                            </button>
                                                            <button
                                                                onClick={() => handleSignClick(doc)}
                                                                className="bg-primary text-white text-[11px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
                                                            >
                                                                Assinar Documento
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewDocument(doc)}
                                                                className="text-primary hover:text-primary/70 font-bold text-xs uppercase tracking-wider transition-colors"
                                                            >
                                                                Visualizar
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-4">
                        {loading ? (
                            <div className="p-8 text-center text-text-muted">Carregando documentos...</div>
                        ) : documents.length === 0 ? (
                            <div className="p-8 text-center text-text-muted">Nenhum documento encontrado.</div>
                        ) : (
                            documents.map((doc) => (
                                <div key={doc.id} className="bg-white p-5 rounded-xl border border-primary/10 shadow-sm flex flex-col gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-primary/60 flex-shrink-0">
                                            <span className="material-symbols-outlined">{getIconForType(doc.type)}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-text-main leading-tight">{doc.title}</h4>
                                            <p className="text-xs text-text-muted mt-1">{formatDate(new Date(doc.created_at))}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-b border-gray-50 py-3">
                                        <span className="text-xs font-bold uppercase text-text-muted">Status</span>
                                        {getStatusBadge(doc.status)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleViewDocument(doc)}
                                            className="py-2.5 rounded-lg border border-[#eceae8] text-primary text-sm font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                            Visualizar
                                        </button>
                                        {doc.status === 'pending' && (
                                            <button
                                                onClick={() => handleSignClick(doc)}
                                                className="bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit_document</span>
                                                Assinar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer Help Card */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6 text-center md:text-left">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                                <span className="material-symbols-outlined text-[32px]">support_agent</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main">Dúvidas sobre os documentos?</h3>
                                <p className="text-sm text-text-main/70 leading-relaxed">
                                    Nossa equipe está à disposição para esclarecer qualquer cláusula ou procedimento.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.open('https://wa.me/5512987029253?text=Ol%C3%A1%2C%20tenho%20d%C3%BAvidas%20sobre%20meus%20documentos.', '_blank')}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-[20px]">chat</span>
                            Falar no WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            {/* View Document Modal */}
            {viewingDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in print:bg-white print:p-0 print:absolute print:inset-0">
                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] overflow-hidden shadow-xl flex flex-col print:shadow-none print:w-full print:h-full print:rounded-none">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 print:hidden">
                            <div>
                                <h3 className="font-bold text-lg text-text-main">Visualizar Documento</h3>
                                <p className="text-xs text-text-muted">{viewingDoc.title}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">print</span>
                                    Imprimir / Salvar PDF
                                </button>
                                <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-gray-200 rounded-full text-text-muted transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>
                        <div id="document-content-area" className="flex-1 overflow-y-auto p-8 bg-white print:overflow-visible print:p-0">
                            {renderDocumentContent(viewingDoc)}
                        </div>
                    </div>
                </div>
            )}

            {showSignatureModal && selectedDocument && (
                <SignatureModal
                    document={selectedDocument}
                    onClose={() => setShowSignatureModal(false)}
                    onComplete={handleSignatureComplete}
                />
            )}
        </div>
    );
};

export default PatientDocuments;
