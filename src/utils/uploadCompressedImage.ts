import { supabase } from '../lib/supabaseClient';

export async function uploadCompressedImage(
  file: File,
  path: string,
): Promise<string> {
  if (file.size > 50 * 1024) {
    throw new Error(`"${file.name}" is ${Math.round(file.size / 1024)}KB — must be 50KB or less.`);
  }

  const { error } = await supabase.storage
    .from('member-files')
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  return path;
}
