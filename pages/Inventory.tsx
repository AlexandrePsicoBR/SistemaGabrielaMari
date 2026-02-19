import React, { useState, useEffect } from 'react';
import { formatDate } from '../lib/dateUtils';
import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types';
import NewInventoryItemModal from '../components/NewInventoryItemModal';

const Inventory: React.FC = () => {
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching inventory:', error);
      } else {
        // Map database fields to frontend types
        const mappedItems: InventoryItem[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          stock: item.stock,
          minStock: item.min_stock,
          unit: item.unit,
          lastRestock: item.last_restock,
          cost: item.cost
        }));
        setItems(mappedItems);
      }
    } catch (error) {
      console.error('Unexpected error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filtros
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFilter === 'Todos' || item.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  // Estatísticas
  const lowStockCount = items.filter(i => i.stock <= i.minStock).length;
  // Calculate total value based on real DB cost
  const totalValue = items.reduce((acc, item) => acc + (item.stock * (item.cost || 0)), 0);

  // Handlers
  const handleCreate = () => {
    setEditingItem(null);
    setShowItemModal(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este item permanentemente?')) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting item:', error);
        alert('Erro ao excluir item.');
      } else {
        setItems(items.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error('Unexpected error deleting item:', error);
    }
  };

  const handleCloseModal = (shouldRefresh = false) => {
    setEditingItem(null);
    setShowItemModal(false);
    if (shouldRefresh) {
      fetchItems();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-text-main">Gestão de Estoque</h2>
          <p className="text-text-muted mt-1">Controle de produtos e insumos da clínica.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg shadow-sm transition-all font-bold text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Novo Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e3e0de] shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="bg-red-50 p-2 rounded-lg text-red-600">
              <span className="material-symbols-outlined">warning</span>
            </div>
            {lowStockCount > 0 && <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Ação Necessária</span>}
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Itens com Estoque Baixo</p>
            <p className="text-text-main text-3xl font-bold mt-1">{lowStockCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e3e0de] shadow-sm flex flex-col gap-4">
          <div className="bg-green-50 p-2 rounded-lg text-green-700 w-fit">
            <span className="material-symbols-outlined">attach_money</span>
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Valor Total Estimado</p>
            <p className="text-text-main text-3xl font-bold mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e3e0de] shadow-sm flex flex-col gap-4">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-600 w-fit">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Total de Itens Cadastrados</p>
            <p className="text-text-main text-3xl font-bold mt-1">{items.length}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e3e0de] rounded-lg text-sm text-text-main focus:border-primary outline-none shadow-sm placeholder:text-gray-400"
            placeholder="Buscar produto por nome..."
            type="text"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          {['Todos', 'Injetáveis', 'Consumíveis', 'Descartáveis'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeFilter === filter
                ? 'bg-text-main text-white shadow-sm'
                : 'bg-white text-text-muted border border-[#e3e0de] hover:bg-gray-50'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e3e0de] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full text-left hidden md:table">
            <thead className="bg-gray-50 border-b border-[#e3e0de]">
              <tr>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Produto</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Categoria</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Estoque</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Última Reposição</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e0de]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">Carregando estoque...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">Nenhum item encontrado.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-background-light transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-text-muted">
                          <span className="material-symbols-outlined text-[20px]">
                            {item.category === 'Injetáveis' ? 'vaccines' : item.category === 'Consumíveis' ? 'sanitizer' : 'inventory_2'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-main">{item.name}</p>
                          <p className="text-xs text-text-muted">{item.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${item.category === 'Injetáveis' ? 'bg-purple-50 text-purple-700' :
                        item.category === 'Consumíveis' ? 'bg-orange-50 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {item.stock <= item.minStock && (
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                        <span className={`text-sm font-bold ${item.stock <= item.minStock ? 'text-red-600' : 'text-text-main'}`}>
                          {item.stock} {item.unit}
                        </span>
                        {item.stock <= item.minStock && (
                          <span className="text-xs text-text-muted">(Baixo)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right"><p className="text-sm font-medium text-text-main">{formatDate(new Date(item.lastRestock))}</p></td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-text-muted hover:text-red-600 transition-colors">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-[#e3e0de]">
            {loading ? (
              <div className="py-8 text-center text-text-muted">Carregando estoque...</div>
            ) : filteredItems.length === 0 ? (
              <div className="py-8 text-center text-text-muted">Nenhum item encontrado.</div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-text-muted shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {item.category === 'Injetáveis' ? 'vaccines' : item.category === 'Consumíveis' ? 'sanitizer' : 'inventory_2'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-text-main">{item.name}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium mt-1 ${item.category === 'Injetáveis' ? 'bg-purple-50 text-purple-700' :
                          item.category === 'Consumíveis' ? 'bg-orange-50 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-text-muted hover:text-red-600 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                      <div className="flex items-center gap-2">
                        {item.stock <= item.minStock && (
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                        <span className={`text-sm font-bold ${item.stock <= item.minStock ? 'text-red-600' : 'text-text-main'}`}>
                          {item.stock} {item.unit}
                        </span>
                        {item.stock <= item.minStock && (
                          <span className="text-xs text-text-muted">(Baixo)</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">Últ.: {formatDate(new Date(item.lastRestock))}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showItemModal && (
        <NewInventoryItemModal
          onClose={() => handleCloseModal(true)}
          initialData={editingItem}
        />
      )}
    </div>
  );
};

export default Inventory;