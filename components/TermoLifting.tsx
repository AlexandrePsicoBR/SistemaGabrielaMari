import React from 'react';
import { formatDate } from '../lib/dateUtils';
import DocumentHeader from './DocumentHeader';

interface TermoLiftingProps {
    paciente: {
        nome: string;
        dataNascimento: string;
        telefone: string;
        cpf: string;
        endereco?: string;

        alergias?: string | string[];
    };
}

const TermoLifting: React.FC<TermoLiftingProps> = ({ paciente }) => {
    // Data formatada (ex: 27 de Janeiro de 2026)
    const dataHoje = formatDate(new Date(), {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Lógica para preencher alergias
    const textoAlergias = Array.isArray(paciente.alergias)
        ? (paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "Nego alergias conhecidas")
        : (paciente.alergias || "Nego alergias conhecidas");

    return (
        <div className="max-w-[210mm] mx-auto p-12 bg-white text-black font-serif text-sm text-justify leading-relaxed shadow-lg print:shadow-none print:w-full print:p-[20mm] print:m-0">

            {/* TÍTULO */}
            {/* TÍTULO */}
            <DocumentHeader
                title={
                    <>
                        <div className="uppercase">Termo de Consentimento e Livre Esclarecimento</div>
                        <div className="uppercase text-lg mt-1">do Procedimento Lifting Temporal</div>
                    </>
                }
                paciente={paciente}
            />

            {/* SOBRE O PROCEDIMENTO */}
            <div className="mb-4 space-y-2">
                <p><span className="font-bold">Sobre o procedimento:</span> É um procedimento minimamente invasivo.</p>
                <p>
                    O lifting facial compreende algumas áreas: Pálpebras, pescoço, mandíbula (contorno) e área frontal.
                    A técnica faz a suspenção da musculatura facial SMAS, utilizando 1 fio de cada lado na região do couro cabeludo, reposicionando anatomicamente os tecidos.
                    No caso do procedimento não cirúrgico, ele é realizado em consultório e dura aproximadamente uma hora, sem a necessidade de internação.
                    Iniciamos com aplicação de anestesia local e, em seguida, será introduzido pequenas cânulas na face.
                    Isso por meio de pequenos pontos que servem como guias, mas que não podem ser vistos a olho nu e nem sentidos pelo toque.
                    Depois disso, os fios são posicionados no tecido subcutâneo, mais especificamente na parte gordurosa da face.
                    Tudo isso sem a necessidade de cortes e, consequentemente, suturas. O procedimento não deixa marcas e cicatrizes aparentes.
                </p>
            </div>

            {/* PARA QUEM É INDICADO */}
            <div className="mb-4 space-y-2">
                <p className="font-bold">Para quem é indicado?</p>
                <p>
                    Indicado para quem tem flacidez leve ou moderada e não deseja passar por um procedimento invasivo como uma cirurgia plástica. O implante com fios suspende a musculatura e reposiciona a pele.
                    O procedimento tem por objetivo amenizar parcialmente o processo de envelhecimento.
                </p>
            </div>

            {/* RESULTADOS */}
            <div className="mb-4 space-y-1">
                <p className="font-bold">Os resultados obtidos são:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                    <li>Redução da flacidez</li>
                    <li>Redução das rugas</li>
                    <li>Arqueamento das sobrancelhas</li>
                    <li>Melhora do contorno facial</li>
                    <li>Redução do excesso de pele palpebral</li>
                    <li>Diminuição da flacidez do pescoço (para lifting cervical)</li>
                    <li>Melhora significativa na elasticidade da pele.</li>
                </ul>
            </div>

            {/* CUIDADOS PÓS */}
            <div className="mb-4 space-y-1">
                <p className="font-bold">Os cuidados pós procedimento são:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                    <li>Repouso absoluto</li>
                    <li>Não fazer exercício físico e não tomar sol por 10 dias</li>
                    <li>Aplicar compressa gelada nas primeiras 48 horas</li>
                    <li>Lavar o cabelo com suavidade e após 48horas ou quando se sentir segura</li>
                    <li>Escovar os cabelos com cuidado</li>
                    <li>Dormir com a cabeça elevada, se possível com travesseiro de viagem em torno de 10 a 15 dias</li>
                    <li>Evitar sorrir e falar em excesso pelo menos nas primeiras 24 horas, para não forçar os músculos da face.</li>
                    <li>Não realizar cirurgias odontológicas e tratamentos faciais nesse mesmo período.</li>
                </ul>
            </div>

            {/* REAÇÕES ADVERSAS */}
            <div className="mb-6 space-y-1">
                <p className="font-bold">Reações adversas pós procedimento</p>
                <ul className="list-disc pl-5 space-y-0.5">
                    <li>O local onde passará os fios pode ficar mais elevado por uma média de 20 dias</li>
                    <li>Dor, edema, vermelhidão, equimose (roxo) nos primeiros 7 dias</li>
                    <li>Sensação de estar com um lado mais elevado que o outro, isso porque um lado pode inchar mais que o outro</li>
                    <li>Pele repuxada e enrugada na lateral por uma média de 10 dias</li>
                </ul>
            </div>

            {/* DECLARAÇÃO DO PACIENTE */}
            <div className="mb-6 space-y-2 border border-gray-200 p-4 rounded bg-gray-50 print:bg-transparent print:border-none print:p-0">
                <p>
                    Eu <span className="font-bold border-b border-black px-2">{paciente.nome}</span>, Portadora do CPF <span className="font-bold border-b border-black px-2">{paciente.cpf}</span>, residente no endereço <span className="font-bold border-b border-black px-2 w-full inline-block print:inline">{paciente.endereco || "_____________________________________________________"}</span>.
                </p>
                <p>
                    Estou ciente de todas as informações referente ao procedimento que por vontade própria irei realizar. Declaro que tive minhas dúvidas e questionamentos sanados, bem como informações de todas as reações adversas que possam surgir nos primeiros dias e semanas após o procedimento.
                    Declaro ainda que seguirei os cuidados indicados pós procedimento, garantindo assim a eficácia do procedimento e garantindo que não haja possíveis complicações.
                    Sigo ciente que o questionário abaixo deve ser preenchido corretamente garantindo assim a segurança e um procedimento sem nenhum tipo de intercorrências.
                </p>
            </div>

            {/* QUESTIONÁRIO */}
            <div className="mb-6 space-y-2">
                <h3 className="font-bold uppercase underline">Questionário:</h3>

                <div className="flex items-center gap-2">
                    <span>Relata algum tipo de alergia?</span>
                    <span className="flex-1 border-b border-black border-dotted px-2 font-bold text-red-600">{textoAlergias}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span>Pressão alta?</span>
                    <span className="flex-1 border-b border-black border-dotted"></span>
                </div>

                <div className="flex items-center gap-2">
                    <span>Diabetes?</span>
                    <span className="flex-1 border-b border-black border-dotted"></span>
                </div>

                <div className="flex items-center gap-2">
                    <span>Síndrome do pânico; crise de ansiedade; depressão?</span>
                    <span className="flex-1 border-b border-black border-dotted"></span>
                </div>

                <div className="flex items-center gap-2">
                    <span>Tem alguma comorbidade?</span>
                    <span className="flex-1 border-b border-black border-dotted"></span>
                </div>

                <div className="flex items-center gap-2">
                    <span>Faz uso de medicamentos?</span>
                    <span className="flex-1 border-b border-black border-dotted"></span>
                </div>

                <div className="flex items-center gap-2">
                    <span>Faz atividade física?</span>
                    <span className="flex-1 border-b border-black border-dotted"></span>
                </div>
            </div>

            {/* USO DE IMAGEM */}
            <div className="mb-8 keep-together break-inside-avoid">
                <h3 className="font-bold uppercase text-center mb-2">TERMO DE AUTORIZAÇÃO DE USO DA IMAGEM</h3>
                <p className="mb-2">
                    Dou o meu consentimento para ser fotografado(a) e ou filmado(a), antes, durante e depois do procedimento, autorizando o profissional da saúde a utilizar a minha imagem pessoal, de forma gratuita em revistas científicas e/ou congressos médicos, redes sociais e websites.
                </p>
                <div className="space-y-1">
                    <label className="flex items-center gap-2">
                        <span className="w-4 h-4 border border-black inline-block"></span>
                        Não autorizo o uso de minha imagem pessoal em revistas científicas, redes sociais e websites.
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="w-4 h-4 border border-black inline-block"></span>
                        Não autorizo o uso de minha imagem pessoal em congressos médicos.
                    </label>
                </div>
            </div>

            {/* ASSINATURAS */}
            <div className="mt-8 break-inside-avoid">
                <div className="flex justify-between items-end gap-10 mb-8">
                    <div className="w-1/2">
                        <p className="border-b border-black mb-1"></p>
                        <p className="text-xs">Assinatura</p>
                    </div>
                </div>

                <p className="text-right">
                    São Paulo, <span className="inline-block border-b border-black min-w-[150px] text-center">{dataHoje}</span>.
                </p>
            </div>

        </div>
    );
};

export default TermoLifting;
