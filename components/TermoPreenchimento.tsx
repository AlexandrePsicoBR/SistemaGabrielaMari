import React from 'react';
import { formatDate } from '../lib/dateUtils';
import DocumentHeader from './DocumentHeader';

interface TermoPreenchimentoProps {
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

const TermoPreenchimento: React.FC<TermoPreenchimentoProps> = ({ paciente, signatureUrl, signatureDate }) => {
    // Data formatada (ex: 27 de Janeiro de 2026)
    const dataHoje = signatureDate
        ? formatDate(new Date(signatureDate), { day: 'numeric', month: 'long', year: 'numeric' })
        : formatDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' });

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
                        TERMO DE CONSENTIMENTO PARA REALIZAÇÃO DE PREENCHIMENTO DÉRMICO FACIAL
                        <br />
                        <span className="font-normal normal-case">(Ácido hialurônico)</span>
                    </>
                }
                paciente={paciente}
            />

            {/* TEXTO CORPO */}
            <div className="space-y-4 mb-4">
                <p>
                    Eu autorizo o profissional a realizar a aplicação do ácido acima.
                </p>

                <p>
                    Trata-se de um procedimento não cirúrgico com Ácido Hialurônico.
                </p>

                <p>
                    Esse procedimento é indicado para rugas, sulcos, melhora do contorno e volume dos lábios, cicatrizes de acne e reposição do volume facial.
                </p>

                <p>
                    Esse procedimento não é indicado nos casos de reação alérgica já conhecida a qualquer um dos componentes, gravidez e lactantes.
                </p>

                {/* Campo de Alergia Dinâmico */}
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 print:bg-transparent print:border-none print:p-0">
                    <span className="font-bold">Sou alérgico a: </span>
                    <span className="uppercase border-b border-black min-w-[200px] inline-block pl-2 text-red-600 font-bold">
                        {textoAlergias}
                    </span>
                </div>

                <p>
                    Logo após a aplicação pode ocorrer vermelhidão, edema, sensibilidade, coceira na região afetada. Trata-se de uma reação normal e esse incômodo pode durar de um a três dias. Após esse período, comunicar ao profissional caso o incômodo persistir.
                </p>

                <p>
                    Logo após a aplicação pode ocorrer hematoma (roxo) na região afetada caso a agulha atinja um vaso. Fazer compressa fria na região afetada. Não use gelo diretamente no local afetado.
                </p>

                <p>
                    Estou ciente que esse procedimento não acabará com o sulco nasogeniano e com as rugas profundas, e sim atenuar melhorando a região.
                </p>

                <p>
                    Pode haver inchaço (edema) após o procedimento nas regiões afetadas. Isso significa que o resultado imediato após o procedimento é frequentemente menos agradável que o resultado final, quando ocorre a normalização da pele. No caso dos lábios para dar volume, é normal sentir por dentro o volume ao passar o dedo ou a língua parecendo vários “caroços” isso é normal.
                </p>

                <p>
                    Para manter a correção na região, será necessário repetir o procedimento com o decorrer do tempo. Isso depende de uma variedade de fatores, como o local anatômico.
                </p>

                <p>
                    Evitar tocar a região tratada nas 6 horas seguintes do procedimento. Depois desse período a área poderá ser lavada suavemente com água e sabonete próprio para o rosto.
                </p>

                <p>
                    As informações descritas neste termo não esgotam todas as possibilidades de riscos e complicações que podem ocorrer com a realização desse procedimento, sendo enumeradas apenas algumas.
                </p>

                <p>
                    As fotos tiradas são exclusivamente para acompanhamento do tratamento e não deverão ser divulgadas para qualquer finalidade.
                </p>
            </div>

            {/* BLOCO FINAL COM PROTEÇÃO DE QUEBRA DE PÁGINA */}
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
                    <div className="w-1/2 text-center relative">
                        {/* Visual Signature Stamp */}
                        {signatureDate && (
                            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-none">
                                <div className="border-2 border-[#556b2f] text-[#556b2f] rounded p-1 px-2 text-[8px] font-bold uppercase tracking-widest leading-none transform -rotate-6 opacity-80 whitespace-nowrap bg-white/50 backdrop-blur-[1px]">
                                    Assinado Digitalmente
                                    <div className="text-[6px] font-normal mt-px text-center">{dataHoje}</div>
                                    <div className="text-[6px] font-normal text-center">Dra. Gabriela Mari</div>
                                </div>
                            </div>
                        )}
                        <div className="border-t border-black pt-2">
                            <p className="font-bold">Gabriela Mari</p>
                            <p className="text-sm">COREN 212775</p>
                            <p className="text-xs text-gray-600 mt-1">Profissional</p>
                        </div>
                    </div>

                    {/* Assinatura Cliente */}
                    <div className="w-1/2 text-center relative">
                        {signatureUrl && (
                            <img
                                src={signatureUrl}
                                alt="Assinatura"
                                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 max-h-16 mix-blend-multiply"
                            />
                        )}
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

export default TermoPreenchimento;
