import React from 'react';
import { formatDate } from '../lib/dateUtils';
import DocumentHeader from './DocumentHeader';

interface CartaProps {
    paciente: {
        nome: string;
        dataNascimento: string;
        telefone: string;
        cpf?: string;
        rg?: string;
        alergias?: string | string[];
    };
    signatureUrl?: string | null;
    signatureDate?: string;
}

const CartaHialuronidase: React.FC<CartaProps> = ({ paciente, signatureUrl, signatureDate }) => {
    // Data de hoje (ex: 27/01/2026)
    const dataHoje = formatDate(new Date());

    // Lógica do Documento: CPF > RG > Vazio
    const documentoApresentado = paciente.cpf || paciente.rg || '';

    const textoAlergias = Array.isArray(paciente.alergias)
        ? (paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "Nego alergias conhecidas")
        : (paciente.alergias || "Nego alergias conhecidas");

    return (
        <div className="max-w-[210mm] mx-auto p-12 bg-white text-black font-serif text-sm leading-relaxed shadow-lg print:shadow-none print:w-full print:p-[20mm] print:m-0">

            <DocumentHeader
                title="CARTA DE INFORMAÇÃO AO PACIENTE – HIALURONIDASE"
                paciente={paciente}
            />

            {/* CORPO DO TEXTO */}
            <div className="space-y-6 text-justify">
                <div>
                    <h2 className="font-bold mb-1">O que é?</h2>
                    <p>
                        Os preenchedores de ácido hialurônico (AH) têm sido muito utilizado na volumização facial, para corrigir a perda dos coxins gordurosos e na harmonização orofacial. A formação de nódulos após a injeção de preenchedores de AH é indesejável esteticamente. A hialuronidase age despolimerizando reversivelmente o ácido hialurônico existente ao redor das células do tecido conjuntivo, reduzindo assim temporariamente a viscosidade desse tecido e tornando-o mais permeável à difusão de líquidos (diluindo o AH). Não deve ser aplicado em regiões infeccionadas.
                    </p>

                    {/* Campo de Alergia Dinâmico */}
                    <div className="mt-4 p-2 bg-gray-50 border border-gray-200 print:bg-transparent print:border-none print:p-0">
                        <span className="font-bold">Sou alérgico a: </span>
                        <span className="uppercase border-b border-black min-w-[200px] inline-block pl-2 text-red-600 font-bold">
                            {textoAlergias}
                        </span>
                    </div>
                </div>

                <div>
                    <h2 className="font-bold mb-1">Obrigações da Enfermeira Esteta</h2>
                    <p>
                        São obrigações da enfermeira esteta a correta indicação, domínio total da técnica e da anatomia. Alertar o paciente quanto ao que esperar dentro das possibilidades de sucesso e principalmente quanto aos cuidados pós-operatório.
                    </p>
                </div>

                <div>
                    <h2 className="font-bold mb-1">Obrigações do Paciente</h2>
                    <p>
                        Seguir rigorosamente todas as orientações da profissional esteta relacionadas ao tratamento efetuado, bem como informar a ele qualquer desconforto sentido. Tomar a medicação prescrita respeitando os horários e a dosagem certa. Informar o aparecimento de reações desagradáveis, gravidez, lactação e medicamentos que esteja utilizando.
                    </p>
                </div>

                <div>
                    <h2 className="font-bold mb-1">Riscos</h2>
                    <p>
                        Reações alérgicas, urticária local, eritema, calafrios, hipotensão, nódulos, vermelhidão, hidrólise excessiva do AH.
                    </p>
                </div>

                <p className="mt-8 font-bold">
                    Eu li, compreendi e concordei com o afirmado acima.
                </p>
            </div>

            {/* ASSINATURAS */}
            <div className="mt-12 space-y-10 break-inside-avoid">

                {/* Assinatura do Paciente */}
                <div>
                    <div className="border-b border-black inline-block min-w-[300px] pb-1 font-bold uppercase">
                        {paciente.nome}
                    </div>
                    <p className="text-sm mt-1">(Assinatura do Paciente)</p>

                    <div className="mt-2 text-sm space-y-1">
                        <p>Data: {dataHoje}</p>
                        <p>Documento apresentado: <span className="uppercase">{documentoApresentado}</span></p>
                    </div>
                </div>

                {/* Profissional */}
                <div className="relative">
                    {/* Visual Signature Stamp */}
                    {signatureDate && (
                        <div className="absolute bottom-24 left-0 pointer-events-none">
                            <div className="border-2 border-[#556b2f] text-[#556b2f] rounded p-1 px-2 text-[8px] font-bold uppercase tracking-widest leading-none transform -rotate-6 opacity-80 whitespace-nowrap bg-white/50 backdrop-blur-[1px]">
                                Assinado Digitalmente
                                <div className="text-[6px] font-normal mt-px text-center">{dataHoje}</div>
                                <div className="text-[6px] font-normal text-center">Dra. Gabriela Mari</div>
                            </div>
                        </div>
                    )}
                    <div className="border-b border-black inline-block min-w-[300px] pb-1 font-bold">
                        Gabriela Mari - COREN 212775
                    </div>
                    <p className="text-sm mt-1">Profissional / Conselho</p>
                    <p className="mt-2 text-sm">Data: {dataHoje}</p>
                </div>

            </div>
        </div>
    );
};

export default CartaHialuronidase;
