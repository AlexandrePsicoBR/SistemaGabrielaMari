
import React, { useState, useEffect } from 'react';
import { scheduleService } from '../lib/schedule';
import { supabase } from '../lib/supabase';
import { Service } from '../types';

interface ModalProps {
  onClose: () => void;
}

const NewAppointmentModal: React.FC<ModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    patientName: '',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    async function fetchServices() {
      const { data } = await supabase.from('services').select('*').eq('active', true);
      if (data) setServices(data);
    }
    fetchServices();
  }, []);

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    const service = services.find(s => s.id === serviceId) || null;
    setSelectedService(service);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patientName || !formData.date || !formData.time || !selectedService) {
        alert('Preencha os campos obrigatórios (Paciente, Procedimento, Data e Hora)');
        return;
      }

      setLoading(true);

      const startsAt = new Date(`${formData.date}T${formData.time}`);
      // Use service duration or default to 60 mins
      const duration = selectedService.duration || 60;
      const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

      await scheduleService.createAppointment({
        patientName: formData.patientName,
        procedure: selectedService.name,
        startsAt,
        endsAt,
        notes: formData.notes
      });

      alert('Agendamento criado com sucesso!');
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao agendar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-fade-in">

        <div className="px-6 py-4 border-b border-[#e3e0de] flex justify-between items-center bg-white">
          <h2 className="text-xl font-serif font-bold text-text-main">Novo Agendamento</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 bg-[#FDFBF9]">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Paciente</label>
            <input
              type="text"
              placeholder="Nome do paciente"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Procedimento</label>
            <div className="relative">
              <select
                value={selectedService?.id || ''}
                onChange={handleServiceChange}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm text-gray-900 bg-white"
              >
                <option value="">Selecione o procedimento</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration} min)
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Horário</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full h-24 p-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="Observações extras..."
            ></textarea>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e3e0de] bg-white flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg text-text-muted hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Agendando...' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentModal;