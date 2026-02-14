import React from 'react';
import { formatDate } from '../lib/dateUtils';
import DocumentHeader from './DocumentHeader';

interface TermoFioPDOProps {
    paciente: {
        nome: string;
        dataNascimento: string;
        telefone: string;
        cpf?: string;
        alergias?: string | string[];
    };
    signatureUrl?: string | null;
    signatureDate?: string;
}

const TermoFioPDO: React.FC<TermoFioPDOProps> = ({ paciente, signatureUrl, signatureDate }) => {
    // Data formatada: "27 de Janeiro de 2026"
    const dataHoje = signatureDate
        ? formatDate(new Date(signatureDate), { day: 'numeric', month: 'long', year: 'numeric' })
        : formatDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' });

    const textoAlergias = Array.isArray(paciente.alergias)
        ? (paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "Nego alergias conhecidas")
        : (paciente.alergias || "Nego alergias conhecidas");

    return (
        <div className="max-w-[210mm] mx-auto p-12 bg-white text-black font-serif text-sm leading-relaxed shadow-lg print:shadow-none print:w-full print:p-[20mm] print:m-0">

            <DocumentHeader
                title="TERMO DE CONSENTIMENTO PARA REALIZAÇÃO DE IMPLANTE DE FIO PDO ABSORVÍVEL"
                paciente={paciente}
            />

            {/* CORPO DO TEXTO */}
            <div className="space-y-4 text-justify">
                <p>
                    Eu autorizo a profissional, <strong>Gabriela Mari - COREN 212775</strong>, a aplicação do Fio de PDO absorvível.
                </p>
                <p>
                    A aplicação de fios absorvíveis é um método não cirúrgico com aplicação de fio polidioxanona (PDO) através de finas agulhas (de acupuntura).
                </p>
                <p>
                    Esse procedimento é indicado para tratar rugas, revitalização cutânea e flacidez, e não ocorre modificação do formato do rosto. Ele estimula a produção de elastina e colágeno em seu entorno, melhorando a qualidade da pele.
                </p>
                <p>
                    Esse procedimento não é indicado caso tenha infecção local pré-existente, doenças autoimunes ativas, gestantes e lactantes, diabetes não controlada e doença cardiovascular aguda.
                </p>

                {/* Campo de Alergia Dinâmico */}
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 print:bg-transparent print:border-none print:p-0">
                    <span className="font-bold">Sou alérgico a: </span>
                    <span className="uppercase border-b border-black min-w-[200px] inline-block pl-2 text-red-600 font-bold">
                        {textoAlergias}
                    </span>
                </div>
                <p>
                    O fio proporciona uma hidratação na pele trazendo colágeno para a região que foi implantado. Esse efeito dura em até 180 dias por se tratar de um fio absorvível.
                </p>
                <p>
                    A duração do fio varia de pessoa para pessoa devido a qualidade da pele e cuidados que cada pessoa tem.
                </p>
                <p>
                    O paciente se compromete em comparecer nos agendamentos pós-procedimento evitando assim complicações pós-procedimento.
                </p>
                <p>
                    Diante dos esclarecimentos prestados, atesto o meu consentimento para a realização do implante do fio PDO de sustentação. Informo que recebi todas as informações do procedimento e das complicações se não seguir o que me foi orientado.
                </p>
                <p>
                    As informações descritas neste termo não esgotam todas as possibilidades de riscos e complicações que podem ocorrer com a realização desse procedimento, sendo enumeradas apenas algumas.
                </p>
                <p>
                    Declaro que li e entendi as orientações e tive oportunidade de esclarecer dúvidas deste termo antes de assiná-lo.
                </p>
            </div>

            {/* DATA DINÂMICA */}
            <div className="mt-12 text-right">
                <p className="text-lg">Data: {dataHoje}</p>
            </div>

            {/* ASSINATURAS */}
            <div className="mt-8 flex justify-between items-end gap-10 break-inside-avoid px-4">
                {/* Assinatura Profissional */}
                <div className="w-1/2 text-center">
                    <div className="border-t border-black pt-2">
                        <p className="font-bold">Gabriela Mari</p>
                        <p className="text-sm">COREN 212775</p>
                    </div>
                </div>

                {/* Assinatura Paciente */}
                <div className="w-1/2 text-center relative">
                    {signatureUrl && (
                        <img
                            src={signatureUrl}
                            alt="Assinatura"
                            className="absolute bottom-12 left-1/2 transform -translate-x-1/2 max-h-16 mix-blend-multiply"
                        />
                    )}
                    <div className="mb-8 text-left">
                        <p className="font-bold uppercase text-xs mb-1">Nome Legível:</p>
                        <p className="uppercase border-b border-dotted border-gray-400 pb-1">{paciente.nome}</p>
                    </div>
                    <div className="border-t border-black pt-2">
                        <p>Assinatura do Cliente</p>
                        {paciente.cpf && <p className="text-xs text-gray-600 mt-1">CPF: {paciente.cpf}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermoFioPDO;
