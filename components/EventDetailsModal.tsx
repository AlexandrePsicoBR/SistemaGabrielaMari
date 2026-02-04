import React, { useState } from 'react';
import { formatDate, formatTime } from '../lib/dateUtils';
import { scheduleService } from '../lib/schedule';

interface EventDetailsModalProps {
    event: {
        id: string; // Google Event ID
        title: string;
        patient: string;
        start: Date;
        end: Date;
        description?: string;
    };
    onClose: () => void;
    onDeleted: () => void;
    onUpdated: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, onDeleted, onUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);

    // Reschedule State
    const [newDate, setNewDate] = useState(event.start.toISOString().split('T')[0]);
    const [newStartTime, setNewStartTime] = useState(formatTime(event.start, { hour: '2-digit', minute: '2-digit' }));
    const [newEndTime, setNewEndTime] = useState(formatTime(event.end, { hour: '2-digit', minute: '2-digit' }));

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

        setLoading(true);
        try {
            await scheduleService.deleteEvent(event.id);
            alert('Agendamento excluído com sucesso.');
            onDeleted();
            onClose();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReschedule = async () => {
        setLoading(true);
        try {
            const startDateTime = new Date(`${newDate}T${newStartTime}`);
            const endDateTime = new Date(`${newDate}T${newEndTime}`);

            if (startDateTime >= endDateTime) {
                alert('O horário de término deve ser após o início.');
                setLoading(false);
                return;
            }

            await scheduleService.updateEvent(event.id, startDateTime, endDateTime);
            alert('Agendamento reagendado com sucesso.');
            onUpdated();
            onClose();
        } catch (error: any) {
            alert('Erro ao reagendar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

                {/* Header */}
                <div className="px-6 py-4 border-b border-[#e3e0de] flex justify-between items-center bg-white">
                    <h2 className="text-xl font-serif font-bold text-text-main line-clamp-1" title={event.title}>
                        {isRescheduling ? 'Reagendar' : 'Detalhes do Agendamento'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 bg-[#FDFBF9]">
                    {!isRescheduling ? (
                        <>
                            <div>
                                <h3 className="text-lg font-bold text-text-main">{event.title}</h3>
                                <p className="text-text-muted text-sm mt-1">{event.patient}</p>
                            </div>

                            <div className="flex items-center gap-2 text-gray-700 bg-white p-3 rounded-lg border border-[#e3e0de]">
                                <span className="material-symbols-outlined text-primary">event</span>
                                <span className="font-medium">
                                    {formatDate(event.start, { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-700 bg-white p-3 rounded-lg border border-[#e3e0de]">
                                <span className="material-symbols-outlined text-primary">schedule</span>
                                <span className="font-medium">
                                    {formatTime(event.start, { hour: '2-digit', minute: '2-digit' })} - {formatTime(event.end, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors flex justify-center items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Excluir
                                </button>
                                <button
                                    onClick={() => setIsRescheduling(true)}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark font-medium transition-colors flex justify-center items-center gap-2 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">edit_calendar</span>
                                    Reagendar
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Nova Data</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary outline-none text-sm text-gray-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Início</label>
                                    <input
                                        type="time"
                                        value={newStartTime}
                                        onChange={(e) => setNewStartTime(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary outline-none text-sm text-gray-900"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Término</label>
                                    <input
                                        type="time"
                                        value={newEndTime}
                                        onChange={(e) => setNewEndTime(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary outline-none text-sm text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setIsRescheduling(false)}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-lg text-text-muted hover:bg-gray-100 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReschedule}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark font-medium transition-colors shadow-sm"
                                >
                                    {loading ? 'Salvando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;
