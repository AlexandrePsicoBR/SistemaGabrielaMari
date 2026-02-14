import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  description: string;
  patientName?: string;
  value: number;
  cost?: number; // New optional field
  date: string;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  status: 'Pago' | 'Pendente' | 'Recebido' | 'Em aberto' | 'Não pago';
}

interface ModalProps {
  onClose: () => void;
  onSave: () => void;
  initialData?: Transaction | null;
  initialPatientName?: string;
}

const NewTransactionModal: React.FC<ModalProps> = ({ onClose, onSave, initialData, initialPatientName }) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState(12);

  // Autocomplete states
  const [patients, setPatients] = useState<{ id: string, name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<{ id: string, name: string }[]>([]);

  const [formData, setFormData] = useState({
    description: '',
    patientName: '',
    value: '',
    cost: '', // New state for cost
    date: new Date().toISOString().split('T')[0],
    category: '',
    paymentMethod: '',
    isPaid: true
  });

  useEffect(() => {
    // Fetch patients for autocomplete
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, name')
        .order('name');

      if (data) {
        setPatients(data);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setFormData({
        description: initialData.description,
        patientName: initialData.patientName || '',
        value: initialData.value.toString(),
        cost: initialData.cost ? initialData.cost.toString() : '', // Load cost
        date: initialData.date,
        category: initialData.category,
        paymentMethod: initialData.paymentMethod || '',
        isPaid: initialData.status === 'Pago' || initialData.status === 'Recebido'
      });
    } else if (initialPatientName) {
      // Se não for edição, mas tiver nome inicial (contexto do paciente), preenche
      setFormData(prev => ({ ...prev, patientName: initialPatientName }));
    }
  }, [initialData, initialPatientName]);

  // Filter patients when input changes
  useEffect(() => {
    if (formData.patientName) {
      const lower = formData.patientName.toLowerCase();
      const filtered = patients.filter(p => p.name.toLowerCase().includes(lower));
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [formData.patientName, patients]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'patientName') {
      setShowSuggestions(true);
    }
  };

  const selectPatient = (name: string) => {
    setFormData(prev => ({ ...prev, patientName: name }));
    setShowSuggestions(false);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isPaid: e.target.checked }));
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.value) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);

      const loops = (type === 'expense' && isRecurring && !isEditing) ? recurrenceMonths : 1;

      // Para evitar problemas de fuso horário, criamos a data base com hora fixa
      const baseDateParts = formData.date.split('-');
      const baseYear = parseInt(baseDateParts[0]);
      const baseMonth = parseInt(baseDateParts[1]) - 1; // Meses em JS são 0-11
      const baseDay = parseInt(baseDateParts[2]);

      const payloads = [];

      for (let i = 0; i < loops; i++) {
        // Calcula a data do mês correspondente
        const currentDataObj = new Date(baseYear, baseMonth + i, baseDay);

        // Formata para YYYY-MM-DD manualmente para garantir consistência
        const year = currentDataObj.getFullYear();
        const month = String(currentDataObj.getMonth() + 1).padStart(2, '0');
        const day = String(currentDataObj.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        // Adiciona sufixo na descrição se for recorrente
        const descriptionSuffix = loops > 1 ? ` (${i + 1}/${loops})` : '';

        const payload = {
          description: formData.description + descriptionSuffix,
          // Allow linking expense to patient if selected
          patient_name: formData.patientName || null,
          value: Number(formData.value),
          cost: Number(formData.cost) || 0, // Save Cost
          date: dateString,
          type: type,
          category: formData.category || 'Outros',
          payment_method: formData.paymentMethod || 'Dinheiro',
          status: type === 'income'
            ? (formData.isPaid ? 'Recebido' : 'Em aberto')
            : (isRecurring && !isEditing ? 'Não pago' : (formData.isPaid ? 'Pago' : 'Não pago'))
        };
        payloads.push(payload);
      }

      if (isEditing && initialData) {
        // Update single transaction
        const { error } = await supabase
          .from('transactions')
          .update(payloads[0])
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Insert (potentially multiple)
        const { error } = await supabase
          .from('transactions')
          .insert(payloads);

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Erro ao salvar transação.');
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
            {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5 bg-[#FDFBF9] overflow-y-auto max-h-[80vh]">

          <div className="flex bg-[#e3e0de] p-1 rounded-lg">
            <button
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              Receita
            </button>
            <button
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              Despesa
            </button>
          </div>

          <div className="space-y-1.5 animate-fade-in">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">
              Paciente {type === 'expense' && '(Opcional)'}
            </label>
            <div className="relative">
              <input
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                type="text"
                autoComplete="off"
                className="w-full h-10 px-3 pl-9 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder={type === 'income' ? "Selecione o paciente..." : "Vincular a um paciente (opcional)..."}
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">person</span>

              {/* Autocomplete Dropdown */}
              {showSuggestions && filteredPatients.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredPatients.map(patient => (
                    <li
                      key={patient.id}
                      onClick={() => selectPatient(patient.name)}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {patient.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Descrição</label>
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
              type="text"
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="Ex: Botox Full Face"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Valor (R$)</label>
              <input
                name="value"
                value={formData.value}
                onChange={handleChange}
                type="number"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="0,00"
              />
            </div>

            {/* COST FIELD */}
            {type === 'income' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Custo (R$)</label>
                <input
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  type="number"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="0,00"
                />
              </div>
            )}

            {type === 'expense' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Data</label>
                <input
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  type="date"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900"
                />
              </div>
            )}
          </div>

          {type === 'income' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Data</label>
              <input
                name="date"
                value={formData.date}
                onChange={handleChange}
                type="date"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900"
              />
            </div>
          )}

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
                  <option value="">Selecione...</option>
                  {type === 'income' ? (
                    <>
                      <option value="Procedimentos">Procedimentos</option>
                      <option value="Venda de Produtos">Venda de Produtos</option>
                      <option value="Retorno">Retorno</option>
                    </>
                  ) : (
                    <>
                      <option value="Estoque">Estoque / Insumos</option>
                      <option value="Aluguel">Aluguel / Condomínio</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Impostos">Impostos</option>
                      <option value="Funcionários">Funcionários</option>
                      <option value="Outros">Outros</option>
                    </>
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Forma Pagto</label>
              <div className="relative">
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm text-gray-900 bg-white"
                >
                  <option value="">Selecione...</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Pix">Pix</option>
                  <option value="Cartão Crédito">Cartão Crédito</option>
                  <option value="Cartão Débito">Cartão Débito</option>
                  <option value="Transferência">Transferência</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          {/* Recorrência para Despesas */}
          {type === 'expense' && !isEditing && (
            <div className="bg-background-light p-3 rounded-lg border border-[#e3e0de] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-text-main cursor-pointer select-none">
                  Despesa Recorrente
                </label>
              </div>

              {isRecurring && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <label className="text-xs text-text-muted">Repetir por</label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={recurrenceMonths}
                    onChange={(e) => setRecurrenceMonths(Number(e.target.value))}
                    className="w-16 h-8 px-2 rounded border border-[#e3e0de] text-center text-sm text-text-main focus:border-primary outline-none"
                  />
                  <span className="text-xs text-text-muted">meses</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPaid"
              checked={formData.isPaid}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isPaid" className="text-sm text-text-main">
              Marcar como {type === 'income' ? 'recebido' : 'pago'}
            </label>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-[#e3e0de] bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white font-medium text-sm shadow-md flex items-center gap-2 disabled:opacity-50 ${type === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
          >
            {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTransactionModal;