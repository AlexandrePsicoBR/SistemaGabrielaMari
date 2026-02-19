
import React, { useState, useEffect } from 'react';
import { formatDate } from '../../lib/dateUtils';
import { supabase } from '../../lib/supabase';
import { profileService } from '../../lib/profile';

interface HistoryEvent {
    id: string;
    title: string;
    date: string;
    doctor: string;
    status: string;
    description: string;
    patient_summary?: string;
    clinical_notes?: string;
    type?: string;
}

const PatientAppointments: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<HistoryEvent[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<HistoryEvent | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const profile = await profileService.getPatientProfile(user.id, user.email);
                if (!profile) return;

                const { data, error } = await supabase
                    .from('clinical_history')
                    .select('*')
                    .eq('patient_id', profile.id)
                    .order('date', { ascending: false });

                if (error) throw error;

                setAppointments(data || []);
            } catch (error) {
                console.error('Error fetching appointments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const handleShowSummary = (appointment: HistoryEvent) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedAppointment(null);
    };

    const lastAppointment = appointments.length > 0 ? appointments[0] : null;

    if (loading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto h-full p-6 lg:p-12 animate-fade-in font-sans relative">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
                {/* Page Header */}
                <header className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-4xl font-black text-text-main tracking-tight font-display mb-2">Minhas Consultas</h2>
                        <p className="text-text-muted text-sm">Gerencie seus procedimentos e visualize seu histórico clínico.</p>
                    </div>
                    <a
                        href="https://wa.me/5521999887766?text=Oi%20Gabi,%20quero%20marcar%20com%20você!"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span className="text-sm font-bold">Nova Consulta</span>
                    </a>
                </header>

                {/* Last Appointment Section */}
                <section>
                    <h3 className="text-lg font-bold text-text-main mb-5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        Última Consulta
                    </h3>

                    {lastAppointment ? (
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-primary/5 border border-[#eceae8] flex flex-col md:flex-row">
                            <div className="md:w-1/3 relative min-h-[200px]">
                                <div className="h-full w-full bg-center bg-no-repeat bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')" }}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-6 md:hidden">
                                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded">Realizado</span>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="text-primary text-xs font-bold uppercase tracking-widest block mb-2">{lastAppointment.type || 'Procedimento'}</span>
                                        <h4 className="text-2xl font-bold text-text-main font-display">{lastAppointment.title}</h4>
                                    </div>
                                    <div className="hidden md:block">
                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-primary/20">Realizado</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#FDFBF9] flex items-center justify-center text-primary border border-[#eceae8]">
                                            <span className="material-symbols-outlined text-xl">event</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-text-muted font-bold tracking-tighter leading-none mb-1">Data</p>
                                            <p className="font-bold text-text-main">{formatDate(new Date(lastAppointment.date))}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#FDFBF9] flex items-center justify-center text-primary border border-[#eceae8]">
                                            <span className="material-symbols-outlined text-xl">medication</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-text-muted font-bold tracking-tighter leading-none mb-1">Profissional</p>
                                            <p className="font-bold text-text-main">{lastAppointment.doctor || 'Dra. Gabriela Mari'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-[#eceae8] flex flex-wrap gap-4">
                                    <button
                                        onClick={() => handleShowSummary(lastAppointment)}
                                        className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all uppercase tracking-wider"
                                    >
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-10 text-center border border-[#eceae8] shadow-sm">
                            <span className="material-symbols-outlined text-4xl text-text-muted mb-4">event_busy</span>
                            <h3 className="text-xl font-bold text-text-main mb-2">Nenhuma consulta realizada</h3>
                            <p className="text-text-muted">Você ainda não possui histórico de consultas.</p>
                        </div>
                    )}
                </section>

                {/* History Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-[#eceae8] overflow-hidden">
                    <div className="p-6 border-b border-[#eceae8] flex justify-between items-center bg-[#FDFBF9]">
                        <h3 className="text-lg font-bold text-text-main font-display">Histórico de Visitas</h3>
                        <div className="flex items-center gap-2 text-text-muted text-xs cursor-pointer hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">filter_list</span>
                            Filtrar por ano
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#fcfbf9] border-b border-[#eceae8]">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Procedimento</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Profissional</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eceae8]">
                                {appointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-bold text-text-main">{formatDate(new Date(apt.date))}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-medium text-text-main">{apt.title}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-cover bg-center border border-gray-200" style={{ backgroundImage: "url('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png')" }}></div>
                                                <p className="text-sm text-text-muted">{apt.doctor || 'Dra. Gabriela Mari'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 uppercase border border-green-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Realizado
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => handleShowSummary(apt)}
                                                className="text-primary hover:text-primary-dark text-xs font-bold uppercase tracking-tight transition-colors opacity-60 group-hover:opacity-100"
                                            >
                                                Ver Resumo
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-4 p-4 bg-gray-50/50">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="bg-white p-5 rounded-xl border border-[#eceae8] shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">{formatDate(new Date(apt.date))}</span>
                                        <h4 className="font-bold text-lg text-text-main leading-tight">{apt.title}</h4>
                                    </div>
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 border border-green-100">
                                        <span className="material-symbols-outlined text-lg">check</span>
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 py-3 border-t border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 bg-cover bg-center border border-gray-200" style={{ backgroundImage: "url('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png')" }}></div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-text-muted">Profissional</p>
                                        <p className="text-sm font-medium text-text-main">{apt.doctor || 'Dra. Gabriela Mari'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleShowSummary(apt)}
                                    className="w-full py-2.5 rounded-lg border border-[#eceae8] text-primary text-sm font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                    Ver Resumo
                                </button>
                            </div>
                        ))}
                    </div>

                    {appointments.length === 0 && (
                        <div className="p-8 text-center text-text-muted text-sm">
                            Nenhuma consulta encontrada.
                        </div>
                    )}
                </section>
            </div>

            {/* Modal de Resumo */}
            {showModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
                        <div className="bg-[#FDFBF9] p-6 border-b border-[#eceae8] flex justify-between items-center">
                            <h3 className="text-xl font-bold text-text-main font-display">Resumo da Consulta</h3>
                            <button onClick={closeModal} className="text-text-muted hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <span className="text-primary text-xs font-bold uppercase tracking-widest block mb-2">Procedimento</span>
                                <h4 className="text-2xl font-bold text-text-main mb-1">{selectedAppointment.title}</h4>
                                <p className="text-sm text-text-muted">{formatDate(new Date(selectedAppointment.date), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-[#fcfbf9] p-4 rounded-lg border border-[#eceae8]">
                                    <h5 className="font-bold text-text-main text-sm mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">medical_services</span>
                                        Profissional
                                    </h5>
                                    <p className="text-text-muted text-sm">{selectedAppointment.doctor || 'Dra. Gabriela Mari'}</p>
                                </div>

                                <div className="bg-[#fcfbf9] p-4 rounded-lg border border-[#eceae8]">
                                    <h5 className="font-bold text-text-main text-sm mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">notes</span>
                                        Resumo do Atendimento
                                    </h5>
                                    <p className="text-text-muted text-sm leading-relaxed">
                                        {selectedAppointment.patient_summary || selectedAppointment.description || "Nenhum resumo disponível para este atendimento."}
                                    </p>
                                </div>

                                {/* NOTA: Evolução Técnica (clinical_notes) omitida intencionalmente para o paciente */}
                            </div>
                        </div>
                        <div className="p-4 border-t border-[#eceae8] flex justify-end">
                            <button
                                onClick={closeModal}
                                className="bg-[#f2f0ee] hover:bg-[#e6e4e2] text-text-main font-bold py-2.5 px-6 rounded-lg text-sm transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientAppointments;
