import React, { useState, useEffect, useRef } from 'react';
import { formatDate } from '../lib/dateUtils';
import { useReactToPrint } from 'react-to-print';

interface AnamneseFacialProps {
    patientData: {
        name: string;
        birthDate: string;
        email: string;
        phone: string;
        address: string;
    };
    onPrint?: () => void; // Optional
    patientId?: string;
}

const AnamneseFacial: React.FC<AnamneseFacialProps> = ({ patientData, onPrint, patientId }) => {

    // Print Ref
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => printRef.current,
        documentTitle: `Anamnese Facial - ${patientData?.name || 'Paciente'}`,
        pageStyle: `
            @page {
                size: auto;
                margin: 0mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                }
                /* Force visibility of the printed content */
                #print-view {
                    display: block !important;
                    width: 100% !important;
                }
            }
        `
    });

    // 1. Initial State Definition
    const initialFormState = {
        queixaPrincipal: '',
        historicoSaude: {
            diabetes: false, hipertensao: false, tireoide: false, cardiacos: false,
            marcapasso: false, autoimune: false, coagulacao: false, herpes: false,
            epilepsia: false, gestante: false, lactante: false, tentante: false,
            alergias: '', medicamentos: ''
        },
        habitosDiarios: {
            exposicaoSolar: 'Diária com proteção',
            tabagismo: 'Não fuma',
            agua: '1 a 2 litros',
            alimentacao: 'Saudável / Equilibrada'
        },
        avaliacaoPele: {
            biotipo: { eudermica: false, lipidica: false, alipica: false, mista: false },
            estado: { normal: false, desidratado: false, sensibilizado: false, acneico: false, seborreico: false },
            textura: { lisa: false, aspera: false },
            espessura: { fina: false, muitofina: false, espessa: false },
            ostios: { dilatadosT: false, dilatadosFace: false, contraidos: false },
            acne: { grau1: false, grau2: false, grau3: false, grau4: false, grau5: false },
            involucao: { linhas: false, sulcos: false, rugas: false, elastose: false, ptose: false, local: '' },
            fototipo: { tipo1: false, tipo2: false, tipo3: false, tipo4: false, tipo5: false },
            fotoenvelhecimento: { tipo1: false, tipo2: false, tipo3: false, tipo4: false, obs: '' },
            manchas: { acromia: false, efelides: false, hipocromia: false, melanose: false, hipercromia: false, melanoseSolar: false, outros: '' },
            vascular: { equimose: false, petequias: false, telangectasias: false, eritema: false, nevoRubi: false, rosacea: false, outros: '' },
            lesoes: { comedoes: false, papula: false, pustula: false, millium: false, cisto: false, nodulo: false, siringoma: false, nevoMelanocitico: false, xantelasma: false, dermatite: false, ulceracao: false, hiperqueratose: false, psoriase: false, outros: '' },
            cicatriz: { hipertrofica: false, atrofica: false, queloideana: false, retratil: false, hipercromica: false, hipocromica: false },
            pelos: { hirsutismo: false, hipertricose: false, alopecia: false, foliculite: false },
            olheiras: { sim: false, nao: false, obs: '' },
            flacidez: { tissular: '', muscular: '' }
        },
        planoTratamento: {
            objetivos: '',
            tratamentoProposto: '',
            observacoes: ''
        }
    };

    const [formData, setFormData] = useState(initialFormState);

    // 2. Load Data
    useEffect(() => {
        if (patientId) {
            const savedData = localStorage.getItem(`anamnese_facial_${patientId}`);
            if (savedData) {
                try {
                    setFormData(JSON.parse(savedData));
                } catch (e) {
                    console.error("Failed to parse saved anamnesis data", e);
                }
            }
        }
    }, [patientId]);

    // 3. Handle Save
    const handleSave = () => {
        if (patientId) {
            localStorage.setItem(`anamnese_facial_${patientId}`, JSON.stringify(formData));
            alert('Anamnese salva com sucesso!');
        } else {
            alert('Erro: ID do paciente não encontrado.');
        }
    };

    const age = ((birthDate: string) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    })(patientData.birthDate);

    // Helper functions
    const updateField = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...(prev as any)[section], [field]: value }
        }));
    };

    const updateSkinField = (category: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            avaliacaoPele: {
                ...prev.avaliacaoPele,
                [category]: { ...(prev.avaliacaoPele as any)[category], [field]: value }
            }
        }));
    };

    const CheckboxItem = ({ label, checked, onChange }: { label: string, checked?: boolean, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors group ${checked ? 'bg-primary/5 border-primary' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'}`}>
            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20" checked={!!checked} onChange={onChange} />
            <span className={`text-sm font-medium group-hover:text-gray-900 ${checked ? 'text-primary-dark' : 'text-gray-700'}`}>{label}</span>
        </label>
    );

    return (
        <div className="w-full">
            {/* WEB UI */}
            <div id="web-view" className="print:hidden space-y-6 p-6 md:p-8 pb-24 bg-gray-50/50">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-gray-900">Anamnese Facial</h1>
                        <p className="text-sm text-gray-500">Preencha os dados abaixo para avaliação.</p>
                    </div>
                    <button type="button" onClick={onPrint} className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium">
                        <span className="material-symbols-outlined">print</span> Imprimir
                    </button>
                </div>

                {/* Queixa */}
                <div className="bg-white p-8 rounded-xl border border-[#e3e0de] shadow-sm">
                    <h3 className="font-serif font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">sentiment_dissatisfied</span> Queixa Principal
                    </h3>
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-400">O que mais te incomoda hoje?</label>
                        <textarea className="w-full h-32 p-4 rounded-xl bg-gray-50/50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none text-base text-gray-900" placeholder="Ex: Rugas na testa..." value={formData.queixaPrincipal} onChange={(e) => setFormData({ ...formData, queixaPrincipal: e.target.value })}></textarea>
                    </div>
                </div>

                {/* Histórico Saúde */}
                <div className="bg-white p-8 rounded-xl border border-[#e3e0de] shadow-sm">
                    <h3 className="font-serif font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">medical_services</span> Histórico de Saúde
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['diabetes', 'hipertensao', 'tireoide', 'cardiacos', 'marcapasso', 'autoimune', 'coagulacao', 'herpes', 'epilepsia', 'gestante', 'lactante', 'tentante'].map(key => (
                            <div key={key}>
                                <CheckboxItem label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()} checked={(formData.historicoSaude as any)[key]} onChange={(e) => updateField('historicoSaude', key, e.target.checked)} />
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Alergias</label>
                            <input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.historicoSaude.alergias} onChange={(e) => updateField('historicoSaude', 'alergias', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Medicamentos</label>
                            <input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.historicoSaude.medicamentos} onChange={(e) => updateField('historicoSaude', 'medicamentos', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Hábitos */}
                <div className="bg-white p-8 rounded-xl border border-[#e3e0de] shadow-sm">
                    <h3 className="font-serif font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">wb_sunny</span> Hábitos Diários
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Exposição Solar</label>
                            <select className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.habitosDiarios.exposicaoSolar} onChange={(e) => updateField('habitosDiarios', 'exposicaoSolar', e.target.value)}>
                                <option>Diária com proteção</option><option>Diária sem proteção</option><option>Ocasional</option><option>Rara</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Tabagismo</label>
                            <select className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.habitosDiarios.tabagismo} onChange={(e) => updateField('habitosDiarios', 'tabagismo', e.target.value)}>
                                <option>Não fuma</option><option>Ocasional</option><option>Diário</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Ingestão de Água</label>
                            <select className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.habitosDiarios.agua} onChange={(e) => updateField('habitosDiarios', 'agua', e.target.value)}>
                                <option>Menos de 1 litro</option><option>1 a 2 litros</option><option>Mais de 2 litros</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Alimentação</label>
                            <select className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.habitosDiarios.alimentacao} onChange={(e) => updateField('habitosDiarios', 'alimentacao', e.target.value)}>
                                <option>Saudável / Equilibrada</option><option>Regular</option><option>Rica em açúcares/gorduras</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Avaliação Pele */}
                <div className="bg-white p-8 rounded-xl border border-[#e3e0de] shadow-sm">
                    <h3 className="font-serif font-bold text-lg text-gray-900 mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">face</span> Avaliação da Pele</h3>
                    <div className="space-y-6">
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Biotipo</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div key="eudermica"><CheckboxItem label="Eudérmica" checked={formData.avaliacaoPele.biotipo.eudermica} onChange={(e) => updateSkinField('biotipo', 'eudermica', e.target.checked)} /></div>
                            <div key="lipidica"><CheckboxItem label="Lipídica" checked={formData.avaliacaoPele.biotipo.lipidica} onChange={(e) => updateSkinField('biotipo', 'lipidica', e.target.checked)} /></div>
                            <div key="alipica"><CheckboxItem label="Alípica" checked={formData.avaliacaoPele.biotipo.alipica} onChange={(e) => updateSkinField('biotipo', 'alipica', e.target.checked)} /></div>
                            <div key="mista"><CheckboxItem label="Mista" checked={formData.avaliacaoPele.biotipo.mista} onChange={(e) => updateSkinField('biotipo', 'mista', e.target.checked)} /></div>
                        </div></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Estado</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['normal', 'desidratado', 'sensibilizado', 'acneico', 'seborreico'].map(k => <div key={k}><CheckboxItem label={k.charAt(0).toUpperCase() + k.slice(1)} checked={(formData.avaliacaoPele.estado as any)[k]} onChange={(e) => updateSkinField('estado', k, e.target.checked)} /></div>)}
                        </div></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Textura</label><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div key="lisa"><CheckboxItem label="Lisa" checked={formData.avaliacaoPele.textura.lisa} onChange={(e) => updateSkinField('textura', 'lisa', e.target.checked)} /></div>
                            <div key="aspera"><CheckboxItem label="Áspera" checked={formData.avaliacaoPele.textura.aspera} onChange={(e) => updateSkinField('textura', 'aspera', e.target.checked)} /></div>
                        </div></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Espessura</label><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {['fina', 'muitofina', 'espessa'].map(k => <div key={k}><CheckboxItem label={k.charAt(0).toUpperCase() + k.slice(1)} checked={(formData.avaliacaoPele.espessura as any)[k]} onChange={(e) => updateSkinField('espessura', k, e.target.checked)} /></div>)}
                        </div></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Óstios</label><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div key="dilatadosT"><CheckboxItem label="Dilatados Zona T" checked={formData.avaliacaoPele.ostios.dilatadosT} onChange={(e) => updateSkinField('ostios', 'dilatadosT', e.target.checked)} /></div>
                            <div key="dilatadosFace"><CheckboxItem label="Dilatados Face" checked={formData.avaliacaoPele.ostios.dilatadosFace} onChange={(e) => updateSkinField('ostios', 'dilatadosFace', e.target.checked)} /></div>
                            <div key="contraidos"><CheckboxItem label="Contraídos" checked={formData.avaliacaoPele.ostios.contraidos} onChange={(e) => updateSkinField('ostios', 'contraidos', e.target.checked)} /></div>
                        </div></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Acne</label><div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {['grau1', 'grau2', 'grau3', 'grau4', 'grau5'].map(k => <div key={k}><CheckboxItem label={k.replace('grau', 'Grau ')} checked={(formData.avaliacaoPele.acne as any)[k]} onChange={(e) => updateSkinField('acne', k, e.target.checked)} /></div>)}
                        </div></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Involução</label><div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                            {['linhas', 'sulcos', 'rugas', 'elastose', 'ptose'].map(k => <div key={k}><CheckboxItem label={k.charAt(0).toUpperCase() + k.slice(1)} checked={(formData.avaliacaoPele.involucao as any)[k]} onChange={(e) => updateSkinField('involucao', k, e.target.checked)} /></div>)}
                        </div><input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200" placeholder="Local..." value={formData.avaliacaoPele.involucao.local} onChange={(e) => updateSkinField('involucao', 'local', e.target.value)} /></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Fototipo</label><div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {['tipo1', 'tipo2', 'tipo3', 'tipo4', 'tipo5'].map(k => <div key={k}><CheckboxItem label={'Tipo ' + k.slice(4)} checked={(formData.avaliacaoPele.fototipo as any)[k]} onChange={(e) => updateSkinField('fototipo', k, e.target.checked)} /></div>)}
                        </div></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Fotoenvelhecimento</label><div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-3">
                            {['tipo1', 'tipo2', 'tipo3', 'tipo4'].map(k => <div key={k}><CheckboxItem label={'Tipo ' + k.slice(4)} checked={(formData.avaliacaoPele.fotoenvelhecimento as any)[k]} onChange={(e) => updateSkinField('fotoenvelhecimento', k, e.target.checked)} /></div>)}
                        </div><input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200" placeholder="Obs..." value={formData.avaliacaoPele.fotoenvelhecimento.obs} onChange={(e) => updateSkinField('fotoenvelhecimento', 'obs', e.target.value)} /></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Manchas</label><div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                            {['acromia', 'efelides', 'hipocromia', 'melanose', 'hipercromia', 'melanoseSolar'].map(k => <div key={k}><CheckboxItem label={k.charAt(0).toUpperCase() + k.slice(1)} checked={(formData.avaliacaoPele.manchas as any)[k]} onChange={(e) => updateSkinField('manchas', k, e.target.checked)} /></div>)}
                        </div><input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200" placeholder="Outros..." value={formData.avaliacaoPele.manchas.outros} onChange={(e) => updateSkinField('manchas', 'outros', e.target.value)} /></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Vascular</label><div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                            {['equimose', 'petequias', 'telangectasias', 'eritema', 'nevoRubi', 'rosacea'].map(k => <div key={k}><CheckboxItem label={k.charAt(0).toUpperCase() + k.slice(1)} checked={(formData.avaliacaoPele.vascular as any)[k]} onChange={(e) => updateSkinField('vascular', k, e.target.checked)} /></div>)}
                        </div><input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200" placeholder="Outros..." value={formData.avaliacaoPele.vascular.outros} onChange={(e) => updateSkinField('vascular', 'outros', e.target.value)} /></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Lesões</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            {['comedoes', 'papula', 'pustula', 'millium', 'cisto', 'nodulo', 'siringoma', 'nevoMelanocitico', 'xantelasma', 'dermatite', 'ulceracao', 'hiperqueratose', 'psoriase'].map(k => <div key={k}><CheckboxItem label={k.charAt(0).toUpperCase() + k.slice(1)} checked={(formData.avaliacaoPele.lesoes as any)[k]} onChange={(e) => updateSkinField('lesoes', k, e.target.checked)} /></div>)}
                        </div><input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200" placeholder="Outros..." value={formData.avaliacaoPele.lesoes.outros} onChange={(e) => updateSkinField('lesoes', 'outros', e.target.value)} /></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Cicatriz</label><div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['hipertrofica', 'atrofica', 'queloideana', 'retratil', 'hipercromica', 'hipocromica'].map(k => <div key={k}><CheckboxItem label={k.charAt(0).toUpperCase() + k.slice(1)} checked={(formData.avaliacaoPele.cicatriz as any)[k]} onChange={(e) => updateSkinField('cicatriz', k, e.target.checked)} /></div>)}
                        </div></div>
                        <div><label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Pelos</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['hirsutismo', 'hipertricose', 'alopecia', 'foliculite'].map(k => <div key={k}><CheckboxItem label={k.charAt(0).toUpperCase() + k.slice(1)} checked={(formData.avaliacaoPele.pelos as any)[k]} onChange={(e) => updateSkinField('pelos', k, e.target.checked)} /></div>)}
                        </div></div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Olheiras</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                        <input type="radio" name="olheiras" className="accent-primary" checked={formData.avaliacaoPele.olheiras.sim} onChange={() => updateSkinField('olheiras', 'sim', true)} onClick={() => updateSkinField('olheiras', 'nao', false)} /> Sim
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                        <input type="radio" name="olheiras" className="accent-primary" checked={formData.avaliacaoPele.olheiras.nao} onChange={() => updateSkinField('olheiras', 'nao', true)} onClick={() => updateSkinField('olheiras', 'sim', false)} /> Não
                                    </label>
                                </div>
                                <input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200" placeholder="Tipo / Observação..." value={formData.avaliacaoPele.olheiras.obs} onChange={(e) => updateSkinField('olheiras', 'obs', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3 block">Flacidez</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><span className="text-sm font-bold text-gray-700">Tissular</span><input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200" placeholder="Localização..." value={formData.avaliacaoPele.flacidez.tissular} onChange={(e) => updateSkinField('flacidez', 'tissular', e.target.value)} /></div>
                                <div className="space-y-2"><span className="text-sm font-bold text-gray-700">Muscular</span><input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50/50 border border-gray-200" placeholder="Localização..." value={formData.avaliacaoPele.flacidez.muscular} onChange={(e) => updateSkinField('flacidez', 'muscular', e.target.value)} /></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plano de Tratamento */}
                <div className="bg-white p-8 rounded-xl border border-[#e3e0de] shadow-sm">
                    <h3 className="font-serif font-bold text-lg text-gray-900 mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">edit_note</span> Plano de Tratamento</h3>
                    <div className="space-y-6">
                        <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wide text-gray-400">Objetivos</label><textarea className="w-full h-24 p-4 rounded-xl bg-gray-50/50 border border-gray-200" value={formData.planoTratamento.objetivos} onChange={(e) => updateField('planoTratamento', 'objetivos', e.target.value)}></textarea></div>
                        <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wide text-gray-400">Tratamento Proposto</label><textarea className="w-full h-24 p-4 rounded-xl bg-gray-50/50 border border-gray-200" value={formData.planoTratamento.tratamentoProposto} onChange={(e) => updateField('planoTratamento', 'tratamentoProposto', e.target.value)}></textarea></div>
                        <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wide text-gray-400">Observações</label><textarea className="w-full h-24 p-4 rounded-xl bg-gray-50/50 border border-gray-200" value={formData.planoTratamento.observacoes} onChange={(e) => updateField('planoTratamento', 'observacoes', e.target.value)}></textarea></div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={handleSave} className="bg-primary text-white px-8 py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2 font-bold text-lg">
                        <span className="material-symbols-outlined">save</span> Salvar
                    </button>
                </div>
            </div>

            {/* PRINT LAYOUT - REDESIGNED */}
            <div id="print-view" className="hidden print:block bg-white w-[210mm] mx-auto p-[15mm] text-xs font-serif text-gray-900 leading-normal">
                {/* Header - Compacted */}
                <div className="text-center mb-5 border-b-2 border-black pb-2">
                    <h1 className="text-xl font-bold uppercase tracking-widest text-black mb-0.5">Ficha de Anamnese Facial</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avaliação Estética Personalizada</p>
                </div>

                {/* DADOS PESSOAIS - Compacted */}
                <div className="mb-4">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Dados Pessoais</h2>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 ml-2">
                        <span className="font-bold text-gray-700">Nome:</span>
                        <span className="font-medium border-b border-gray-200">{patientData.name}</span>

                        <span className="font-bold text-gray-700">Idade:</span>
                        <span className="font-medium border-b border-gray-200">{age} anos</span>

                        <span className="font-bold text-gray-700">Endereço:</span>
                        <span className="font-medium border-b border-gray-200">{patientData.address}</span>

                        <span className="font-bold text-gray-700">Contatos:</span>
                        <div className="flex gap-4 border-b border-gray-200">
                            <span className="font-medium">{patientData.phone}</span>
                            <span className="text-gray-400">|</span>
                            <span className="font-medium">{patientData.email}</span>
                        </div>
                    </div>
                </div>

                {/* QUEIXA PRINCIPAL - Compacted */}
                <div className="mb-4">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Queixa Principal</h2>
                    <div className="ml-2 p-1.5 border border-gray-200 rounded-sm bg-gray-50/30 min-h-[2.5rem]">
                        {formData.queixaPrincipal}
                    </div>
                </div>

                {/* HISTÓRICO CLINICO - Compacted */}
                <div className="mb-4">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Histórico Clínico</h2>
                    <div className="ml-2">
                        <div className="grid grid-cols-4 gap-y-1.5 gap-x-1 mb-2">
                            {['diabetes', 'hipertensao', 'tireoide', 'cardiacos', 'marcapasso', 'autoimune', 'coagulacao', 'herpes', 'epilepsia', 'gestante', 'lactante', 'tentante'].map(k => (
                                <div key={k} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 border border-gray-400 rounded-sm flex items-center justify-center text-[8px] ${(formData.historicoSaude as any)[k] ? 'bg-black text-white border-black' : 'bg-white'}`}>
                                        {(formData.historicoSaude as any)[k] && '✓'}
                                    </div>
                                    <span className="text-[9px] uppercase tracking-tight text-gray-700">{k}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                            <span className="font-bold text-gray-700">Alergias:</span>
                            <span className="font-medium border-b border-gray-200">{formData.historicoSaude.alergias || 'Nenhuma'}</span>

                            <span className="font-bold text-gray-700">Medicamentos:</span>
                            <span className="font-medium border-b border-gray-200">{formData.historicoSaude.medicamentos || 'Nenhum'}</span>
                        </div>
                    </div>
                </div>

                {/* HÁBITOS - Compacted */}
                <div className="mb-4">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Hábitos Diários</h2>
                    <div className="ml-2 grid grid-cols-2 gap-x-6 gap-y-1">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Exposição Solar</span>
                            <span className="font-medium border-b border-gray-200 py-0.5">{formData.habitosDiarios.exposicaoSolar}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Tabagismo</span>
                            <span className="font-medium border-b border-gray-200 py-0.5">{formData.habitosDiarios.tabagismo}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Ingestão de Água</span>
                            <span className="font-medium border-b border-gray-200 py-0.5">{formData.habitosDiarios.agua}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Alimentação</span>
                            <span className="font-medium border-b border-gray-200 py-0.5">{formData.habitosDiarios.alimentacao}</span>
                        </div>
                    </div>
                </div>

                {/* AVALIAÇÃO DA PELE - Compacted */}
                <div className="mb-4 break-inside-avoid">
                    <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Avaliação da Pele</h2>
                    <div className="ml-2 space-y-2">
                        {/* Summary Badges */}
                        <div className="flex gap-4 pb-1 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-700">Biotipo:</span>
                                {['eudermica', 'lipidica', 'alipica', 'mista'].map(k => (formData.avaliacaoPele.biotipo as any)[k] &&
                                    <span key={k} className="px-1.5 py-px bg-gray-100 text-black rounded text-[9px] uppercase font-bold border border-gray-300">{k}</span>
                                )}
                            </div>
                            <div className="w-px bg-gray-300 h-3 self-center mx-2"></div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-700">Estado:</span>
                                {['normal', 'desidratado', 'sensibilizado', 'acneico', 'seborreico'].map(k => (formData.avaliacaoPele.estado as any)[k] &&
                                    <span key={k} className="px-1.5 py-px bg-gray-100 text-black rounded text-[9px] uppercase font-bold border border-gray-300">{k}</span>
                                )}
                            </div>
                        </div>

                        {/* Details Grid - Tighter */}
                        <div className="grid grid-cols-2 gap-y-0.5 gap-x-6 text-[10px]">
                            {[
                                { l: 'Textura', v: ['lisa', 'aspera'].filter(k => (formData.avaliacaoPele.textura as any)[k]).join(', ') },
                                { l: 'Espessura', v: ['fina', 'muitofina', 'espessa'].filter(k => (formData.avaliacaoPele.espessura as any)[k]).join(', ') },
                                { l: 'Óstios', v: ['dilatadosT', 'dilatadosFace', 'contraidos'].filter(k => (formData.avaliacaoPele.ostios as any)[k]).join(', ') },
                                { l: 'Acne', v: ['grau1', 'grau2', 'grau3', 'grau4', 'grau5'].filter(k => (formData.avaliacaoPele.acne as any)[k]).map(s => s.replace('grau', 'Grau ')).join(', ') },
                                { l: 'Fototipo', v: ['tipo1', 'tipo2', 'tipo3', 'tipo4', 'tipo5'].filter(k => (formData.avaliacaoPele.fototipo as any)[k]).map(s => 'Tipo ' + s.slice(4)).join(', ') },
                                { l: 'Pelos', v: ['hirsutismo', 'hipertricose', 'alopecia', 'foliculite'].filter(k => (formData.avaliacaoPele.pelos as any)[k]).join(', ') },
                            ].map((item) => (
                                <div key={item.l} className="flex gap-2 border-b border-gray-100 py-px">
                                    <span className="font-bold text-gray-600 w-16">{item.l}:</span>
                                    <span className="font-medium text-gray-900">{item.v || '-'}</span>
                                </div>
                            ))}
                        </div>

                        {/* More Details - Full Line - Tighter */}
                        <div className="space-y-0.5 text-[10px] mt-1">
                            <div className="flex gap-2 border-b border-gray-100 py-px">
                                <span className="font-bold text-gray-600 w-20">Involução:</span>
                                <span className="font-medium text-gray-900 flex-1">
                                    {['linhas', 'sulcos', 'rugas', 'elastose', 'ptose'].filter(k => (formData.avaliacaoPele.involucao as any)[k]).join(', ')}
                                    {formData.avaliacaoPele.involucao.local && <span className="text-gray-500 italic ml-2">({formData.avaliacaoPele.involucao.local})</span>}
                                </span>
                            </div>
                            <div className="flex gap-2 border-b border-gray-100 py-px">
                                <span className="font-bold text-gray-600 w-20">Manchas:</span>
                                <span className="font-medium text-gray-900 flex-1">
                                    {['acromia', 'efelides', 'hipocromia', 'melanose', 'hipercromia', 'melanoseSolar'].filter(k => (formData.avaliacaoPele.manchas as any)[k]).join(', ')}
                                    {formData.avaliacaoPele.manchas.outros && <span className="italic ml-2">{formData.avaliacaoPele.manchas.outros}</span>}
                                </span>
                            </div>
                            <div className="flex gap-2 border-b border-gray-100 py-px">
                                <span className="font-bold text-gray-600 w-20">Lesões:</span>
                                <span className="font-medium text-gray-900 flex-1">
                                    {['comedoes', 'papula', 'pustula', 'millium', 'cisto', 'nodulo', 'siringoma', 'nevoMelanocitico', 'xantelasma', 'dermatite', 'ulceracao', 'hiperqueratose', 'psoriase'].filter(k => (formData.avaliacaoPele.lesoes as any)[k]).join(', ')}
                                    {formData.avaliacaoPele.lesoes.outros && <span className="italic ml-2">{formData.avaliacaoPele.lesoes.outros}</span>}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GROUP: PLANO + DECLARAÇÃO + ASSINATURAS (Avoid break inside) */}
                <div className="break-inside-avoid mt-2" style={{ pageBreakInside: 'avoid' }}>

                    {/* PLANO */}
                    <div className="mb-4">
                        <h2 className="font-bold uppercase bg-gray-100 p-0.5 pl-2 mb-2 text-[10px] tracking-wider border-l-4 border-black">Plano de Tratamento</h2>
                        <div className="ml-2 grid grid-cols-2 gap-3">
                            <div className="border border-gray-200 rounded p-1.5 bg-gray-50/50">
                                <span className="block text-[8px] font-bold text-gray-500 uppercase mb-0.5">Objetivos</span>
                                <p className="text-[10px]">{formData.planoTratamento.objetivos}</p>
                            </div>
                            <div className="border border-gray-200 rounded p-1.5 bg-gray-50/50">
                                <span className="block text-[8px] font-bold text-gray-500 uppercase mb-0.5">Tratamento Proposto</span>
                                <p className="text-[10px]">{formData.planoTratamento.tratamentoProposto}</p>
                            </div>
                            <div className="col-span-2 border border-gray-200 rounded p-1.5 bg-gray-50/50">
                                <span className="block text-[8px] font-bold text-gray-500 uppercase mb-0.5">Observações</span>
                                <p className="text-[10px]">{formData.planoTratamento.observacoes}</p>
                            </div>
                        </div>
                    </div>

                    {/* DECLARAÇÃO */}
                    <div className="mb-6 px-2">
                        <p className="text-[9px] text-justify text-gray-800 leading-relaxed italic">
                            "Eu, abaixo assinado(a), declaro que as informações registradas nesta ficha de anamnese são verdadeiras e assumo inteira responsabilidade por elas. Declaro que não omiti nenhuma informação sobre minha saúde, hábitos ou histórico clínico. Estou ciente de que a omissão de dados pode comprometer a segurança e a eficácia dos procedimentos estéticos. Autorizo o processamento destes dados para fins de acompanhamento profissional."
                        </p>
                    </div>

                    {/* ASSINATURAS */}
                    <div className="mt-6">
                        <div className="flex justify-between gap-16 px-8">
                            <div className="flex-1 text-center">
                                <div className="border-b border-black mb-2"></div>
                                <p className="text-[9px] font-bold uppercase tracking-wider">Profissional Responsável</p>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="border-b border-black mb-2"></div>
                                <p className="text-[9px] font-bold uppercase tracking-wider">Assinatura do Paciente</p>
                            </div>
                        </div>
                        <p className="text-[8px] text-center mt-4 text-gray-400">
                            {formatDate(new Date())} • Documento processado digitalmente
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AnamneseFacial;
