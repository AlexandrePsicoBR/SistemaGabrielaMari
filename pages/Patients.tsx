import React, { useState, useEffect, useCallback } from 'react';
import { formatDate } from '../lib/dateUtils';
import NewPatientModal from '../components/NewPatientModal';
import { supabase } from '../lib/supabase';

interface PatientsProps {
  onPatientClick: (id: string) => void;
}

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string; // Added field
  phoneType?: string;
  lastProcedure?: string;
  lastDate?: string;
  status: 'Ativo' | 'Inativo';
  category: 'VIP' | 'Comum' | 'Novo';
  avatar?: string;
  initials?: string;
}

const Patients: React.FC<PatientsProps> = ({ onPatientClick }) => {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setLoading(true);

      // Create a promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000);
      });

      // Data fetch promise
      const dataPromise = supabase
        .from('patients')
        .select(`
          *,
          clinical_history (
            title,
            date
          )
        `);

      // Race the fetch against the timeout
      // Note: Supabase types usually return { data, error } but Promise.race returns the result of the first settled promise.
      // We need to wrap dataPromise to return compatible type or handle generic result.
      // Easiest is to wait for the result
      const result: any = await Promise.race([dataPromise, timeoutPromise]);
      const { data, error } = result;

      if (error) throw error;

      if (data) {
        // Use Promise.all to handle async signed URL generation
        const mappedPatients = await Promise.all(data.map(async (p: any) => {
          let avatarUrl = p.avatar_url;
          // Generate Signed URL if it's a path (not null/empty and not already http)
          if (avatarUrl && !avatarUrl.startsWith('http')) {
            const { data: signedData } = await supabase.storage
              .from('fotos-pacientes')
              .createSignedUrl(avatarUrl, 3600);
            if (signedData?.signedUrl) avatarUrl = signedData.signedUrl;
          }

          // Get latest history item
          const history = p.clinical_history || [];
          // Sort descending by date
          history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const lastItem = history[0];
          const lastProcedure = lastItem ? lastItem.title : '-';
          const lastDate = lastItem ? formatDate(new Date(lastItem.date)) : '-';

          return {
            id: p.id,
            name: p.name,
            email: p.email || '',
            phone: p.phone || '',
            cpf: p.cpf || '', // Map CPF from DB
            phoneType: '',
            lastProcedure: lastProcedure,
            lastDate: lastDate,
            status: p.status === 'Inativo' ? 'Inativo' : 'Ativo',
            category: (['VIP', 'Comum', 'Novo'].includes(p.status) ? p.status : 'Comum') as any,
            avatar: avatarUrl,
            initials: p.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
          };
        }));

        setPatients(mappedPatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      alert('Erro ao carregar pacientes. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = patient.name.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchLower) ||
      patient.cpf.toLowerCase().includes(searchLower); // Search by CPF

    const matchesStatus = statusFilter === 'Todos' ||
      (statusFilter === 'Ativo' && patient.status === 'Ativo') ||
      (statusFilter === 'Inativo' && patient.status === 'Inativo');

    const matchesCategory = categoryFilter === 'Todas' || patient.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-text-main">Pacientes</h2>
          <p className="text-text-muted mt-1">Gerencie sua base de clientes.</p>
        </div>
        <button
          onClick={() => setShowPatientModal(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Paciente
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e3e0de] flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background-light border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-gray-400 text-gray-900"
            placeholder="Buscar por nome, CPF ou telefone..."
          />
        </div>
        <div className="flex gap-3">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-transparent hover:bg-gray-100 pl-4 pr-10 py-2 rounded-lg text-sm font-medium text-text-main transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Todos">Status: Todos</option>
              <option value="Ativo">Status: Ativo</option>
              <option value="Inativo">Status: Inativo</option>
            </select>
            <span className="material-symbols-outlined text-sm absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">expand_more</span>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-white border border-transparent hover:bg-gray-100 pl-4 pr-10 py-2 rounded-lg text-sm font-medium text-text-main transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Todas">Categoria: Todas</option>
              <option value="VIP">Categoria: VIP</option>
              <option value="Novo">Categoria: Novo</option>
              <option value="Comum">Categoria: Comum</option>
            </select>
            <span className="material-symbols-outlined text-sm absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">expand_more</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e3e0de] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
            <p className="mt-2">Carregando pacientes...</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-[#e3e0de]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted tracking-wider">Paciente</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted tracking-wider">Último Procedimento</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-text-muted tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e0de]">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} onClick={() => onPatientClick(patient.id)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {patient.avatar ? (
                        <img src={patient.avatar} alt={patient.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-text-muted font-bold">
                          {patient.initials || patient.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-text-main">{patient.name}</p>
                        <p className="text-xs text-text-muted">{patient.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-sm text-text-main">
                        <span className={`material-symbols-outlined text-[16px] ${patient.phoneType ? 'text-green-600' : 'text-text-muted'}`}>call</span>
                        {patient.phone}
                      </div>
                      {patient.phoneType && <span className="text-xs text-text-muted">{patient.phoneType}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-main">{patient.lastProcedure}</span>
                      <span className="text-xs text-text-muted">{patient.lastDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {patient.category === 'VIP' ? (
                      <span className="inline-flex items-center rounded-full bg-[#fcf5eb] px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">VIP</span>
                    ) : patient.status === 'Ativo' ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-100">Ativo</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 border border-gray-200">Inativo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-text-muted hover:text-text-main p-1 rounded-full hover:bg-gray-200">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showPatientModal && (
        <NewPatientModal onClose={() => {
          setShowPatientModal(false);
          fetchPatients(); // Refetch after adding new patient
        }} />
      )}
    </div>
  );
};

export default Patients;