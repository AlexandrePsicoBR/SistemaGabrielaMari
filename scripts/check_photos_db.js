import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPhotos() {
    console.log('--- Checking Patient Photos DB ---');

    const { data: photos, error } = await supabase
        .from('patient_photos')
        .select('*');

    if (error) {
        console.error('Error fetching photos:', error);
        return;
    }

    console.log(`Found ${photos.length} photos.`);
    photos.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`  Title: ${p.title}`);
        console.log(`  Before URL: ${p.before_url}`);
        console.log(`  After URL: ${p.after_url}`);
        console.log('-----------------------------------');
    });
}

checkPhotos();
