import React from 'react';
import { formatDate } from '../lib/dateUtils';
import DocumentHeader from './DocumentHeader';

interface TermoPeelingProps {
    paciente: {
        nome: string;
        dataNascimento: string;
        telefone: string;
        cpf?: string;
        alergias?: string | string[];
    };
}

const TermoPeeling: React.FC<TermoPeelingProps> = ({ paciente }) => {
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
                title="TERMO DE CONSENTIMENTO PARA REALIZAÇÃO DE TRATAMENTO COM PEELING"
                paciente={paciente}
            />

            {/* TEXTO CORPO */}
            <div className="space-y-4 mb-4">
                <p>
                    Eu autorizo a profissional Gabriela Mari, COREN 212775, a realizar o tratamento de peeling, seja químico, físico ou enzimático.
                </p>

                <p>
                    Peeling químico baseia-se na aplicação de um ou mais agentes esfoliantes na pele resultando na destruição de parte da epiderme e\ou derme, seguida da regeneração dos tecidos epidérmicos e dérmicos novos.
                </p>

                <p>
                    Peeling enzimático – as enzimas proteolíticas são aplicadas em formulações tópicas com a finalidade de reduzir a espessura da camada córnea da pele por hidrolisar, em pontos específicos, a queratina cutânea.
                </p>

                <p>
                    No Peeling físico a abrasão é feita por cosméticos ou aparelhos.
                </p>

                <p>
                    O peeling é um procedimento para melhorar a aparência da pele. Uma solução, podendo ser química ou enzimática, é aplicada sobre a pele podendo ocasionar a descamação das suas camadas mais externas por 3 a 7 dias. Com isso, ocorre a renovação da pele.
                </p>

                <p>
                    O peeling é indicado para tratamento de rugas finas e rejuvenescimento, manchas superficiais ou senis e solares, acne e estrias.
                </p>

                <p>
                    A eficácia do tratamento pode variar de pessoa para pessoa. O resultado não será garantido caso não seja feita a manutenção necessária com cremes e\ou medicamentos prescritos pelo profissional habilitado ou com sessões adicionais de peelings.
                </p>

                <p>
                    <span className="font-bold">Indicações gerais:</span> prevenção e tratamento do envelhecimento cutâneo, diminuição de sulcos e rugas, fotoenvelhecimento, hiperpigmentação cicatrizes, peles secas, desidratadas ou peles oleosas, acne, excesso de comedões, celulite, foliculite, estrias, mãos.
                </p>

                <p>
                    <span className="font-bold">Contra-indicações gerais:</span> lesões de pele ou ferimentos, alergia ao produto usado, hipertensão descompensada, diabetes descompensada, falta de comprometimento do cliente, herpes ativa, pele queimada e\ou bronzeada.
                </p>

                {/* Campo de Alergia Dinâmico */}
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 print:bg-transparent print:border-none print:p-0">
                    <span className="font-bold">Sou alérgico a: </span>
                    <span className="uppercase border-b border-black min-w-[200px] inline-block pl-2 text-red-600 font-bold">
                        {textoAlergias}
                    </span>
                </div>

                <p>
                    Para determinados tipos de pele o uso de cremes pode ser necessário para preparar a pele, conforme orientação do profissional.
                </p>

                <p>
                    Logo após o procedimento poderá ocorrer vermelhidão, inchaço, sensibilidade e uma leve sensação de coceira na região tratada. Esses efeitos são normais e o incômodo desaparecerá em até 1 semana. Entrar em contato se após o 3º dia continuar a sentir o incômodo.
                </p>

                <p className="font-bold">
                    Atesto que durante o tratamento NÃO POSSO ME EXPOR AO SOL, NÃO POSSO UTILIZAR CREMES COM ÁLCOOL OU PERFUME, pois poderá ocasionar manchas.
                </p>

                <p>
                    Deverei usar filtro solar com alta proteção diariamente e reaplicar a cada 3 horas mesmo em dias nublados ou sem sol, conforme recomendação do profissional.
                </p>

                <p>
                    Não se expor ao sol e não utilizar produtos (ex. cremes) com álcool ou perfume após o tratamento com peeling por 4 (quatro) semanas usando filtro solar a cada 3 horas. Estas medidas são necessárias para diminuir a possibilidade de efeitos indesejáveis.
                </p>

                <p>
                    Em alguns casos, o peeling pode aprofundar, criando uma crosta, sendo neste caso necessário o uso de creme prescrito pelo profissional. A crosta NÃO deve ser puxada da pele de maneira alguma pois pode causar efeitos indesejáveis (ex. manchas). Aguardar a crosta sair sozinha, não se expor ao sol e passar protetor solar a cada 3 horas mesmo em dias sem sol.
                </p>

                <p>
                    Estou ciente da possibilidade de complicações e o que devo esperar desse tratamento. Declaro não estar grávida. Declaro não sofrer de cicatrização anormal ou hipertrófica e que não faço uso do medicamento isotretinoína por pelo menos 1 ano.
                </p>

                <p>
                    As fotos tiradas são exclusivamente para acompanhamento do tratamento e não deverão ser divulgadas para qualquer finalidade, a não ser que sejam autorizadas previamente por mim.
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

export default TermoPeeling;
