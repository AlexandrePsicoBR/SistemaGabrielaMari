import React, { useState, useEffect, useRef } from 'react';
import { formatDate } from '../lib/dateUtils';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '../lib/supabase';
import { useCertificate } from '../contexts/CertificateContext';
import { CertificatePasswordModal } from './CertificatePasswordModal';

interface AnamneseCorporalProps {
    patientData: {
        name: string;
        birthDate: string;
        email: string;
        phone: string;
        address: string;
    };
    onPrint?: () => void;
    patientId?: string;
    onSuccess?: () => void;
}

const AnamneseCorporal: React.FC<AnamneseCorporalProps> = ({ patientData, onPrint, patientId, onSuccess }) => {

    const initialFormState = {
        dataAvaliacao: new Date().toISOString().split('T')[0],
        dadosPessoais: {
            indicacao: '',
            cidade: '',
            profissao: ''
        },
        motivoConsulta: {
            queixa: '',
            tratamentoPrevio: { realizado: false, qual: '' },
            historia: { data: '', local: '', resultados: '' } // otimo, bom, ruim
        },
        historicoPaciente: {
            medicacao: { uso: false, quais: '' },
            alergias: { uso: false, quais: '' },
            afeccoesCutaneas: { uso: false, quais: '' },
            pressao: { hipertensao: false, hipotensao: false },
            cardiacos: { problema: false, quais: '' },
            marcapasso: false,
            diabetes: { tem: false, tipo: '', desde: '' },
            tireoide: { tem: false, qual: '' },
            epilepsia: false,
            disturbioCirculatorio: { tem: false, trombose: false, varizes: false },
            oncologicos: { tem: false, quais: '' },
            cirurgicos: { tem: false, quais: '' },
            metais: { tem: false, regiao: '' },
            atividadeFisica: { pratica: false, frequencia: '' },
            agua: { quantidade: '' }, // 1l, 1.5l, 2l, outro
            alimentacao: {
                carneVermelha: false, frango: false, peixe: false, soja: false, ovos: false,
                leite: false, queijo: false, vitA: false, vitC: false, vitK: false,
                saladas: false, arroz: false, feijao: false, lentilha: false,
                amendoas: false, farinhaBranca: false, farinhaIntegral: false
            },
            frituras: '', // muito, pouco, sem
            refrigerantesDoces: '', // muito, pouco, sem
            intestino: '', // regular, irregular
            fumoAlcool: { uso: false, quantidade: '' }
        },
        cuidadosDiarios: {
            hidratante: false, redutor: false, anticelulitico: false, estrias: false,
            firmante: false, maos: false, pes: false, esfoliante: false,
            filtroSolar: { uso: false, fps: '', ppd: '' },
            acido: false,
            outro: ''
        },
        mulher: {
            dum: '',
            cicloRegular: false,
            gestacoes: '',
            filhos: '',
            anticoncepcional: '',
            reposicaoHormonal: false
        },
        composicaoCorporal: '', // androide, ginoide
        satisfacaoCorporal: { atual: '', desejada: '' },
        medidas: {
            peso: '',
            altura: '',
            imc: ''
        },
        eva: null as number | null
    };

    const [formData, setFormData] = useState(initialFormState);

    // Load Data
    useEffect(() => {
        if (patientId) {
            const savedData = localStorage.getItem(`anamnese_corporal_${patientId}`);
            if (savedData) {
                try {
                    setFormData(JSON.parse(savedData));
                } catch (e) {
                    console.error("Failed to load corporal data");
                }
            }
        }
    }, [patientId]);

    // Calculate IMC automatically when weight/height change
    useEffect(() => {
        const peso = parseFloat(formData.medidas.peso.replace(',', '.'));
        const altura = parseFloat(formData.medidas.altura.replace(',', '.'));
        if (peso > 0 && altura > 0) {
            const imc = (peso / (altura * altura)).toFixed(2);
            setFormData(prev => ({ ...prev, medidas: { ...prev.medidas, imc } }));
        }
    }, [formData.medidas.peso, formData.medidas.altura]);

    // Certificate
    const { sign, isUnlocked } = useCertificate();
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const handleSave = async () => {
        if (!patientId) {
            alert('Erro: ID do paciente não encontrado.');
            return;
        }

        if (!isUnlocked) {
            setShowPasswordModal(true);
            return;
        }

        try {
            const dataToSign = JSON.stringify({
                patientId,
                date: new Date().toISOString(),
                type: 'anamnese-corporal',
                data: formData,
                doctor: 'Dra. Gabriela Mari'
            });

            const signature = sign(dataToSign);

            const { error } = await supabase.from('clinical_history').insert({
                patient_id: patientId,
                date: new Date().toISOString(),
                title: 'Anamnese Corporal',
                description: 'Ficha de Anamnese Corporal preenchida e assinada.',
                patient_summary: formData.motivoConsulta.queixa,
                clinical_notes: JSON.stringify(formData), // Storing JSON as string
                type: 'anamnese-corporal',
                status: 'Concluído',
                tags: ['anamnese', 'corporal'],
                signature: signature,
                doctor: 'Dra. Gabriela Mari'
            });

            if (error) throw error;

            alert('Anamnese Corporal salva e assinada com sucesso!');
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error saving anamnesis:', error);
            alert('Erro ao salvar anamnese.');
        }
    };

    // Helper functions for state updates
    const updateRootField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateSectionField = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...(prev as any)[section], [field]: value }
        }));
    };

    const updateDeepField = (section: string, subsection: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...(prev as any)[section],
                [subsection]: { ...((prev as any)[section] as any)[subsection], [field]: value }
            }
        }));
    };

    const CheckboxLabel = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) => (
        <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );

    const RadioLabel = ({ name, label, value, checkedValue, onChange }: any) => (
        <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={name} className="w-4 h-4 text-primary border-gray-300" checked={value === checkedValue} onChange={() => onChange(checkedValue)} />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );

    return (
        <div className="w-full">
            {/* WEB UI */}
            <div id="web-view" className="print:hidden space-y-8 p-6 md:p-8 pb-24 bg-gray-50/50">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold font-serif text-gray-900">Avaliação Corporal</h1>
                    <button type="button" onClick={onPrint} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50">
                        <span className="material-symbols-outlined">print</span> Imprimir
                    </button>
                </div>

                {/* Dados Iniciais */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Dados Pessoais Complementares</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Indicação</label><input type="text" className="w-full p-2 border rounded-md" value={formData.dadosPessoais.indicacao} onChange={e => updateSectionField('dadosPessoais', 'indicacao', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Cidade</label><input type="text" className="w-full p-2 border rounded-md" value={formData.dadosPessoais.cidade} onChange={e => updateSectionField('dadosPessoais', 'cidade', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Profissão</label><input type="text" className="w-full p-2 border rounded-md" value={formData.dadosPessoais.profissao} onChange={e => updateSectionField('dadosPessoais', 'profissao', e.target.value)} /></div>
                    </div>
                </div>

                {/* Motivo Consulta */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Motivo da Consulta</h3>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Queixa Principal</label><textarea className="w-full p-3 border rounded-md h-24" value={formData.motivoConsulta.queixa} onChange={e => updateSectionField('motivoConsulta', 'queixa', e.target.value)} /></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold">Tratamento Prévio?</span>
                                <CheckboxLabel label="Sim" checked={formData.motivoConsulta.tratamentoPrevio.realizado} onChange={c => updateDeepField('motivoConsulta', 'tratamentoPrevio', 'realizado', c)} />
                            </div>
                            {formData.motivoConsulta.tratamentoPrevio.realizado && (
                                <textarea className="w-full p-2 border rounded-md h-20" placeholder="Qual?" value={formData.motivoConsulta.tratamentoPrevio.qual} onChange={e => updateDeepField('motivoConsulta', 'tratamentoPrevio', 'qual', e.target.value)} />
                            )}
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-bold">Histórico da Queixa</span>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="date" className="p-2 border rounded-md" value={formData.motivoConsulta.historia.data} onChange={e => updateDeepField('motivoConsulta', 'historia', 'data', e.target.value)} />
                                <input type="text" className="p-2 border rounded-md" placeholder="Local" value={formData.motivoConsulta.historia.local} onChange={e => updateDeepField('motivoConsulta', 'historia', 'local', e.target.value)} />
                            </div>
                            <select className="w-full p-2 border rounded-md" value={formData.motivoConsulta.historia.resultados} onChange={e => updateDeepField('motivoConsulta', 'historia', 'resultados', e.target.value)}>
                                <option value="">Resultados...</option><option value="Otimo">Ótimo</option><option value="Bom">Bom</option><option value="Ruim">Ruim</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Histórico Paciente */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Histórico do Paciente</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Medicação */}
                        <div className="space-y-2 border p-3 rounded-lg">
                            <div className="flex items-center gap-2"><CheckboxLabel label="Uso de Medicação Regular" checked={formData.historicoPaciente.medicacao.uso} onChange={c => updateDeepField('historicoPaciente', 'medicacao', 'uso', c)} /></div>
                            <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Quais?" disabled={!formData.historicoPaciente.medicacao.uso} value={formData.historicoPaciente.medicacao.quais} onChange={e => updateDeepField('historicoPaciente', 'medicacao', 'quais', e.target.value)} />
                        </div>
                        {/* Alergias */}
                        <div className="space-y-2 border p-3 rounded-lg">
                            <div className="flex items-center gap-2"><CheckboxLabel label="Alergias" checked={formData.historicoPaciente.alergias.uso} onChange={c => updateDeepField('historicoPaciente', 'alergias', 'uso', c)} /></div>
                            <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Quais?" disabled={!formData.historicoPaciente.alergias.uso} value={formData.historicoPaciente.alergias.quais} onChange={e => updateDeepField('historicoPaciente', 'alergias', 'quais', e.target.value)} />
                        </div>
                        {/* Afecções */}
                        <div className="space-y-2 border p-3 rounded-lg">
                            <div className="flex items-center gap-2"><CheckboxLabel label="Afecções Cutâneas" checked={formData.historicoPaciente.afeccoesCutaneas.uso} onChange={c => updateDeepField('historicoPaciente', 'afeccoesCutaneas', 'uso', c)} /></div>
                            <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Quais?" disabled={!formData.historicoPaciente.afeccoesCutaneas.uso} value={formData.historicoPaciente.afeccoesCutaneas.quais} onChange={e => updateDeepField('historicoPaciente', 'afeccoesCutaneas', 'quais', e.target.value)} />
                        </div>
                        {/* Pressão */}
                        <div className="space-y-2 border p-3 rounded-lg">
                            <span className="font-bold text-sm">Pressão Arterial</span>
                            <div className="flex gap-4">
                                <CheckboxLabel label="Hipertensão" checked={formData.historicoPaciente.pressao.hipertensao} onChange={c => updateDeepField('historicoPaciente', 'pressao', 'hipertensao', c)} />
                                <CheckboxLabel label="Hipotensão" checked={formData.historicoPaciente.pressao.hipotensao} onChange={c => updateDeepField('historicoPaciente', 'pressao', 'hipotensao', c)} />
                            </div>
                        </div>
                    </div>

                    {/* Specific Checks Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <CheckboxLabel label="Marcapasso" checked={formData.historicoPaciente.marcapasso} onChange={c => updateSectionField('historicoPaciente', 'marcapasso', c)} />
                        <CheckboxLabel label="Epilepsia" checked={formData.historicoPaciente.epilepsia} onChange={c => updateSectionField('historicoPaciente', 'epilepsia', c)} />
                        <CheckboxLabel label="Trombose" checked={formData.historicoPaciente.disturbioCirculatorio.trombose} onChange={c => updateDeepField('historicoPaciente', 'disturbioCirculatorio', 'trombose', c)} />
                        <CheckboxLabel label="Varizes" checked={formData.historicoPaciente.disturbioCirculatorio.varizes} onChange={c => updateDeepField('historicoPaciente', 'disturbioCirculatorio', 'varizes', c)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <CheckboxLabel label="Diabetes" checked={formData.historicoPaciente.diabetes.tem} onChange={c => updateDeepField('historicoPaciente', 'diabetes', 'tem', c)} />
                            {formData.historicoPaciente.diabetes.tem && <div className="ml-6 flex gap-2 mt-1"><input type="text" className="border p-1 text-xs rounded w-20" placeholder="Tipo" value={formData.historicoPaciente.diabetes.tipo} onChange={e => updateDeepField('historicoPaciente', 'diabetes', 'tipo', e.target.value)} /><input type="text" className="border p-1 text-xs rounded flex-1" placeholder="Desde..." value={formData.historicoPaciente.diabetes.desde} onChange={e => updateDeepField('historicoPaciente', 'diabetes', 'desde', e.target.value)} /></div>}
                        </div>
                        <div>
                            <CheckboxLabel label="Metais no Corpo" checked={formData.historicoPaciente.metais.tem} onChange={c => updateDeepField('historicoPaciente', 'metais', 'tem', c)} />
                            {formData.historicoPaciente.metais.tem && <input type="text" className="border p-1 text-xs rounded w-full mt-1" placeholder="Região" value={formData.historicoPaciente.metais.regiao} onChange={e => updateDeepField('historicoPaciente', 'metais', 'regiao', e.target.value)} />}
                        </div>
                    </div>
                </div>

                {/* Hábitos e Alimentação */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Hábitos e Alimentação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Ingestão de Água</label>
                            <select className="w-full p-2 border rounded-md" value={formData.historicoPaciente.agua.quantidade} onChange={e => updateDeepField('historicoPaciente', 'agua', 'quantidade', e.target.value)}>
                                <option value="">Selecione...</option><option>1 litro/dia</option><option>1.5 litros/dia</option><option>2 litros/dia</option><option>Mais de 2L</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Frituras</label>
                            <select className="w-full p-2 border rounded-md" value={formData.historicoPaciente.frituras} onChange={e => updateSectionField('historicoPaciente', 'frituras', e.target.value)}>
                                <option value="">Selecione...</option><option>Muito Frequente</option><option>Pouco Frequente</option><option>Sem Consumo</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Refrigerantes/Doces</label>
                            <select className="w-full p-2 border rounded-md" value={formData.historicoPaciente.refrigerantesDoces} onChange={e => updateSectionField('historicoPaciente', 'refrigerantesDoces', e.target.value)}>
                                <option value="">Selecione...</option><option>Muito Frequente</option><option>Pouco Frequente</option><option>Sem Consumo</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Intestino</label>
                            <select className="w-full p-2 border rounded-md" value={formData.historicoPaciente.intestino} onChange={e => updateSectionField('historicoPaciente', 'intestino', e.target.value)}>
                                <option value="">Selecione...</option><option>Regular</option><option>Irregular</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Alimentos Ingeridos Semanalmente</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {Object.keys(formData.historicoPaciente.alimentacao).map(key => (
                                <div key={key}>
                                    <CheckboxLabel label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} checked={(formData.historicoPaciente.alimentacao as any)[key]} onChange={c => updateDeepField('historicoPaciente', 'alimentacao', key, c)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Medidas e IMC */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Medidas e IMC</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Peso (kg)</label>
                            <input type="number" className="w-full p-2 border rounded-md" value={formData.medidas.peso} onChange={e => updateSectionField('medidas', 'peso', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Altura (m)</label>
                            <input type="number" className="w-full p-2 border rounded-md" step="0.01" value={formData.medidas.altura} onChange={e => updateSectionField('medidas', 'altura', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">IMC</label>
                            <input type="text" className="w-full p-2 border rounded-md bg-gray-100" readOnly value={formData.medidas.imc} />
                        </div>
                    </div>

                    {/* Tabela IMC */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs rounded-md overflow-hidden border">
                            <thead className="bg-gray-100 text-left">
                                <tr><th className="p-2">IMC (Kg/m²)</th><th className="p-2">Classificação</th></tr>
                            </thead>
                            <tbody>
                                <tr className="bg-green-50 text-green-700"><td className="p-2">18,5 - 24,9</td><td className="p-2">Peso Saudável</td></tr>
                                <tr className="bg-yellow-50 text-yellow-700"><td className="p-2">25 - 29,9</td><td className="p-2">Sobrepeso</td></tr>
                                <tr className="bg-orange-50 text-orange-700"><td className="p-2">30 - 34,9</td><td className="p-2">Obesidade Grau I</td></tr>
                                <tr className="bg-red-50 text-red-700"><td className="p-2">35 - 39,9</td><td className="p-2">Obesidade Grau II</td></tr>
                                <tr className="bg-purple-50 text-purple-700"><td className="p-2">40 ou mais</td><td className="p-2">Obesidade Mórbida</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Visuals */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                    <h3 className="font-bold text-lg border-b pb-2">Avaliação Visual</h3>

                    {/* Composição */}
                    <div>
                        <h4 className="font-bold text-sm text-gray-700 mb-2">Tipo de Composição Corporal</h4>
                        <img src="/images/Tipo de Composição Corporal.png" alt="Composição Corporal" className="h-40 object-contain mb-2" />
                        <div className="flex gap-4">
                            <RadioLabel name="composicao" label="Androide" value={formData.composicaoCorporal} checkedValue="Androide" onChange={(v: string) => updateRootField('composicaoCorporal', v)} />
                            <RadioLabel name="composicao" label="Ginoide" value={formData.composicaoCorporal} checkedValue="Ginoide" onChange={(v: string) => updateRootField('composicaoCorporal', v)} />
                        </div>
                    </div>

                    {/* Stunkard */}
                    <div>
                        <h4 className="font-bold text-sm text-gray-700 mb-2">Escala de Stunkard</h4>
                        <div className="flex flex-wrap gap-4 mb-4">
                            <img src="/images/STUNKARD Mulher.png" alt="Stunkard Mulher" className="h-32 object-contain" />
                            <img src="/images/STUNKARD Homem.png" alt="Stunkard Homem" className="h-32 object-contain" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-500">Atual (Número)</label><input type="text" className="w-full p-2 border rounded" value={formData.satisfacaoCorporal.atual} onChange={e => updateSectionField('satisfacaoCorporal', 'atual', e.target.value)} /></div>
                            <div><label className="text-xs font-bold text-gray-500">Desejada (Número)</label><input type="text" className="w-full p-2 border rounded" value={formData.satisfacaoCorporal.desejada} onChange={e => updateSectionField('satisfacaoCorporal', 'desejada', e.target.value)} /></div>
                        </div>
                    </div>

                    {/* Areas */}
                    <div>
                        <h4 className="font-bold text-sm text-gray-700 mb-2">Áreas (Gordura/Estrias/Flacidez)</h4>
                        <img src="/images/Areas de Gordura.png" alt="Áreas" className="w-full max-w-md object-contain border rounded-lg" />
                    </div>
                </div>

                {/* EVA Scale */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-lg border-b pb-2 mb-4">Nível de Satisfação (EVA)</h3>
                    <div className="space-y-4 py-4">
                        <label className="block text-sm font-medium text-gray-900">
                            Qual o grau de satisfação mediante a realização do tratamento proposto? <br />
                            <span className="text-gray-500 font-normal">
                                Selecione um número entre 0 (insatisfeita), 5 (satisfeita) e 10 (extremamente satisfeita).
                            </span>
                        </label>

                        <div className="flex flex-wrap gap-2 justify-between">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                                let colorClass = "";
                                if (num <= 3) colorClass = "hover:bg-red-100 border-red-200 text-red-700";
                                else if (num <= 6) colorClass = "hover:bg-yellow-100 border-yellow-200 text-yellow-700";
                                else if (num <= 8) colorClass = "hover:bg-green-100 border-green-200 text-green-700";
                                else colorClass = "hover:bg-blue-100 border-blue-200 text-blue-700";

                                const isSelected = formData.eva === num;
                                const activeClass = isSelected
                                    ? (num <= 3 ? "bg-red-500 text-white border-red-500"
                                        : num <= 6 ? "bg-yellow-400 text-white border-yellow-400"
                                            : num <= 8 ? "bg-green-500 text-white border-green-500"
                                                : "bg-blue-600 text-white border-blue-600")
                                    : "bg-white";

                                return (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => updateRootField('eva', num)}
                                        className={`w-10 h-10 rounded-full border-2 font-bold transition-all ${colorClass} ${activeClass}`}
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-between text-xs text-gray-500 px-2">
                            <span>Insatisfeita (0)</span>
                            <span>Satisfeita (5)</span>
                            <span>Extremamente Satisfeita (10)</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={handleSave} className="bg-primary text-white px-8 py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2 font-bold text-lg">
                        <span className="material-symbols-outlined">save</span> Salvar Anamnese
                    </button>
                </div>
            </div>

            {/* PRINT LAYOUT - REDESIGNED & COMPACTED */}
            <div id="print-view" className="hidden print:block bg-white w-[210mm] mx-auto p-[15mm] text-xs font-serif text-gray-900 leading-normal">
                {/* Header */}
                <div className="text-center mb-5 border-b-2 border-black pb-2">
                    <h1 className="text-xl font-bold uppercase tracking-widest text-black mb-0.5">Avaliação Corporal</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ficha de Anamnese Completa</p>
                </div>

                {/* DADOS PESSOAIS */}
                <div className="mb-4">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Dados Pessoais</h2>
                    <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-1.5 ml-2">
                        <span className="font-bold text-gray-700">Nome:</span> <span className="font-medium border-b border-gray-200">{patientData.name}</span>
                        <span className="font-bold text-gray-700">Data Nasc:</span> <span className="font-medium border-b border-gray-200">{formatDate(new Date(patientData.birthDate))}</span>

                        <span className="font-bold text-gray-700">Telefone:</span> <span className="font-medium border-b border-gray-200">{patientData.phone}</span>
                        <span className="font-bold text-gray-700">Email:</span> <span className="font-medium border-b border-gray-200">{patientData.email}</span>

                        <span className="font-bold text-gray-700">Endereço:</span> <span className="font-medium border-b border-gray-200 col-span-3">{patientData.address}</span>

                        <span className="font-bold text-gray-700">Profissão:</span> <span className="font-medium border-b border-gray-200">{formData.dadosPessoais.profissao}</span>
                        <span className="font-bold text-gray-700">Cidade:</span> <span className="font-medium border-b border-gray-200">{formData.dadosPessoais.cidade}</span>
                    </div>
                </div>

                {/* MOTIVO DA CONSULTA */}
                <div className="mb-4">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Motivo da Consulta</h2>
                    <div className="ml-2 mb-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">Queixa Principal:</span>
                        <div className="p-1.5 border border-gray-200 rounded-sm bg-gray-50/30 min-h-[2.5rem] mt-0.5">
                            {formData.motivoConsulta.queixa}
                        </div>
                    </div>
                    <div className="ml-2 grid grid-cols-1 gap-1">
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-700">Tratamento Prévio:</span>
                            <span className="font-medium">{formData.motivoConsulta.tratamentoPrevio.realizado ? `Sim (${formData.motivoConsulta.tratamentoPrevio.qual})` : 'Não'}</span>
                        </div>
                    </div>
                </div>

                {/* HISTÓRICO PACIENTE */}
                <div className="mb-4">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Histórico de Saúde</h2>
                    <div className="ml-2 grid grid-cols-2 gap-x-6 gap-y-1.5 align-top">
                        <div className="flex flex-col gap-1">
                            {/* Simple Checks */}
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 border border-gray-400 flex items-center justify-center text-[8px] ${formData.historicoPaciente.marcapasso ? 'bg-black text-white' : ''}`}>{formData.historicoPaciente.marcapasso && '✓'}</span>
                                <span>Marcapasso</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 border border-gray-400 flex items-center justify-center text-[8px] ${formData.historicoPaciente.epilepsia ? 'bg-black text-white' : ''}`}>{formData.historicoPaciente.epilepsia && '✓'}</span>
                                <span>Epilepsia</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 border border-gray-400 flex items-center justify-center text-[8px] ${formData.historicoPaciente.pressao.hipertensao ? 'bg-black text-white' : ''}`}>{formData.historicoPaciente.pressao.hipertensao && '✓'}</span>
                                <span>Hipertensão</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 border border-gray-400 flex items-center justify-center text-[8px] ${formData.historicoPaciente.pressao.hipotensao ? 'bg-black text-white' : ''}`}>{formData.historicoPaciente.pressao.hipotensao && '✓'}</span>
                                <span>Hipotensão</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex gap-2"><span className="font-bold w-20">Diabetes:</span> {formData.historicoPaciente.diabetes.tem ? `Sim (${formData.historicoPaciente.diabetes.tipo})` : 'Não'}</div>
                            <div className="flex gap-2"><span className="font-bold w-20">Cardíacos:</span> {formData.historicoPaciente.cardiacos.problema ? `Sim (${formData.historicoPaciente.cardiacos.quais})` : 'Não'}</div>
                            <div className="flex gap-2"><span className="font-bold w-20">Alergias:</span> {formData.historicoPaciente.alergias.uso ? formData.historicoPaciente.alergias.quais : 'Não'}</div>
                            <div className="flex gap-2"><span className="font-bold w-20">Medicação:</span> {formData.historicoPaciente.medicacao.uso ? formData.historicoPaciente.medicacao.quais : 'Não'}</div>
                        </div>
                    </div>
                </div>

                {/* HÁBITOS */}
                <div className="mb-4">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Hábitos e Alimentação</h2>
                    <div className="ml-2 grid grid-cols-4 gap-2 text-[10px]">
                        <div><span className="font-bold block text-gray-500 text-[8px] uppercase">Água</span> {formData.historicoPaciente.agua.quantidade}</div>
                        <div><span className="font-bold block text-gray-500 text-[8px] uppercase">Frituras</span> {formData.historicoPaciente.frituras}</div>
                        <div><span className="font-bold block text-gray-500 text-[8px] uppercase">Doces</span> {formData.historicoPaciente.refrigerantesDoces}</div>
                        <div><span className="font-bold block text-gray-500 text-[8px] uppercase">Intestino</span> {formData.historicoPaciente.intestino}</div>
                    </div>
                </div>

                {/* MEDIDAS (Text Only) */}
                <div className="mb-4">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Medidas e Composição</h2>
                    <div className="ml-2 flex gap-8 mb-2">
                        <div><span className="font-bold">Peso:</span> {formData.medidas.peso} kg</div>
                        <div><span className="font-bold">Altura:</span> {formData.medidas.altura} m</div>
                        <div><span className="font-bold">IMC:</span> {formData.medidas.imc}</div>
                    </div>
                    <div className="ml-2 flex gap-8">
                        <div><span className="font-bold">Biotipo:</span> {formData.composicaoCorporal || '-'}</div>
                        <div><span className="font-bold">Satisfação Corporal (Stunkard):</span> Atual: {formData.satisfacaoCorporal.atual} / Desejada: {formData.satisfacaoCorporal.desejada}</div>
                    </div>
                </div>

                {/* DECLARAÇÃO & ASSINATURAS (Avoid break inside) */}
                <div className="break-inside-avoid mt-2" style={{ pageBreakInside: 'avoid' }}>
                    <div className="mb-6 px-2">
                        <h2 className="font-bold border-b border-gray-200 mb-2 text-[10px] uppercase text-gray-500">Termo de Responsabilidade</h2>
                        <p className="text-[9px] text-justify text-gray-800 leading-relaxed italic">
                            "Eu, abaixo assinado(a), declaro que as informações registradas nesta ficha de anamnese são verdadeiras e assumo inteira responsabilidade por elas. Declaro que não omiti nenhuma informação sobre minha saúde, hábitos ou histórico clínico. Estou ciente de que a omissão de dados pode comprometer a segurança e a eficácia dos procedimentos estéticos. Autorizo o processamento destes dados para fins de acompanhamento profissional."
                        </p>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between gap-16 px-8">
                            <div className="flex-1 text-center">
                                <div className="border-b border-black mb-2 relative">
                                    {/* Visual Signature Stamp */}
                                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 pointer-events-none">
                                        <div className="border-2 border-[#556b2f] text-[#556b2f] rounded p-1 px-2 text-[8px] font-bold uppercase tracking-widest leading-none transform -rotate-6 opacity-80 whitespace-nowrap">
                                            Assinado Digitalmente
                                            <div className="text-[6px] font-normal mt-px text-center">{formatDate(new Date())}</div>
                                            <div className="text-[6px] font-normal text-center">Dra. Gabriela Mari</div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[9px] font-bold uppercase tracking-wider">Profissional Responsável</p>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="border-b border-black mb-2"></div>
                                <p className="text-[9px] font-bold uppercase tracking-wider">Assinatura do Paciente</p>
                            </div>
                        </div>
                        <p className="text-[8px] text-center mt-4 text-gray-400">
                            {formatDate(new Date())} • Documento processado digitalmente • Chave: {Math.random().toString(36).substring(7).toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>
            {/* Password Modal */}
            <CertificatePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSuccess={() => handleSave()}
            />
        </div>
    );
};

export default AnamneseCorporal;
