import { supabase } from '../lib/supabaseClient';

export async function uploadCompressedImage(
  file: File,
  path: string,
  maxKb: number = 50,
): Promise<string> {
  if (file.size > maxKb * 1024) {
    throw new Error(`"${file.name}" is ${Math.round(file.size / 1024)}KB — must be ${maxKb}KB or less.`);
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
