import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Service } from '../types';

interface ModalProps {
  onClose: () => void;
  initialData?: Service | null;
}

const NewServiceModal: React.FC<ModalProps> = ({ onClose, initialData }) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Service>>({
    name: initialData?.name || '',
    category: initialData?.category || 'Facial',
    duration: initialData?.duration || 60,
    price: initialData?.price || 0,
    description: initialData?.description || '',
    active: initialData ? initialData.active : true,
    expiration_months: initialData?.expiration_months || 0
  });

  const handleChange = (field: keyof Service, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (!formData.name || !formData.price) {
        alert('Por favor, preencha nome e preço.');
        return;
      }

      const payload = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price), // Ensure number
        duration: Number(formData.duration),
        description: formData.description,
        active: formData.active,
        expiration_months: formData.expiration_months
      };

      if (isEditing && initialData) {
        // Update
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('services')
          .insert(payload);

        if (error) throw error;
      }

      onClose(); // Will trigger refresh in parent
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Erro ao salvar serviço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onClose()}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-fade-in">

        <div className="px-6 py-4 border-b border-[#e3e0de] flex justify-between items-center bg-white">
          <h2 className="text-xl font-serif font-bold text-text-main">
            {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
          <button onClick={() => onClose()} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 bg-[#FDFBF9]">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Nome do Procedimento</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="Ex: Harmonização Facial"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Categoria</label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm text-gray-900"
                >
                  <option value="Facial" className="text-gray-900">Facial</option>
                  <option value="Corporal" className="text-gray-900">Corporal</option>
                  <option value="Injetáveis" className="text-gray-900">Injetáveis</option>
                  <option value="Laser" className="text-gray-900">Laser</option>
                  <option value="Outros" className="text-gray-900">Outros</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Duração (min)</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none">min</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Preço Base (R$)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Descrição / Protocolo</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full h-24 p-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="Breve descrição do procedimento..."
            ></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Vencimento (Meses)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={formData.expiration_months || ''}
                onChange={(e) => handleChange('expiration_months', parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Ex: 6 (para 6 meses)"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none">meses</span>
            </div>
            <p className="text-[10px] text-text-muted">Deixe em branco ou 0 se não houver validade.</p>
          </div>


        </div>

        <div className="px-6 py-4 border-t border-[#e3e0de] bg-white flex justify-end gap-3">
          <button onClick={() => onClose()} className="px-4 py-2 rounded-lg text-text-muted hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Serviço')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewServiceModal;