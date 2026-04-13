import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabaseClient';

export async function uploadCompressedImage(
  file: File,
  path: string,
): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.05,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  });

  const { error } = await supabase.storage
    .from('member-files')
    .upload(path, compressed, {
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  // We store storage path, not public URL
  return path;
}
