import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- Checking Patients Table Schema ---');

    // Fetch a single row to see available columns
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching patients:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No patients found to infer schema.');
    }
}

checkSchema();
