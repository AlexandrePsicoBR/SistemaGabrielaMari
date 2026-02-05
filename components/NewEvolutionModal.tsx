import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

const NewEvolutionModal: React.FC<ModalProps> = ({ onClose, onSave, initialData }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [procedure, setProcedure] = useState('');
  const [patientNote, setPatientNote] = useState('');
  const [technicalNote, setTechnicalNote] = useState('');
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Inventory State
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; stock: number; unit: string }[]>([]);
  const [consumptionList, setConsumptionList] = useState<{ id: string; name: string; quantity: number; unit: string }[]>([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [consumptionQty, setConsumptionQty] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingServices(true);
        // Fetch Services
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name, expiration_months')
          .eq('active', true)
          .order('name');
        setServices(servicesData || []);

        // Fetch Inventory
        const { data: inventoryData } = await supabase
          .from('inventory')
          .select('id, name, stock, unit')
          .gt('stock', 0)
          .order('name');
        setInventoryItems(inventoryData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setProcedure(initialData.title); // Assuming title maps to procedure
      setPatientNote(initialData.patientSummary || '');
      setTechnicalNote(initialData.clinicalNotes || '');
      // Note: We are not repopulating consumption list for now as it's complex to track back from history without specific tables
    }
  }, [initialData]);

  const handleAddConsumption = () => {
    if (!selectedItem || consumptionQty <= 0) return;
    const item = inventoryItems.find(i => i.id === selectedItem);
    if (!item) return;

    if (consumptionQty > item.stock) {
      alert(`Quantidade indisponível! Estoque atual: ${item.stock} ${item.unit}`);
      return;
    }

    setConsumptionList([...consumptionList, {
      id: item.id,
      name: item.name,
      quantity: consumptionQty,
      unit: item.unit
    }]);
    setSelectedItem('');
    setConsumptionQty(1);
  };

  const handleRemoveConsumption = (index: number) => {
    const newList = [...consumptionList];
    newList.splice(index, 1);
    setConsumptionList(newList);
  };

  const handleSave = async () => {
    // 1. Process Stock Deduction
    if (consumptionList.length > 0) {
      for (const item of consumptionList) {
        try {
          const currentItem = inventoryItems.find(i => i.id === item.id);
          if (currentItem) {
            const newStock = currentItem.stock - item.quantity;
            const { error } = await supabase
              .from('inventory')
              .update({ stock: newStock })
              .eq('id', item.id);

            if (error) console.error(`Error updating stock for ${item.name}:`, error);
          }
        } catch (err) {
          console.error('Error processing stock deduction:', err);
        }
      }
    }

    // 2. Calculate Expiration Date
    let expirationDate = null;
    const selectedServiceData = services.find(s => s.name === procedure) as any;

    if (selectedServiceData && selectedServiceData.expiration_months && selectedServiceData.expiration_months > 0) {
      const d = new Date(date);
      d.setMonth(d.getMonth() + selectedServiceData.expiration_months);
      expirationDate = d.toISOString().split('T')[0];
    }

    // 3. Save Evolution
    onSave({
      date,
      title: procedure || 'Procedimento Estético',
      patientSummary: patientNote,
      clinicalNotes: technicalNote,
      doctor: 'Dra. Gabriela Mari', // Default for now
      status: 'Concluído',
      expiration_date: expirationDate
      // We could ideally attach the consumed items to the history record too if we had a relation table
      // For now, request only specified "updating stock".
    });
    // Call onClose only if it's a new insertion or if the parent handles closing after save. 
    // Usually onSave will handle the logic. 
    // Here we just call onSave and let the parent decide, or close immediately.
    // For consistency with existing code:
    onClose();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-[#1d1915] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="px-8 py-5 border-b border-[#e3e0de] flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-serif font-bold text-text-main">{initialData ? 'Editar Evolução' : 'Nova Evolução Clínica'}</h2>
            <p className="text-sm text-text-muted mt-1">Isabella Rossi</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FDFBF9]">

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Data do Procedimento</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-gray-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Tipo de Procedimento</label>
              <div className="relative">
                <select
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-gray-900 bg-white"
                  disabled={loadingServices}
                >
                  <option value="">{loadingServices ? 'Carregando serviços...' : 'Selecione um Serviço'}</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Public Note */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between text-text-main font-bold">
                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">visibility</span> Nota para o Paciente</span>
                <span className="text-[10px] uppercase bg-gray-100 text-text-muted px-2 py-0.5 rounded">Público</span>
              </label>
              <textarea
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                className="w-full min-h-[200px] p-4 rounded-xl border-none bg-white shadow-sm focus:ring-1 focus:ring-primary resize-none placeholder:text-gray-300 text-gray-900"
                placeholder="Descreva as instruções pós-procedimento, cuidados básicos e observações que o paciente deve seguir..."
              ></textarea>
            </div>

            {/* Private Note */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between text-text-main font-bold">
                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-gray-400">lock</span> Notas Técnicas</span>
                <span className="text-[10px] uppercase bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded">Confidencial</span>
              </label>
              <textarea
                value={technicalNote}
                onChange={(e) => setTechnicalNote(e.target.value)}
                className="w-full min-h-[200px] p-4 rounded-xl border border-[#e3e0de] bg-white shadow-sm focus:ring-1 focus:ring-primary resize-none placeholder:text-gray-300 text-gray-900"
                placeholder="Detalhes técnicos, dosagens exatas (ex: 50U Dysport), mapeamento de aplicação e intercorrências..."
              ></textarea>
            </div>
          </div>

          <hr className="border-[#e3e0de]" />

          {/* Inventory Consumption */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                Consumo de Insumos
              </h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-[#e3e0de] space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Insumo / Produto</label>
                  <div className="relative">
                    <select
                      value={selectedItem}
                      onChange={(e) => setSelectedItem(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm"
                    >
                      <option value="">Selecione um item...</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id} disabled={item.stock <= 0}>
                          {item.name} (Disp: {item.stock} {item.unit})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div className="w-24 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    value={consumptionQty}
                    onChange={(e) => setConsumptionQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary outline-none text-sm text-center"
                  />
                </div>
                <button
                  onClick={handleAddConsumption}
                  disabled={!selectedItem}
                  className="h-10 px-4 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Adicionar
                </button>
              </div>

              {/* List of Consumed Items */}
              {consumptionList.length > 0 && (
                <div className="space-y-2 mt-4">
                  <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Itens Utilizados</label>
                  <div className="bg-white rounded-lg border border-[#e3e0de] divide-y divide-[#e3e0de] overflow-hidden">
                    {consumptionList.map((item, index) => (
                      <div key={index} className="p-3 flex justify-between items-center text-sm">
                        <span className="text-text-main font-medium">{item.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="bg-gray-100 text-text-muted px-2 py-0.5 rounded text-xs">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => handleRemoveConsumption(index)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Photos Removed as requested */}

        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[#e3e0de] bg-white flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-text-muted hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-8 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm shadow-lg shadow-primary/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check</span>
            {initialData ? 'Salvar Alterações' : 'Salvar Evolução'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewEvolutionModal;