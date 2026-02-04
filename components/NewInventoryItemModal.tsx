import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types';

interface ModalProps {
  onClose: () => void;
  // onSave: (item: InventoryItem) => void; // No longer needed
  initialData?: InventoryItem | null;
}

const NewInventoryItemModal: React.FC<ModalProps> = ({ onClose, initialData }) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);

  // Estados locais para controlar o formulário
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Injetáveis',
    stock: 0,
    minStock: 5,
    unit: 'UN',
    lastRestock: new Date().toISOString().split('T')[0],
  });

  const [cost, setCost] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // If we had cost in initialData we would set it here.
      // For now, initializing empty or mock if needed.
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'minStock' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        category: formData.category,
        stock: Number(formData.stock),
        min_stock: Number(formData.minStock), // Map to snake_case
        unit: formData.unit,
        last_restock: formData.lastRestock,
        cost: cost ? parseFloat(cost.replace(',', '.')) : 0
      };

      if (isEditing && initialData) {
        // Update
        const { error } = await supabase
          .from('inventory')
          .update(payload)
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('inventory')
          .insert(payload);

        if (error) throw error;
      }

      onClose(); // Will trigger refresh via parent prop closure
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert('Erro ao salvar item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-fade-in">

        <div className="px-6 py-4 border-b border-[#e3e0de] flex justify-between items-center bg-white">
          <h2 className="text-xl font-serif font-bold text-text-main">
            {isEditing ? 'Editar Item' : 'Novo Item de Estoque'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 bg-[#FDFBF9]">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Nome do Produto</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="Ex: Botox 100U"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Categoria</label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm text-gray-900 bg-white"
                >
                  <option value="Injetáveis">Injetáveis</option>
                  <option value="Descartáveis">Descartáveis</option>
                  <option value="Cosméticos">Cosméticos</option>
                  <option value="Papelaria">Papelaria</option>
                  <option value="Consumíveis">Consumíveis</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Fornecedor</label>
              <input
                type="text"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Qtd Inicial</label>
              <input
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                type="number"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Unidade</label>
              <div className="relative">
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm text-gray-900 bg-white"
                >
                  <option value="UN">UN</option>
                  <option value="CX">CX</option>
                  <option value="ML">ML</option>
                  <option value="PCT">PCT</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Estoque Mín.</label>
              <input
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                type="number"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Custo Unitário (R$)</label>
              <input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                type="text"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Validade</label>
              <input
                type="date"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-[#e3e0de] bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar Item')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewInventoryItemModal;