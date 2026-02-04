import { createClient } from '@supabase/supabase-js';

// Hardcoded for script execution
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

const transactions = [
    { description: 'Botox Full Face - A. Silva', category: 'Procedimentos', value: 2500, date: '2023-10-12', type: 'income', payment_method: 'Cartão Crédito', status: 'Pago', patient_name: 'Ana Silva' },
    { description: 'Compra de Toxina', category: 'Estoque', value: 4500, date: '2023-10-11', type: 'expense', payment_method: 'Boleto', status: 'Pago', patient_name: null },
    { description: 'Limpeza de Pele - J. Roberts', category: 'Procedimentos', value: 350, date: '2023-10-10', type: 'income', payment_method: 'Pix', status: 'Pago', patient_name: 'Julia Roberts' },
    { description: 'Aluguel Clínica', category: 'Aluguel', value: 3000, date: '2023-10-05', type: 'expense', payment_method: 'Transferência', status: 'Pago', patient_name: null },
    { description: 'Preenchimento Labial', category: 'Procedimentos', value: 1800, date: '2023-09-28', type: 'income', payment_method: 'Cartão Crédito', status: 'Pago', patient_name: null },
    { description: 'Manutenção Laser', category: 'Manutenção', value: 1200, date: '2023-09-15', type: 'expense', payment_method: 'Boleto', status: 'Pago', patient_name: null },
    { description: 'Bioestimulador', category: 'Procedimentos', value: 3000, date: '2023-08-20', type: 'income', payment_method: 'Cartão Débito', status: 'Pago', patient_name: null },
    { description: 'Venda Protetor Solar', category: 'Venda de Produtos', value: 150, date: '2023-10-13', type: 'income', payment_method: 'Dinheiro', status: 'Pago', patient_name: null }
];

async function seed() {
    console.log('Checking for existing transactions...');
    const { data: existing, error: fetchError } = await supabase.from('transactions').select('id').limit(1);

    if (fetchError) {
        console.error('Error checking transactions:', fetchError);
        return;
    }

    if (existing && existing.length > 0) {
        console.log('Transactions already exist. Skipping seed.');
        return;
    }

    console.log('Seeding ' + transactions.length + ' transactions...');
    const { error } = await supabase.from('transactions').insert(transactions);

    if (error) {
        console.error('Error seeding transactions:', error);
    } else {
        console.log('Transactions seeded successfully!');
    }
}

seed();
