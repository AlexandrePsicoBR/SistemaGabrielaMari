import React from 'react';
import { formatDate } from '../lib/dateUtils';
import DocumentHeader from './DocumentHeader';

interface TermoMicroagulhamentoProps {
    paciente: {
        nome: string;
        dataNascimento: string;
        telefone: string;
        cpf?: string;
        alergias?: string | string[];
    };
}

const TermoMicroagulhamento: React.FC<TermoMicroagulhamentoProps> = ({ paciente }) => {
    // Data formatada (ex: 27 de Janeiro de 2026)
    const dataHoje = formatDate(new Date(), {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const textoAlergias = Array.isArray(paciente.alergias)
        ? (paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "Nego alergias conhecidas")
        : (paciente.alergias || "Nego alergias conhecidas");

    return (
        <div className="max-w-[210mm] mx-auto p-12 bg-white text-black font-serif text-sm text-justify leading-relaxed shadow-lg print:shadow-none print:w-full print:p-[20mm] print:m-0">

            {/* TÍTULO */}
            {/* TÍTULO */}
            <DocumentHeader
                title="TERMO DE CONSENTIMENTO PARA REALIZAÇÃO DE MICROAGULHAMENTO"
                paciente={paciente}
            />

            {/* TEXTO CORPO */}
            <div className="space-y-4 mb-4">
                <p>
                    Eu autorizo o profissional quanto a aplicação de microagulhamento, também conhecida como Terapia de Indução de Colágeno.
                </p>

                <p>
                    Trata-se de um estímulo mecânico à produção de colágeno realizado por meio do rolamento de um cilindro com pequenas agulhas (roller), que ocasionam micro lesões na pele, promovendo a renovação das células envelhecidas e melhorando a sua qualidade. Promove também a remodelação e formação de colágeno. Além disso, potencializa a permeação de produtos de uso tópico.
                </p>

                <p>
                    Esse procedimento é indicado para rejuvenescimento, rugas, atenuação das estrias, melhora das cicatrizes de acne e da flacidez da pele, redução das linhas finas de expressão, melasma, alopecia, entre outros.
                </p>

                <p className="font-bold">
                    Este procedimento é contraindicado para gestantes, pessoas em tratamento com isotretinoína ou imunossupressor, uso de anticoagulantes, uso de Roacutan, Diabetes, herpes ativa, sensibilidade a luz, histórico de problemas com cicatrização, tendência a queloide, alergia ao metal ou ao produto, rosácea ativa, pele queimada\bronzeada, processo inflamatório\infecção na pele, entre outros.
                </p>


                <p>
                    Estou ciente, e confirmo que não me enquadro nesse grupo de contra indicações.
                </p>

                {/* Campo de Alergia Dinâmico */}
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 print:bg-transparent print:border-none print:p-0">
                    <span className="font-bold">Sou alérgico a: </span>
                    <span className="uppercase border-b border-black min-w-[200px] inline-block pl-2 text-red-600 font-bold">
                        {textoAlergias}
                    </span>
                </div>

                <p>
                    Antes do procedimento será aplicado um anestésico tópico em creme.
                    Durante o procedimento ocorrerá vermelhidão (hiperemia) e inchaço (edema) local, podendo durar por uma média de 1 a 3 dias. Deverei usar filtro solar diariamente e os produtos receitados como recomendado. A não utilização desses produtos poderá causar manchas no meu rosto e serei responsável por isto.
                </p>

                <p>
                    Os resultados ocorrem gradualmente sendo necessário mais de uma sessão. A eficácia pode variar de pessoa para pessoa.
                </p>

                <p>
                    Diante dos esclarecimentos prestados, atesto o meu consentimento para a realização do tratamento de microagulhamento. Informo que recebi todas as informações do procedimento e das complicações se não seguir o que me foi orientado.
                </p>

                <p>
                    As informações descritas neste termo não esgotam todas as possibilidades de riscos e complicações que podem ocorrer com a realização desse procedimento, sendo enumeradas apenas algumas.
                </p>

                <p>
                    As fotos tiradas são exclusivamente para acompanhamento do tratamento e não deverão ser divulgadas para qualquer finalidade.
                </p>
            </div>

            {/* BLOCO FINAL COM PROTEÇÃO DE QUEBRA DE PÁGINA */}
            {/* Agrupa o último parágrafo, data e assinaturas para não separar */}
            <div className="break-inside-avoid page-break-inside-avoid">
                <p className="mb-8 text-justify mt-4">
                    Declaro que li e entendi as orientações e tive oportunidade de esclarecer dúvidas deste termo antes de assiná-lo.
                </p>

                {/* DATA */}
                <div className="mb-12 font-bold text-lg text-left">
                    Data: {dataHoje}
                </div>

                {/* ASSINATURAS */}
                <div className="flex justify-between items-end mt-16 gap-10">
                    {/* Assinatura Profissional */}
                    <div className="w-1/2 text-center">
                        <div className="border-t border-black pt-2">
                            <p className="font-bold">Gabriela Mari</p>
                            <p className="text-sm">COREN 212775</p>
                            <p className="text-xs text-gray-600 mt-1">Profissional</p>
                        </div>
                    </div>

                    {/* Assinatura Cliente */}
                    <div className="w-1/2 text-center">
                        <div className="border-t border-black pt-2">
                            <p className="font-bold uppercase mb-1">{paciente.nome}</p>
                            <p>Assinatura do Cliente</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TermoMicroagulhamento;
