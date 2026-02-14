import React from 'react';
import { formatDate } from '../lib/dateUtils';
import DocumentHeader from './DocumentHeader';

interface TermoProps {
    paciente: {
        nome: string;
        dataNascimento: string;
        telefone: string;
        cpf: string;
        alergias: string | string[];
    };
    signatureUrl?: string | null;
    signatureDate?: string;
}

const TermoBotox: React.FC<TermoProps> = ({ paciente, signatureUrl, signatureDate }) => {
    const textoAlergias = Array.isArray(paciente.alergias)
        ? (paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "Nego alergias conhecidas")
        : (paciente.alergias || "Nego alergias conhecidas");

    const today = signatureDate ? formatDate(new Date(signatureDate)) : formatDate(new Date());

    return (
        <div className="w-[210mm] min-h-[297mm] p-[20mm] bg-white text-black font-sans text-sm leading-relaxed mx-auto shadow-md print:shadow-none print:w-full print:min-h-0 print:h-auto print:m-0 print:p-[20mm]">
            <DocumentHeader
                title={
                    <>
                        TERMO DE ESCLARECIMENTO E CONSENTIMENTO PARA TRATAMENTO DE RUGAS COM TOXINA BOTULÍNICA A
                        <div className="text-xs font-normal normal-case mt-1">(com finalidade estética).</div>
                    </>
                }
                paciente={paciente}
            />

            <div className="space-y-4 text-justify">
                <div>
                    <h2 className="font-bold mb-1">INFORMAÇÕES GERAIS</h2>
                    <p>
                        Pequenas quantidades de toxina botulínica são injetadas em um músculo, para o enfraquecimento da contração muscular ou até a paralisia deste. Isso ocorre alguns dias após a injeção e seu efeito pode durar em média de 3 a 5 meses. Este período pode ser maior ou menor.
                    </p>
                    <p className="mt-2">
                        A injeção de toxina botulínica em um músculo causa uma melhora nas rugas, devido a diminuição da força de enrugar o local. A marca da ruga atenuará e permanecerá assim até terminar o efeito do produto. Rugas existentes entre as sobrancelhas são decorrentes da contração de um pequeno músculo chamado corrugador. Os outros locais de tratamento mais comuns são rugas ao redor dos olhos e testa.
                    </p>
                    <p className="mt-2">
                        A aplicação da toxina não elimina todas as rugas, mas atenua as linhas de expressão. Os resultados dos tratamentos podem ser variáveis de pessoa a pessoa e, inclusive, no mesmo indivíduo um tratamento pode ter duração diferente do outro.
                    </p>
                </div>

                <div>
                    <h2 className="font-bold mb-1">RISCOS E COMPLICAÇÕES</h2>
                    <p>O tratamento de rugas faciais com a toxina botulínica pode causar:</p>
                    <ol className="list-decimal list-outside ml-5 space-y-1 mt-1">
                        <li>A queda temporária da pálpebra, em aproximadamente 2% (dois por cento) dos pacientes tratados. Este efeito dura aproximadamente 3 (três) a 4 (quatro) semanas, e é reversível.</li>
                        <li>Alterações da sensibilidade. Intumescimento e dor de cabeça são raramente observados em pacientes submetidos a este procedimento.</li>
                        <li>Um leve hematoma (derrame de sangue) pode ocorrer nos locais de aplicação.</li>
                        <li>Em poucos pacientes a injeção pode não provocar o efeito necessário ou não durar o tempo esperado.</li>
                        <li>Alguns pacientes podem apresentar dor por algum período no local da aplicação, sendo essa ocorrência uma característica pessoal, não podendo ser previsto ou evitado com antecedência, independentemente do procedimento realizado.</li>
                        <li>Alguns pacientes podem apresentar dores de cabeça semelhante a enxaqueca após aplicação do Toxina botulínica.</li>
                    </ol>
                </div>

                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 print:bg-transparent print:border-none print:p-0">
                    <span className="font-bold">Sou alérgico a: </span>
                    <span className="uppercase border-b border-black min-w-[200px] inline-block pl-2 text-red-600 font-bold">
                        {textoAlergias}
                    </span>
                </div>

                <p className="mt-2">
                    Certifico que não estou grávida e não apresento distúrbios neurológicos.
                </p>

                <div>
                    <h2 className="font-bold mb-1">RESULTADOS E CUIDADOS PÓS-TRATAMENTO:</h2>
                    <ol className="list-decimal list-outside ml-5 space-y-1">
                        <li>Eu compreendi que o efeito da aplicação não é imediato e demora cerca de 4 a 7 dias para se observar o resultado. Esse efeito irá reverter-se em alguns meses, quando o tratamento poderá ser novamente indicado.</li>
                        <li>Estou ciente da necessidade de permanecer em postura ereta e não manipular a área tratada por um período de 4 (quatro) horas após a injeção. Não abaixar a cabeça. Evitar atividade física por 24 horas.</li>
                        <li>Estou ciente de que, no dia da aplicação da toxina, serei fotografado (a) apenas para controle e acompanhamento do médico que irá fazer o procedimento sendo que essas fotos poderão ser expostas em atividades e/ou reuniões acadêmicas e em redes sociais.</li>
                        <li>Após a aplicação fui orientada a não ingerir medicamentos sem a devida autorização médica por 1 semana. Não consumir bebida alcóolica por pelo menos 48 horas.</li>
                    </ol>
                </div>
            </div>

            <div className="mt-8 break-inside-avoid">
                <div className="flex items-end justify-between">
                    <div className="w-2/3 relative">
                        {signatureUrl && (
                            <img
                                src={signatureUrl}
                                alt="Assinatura"
                                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 max-h-16 mix-blend-multiply"
                            />
                        )}
                        <div className="border-t border-black pt-1 text-center text-xs">
                            Assinatura Paciente
                        </div>
                    </div>
                    <div className="text-xs">
                        DATA: {today}
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <h2 className="font-bold text-center border-t border-black pt-4">TERMO DE RESPONSABILIDADE</h2>
                <p className="text-justify text-xs">
                    Afirmo ter conhecimento dos riscos do tratamento e asseguro que o profissional me explicou todo o procedimento esclarecendo todas as minhas dúvidas e deixando claro que este tratamento não tem garantia de sucesso haja vista que inúmeros fatores podem influenciar no resultado.
                </p>
                <p className="text-justify text-xs">
                    Declaro ter lido e compreendido todas as informações acima. Todas as minhas perguntas foram respondidas anteriormente pelo profissional de estética.
                    Eu aceito os riscos e possíveis complicações inerentes a este procedimento e quero submeter-me ao mesmo.
                    Retorno para avaliação será feito somente com o prazo de 15 dias.
                </p>
            </div>

            <div className="mt-12 flex justify-between items-end text-xs font-bold uppercase break-inside-avoid">
                <div className="w-5/12 text-center relative">
                    {signatureUrl && (
                        <img
                            src={signatureUrl}
                            alt="Assinatura"
                            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-h-16 mix-blend-multiply"
                        />
                    )}
                    <div className="border-t border-black pt-1 mb-1">Assinatura Paciente</div>
                    <p>CPF: {paciente.cpf}</p>
                </div>
                <div className="w-2/12 text-center">DATA: {today}</div>
                <div className="w-4/12 text-center">
                    <div className="border-t border-black pt-1 mb-1">Profissional Responsável: Gabriela Mari</div>
                    <p>COREN: 212775</p>
                </div>
            </div>
        </div>
    );
};

export default TermoBotox;
