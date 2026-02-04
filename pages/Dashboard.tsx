import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../lib/dateUtils';
import { Appointment } from '../types';
import NewAppointmentModal from '../components/NewAppointmentModal';
import { supabase } from '../lib/supabase';
import { LoginButton } from '../components/auth/LoginButton';
import { scheduleService } from '../lib/schedule';

interface DashboardProps {
  onNavigate: (view: any) => void;
  onSelectPatient: (patientId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectPatient }) => {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    lowStock: 0,
    totalValue: 0,
    lowStockItems: [] as any[]
  });

  const [financialStats, setFinancialStats] = useState({
    incomeToday: 0,
    incomeMonth: 0,
    expenseToday: 0,
    expenseMonth: 0,
    balanceMonth: 0,
    projectedBalance: 0,
    recentTransactions: [] as any[]
  });

  const [stats, setStats] = useState({
    appointmentsToday: 0
  });

  const [patientStats, setPatientStats] = useState({
    total: 0,
    newThisMonth: 0
  });

  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);

  useEffect(() => {
    // Auth Listener to capture Google Token (it is lost on refresh otherwise)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.provider_token) {
        console.log('Google Token Captured & Saved');
        localStorage.setItem('google_provider_token', session.provider_token);
      }
      // Optional: Capture refresh token if needed later
      if (session?.provider_refresh_token) {
        localStorage.setItem('google_refresh_token', session.provider_refresh_token);
      }
    });

    const fetchData = async () => {
      // 0. Appointments Today
      try {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        // Assuming scheduleService.listEvents returns { items: [...] } or similar depending on implementation
        // Based on previous files, it returns basic Google API response structure
        const events = await scheduleService.listEvents(start, end);
        if (events && events.items) {
          setStats(prev => ({ ...prev, appointmentsToday: events.items.length }));

          const sorted = events.items.sort((a: any, b: any) => {
            return new Date(a.start.dateTime || a.start.date).getTime() - new Date(b.start.dateTime || b.start.date).getTime();
          });
          setTodayAppointments(sorted);
        }
      } catch (e) {
        console.error("Error fetching daily stats", e);
      }

      // 1. Inventory
      const { data: invData } = await supabase.from('inventory').select('*');
      if (invData) {
        const totalItems = invData.length;
        const lowStockItems = invData.filter((item: any) => item.stock <= item.min_stock);
        const lowStock = lowStockItems.length;
        const totalValue = invData.reduce((acc: number, item: any) => acc + (item.stock * (item.cost || 0)), 0);

        setInventoryStats({ totalItems, lowStock, totalValue, lowStockItems });
      }

      // 2. Financials
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transData) {
        let todayIn = 0;
        let todayOut = 0;
        let monthIn = 0;
        let monthOut = 0;
        let balance = 0;

        transData.forEach((t: any) => {
          const val = Number(t.value);
          const tDate = new Date(t.date + 'T12:00:00'); // Compensate timezone simple fix

          // Balance
          if (t.type === 'income') balance += val;
          else balance -= val;

          // Today
          if (t.date === today) {
            if (t.type === 'income') todayIn += val;
            else todayOut += val;
          }

          // Month Stats
          if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            if (t.type === 'income') monthIn += val;
            else monthOut += val;
          }
        });

        // Recent (Top 4)
        const recent = transData.slice(0, 4).map((t: any) => ({
          id: t.id,
          desc: t.description,
          cat: t.category,
          val: Number(t.value),
          type: t.type
        }));

        setFinancialStats({
          incomeToday: todayIn,
          incomeMonth: monthIn,
          expenseToday: todayOut,
          expenseMonth: monthOut,
          balanceMonth: monthIn - monthOut,
          projectedBalance: balance,
          recentTransactions: recent
        });
      }

      // 3. Patients Stats
      const { data: patientsData } = await supabase
        .from('patients')
        .select('created_at');

      if (patientsData) {
        const total = patientsData.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const newThisMonth = patientsData.filter((p: any) => {
          if (!p.created_at) return false;
          const d = new Date(p.created_at);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        setPatientStats({ total, newThisMonth });
      }
    };
    fetchData();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);





  const handleGenerateReport = () => {
    // Dados reais do estado
    const reportData = {
      date: formatDate(new Date()),
      time: formatTime(new Date()),
      financial: {
        income: financialStats.incomeMonth,
        expense: financialStats.expenseMonth,
        balance: financialStats.incomeMonth - financialStats.expenseMonth
      },
      patients: {
        total: patientStats.total,
        newThisMonth: patientStats.newThisMonth,
        attendedToday: todayAppointments.length
      },
      inventory: {
        totalItems: inventoryStats.totalItems,
        lowStock: inventoryStats.lowStock,
        totalValue: inventoryStats.totalValue
      }
    };

    const printContent = `
        <html>
          <head>
            <title>Relatório Gerencial - Gabriela Mari</title>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; max-width: 800px; mx-auto; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #c3a383; padding-bottom: 20px; }
              h1 { color: #c3a383; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
              .subtitle { color: #7e756d; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;}
              .meta { font-size: 12px; color: #999; margin-top: 10px; }
              
              .section { margin-bottom: 30px; }
              h2 { font-size: 16px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; }
              
              .stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
              .stat-box { background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; }
              .stat-label { font-size: 11px; text-transform: uppercase; color: #777; font-weight: bold; display: block; margin-bottom: 5px; }
              .stat-value { font-size: 18px; font-weight: bold; color: #333; }
              .income { color: #16a34a; }
              .expense { color: #dc2626; }
              
              .list-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #eee; font-size: 14px; }
              .list-label { font-weight: 500; }
              
              .footer { margin-top: 60px; font-size: 10px; text-align: center; color: #bbb; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
                <h1>Gabriela Mari</h1>
                <div class="subtitle">Estética Avançada</div>
                <div class="meta">Relatório Gerencial • Gerado em ${reportData.date} às ${reportData.time}</div>
            </div>

            <div class="section">
                <h2>Resumo Financeiro (Mensal)</h2>
                <div class="stat-grid">
                    <div class="stat-box">
                        <span class="stat-label">Entradas</span>
                        <span class="stat-value income">R$ ${reportData.financial.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Saídas</span>
                        <span class="stat-value expense">R$ ${reportData.financial.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Saldo Líquido</span>
                        <span class="stat-value">R$ ${reportData.financial.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Pacientes</h2>
                <div class="list-row">
                    <span class="list-label">Total de Pacientes Cadastrados:</span>
                    <span>${reportData.patients.total}</span>
                </div>
                <div class="list-row">
                    <span class="list-label">Novos Cadastros (Este Mês):</span>
                    <span>${reportData.patients.newThisMonth}</span>
                </div>
                <div class="list-row">
                    <span class="list-label">Total Atendidos Hoje:</span>
                    <span>${reportData.patients.attendedToday}</span>
                </div>
            </div>

            <div class="section">
                <h2>Resumo de Estoque</h2>
                <div class="list-row">
                    <span class="list-label">Total de Itens em Estoque:</span>
                    <span>${reportData.inventory.totalItems}</span>
                </div>
                <div class="list-row">
                    <span class="list-label">Itens com Estoque Baixo (Alerta):</span>
                    <span style="color: #dc2626; font-weight: bold;">${reportData.inventory.lowStock}</span>
                </div>
                <div class="list-row">
                    <span class="list-label">Valor Total Estimado em Produtos:</span>
                    <span>R$ ${reportData.inventory.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>

            <div class="footer">
                Documento confidencial para uso interno.
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-text-main">Bom dia, Gabriela</h2>
          <p className="text-text-muted mt-1">
            Visão geral do consultório hoje, {formatDate(new Date(), { day: 'numeric', month: 'long' }).replace(/ de (.{1})/g, (match: string, p1: string) => ` de ${p1.toUpperCase()}`)}.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <LoginButton />
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 bg-white border border-gray-200 text-text-main px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="text-sm font-medium">Relatórios</span>
          </button>
          <button
            onClick={() => setShowAppointmentModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="text-sm font-medium">Novo Agendamento</span>
          </button>
        </div>
      </div>



      {/* KPI Cards */}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Consultas Hoje */}
        <div
          onClick={() => {
            const agendaSection = document.getElementById('agenda-section');
            if (agendaSection) agendaSection.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-[#f3f2f1] relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">calendar_today</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-background-light rounded-lg border border-gray-100">
              <span className="material-symbols-outlined text-primary">event_available</span>
            </div>
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Consultas Hoje</p>
            <p className="text-3xl font-serif font-bold text-text-main mt-1">{stats.appointmentsToday}</p>
          </div>
        </div>

        {/* Card 2: Faturamento Mês Corrente */}
        <div
          onClick={() => onNavigate('financial')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-[#f3f2f1] relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-emerald-500">payments</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-background-light rounded-lg border border-gray-100">
              <span className="material-symbols-outlined text-emerald-600">attach_money</span>
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Mês Atual</span>
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Ganhos até hoje</p>
            <p className="text-3xl font-serif font-bold text-text-main mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.incomeMonth)}
            </p>
          </div>
        </div>

        {/* Card 3: Estoque Baixo */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-[#f3f2f1] relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-red-500">inventory_2</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-background-light rounded-lg border border-gray-100">
              <span className="material-symbols-outlined text-red-500">warning</span>
            </div>
            {inventoryStats.lowStock > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Repor Estoque</span>
            )}
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Produtos com Estoque Baixo</p>
            <p className="text-3xl font-serif font-bold text-text-main mt-1">{inventoryStats.lowStock}</p>
          </div>
        </div>
      </div>

      {/* Agenda Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#f3f2f1] overflow-hidden">
        <div className="p-6 border-b border-[#f3f2f1] flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_month</span>
            Agenda de Hoje
          </h3>
          <button
            onClick={() => onNavigate('agenda')}
            className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1"
          >
            Ver Agenda Completa <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="divide-y divide-[#f3f2f1]">
          {todayAppointments.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p>Nenhuma consulta agendada para hoje.</p>
            </div>
          ) : (
            todayAppointments.map((apt: any) => {
              const procedureName = apt.description ? apt.description.split('\n')[0] : 'Consulta';
              // Extract patient name from summary? Assuming summary is "PatientName - Procedure" or just PatientName
              // If your logic is different, adjust. 
              // Let's assume summary is the primary text.

              return (
                <div
                  key={apt.id}
                  onClick={() => {
                    // Navigation to patient could be tricky if we don't have patientId. 
                    // For now just navigate to Agenda or do nothing special.
                    onNavigate('agenda');
                  }}
                  className="p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center gap-4 group cursor-pointer"
                >
                  <div className="w-20 text-xs font-medium text-text-muted flex flex-col justify-center border-l-2 border-primary pl-3 py-1">
                    <span className="text-text-main font-bold text-sm">
                      {formatTime(new Date(apt.start.dateTime || apt.start.date), { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>
                      {formatTime(new Date(apt.end.dateTime || apt.end.date), { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-4 bg-background-light p-3 rounded-xl border border-[#f3f2f1] group-hover:bg-white group-hover:border-primary/30 transition-all">
                    {/* Generic Avatar based on name initials */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-2 ring-white">
                      {apt.summary ? apt.summary.substring(0, 2).toUpperCase() : 'GM'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-text-main text-sm">{apt.summary}</h4>
                      <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-100">{procedureName}</span>
                        <span>• Consultório</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-green-500" title="Confirmado">check_circle</span>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}


        </div>
      </div>

      {/* Financial Summary Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#f3f2f1] overflow-hidden">
        <div className="p-6 border-b border-[#f3f2f1] flex justify-between items-center">
          <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">attach_money</span>
            Resumo Financeiro
          </h3>
          <button
            onClick={() => onNavigate('financial')}
            className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1"
          >
            Ver Detalhes <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mini Stats */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-green-700 tracking-wider mb-2">Entradas (Mês)</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-green-800">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.incomeMonth)}
              </span>
              <span className="material-symbols-outlined text-green-300 text-4xl -mb-1">trending_up</span>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-red-700 tracking-wider mb-2">Saídas (Mês)</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-red-800">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.expenseMonth)}
              </span>
              <span className="material-symbols-outlined text-red-300 text-4xl -mb-1">trending_down</span>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-blue-700 tracking-wider mb-2">Saldo (Mês)</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-blue-800">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.balanceMonth)}
              </span>
              <span className="material-symbols-outlined text-blue-300 text-4xl -mb-1">account_balance_wallet</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions Mini Table */}
        <div className="border-t border-[#f3f2f1]">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-text-muted uppercase">Descrição</th>
                <th className="px-6 py-3 text-xs font-bold text-text-muted uppercase">Categoria</th>
                <th className="px-6 py-3 text-xs font-bold text-text-muted uppercase text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1]">
              {financialStats.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm text-text-muted text-center">Nenhuma transação recente.</td>
                </tr>
              ) : (
                financialStats.recentTransactions.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-text-main font-medium">{item.desc}</td>
                    <td className="px-6 py-3 text-xs text-text-muted">{item.cat}</td>
                    <td className={`px-6 py-3 text-sm font-bold text-right ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.val)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Summary Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#f3f2f1] overflow-hidden mt-8">
        <div className="p-6 border-b border-[#f3f2f1] flex justify-between items-center">
          <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-600">inventory_2</span>
            Resumo de Estoque
          </h3>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1"
          >
            Gerenciar Estoque <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-orange-700 tracking-wider mb-2">Total de Itens</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-orange-800">{inventoryStats.totalItems}</span>
              <span className="material-symbols-outlined text-orange-300 text-4xl -mb-1">category</span>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-red-700 tracking-wider mb-2">Estoque Baixo</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-red-800">{inventoryStats.lowStock}</span>
              <span className="material-symbols-outlined text-red-300 text-4xl -mb-1">warning</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-gray-600 tracking-wider mb-2">Valor Total Estimado</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inventoryStats.totalValue)}
              </span>
              <span className="material-symbols-outlined text-gray-300 text-4xl -mb-1">monetization_on</span>
            </div>
          </div>
        </div>

        {inventoryStats.lowStockItems.length > 0 && (
          <div className="border-t border-[#f3f2f1]">
            <div className="bg-red-50 px-6 py-2 text-xs font-bold text-red-700 uppercase tracking-wide border-b border-red-100">
              Itens Precisando de Reposição
            </div>
            <table className="w-full text-left">
              <tbody className="divide-y divide-[#f3f2f1]">
                {inventoryStats.lowStockItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-red-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-text-main font-medium">{item.name}</td>
                    <td className="px-6 py-3 text-xs text-text-muted text-right">
                      Estoque: <span className="font-bold text-red-600">{item.stock} {item.unit}</span> (Mín: {item.min_stock})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAppointmentModal && (
        <NewAppointmentModal onClose={() => setShowAppointmentModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;