import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUrls() {
    console.log('--- Testing URLs ---');

    const fileName = '1769706469507-before-FotoGab.jpeg'; // From previous DB check

    // 1. Signed URL
    const { data: signedData, error: signedError } = await supabase.storage
        .from('fotos-pacientes')
        .createSignedUrl(fileName, 60);

    if (signedError) {
        console.error('Error creating signed URL:', signedError);
    } else {
        console.log('Signed URL created:', signedData.signedUrl);
        // We can't easily curl from here, but obtaining it proves file existence usually.
    }

    // 2. Public URL
    const { data: publicData } = supabase.storage
        .from('fotos-pacientes')
        .getPublicUrl(fileName);

    console.log('Public URL:', publicData.publicUrl);
}

testUrls();
