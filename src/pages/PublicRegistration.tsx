import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PageShell } from '../components/PageShell';
import { uploadCompressedImage } from '../utils/uploadCompressedImage';

const MAX_KB = 50;
const MAX_BYTES = MAX_KB * 1024;

function validateFile(file: File | null, label: string): string | null {
  if (!file) return null;
  if (file.size > MAX_BYTES) {
    return `${label}: ${Math.round(file.size / 1024)}KB — must be ${MAX_KB}KB or less.`;
  }
  return null;
}

export const PublicRegistration: React.FC = () => {
  const [form, setForm] = useState({
    full_name: '',
    father_name: '',
    email: '',
    designation: '',
    occupation: '',
    area_district: '',
    dob: '',
    blood_group: '',
    contact_no: '',
    address: '',
    aadhaar_no: '',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null);
  const [aadhaarFrontError, setAadhaarFrontError] = useState<string | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<File | null>(null);
  const [aadhaarBackError, setAadhaarBackError] = useState<string | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (
    file: File | null,
    label: string,
    setter: (f: File | null) => void,
    errorSetter: (e: string | null) => void,
  ) => {
    errorSetter(null);
    if (!file) { setter(null); return; }
    const err = validateFile(file, label);
    if (err) { errorSetter(err); setter(null); return; }
    setter(file);
  };

  const nullify = (val: string) => val.trim() === '' ? null : val.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!photo || !aadhaarFront || !aadhaarBack || !signature) {
      setErrorMsg('Please upload all 4 images (photo, Aadhaar front, Aadhaar back, signature).');
      return;
    }
    if (photoError || aadhaarFrontError || aadhaarBackError || signatureError) {
      setErrorMsg('Please fix the file size errors before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const memberId = crypto.randomUUID();
      const basePath = `members/${memberId}`;

      const photoPath = await uploadCompressedImage(photo, `${basePath}/photo.${photo.name.split('.').pop()}`);
      const aadhaarFrontPath = await uploadCompressedImage(aadhaarFront, `${basePath}/aadhaar-front.${aadhaarFront.name.split('.').pop()}`);
      const aadhaarBackPath = await uploadCompressedImage(aadhaarBack, `${basePath}/aadhaar-back.${aadhaarBack.name.split('.').pop()}`);
      const sigPath = `${basePath}/signature.${signature.name.split('.').pop()}`;
      const { error: sigErr } = await supabase.storage
        .from('member-documents')
        .upload(sigPath, signature, { contentType: signature.type, upsert: true });
      if (sigErr) throw sigErr;

      const { error } = await supabase.from('members').insert({
        id: memberId,
        full_name: form.full_name.trim(),
        father_name: nullify(form.father_name),
        email: form.email.trim(),
        contact_no: form.contact_no.trim(),
        address: form.address.trim(),
        designation: nullify(form.designation),
        occupation: nullify(form.occupation),
        area_district: nullify(form.area_district),
        dob: nullify(form.dob),
        blood_group: nullify(form.blood_group),
        aadhaar_no: nullify(form.aadhaar_no),
        photo_url: photoPath,
        aadhaar_front_url: aadhaarFrontPath,
        aadhaar_back_url: aadhaarBackPath,
        signature_url: sigPath,
        status: 'pending',
      });

      if (error) throw error;
      setSuccessId(memberId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <PageShell title="Membership Application Submitted">
        <p className="mb-4">Thank you for applying for membership of Bhartiya Modi Army J&K.</p>
        <p className="mb-2 text-sm">Your application ID is:</p>
        <p className="font-mono font-semibold text-lg mb-4">{successId}</p>
        <p className="text-sm text-slate-600">You will receive an email once your application is approved or rejected.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Membership Registration">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required />
          <Input label="Father's Name" name="father_name" value={form.father_name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Contact Number" name="contact_no" value={form.contact_no} onChange={handleChange} required />
          <Input label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} />
          <Input label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleChange} />
          <Input label="Designation" name="designation" value={form.designation} onChange={handleChange} />
          <Input label="Occupation" name="occupation" value={form.occupation} onChange={handleChange} />
          <Input label="Area / District" name="area_district" value={form.area_district} onChange={handleChange} />
          <Input label="Aadhaar Number" name="aadhaar_no" value={form.aadhaar_no} onChange={handleChange} maxLength={14} placeholder="XXXX XXXX XXXX" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address (as per Aadhaar card)</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <FileInput
            label="Photo"
            error={photoError}
            onChange={(f) => handleFile(f, 'Photo', setPhoto, setPhotoError)}
          />
          <FileInput
            label="Aadhaar Front"
            error={aadhaarFrontError}
            onChange={(f) => handleFile(f, 'Aadhaar Front', setAadhaarFront, setAadhaarFrontError)}
          />
          <FileInput
            label="Aadhaar Back"
            error={aadhaarBackError}
            onChange={(f) => handleFile(f, 'Aadhaar Back', setAadhaarBack, setAadhaarBackError)}
          />
          <FileInput
            label="Signature"
            error={signatureError}
            onChange={(f) => handleFile(f, 'Signature', setSignature, setSignatureError)}
          />
        </div>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </PageShell>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const Input: React.FC<InputProps> = ({ label, ...rest }) => (
  <div className="flex flex-col text-sm">
    <label className="mb-1 font-medium">{label}</label>
    <input {...rest} className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
  </div>
);

interface FileInputProps {
  label: string;
  error: string | null;
  onChange: (file: File | null) => void;
}
const FileInput: React.FC<FileInputProps> = ({ label, error, onChange }) => (
  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium">{label}</label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => onChange(e.target.files?.[0] || null)}
      className="text-xs"
    />
    {error
      ? <p className="text-[0.7rem] text-red-500 mt-1">{error}</p>
      : <p className="text-[0.7rem] text-slate-500 mt-1">Max 50KB.</p>
    }
  </div>
);
