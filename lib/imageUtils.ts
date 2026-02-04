import { supabase } from './supabase';

export const getSignedPhotoUrl = async (path: string | null | undefined): Promise<string | null> => {
    if (!path) return null;
    // Check if it's already a full URL
    if (path.startsWith('http')) return path;

    try {
        const { data } = await supabase.storage
            .from('fotos-pacientes')
            .createSignedUrl(path, 3600); // 1 hour expiry

        return data?.signedUrl || null;
    } catch (error) {
        console.error('Error getting signed URL for:', path, error);
        return null;
    }
};

export const compressImage = async (file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if larger than maxWidth
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Image compression failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
