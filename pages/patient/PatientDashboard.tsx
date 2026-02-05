
import React, { useEffect, useState } from 'react';
import { formatDate } from '../../lib/dateUtils';
import { getSignedPhotoUrl } from '../../lib/imageUtils';
import { supabase } from '../../lib/supabase';

import { View } from '../../types';

interface PatientDashboardProps {
    onNavigate?: (view: View) => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
    const [patientName, setPatientName] = useState('Paciente');
    const [recentPosts, setRecentPosts] = useState<any[]>([]); // Changed from latestNews
    const [lastConsultation, setLastConsultation] = useState<any>(null);
    const [lastPhoto, setLastPhoto] = useState<any>(null);

    // Restored State for "Balloons"
    const [consultationCount, setConsultationCount] = useState(0);
    const [photoCount, setPhotoCount] = useState(0);
    const [lastConsultationDate, setLastConsultationDate] = useState('-');

    const [loading, setLoading] = useState(true);

    const [expiredProcedures, setExpiredProcedures] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. Get Patient Details
                const { data: patient } = await supabase
                    .from('patients')
                    .select('name, id')
                    .eq('id', user.id)
                    .single();

                if (patient) {
                    setPatientName(patient.name.split(' ')[0]);

                    // --- Fetch Service Metadata for Expiration ---
                    const { data: servicesData } = await supabase
                        .from('services')
                        .select('name, expiration_months')
                        .gt('expiration_months', 0);

                    const serviceMap = new Map();
                    if (servicesData) {
                        servicesData.forEach((s: any) => {
                            serviceMap.set(s.name.trim().toLowerCase(), s.expiration_months);
                        });
                    }
                    // ---------------------------------------------

                    // --- Restored Counts Logic ---
                    const { count: consults } = await supabase
                        .from('clinical_history')
                        .select('*', { count: 'exact', head: true })
                        .eq('patient_id', patient.id);
                    setConsultationCount(consults || 0);

                    const { count: photos } = await supabase
                        .from('patient_photos')
                        .select('*', { count: 'exact', head: true })
                        .eq('patient_id', patient.id);
                    setPhotoCount(photos || 0);
                    // -----------------------------

                    // 1. Latest News (Fetch 3)
                    const { data: news } = await supabase
                        .from('blog_posts')
                        .select('*')
                        .eq('status', 'Publicado')
                        .order('created_at', { ascending: false })
                        .limit(3);
                    setRecentPosts(news || []);

                    // 2. Last Consultation & Full History for Expiration
                    const { data: allHistory } = await supabase
                        .from('clinical_history')
                        .select('*')
                        .eq('patient_id', patient.id)
                        .order('date', { ascending: false });

                    if (allHistory && allHistory.length > 0) {
                        setLastConsultation(allHistory[0]);
                        const dateObj = new Date(allHistory[0].date);
                        setLastConsultationDate(formatDate(dateObj, { day: 'numeric', month: 'short' }).replace('.', ''));

                        // --- Calculate Expirations ---
                        const today = new Date();
                        const thirtyDays = new Date();
                        thirtyDays.setDate(today.getDate() + 30);
                        const todayStr = today.toISOString().split('T')[0];
                        const thirtyDaysStr = thirtyDays.toISOString().split('T')[0];

                        const expirations = allHistory.filter((h: any) => {
                            let expDateStr = h.expiration_date;

                            // Dynamic Calculation if missing
                            if (!expDateStr && h.title) {
                                const normalizedTitle = h.title.trim().toLowerCase();
                                if (serviceMap.has(normalizedTitle)) {
                                    const months = serviceMap.get(normalizedTitle);
                                    const d = new Date(h.date);
                                    d.setMonth(d.getMonth() + months);
                                    expDateStr = d.toISOString().split('T')[0];
                                }
                            }

                            if (!expDateStr) return false;

                            // Attach calculated date for rendering
                            h.expirationDate = expDateStr;

                            // Logic: Show if expired OR expiring in next 30 days
                            return expDateStr <= thirtyDaysStr;
                        }).sort((a: any, b: any) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

                        setExpiredProcedures(expirations);
                        // -----------------------------
                    }


                    // 3. Last Photo
                    const { data: photo } = await supabase
                        .from('patient_photos')
                        .select('*')
                        .eq('patient_id', patient.id)
                        .order('created_at', { ascending: false }) // OR date
                        .limit(1)
                        .single();

                    if (photo) {
                        const beforeUrl = await getSignedPhotoUrl(photo.before_url);
                        const afterUrl = await getSignedPhotoUrl(photo.after_url);
                        setLastPhoto({ ...photo, before_url: beforeUrl, after_url: afterUrl });
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);



    return (
        <div className="flex-1 overflow-y-auto h-full p-6 lg:p-12 animate-fade-in font-sans">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-light text-text-main leading-tight font-display">
                            Bem-vinda de volta, <span className="font-bold">{loading ? '...' : patientName}.</span>
                        </h2>
                        <p className="text-text-muted mt-2 text-lg">Aqui está o resumo do seu tratamento.</p>
                    </div>
                </header>

                {/* Restored Balloons Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-[#eceae8] shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between h-32">
                        <div className="flex items-center gap-3 text-text-muted mb-2">
                            <span className="material-symbols-outlined text-primary">calendar_today</span>
                            <span className="text-sm font-medium uppercase tracking-wider">Minhas Consultas</span>
                        </div>
                        <span className="text-4xl font-bold text-text-main font-display">{loading ? '-' : consultationCount}</span>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-[#eceae8] shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between h-32">
                        <div className="flex items-center gap-3 text-text-muted mb-2">
                            <span className="material-symbols-outlined text-primary">photo_camera</span>
                            <span className="text-sm font-medium uppercase tracking-wider">Fotos 'antes e depois'</span>
                        </div>
                        <span className="text-4xl font-bold text-text-main font-display">{loading ? '-' : photoCount}</span>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-[#eceae8] shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between h-32">
                        <div className="flex items-center gap-3 text-text-muted mb-2">
                            <span className="material-symbols-outlined text-primary">event_available</span>
                            <span className="text-sm font-medium uppercase tracking-wider">Última Consulta</span>
                        </div>
                        <span className="text-4xl font-bold text-text-main font-display">{loading ? '-' : lastConsultationDate}</span>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - The 3 Requested Blocks */}
                    <div className="lg:col-span-2 flex flex-col gap-8">

                        {/* 1. News & Promotions (Priority 1) */}
                        <div className="bg-white rounded-2xl border border-[#eceae8] shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                            {recentPosts.length > 0 ? (
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-1/3 overflow-hidden">
                                        <img
                                            alt={recentPosts[0].title}
                                            className="w-full h-48 md:h-full object-cover hover:scale-105 transition-transform duration-500"
                                            src={recentPosts[0].image_url || "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                                        />
                                    </div>
                                    <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col justify-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Destaque</span>
                                            <span className="text-text-muted text-xs font-semibold">News e Promoções</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-text-main leading-tight font-display">{recentPosts[0].title}</h3>
                                        <p className="text-text-muted text-sm line-clamp-3">
                                            {recentPosts[0].content}
                                        </p>
                                        <div className="mt-2">
                                            <button
                                                onClick={() => onNavigate?.('patient-news')}
                                                className="text-primary text-sm font-bold hover:underline transition-all"
                                            >
                                                Ler mais
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 flex flex-col items-center justify-center min-h-[200px]">
                                    <span className="material-symbols-outlined text-gray-300 text-4xl mb-3">newspaper</span>
                                    <h3 className="text-lg font-medium text-gray-500">Nenhuma novidade recente</h3>
                                    <p className="text-gray-400 text-sm">Fique atenta às próximas promoções!</p>
                                </div>
                            )}
                        </div>

                        {/* 2. Last Consultation (Priority 2) */}
                        <div className="bg-white rounded-2xl border border-[#eceae8] shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100">Realizada</span>
                                    <span className="text-text-muted text-xs font-semibold">Última Consulta</span>
                                </div>

                                {lastConsultation ? (
                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-text-main mb-2 font-display">{lastConsultation.title}</h3>
                                            <div className="flex items-center gap-2 text-text-muted text-sm mb-4">
                                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                                {formatDate(lastConsultation.date)}
                                            </div>
                                            <p className="text-text-muted text-sm bg-[#FDFBF9] p-4 rounded-lg border border-[#f0ebe6] italic">
                                                "{lastConsultation.patient_summary || lastConsultation.description || 'Sem observações.'}"
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                                            </div>
                                            <span className="text-sm font-bold text-text-main">Procedimento<br />Concluído</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-text-muted">Nenhuma consulta registrada.</p>
                                        <button onClick={() => window.open('https://wa.me/5512987029253', '_blank')} className="mt-4 text-primary font-bold text-sm hover:underline">
                                            Agendar agora
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* NEW POSITION: Expiration Block (After Last Consultation) */}
                        <div className="bg-white rounded-2xl border border-[#eceae8] shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                            <div className="p-6 border-b border-[#eceae8] flex justify-between items-center bg-orange-50">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-orange-600">alarm_on</span>
                                    <h3 className="font-bold text-gray-900 text-lg">Vencimento de Procedimentos</h3>
                                </div>
                                <span className="px-2 py-1 bg-white rounded text-xs font-bold text-orange-600 border border-orange-200">Próximos 30 dias</span>
                            </div>
                            <div className="divide-y divide-[#eceae8]">
                                {expiredProcedures.length > 0 ? (
                                    expiredProcedures.map((proc, idx) => {
                                        const expDate = new Date(proc.expirationDate);
                                        const today = new Date();
                                        const isExpired = proc.expirationDate < new Date().toISOString().split('T')[0];

                                        return (
                                            <div key={idx} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-background-light transition-colors gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${isExpired ? 'bg-red-500' : 'bg-orange-500'}`}>
                                                        <span className="material-symbols-outlined">history_toggle_off</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-main">{proc.title}</p>
                                                        <p className={`text-xs mt-0.5 font-bold ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                                                            {isExpired ? 'Vencido em: ' : 'Vence em: '} {formatDate(expDate)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="w-full md:w-auto text-right">
                                                    <button
                                                        onClick={() => {
                                                            const message = `Olá, gostaria de agendar o retorno do procedimento ${proc.title} que ${isExpired ? 'venceu' : 'vence'} em ${formatDate(expDate)}.`;
                                                            window.open(`https://wa.me/5512987029253?text=${encodeURIComponent(message)}`, '_blank');
                                                        }}
                                                        className="w-full md:w-auto text-primary text-sm font-bold border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">calendar_add_on</span> Reagendar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center text-text-muted">
                                        <p>Nenhum procedimento próximo do vencimento.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Latest Before/After (Priority 3) */}
                        <div className="bg-white rounded-2xl border border-[#eceae8] shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100">Evolução</span>
                                    <span className="text-text-muted text-xs font-semibold">Último Registro</span>
                                </div>

                                {lastPhoto ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider pl-1">Antes</span>
                                            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 border border-gray-200 relative group">
                                                {lastPhoto.before_url ? (
                                                    <img src={lastPhoto.before_url} alt="Antes" className="w-full h-full object-contain" />
                                                ) : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem foto</div>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider pl-1">Depois</span>
                                            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 border border-gray-200 relative group">
                                                {lastPhoto.after_url ? (
                                                    <img src={lastPhoto.after_url} alt="Depois" className="w-full h-full object-contain" />
                                                ) : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem foto</div>}
                                            </div>
                                        </div>
                                        <div className="col-span-2 mt-2 text-center">
                                            <h4 className="font-bold text-text-main">{lastPhoto.title}</h4>
                                            {lastPhoto.date && <p className="text-xs text-text-muted">{formatDate(lastPhoto.date)}</p>}
                                            <button
                                                onClick={() => onNavigate?.('patient-history')}
                                                className="mt-2 text-primary text-sm font-bold hover:underline"
                                            >
                                                Ver galeria completa
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-gray-300 text-3xl">photo_library</span>
                                        </div>
                                        <h3 className="font-medium text-text-main">Sua evolução será registrada aqui</h3>
                                        <p className="text-sm text-text-muted max-w-xs">
                                            Assim que iniciarmos seu tratamento, você poderá acompanhar seus resultados através de fotos comparativas.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar - Quick Access */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white border border-[#eceae8] rounded-xl p-6 shadow-sm h-full flex flex-col sticky top-6">
                            <h3 className="font-bold text-lg mb-4 text-text-main font-display">Acesso Rápido</h3>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => onNavigate?.('patient-appointments')}
                                    className="flex items-center justify-between p-4 rounded-lg border border-[#eceae8] hover:border-primary/50 hover:bg-[#FDFBF9] transition-all group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">timeline</span>
                                        <span className="text-sm font-medium text-text-main">Evolução da Sua Beleza</span>
                                    </div>
                                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-[20px]">chevron_right</span>
                                </button>
                                <button
                                    onClick={() => onNavigate?.('patient-history')}
                                    className="flex items-center justify-between p-4 rounded-lg border border-[#eceae8] hover:border-primary/50 hover:bg-[#FDFBF9] transition-all group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">photo_camera</span>
                                        <span className="text-sm font-medium text-text-main">Fotos Antes | Depois</span>
                                    </div>
                                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-[20px]">chevron_right</span>
                                </button>
                                <button
                                    onClick={() => window.open('https://wa.me/5512987029253', '_blank')}
                                    className="flex items-center justify-between p-4 rounded-lg border border-[#eceae8] hover:border-primary/50 hover:bg-[#FDFBF9] transition-all group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">chat</span>
                                        <span className="text-sm font-medium text-text-main">Fale com a Gabriela</span>
                                    </div>
                                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        {/* Sidebar - Recent Posts Block */}
                        <div className="bg-white border border-[#eceae8] rounded-xl p-6 shadow-sm flex flex-col">
                            <div className="mb-6">
                                <h3 className="font-bold text-gray-900 text-lg font-display">Últimas Postagens</h3>
                                <div className="h-1 w-12 bg-primary rounded-full mt-1"></div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {recentPosts.length > 0 ? (
                                    recentPosts.map((post, idx) => (
                                        <div key={idx} className="flex gap-4 group cursor-pointer" onClick={() => onNavigate?.('patient-news')}>
                                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                                <img
                                                    src={post.image_url || "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="flex flex-col justify-between py-1">
                                                <h4 className="font-bold text-sm text-text-main leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                                    {post.title}
                                                </h4>
                                                <span className="text-xs text-text-muted">{formatDate(post.created_at)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-text-muted text-sm py-4">Nenhuma postagem recente.</p>
                                )}

                                <button
                                    onClick={() => onNavigate?.('patient-news')}
                                    className="mt-2 w-full text-primary font-bold text-sm hover:underline flex items-center justify-center gap-1"
                                >
                                    Ver todas as novidades
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
