import React, { useState, useMemo, useEffect } from 'react';
import { formatDate } from '../lib/dateUtils';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { supabase } from '../lib/supabase';
import NewTransactionModal, { Transaction } from '../components/NewTransactionModal';

// Cores para o gráfico de pizza seguindo a paleta
const CATEGORY_COLORS = ['#c3a383', '#eaddcf', '#8a7560', '#161413', '#A88B6E', '#D6C0A8'];

const Financial: React.FC = () => {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros e Ordenação
  const [filterMonth, setFilterMonth] = useState<string>(''); // Formato YYYY-MM
  const [filterCategory, setFilterCategory] = useState<string>('Todas');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'date', direction: 'asc' | 'desc' } | null>(null);

  // Fetch transactions from Supabase
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        // Map DB snake_case to frontend camelCase
        const mappedTransactions: Transaction[] = (data || []).map((t: any) => ({
          id: t.id,
          description: t.description,
          patientName: t.patient_name,
          value: Number(t.value),
          date: t.date,
          type: t.type,
          category: t.category,
          paymentMethod: t.payment_method,
          status: t.status as any, // Allow new statuses
          cost: Number(t.cost || 0)
        }));
        setTransactions(mappedTransactions);
      }
    } catch (error) {
      console.error('Unexpected error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // --- Lógica de Agregação de Dados ---

  // 1. Dados para o Gráfico de Barras (Receita vs Despesa)
  const chartData = useMemo(() => {
    if (period === 'monthly') {
      // Visão Mensal: Agrupa por mês do ano atual
      const currentYear = new Date().getFullYear();
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      const data = months.map((month, index) => ({
        name: month,
        revenue: 0,
        expense: 0,
        profit: 0,
        index: index // para ordenação se necessário
      }));

      transactions.forEach(t => {
        const date = new Date(t.date);
        const [yearStr, monthStr] = t.date.split('-');
        if (parseInt(yearStr) === currentYear) {
          const monthIndex = parseInt(monthStr) - 1; // 0-11
          
          const val = Number(t.value || 0);
          const itemCost = Number((t as any).cost || 0);
          const revenue = t.type === 'income' ? val : 0;
          const totalCost = t.type === 'income' ? itemCost : val;

          data[monthIndex].revenue += revenue;
          data[monthIndex].expense += totalCost;
          data[monthIndex].profit += (revenue - totalCost);
        }
      });

      return data;
    } else {
      // Visão Anual: Agrupa por ano (últimos 5 anos)
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => (currentYear - 4 + i).toString());

      const data = years.map(year => ({
        name: year,
        revenue: 0,
        expense: 0,
        profit: 0
      }));

      transactions.forEach(t => {
        const year = t.date.split('-')[0];
        const yearIndex = data.findIndex(d => d.name === year);
        if (yearIndex !== -1) {
          const val = Number(t.value || 0);
          const itemCost = Number((t as any).cost || 0);
          const revenue = t.type === 'income' ? val : 0;
          const totalCost = t.type === 'income' ? itemCost : val;

          data[yearIndex].revenue += revenue;
          data[yearIndex].expense += totalCost;
          data[yearIndex].profit += (revenue - totalCost);
        }
      });

      return data;
    }
  }, [transactions, period]);

  // 2. Dados para o Gráfico de Pizza (Categorias de Receita)
  const pieData = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    transactions.forEach(t => {
      // Filtra apenas receitas
      if (t.type === 'income') {
        const category = t.category || 'Outros';
        categoryMap[category] = (categoryMap[category] || 0) + t.value;
      }
    });

    return Object.keys(categoryMap).map((cat, index) => ({
      name: cat,
      value: categoryMap[cat],
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    })).sort((a, b) => b.value - a.value); // Ordena do maior para o menor

  }, [transactions]);

  // 3. Lista de Transações Processadas (Filtradas e Ordenadas)
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // Aplicar Filtros
    if (filterMonth) {
      result = result.filter(t => t.date.startsWith(filterMonth));
    }
    if (filterCategory !== 'Todas') {
      result = result.filter(t => t.category === filterCategory);
    }
    if (filterStatus !== 'Todos') {
      if (filterStatus === 'Pagos') {
        result = result.filter(t => t.status === 'Pago' || t.status === 'Recebido');
      } else if (filterStatus === 'Pendentes') {
        result = result.filter(t => t.status === 'Em aberto' || t.status === 'Pendente');
      } else {
        result = result.filter(t => t.status === filterStatus);
      }
    }

    // Aplicar Ordenação
    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Transaction];
        let bValue: any = b[sortConfig.key as keyof Transaction];

        // Normalizar strings para comparação
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort (Date DESC)
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return result;
  }, [transactions, filterMonth, filterCategory, filterStatus, sortConfig]);

  const handleSort = (key: keyof Transaction | 'date') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName: string) => {
    if (sortConfig?.key !== columnName) {
      return <span className="material-symbols-outlined text-[14px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">unfold_more</span>;
    }
    return sortConfig.direction === 'asc' 
      ? <span className="material-symbols-outlined text-[14px] text-primary">expand_less</span>
      : <span className="material-symbols-outlined text-[14px] text-primary">expand_more</span>;
  };

  // Formatador de moeda
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleSaveTransaction = () => {
    // Refresh list after save
    fetchTransactions();
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        alert('Erro ao excluir transação.');
      } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Unexpected error deleting transaction:', error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-text-main">Financeiro</h2>
          <p className="text-text-muted mt-1 font-medium">Visão geral da performance da clínica.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#e3e0de] p-1 rounded-lg flex text-sm font-medium">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-1.5 rounded transition-all duration-200 ${period === 'monthly'
                ? 'bg-white shadow-sm text-text-main'
                : 'text-text-muted hover:text-text-main'
                }`}
            >
              Mensal ({new Date().getFullYear()})
            </button>
            <button
              onClick={() => setPeriod('annual')}
              className={`px-4 py-1.5 rounded transition-all duration-200 ${period === 'annual'
                ? 'bg-white shadow-sm text-text-main'
                : 'text-text-muted hover:text-text-main'
                }`}
            >
              Anual
            </button>
          </div>
          <button
            onClick={() => setShowTransactionModal(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Transação
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-[#f3f2f1]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-text-main">Receita vs Despesas vs Lucro</h3>
            <div className="flex gap-4 text-xs font-medium text-gray-900">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Receita</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Despesas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Lucro</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#000000', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={15} />
                <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={15} />
                <Bar dataKey="profit" name="Lucro" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#f3f2f1] flex flex-col">
          <h3 className="font-bold text-lg text-text-main mb-6">Receita por Categoria</h3>
          <div className="flex-1 relative flex items-center justify-center">
            <div className="w-[200px] h-[200px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted text-xs text-center">
                  Sem dados de receita
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-text-muted uppercase">Total</span>
                <span className="text-xl font-bold text-text-main">
                  {pieData.length > 0 ? '100%' : '0%'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs font-medium">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-text-main truncate" title={item.name}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-bold text-xl text-text-main">Transações Recentes</h3>
          <div className="text-sm text-text-muted">
            Saldo Listado: <span className={`font-bold ${processedTransactions.reduce((acc, t) => acc + (t.type === 'income' ? t.value : -t.value), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(processedTransactions.reduce((acc, t) => acc + (t.type === 'income' ? t.value : -t.value), 0))}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[#f3f2f1] overflow-hidden">
          {/* Desktop Table */}
          <table className="w-full text-left hidden md:table">
            <thead className="bg-[#fcfaf8] border-b border-[#f3f2f1]">
              <tr>
                <th className="py-2 px-6 align-top min-w-[150px]">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleSort('date')} className="flex items-center gap-1 text-xs font-bold text-text-muted uppercase hover:text-primary group text-left">
                      Data {getSortIcon('date')}
                    </button>
                    <input 
                      type="month" 
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary text-gray-700 bg-white"
                    />
                  </div>
                </th>
                <th className="py-2 px-6 align-top">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleSort('description')} className="flex items-center gap-1 text-xs font-bold text-text-muted uppercase hover:text-primary group text-left">
                      Descrição {getSortIcon('description')}
                    </button>
                    <div className="h-[26px]"></div> {/* Spacer for alignment */}
                  </div>
                </th>
                <th className="py-2 px-6 align-top max-w-[140px]">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleSort('category')} className="flex items-center gap-1 text-xs font-bold text-text-muted uppercase hover:text-primary group text-left">
                      Categoria {getSortIcon('category')}
                    </button>
                    <select 
                      value={filterCategory} 
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary text-gray-700 bg-white w-full"
                    >
                      <option value="Todas">Todas</option>
                      <option value="Procedimentos">Procedimentos</option>
                      <option value="Estoque">Estoque</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Impostos">Impostos</option>
                      <option value="Serviços">Serviços</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </th>
                <th className="py-2 px-6 align-top max-w-[140px]">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleSort('status')} className="flex items-center gap-1 text-xs font-bold text-text-muted uppercase hover:text-primary group text-left">
                      Status {getSortIcon('status')}
                    </button>
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary text-gray-700 bg-white w-full"
                    >
                      <option value="Todos">Todos</option>
                      <option value="Pagos">Pagos/Recebidos</option>
                      <option value="Pendentes">Pendentes</option>
                      <option value="Não pago">Não pago</option>
                    </select>
                  </div>
                </th>
                <th className="py-2 px-6 align-top text-right min-w-[120px]">
                  <div className="flex flex-col gap-2 items-end">
                    <button onClick={() => handleSort('value')} className="flex items-center gap-1 text-xs font-bold text-text-muted uppercase hover:text-primary group justify-end">
                      {getSortIcon('value')} Valor
                    </button>
                    <div className="h-[26px]"></div> {/* Spacer */}
                  </div>
                </th>
                <th className="py-2 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">Carregando dados financeiros...</td>
                </tr>
              ) : processedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Nenhuma transação encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                processedTransactions.map((transaction) => (
                  <tr key={transaction.id || Math.random()} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6 text-sm font-medium text-text-main">
                      {formatDate(transaction.date + 'T12:00:00', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-main">{transaction.description}</span>
                        {transaction.patientName && (
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">person</span>
                            {transaction.patientName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${transaction.category === 'Procedimentos' ? 'bg-primary/10 text-[#b8702b]' :
                        transaction.category === 'Estoque' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${transaction.status === 'Pago' || transaction.status === 'Recebido'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : transaction.status === 'Em aberto' || transaction.status === 'Pendente'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : transaction.status === 'Não pago'
                            ? 'bg-gray-800 text-white border-gray-700' // Dark Gray
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-sm font-bold text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.value)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Excluir Transação"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-2 text-text-muted hover:text-primary hover:bg-gray-100 rounded-full transition-colors ml-1"
                        title="Editar Transação"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-[#f3f2f1]">
            {/* Mobile Filters UI - Keep simple for mobile */}
            <div className="p-4 bg-gray-50 flex flex-wrap gap-2 items-center">
               <span className="text-xs font-bold text-gray-500 mr-2">Filtros:</span>
               <input 
                  type="month" 
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary text-gray-700 bg-white"
                />
            </div>
            {loading ? (
              <div className="py-8 text-center text-text-muted">Carregando dados financeiros...</div>
            ) : processedTransactions.length === 0 ? (
              <div className="py-8 text-center text-text-muted">Nenhuma transação encontrada.</div>
            ) : (
              processedTransactions.map((transaction) => (
                <div key={transaction.id || Math.random()} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-main">{transaction.description}</span>
                      {transaction.patientName && (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">person</span>
                          {transaction.patientName}
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        {formatDate(transaction.date + 'T12:00:00', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.value)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${transaction.category === 'Procedimentos' ? 'bg-primary/10 text-[#b8702b]' :
                        transaction.category === 'Estoque' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {transaction.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${transaction.status === 'Pago' || transaction.status === 'Recebido'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : transaction.status === 'Em aberto' || transaction.status === 'Pendente'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : transaction.status === 'Não pago'
                            ? 'bg-gray-800 text-white border-gray-700' // Dark Gray
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                        {transaction.status}
                      </span>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-1.5 text-text-muted hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showTransactionModal && (
        <NewTransactionModal
          onClose={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          initialData={editingTransaction}
        />
      )}
    </div>
  );
};

export default Financial;