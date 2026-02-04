import React from 'react';

interface DocumentHeaderProps {
    title: string | React.ReactNode;
    paciente: {
        nome: string;
        dataNascimento?: string;
        telefone?: string;
        cpf?: string;
    };
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, paciente }) => {
    return (
        <div className="mb-8 font-sans print:font-sans">
            {/* Title */}
            <div className="text-center font-bold text-lg mb-6 uppercase leading-tight">
                {title}
            </div>

            {/* Patient Data Grid */}
            <div className="flex flex-col w-full">
                {/* Row 1 */}
                <div className="flex justify-between items-end border-b-2 border-black py-1">
                    <div className="text-sm font-bold uppercase overflow-hidden whitespace-nowrap text-ellipsis mr-4">
                        NOME COMPLETO: <span className="font-normal font-serif ml-1">{paciente.nome}</span>
                    </div>
                    <div className="text-sm font-bold uppercase whitespace-nowrap">
                        DATA DE NASCIMENTO: <span className="font-normal font-serif ml-1">{paciente.dataNascimento || '___/___/____'}</span>
                    </div>
                </div>

                {/* Row 2 */}
                <div className="flex justify-between items-end border-b-2 border-black py-1 mt-1">
                    <div className="text-sm font-bold uppercase">
                        FONE/CEL: <span className="font-normal font-serif ml-1">{paciente.telefone || '(___) _____ - ____'}</span>
                    </div>
                    <div className="text-sm font-bold uppercase">
                        CPF/RG: <span className="font-normal font-serif ml-1">{paciente.cpf || '___.___.___-__'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentHeader;
