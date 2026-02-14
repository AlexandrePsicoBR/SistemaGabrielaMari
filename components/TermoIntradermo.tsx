import React from 'react';
import { formatDate } from '../lib/dateUtils';
import DocumentHeader from './DocumentHeader';

// Interface dos dados que vêm do Banco de Dados
interface TermoIntradermoProps {
    paciente: {
        nome: string;
        dataNascimento: string;
        telefone: string;
        cpf: string;

        alergias?: string | string[]; // Array de alergias (opcional)
    };
    signatureUrl?: string | null;
    signatureDate?: string;
}

const TermoIntradermo: React.FC<TermoIntradermoProps> = ({ paciente, signatureUrl, signatureDate }) => {
    // Pega a data de hoje formatada (ex: 27/01/2026)
    const dataHoje = signatureDate
        ? formatDate(new Date(signatureDate))
        : formatDate(new Date());

    // Lógica para preencher o campo de alergias
    // Lógica para preencher o campo de alergias
    const textoAlergias = Array.isArray(paciente.alergias)
        ? (paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "Nego alergias conhecidas")
        : (paciente.alergias || "Nego alergias conhecidas");

    return (
        <div className="max-w-[210mm] mx-auto p-12 bg-white text-black font-serif text-sm text-justify leading-relaxed shadow-lg print:shadow-none print:w-full print:p-[20mm] print:m-0">

            {/* TÍTULO */}
            {/* TÍTULO */}
            <DocumentHeader
                title="Termo de Consentimento Livre e Esclarecido para realização de Intradermoterapia"
                paciente={paciente}
            />

            {/* DESCRIÇÃO */}
            <div className="mb-6 space-y-2">
                <h3 className="font-bold uppercase underline text-left">Descrição e Indicações do Procedimento:</h3>
                <p>
                    A intradermoterapia é uma técnica que detém comprovação científica, de ação localizada ou sistêmica, realizada exclusivamente por profissionais habilitados, e consiste na aplicação de princípios ativos e/ou soro fisiológico diretamente no tecido subcutâneo da área onde se localiza a disfunção a ser tratada, ou por via intramuscular. Dentre as disfunções passíveis de serem tratadas com esta técnica estão celulite, gordura localizada, flacidez dérmica, estrias, rugas, dependendo dos ativos escolhidos para a aplicação. Os resultados são localizados e começam a ser observados em média 10 a 20 dias após cada aplicação e progressivamente. Pode ser associado com outros tratamentos estéticos corporais para potencializar os resultados.
                </p>
            </div>

            {/* CONTRA-INDICAÇÕES E ALERGIAS */}
            <div className="mb-6 space-y-2">
                <h3 className="font-bold uppercase underline text-left">Contraindicações, Reações Adversas e Precauções:</h3>
                <p>
                    Mesmo com objetivos estéticos, a intradermoterapia é um procedimento invasivo e como tal, tem indicações e contraindicações que me foram apresentadas e verificadas pelo profissional, em consulta prévia, na qual declaro não ter omitido nenhuma informação sobre meu estado de saúde, doenças prévias, cicatrização hipertrófica, gravidez, amamentação, idade, cirurgias anteriores, uso de medicações, implantes ou próteses, realização de outros tratamentos e alergias.
                </p>

                {/* Campo de Alergia Dinâmico */}
                <div className="mt-2 text-left">
                    <span className="font-bold">Sou alérgico a: </span>
                    <span className="uppercase border-b border-black min-w-[200px] inline-block pl-2 font-bold text-red-600">
                        {textoAlergias}
                    </span>
                </div>
            </div>

            {/* DECLARAÇÕES E EFEITOS ADVERSOS */}
            <div className="mb-6 space-y-2">
                <p className="font-bold">Declaro não estar grávida ou amamentando.</p>
                <p>
                    O tratamento é passível de reações adversas imediatas ou tardias, que são previstas e devem desaparecer em até 20 dias, como vermelhidão, edema, sangramento leve, formação de nódulos e descoloração da região. Comprometo-me em reportar ao profissional qualquer reação não prevista que ocorra na área tradada durante o tratamento. Até 2 semanas após cada aplicação ou enquanto houver hematomas, a exposição da região ao sol poderá manchar a pele, como ocorre com qualquer hematoma quando exposto ao sol. Durante o tratamento fica restrito o consumo de alimentos como carne de porco e derivado, frituras, frutos do mar, carboidratos açucarados, ovos e bebida alcóolica.
                </p>
            </div>

            {/* PLANO DE TRATAMENTO */}
            <div className="mb-6 space-y-2">
                <h3 className="font-bold uppercase underline text-left">Plano de Tratamento Proposto e Responsabilidades</h3>
                <p>
                    A elaboração do plano de tratamento depende e varia com os objetivos e características individuais de cada paciente. Faz parte do plano de tratamento como um todo, que o paciente compareça às sessões, siga as orientações médicas e as precauções acima descritas, tome pelo menos 2 litros de água por dia em pequenas porções, faça exercícios físicos regulares (pelo menos por 40 minutos 3 vezes por semana) e se alimente de forma saudável. Estou ciente e de acordo com todas as informações relacionadas e das técnicas que serão aplicadas, bem como dos produtos que serão utilizados, me propondo assim a realizar cuidados em casa para contribuir com os resultados. Declaro estar ciente também de que as técnicas utilizadas têm resultados variáveis para cada indivíduo e podem apresentar em alguns, casos efeitos adversos dos quais tenho plena consciência.
                </p>
            </div>

            {/* USO DE IMAGEM E CONCLUSÃO */}
            <div className="mb-8 space-y-2 bg-gray-50 p-4 border rounded print:bg-transparent print:border-none print:p-0">
                <h3 className="font-bold uppercase underline text-left">Registros, Uso de Imagens e Consentimento Geral</h3>
                <p>
                    Autorizo o registro das minhas medidas corporais, fotos de antes e depois dos procedimentos, pois compreendo que isto representa uma fonte de esclarecimento dos resultados alcançados, tanto para o profissional quanto para mim. As fotos poderão ser enviadas ao cliente via e-mail ao término do tratamento, ficando também arquivadas em seu prontuário. De forma a preservar minha identidade, autorizo expor meus resultados de forma pontual e profissional. Compreendo todos os riscos do tratamento e aceito os custos e responsabilidades que envolvem e que me foram previamente apresentados. Tive a oportunidade de esclarecer minhas dúvidas relativas ao procedimento que voluntariamente irei me submeter, tendo lido, compreendido e consentido as informações contidas neste documento antes da sua assinatura. Assim, não restando dúvidas, eu autorizo a realização dos procedimentos propostos neste termo.
                </p>
            </div>

            {/* DATA */}
            <div className="mb-12 font-bold text-lg text-left">
                Data: {dataHoje}
            </div>

            {/* ASSINATURAS */}
            <div className="flex justify-between items-end mt-16 gap-10 break-inside-avoid">
                <div className="w-1/2 text-center">
                    <div className="border-t border-black pt-2">
                        <p className="font-bold">Gabriela Mari</p>
                        <p className="text-sm">COREN 212775</p>
                        <p className="text-xs text-gray-600 mt-1">Profissional</p>
                    </div>
                </div>

                <div className="w-1/2 text-center relative">
                    {signatureUrl && (
                        <img
                            src={signatureUrl}
                            alt="Assinatura"
                            className="absolute bottom-12 left-1/2 transform -translate-x-1/2 max-h-16 mix-blend-multiply"
                        />
                    )}
                    <div className="border-t border-black pt-2">
                        <p className="font-bold uppercase">{paciente.nome}</p>
                        <p className="text-xs text-gray-600">Assinatura do(a) paciente</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TermoIntradermo;
