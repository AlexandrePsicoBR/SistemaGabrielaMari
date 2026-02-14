import React from 'react';
import { formatDate } from '../lib/dateUtils';
import DocumentHeader from './DocumentHeader';

interface TermoHidrolipoProps {
    paciente: {
        nome: string;
        dataNascimento: string;
        telefone: string;
        cpf?: string;
        rg?: string;
        alergias?: string | string[];
    };
    substancias?: string;
    signatureUrl?: string | null;
    signatureDate?: string;
}

const TermoHidrolipo: React.FC<TermoHidrolipoProps> = ({ paciente, substancias, signatureUrl, signatureDate }) => {
    // Data de hoje (ex: "27 de Janeiro de 2026")
    const dataHoje = signatureDate
        ? formatDate(new Date(signatureDate), { day: 'numeric', month: 'long', year: 'numeric' })
        : formatDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' });

    // Lógica de documento (RG prioridade sobre CPF neste caso, conforme solicitado "RG/CPF")
    // User said: "Se tiver RG, mostre o RG. Se não, mostre o CPF."
    const documento = paciente.rg || paciente.cpf || "__________________";

    const textoAlergias = Array.isArray(paciente.alergias)
        ? (paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "Nego alergias conhecidas")
        : (paciente.alergias || "Nego alergias conhecidas");

    return (
        <div className="max-w-[210mm] mx-auto p-12 bg-white text-black font-serif text-sm leading-relaxed shadow-lg print:shadow-none print:w-full print:p-[20mm] print:m-0">

            <DocumentHeader
                title={
                    <>
                        <div className="uppercase">Termo de Consentimento Esclarecido</div>
                        <div className="uppercase font-normal mt-1 text-md">Para Hidrolipoclasia Ultrassônica</div>
                    </>
                }
                paciente={paciente}
            />

            {/* TEXTO CORPO */}
            <div className="space-y-4 text-justify">
                <p>
                    A hidrolipoclasia não aspirativa ou hidrolipoclasia ultrassônica é um procedimento responsável pelo tratamento da gordura localizada de pequenas áreas do corpo. É um procedimento minimamente invasivo que visa reduzir medidas e eliminar a gordura localizada através da quebra de tecido adiposo a partir da aplicação de uma solução hipotônica (soro e outras combinações) diretamente na gordura localizada seguida da ação de ultrassom focalizado e drenagem para a eliminação da gordura.
                </p>
                <p>
                    Não se trata de um procedimento invasivo como a lipoaspiração, hidrolipo aspirativa ou lipoaspiração, mais conhecidas como lipo light. O procedimento é considerado orgânico, pois a gordura e a solução injetada são eliminadas naturalmente pelo corpo, dispensando a invasão das cânulas aspirativas, minimizando assim qualquer tipo de risco.
                </p>
                <p>
                    As ondas de ultrassom utilizadas, após a aplicação, penetram de 3 a 4 cm de profundidade, provocando o extravase das células de gordura de forma muito mais eficiente, pois com o espaço entre as células preenchido por líquido e até mesmo o inchaço das células adiposas com a presença do líquido hipotônico, a estimulação do ultrassom é potencializada e os resultados são superiores se comparados aos resultados obtidos apenas com o aparelho deu ultrassom. Porém, o procedimento é limitado a áreas do corpo com pouco acúmulo de gordura.
                </p>

                {/* Campo de Alergia Dinâmico */}
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 print:bg-transparent print:border-none print:p-0">
                    <span className="font-bold">Sou alérgico a: </span>
                    <span className="uppercase border-b border-black min-w-[200px] inline-block pl-2 text-red-600 font-bold">
                        {textoAlergias}
                    </span>
                </div>

                {/* Declaração Concordância */}
                <p className="mt-8">
                    Declaro estar em concordância com o tratamento de hidrolipoclasia ultrassônica a ser efetuado com as substâncias <span className="font-bold">{substancias || "_______________________________________________________"}</span> para fins estéticos.
                </p>

                {/* Declaração Pessoal */}
                <p>
                    Eu, <span className="font-bold uppercase">{paciente.nome}</span>, portador(a) do RG/CPF nº <span className="font-bold">{documento}</span> autorizo <span className="font-bold">Gabriela Mari</span> a realizar o procedimento supra mencionado. Estou plenamente seguro(a) que esclareci todas as minhas dúvidas relativas ao procedimento, após ter lido e compreendido todas as informações deste documento, antes da assinatura. Reservo-me o direito de revogar minha assinatura abaixo apenas antes que o procedimento se realize.
                </p>

                <p>
                    CONFIRMO que foi explicado detalhadamente o propósito, os benefícios, os riscos e as alternativas para o procedimento acima descrito, bem como que existiu tempo hábil para o paciente esclarecer suas dúvidas.
                </p>
            </div>

            {/* DATA */}
            <div className="mt-12 text-right font-bold">
                Data: {dataHoje}
            </div>

            {/* ASSINATURA */}
            <div className="mt-16 break-inside-avoid w-2/3 mx-auto text-center relative">
                {signatureUrl && (
                    <img
                        src={signatureUrl}
                        alt="Assinatura"
                        className="absolute bottom-16 left-1/2 transform -translate-x-1/2 max-h-16 mix-blend-multiply"
                    />
                )}
                <div className="mb-8 text-left">
                    <p className="font-bold uppercase text-xs mb-1">Nome Legível:</p>
                    <p className="uppercase border-b border-dotted border-gray-400 pb-1 w-full">{paciente.nome}</p>
                </div>

                <div className="border-t border-black pt-2">
                    <p className="font-bold">Assinatura do Cliente</p>
                </div>
            </div>

        </div>
    );
};

export default TermoHidrolipo;
