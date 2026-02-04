import React, { useState, useMemo, useEffect } from 'react';
import { formatDate } from '../lib/dateUtils';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { supabase } from '../lib/supabase';
import NewTransactionModal, { Transaction } from '../components/NewTransactionModal';

// Cores para o gráfico de pizza seguindo a paleta
const CATEGORY_COLORS = ['#c3a383', '#eaddcf', '#8a7560', '#161413', '#A88B6E', '#D6C0A8'];

const Financial: React.FC = () => {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
          status: t.status as 'Pago' | 'Pendente'
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
        index: index // para ordenação se necessário
      }));

      transactions.forEach(t => {
        const date = new Date(t.date);
        // Ajuste de timezone simples para garantir mês correto se necessário, mas string YYYY-MM-DD costuma ser OK
        // Vamos usar getMonth() direto da data parseada
        // Note: new Date('2023-10-12') em UTC pode ser dia 11 no Brasil dependendo de como o browser interpreta
        // Melhor usar split para garantir
        const [yearStr, monthStr] = t.date.split('-');
        if (parseInt(yearStr) === currentYear) {
          const monthIndex = parseInt(monthStr) - 1; // 0-11
          if (t.type === 'income') {
            data[monthIndex].revenue += t.value;
          } else {
            data[monthIndex].expense += t.value;
          }
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
        expense: 0
      }));

      transactions.forEach(t => {
        const year = t.date.split('-')[0];
        const yearIndex = data.findIndex(d => d.name === year);
        if (yearIndex !== -1) {
          if (t.type === 'income') {
            data[yearIndex].revenue += t.value;
          } else {
            data[yearIndex].expense += t.value;
          }
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

  // 3. Lista de Transações Recentes (Ordenada por data)
  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Formatador de moeda
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleSaveTransaction = () => {
    // Refresh list after save
    fetchTransactions();
    setShowTransactionModal(false);
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
            <h3 className="font-bold text-lg text-text-main">Receita vs Despesas</h3>
            <div className="flex gap-4 text-xs font-medium text-gray-900">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary"></span> Receita</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#e3e0de]"></span> Despesas</span>
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
                <Bar dataKey="revenue" name="Receita" fill="#c3a383" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" name="Despesas" fill="#e3e0de" radius={[4, 4, 0, 0]} barSize={20} />
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
            Saldo Total: <span className={`font-bold ${transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.value : -t.value), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.value : -t.value), 0))}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[#f3f2f1] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#fcfaf8] border-b border-[#f3f2f1]">
              <tr>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase">Data</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase">Descrição</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase">Categoria</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase text-right">Valor</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">Carregando dados financeiros...</td>
                </tr>
              ) : recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    Nenhuma transação registrada.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id || Math.random()} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6 text-sm font-medium text-text-main">
                      {formatDate(new Date(transaction.date + 'T12:00:00'), { day: '2-digit', month: 'short', year: 'numeric' })}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTransactionModal && (
        <NewTransactionModal
          onClose={() => setShowTransactionModal(false)}
          onSave={handleSaveTransaction}
        />
      )}
    </div>
  );
};

export default Financial;