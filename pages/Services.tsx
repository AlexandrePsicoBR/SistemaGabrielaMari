import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Service } from '../types';
import NewServiceModal from '../components/NewServiceModal';

const Services: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true) // Filter only active services
        .order('name');

      if (error) {
        console.error('Error fetching services:', error);
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const categories = ['Todos', 'Facial', 'Corporal', 'Injetáveis', 'Laser'];

  const filteredServices = activeCategory === 'Todos'
    ? services
    : services.filter(s => s.category === activeCategory);

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const handleCloseModal = (shouldRefresh = false) => {
    setEditingService(null);
    setShowModal(false);
    if (shouldRefresh) {
      fetchServices();
    }
  };

  const handleSoftDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja remover este serviço do sistema? (Ele não será apagado do banco de dados)')) return;

    try {
      const { error } = await supabase
        .from('services')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      fetchServices(); // Refresh list
    } catch (err) {
      console.error('Error archiving service:', err);
      alert('Erro ao remover serviço.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-text-main font-serif">Catálogo de Serviços</h2>
          <p className="text-text-muted mt-1">Gerencie os procedimentos oferecidos na clínica.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm font-medium"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Serviço
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-[#e3e0de] shadow-sm">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat
                ? 'bg-text-main text-white shadow-sm'
                : 'bg-background-light text-text-muted hover:bg-gray-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-background-light border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm outline-none placeholder:text-text-muted/70"
            placeholder="Buscar procedimento..."
          />
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando serviços...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-xl border border-[#e3e0de] shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${service.category === 'Injetáveis' ? 'bg-purple-50 text-purple-600' :
                    service.category === 'Facial' ? 'bg-blue-50 text-blue-600' :
                      service.category === 'Laser' ? 'bg-orange-50 text-orange-600' :
                        'bg-green-50 text-green-600'
                    }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {service.category === 'Injetáveis' ? 'vaccines' :
                        service.category === 'Facial' ? 'face' :
                          service.category === 'Laser' ? 'light_mode' : 'spa'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-text-muted hover:text-primary transition-colors p-1"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      onClick={(e) => handleSoftDelete(service.id, e)}
                      className="text-text-muted hover:text-red-500 transition-colors p-1"
                      title="Remover do Sistema"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-text-main mb-1">{service.name}</h3>
                <p className="text-sm text-text-muted line-clamp-2 h-10 mb-4">{service.description}</p>

                <div className="flex items-center gap-4 text-sm text-text-muted mb-6">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    {service.duration} min
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">category</span>
                    {service.category}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#f3f2f1]">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-text-muted font-bold">Valor da Sessão</span>
                    <span className="text-lg font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEdit(service)}
                    className="px-3 py-1.5 rounded-lg border border-[#e3e0de] text-text-muted text-sm font-medium hover:bg-gray-50 hover:text-text-main transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Card (Empty State-ish) */}
          <button
            onClick={handleCreate}
            className="rounded-xl border-2 border-dashed border-[#e3e0de] flex flex-col items-center justify-center p-6 text-text-muted hover:border-primary/50 hover:bg-white hover:text-primary transition-all group min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <span className="font-bold">Adicionar Novo Serviço</span>
          </button>
        </div>
      )}

      {showModal && (
        <NewServiceModal onClose={() => handleCloseModal(true)} initialData={editingService} />
      )}
    </div>
  );
};

export default Services;