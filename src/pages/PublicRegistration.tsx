import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PageShell } from '../components/PageShell';
import { uploadCompressedImage } from '../utils/uploadCompressedImage';

const MAX_KB = 50;
const PHOTO_MAX_KB = 100;
const MAX_BYTES = MAX_KB * 1024;
const PHOTO_MAX_BYTES = PHOTO_MAX_KB * 1024;

function validateFile(file: File | null, label: string, maxKb: number = MAX_KB): string | null {
  if (!file) return null;
  if (file.size > maxKb * 1024) return `${label}: ${Math.round(file.size/1024)}KB — must be ${maxKb}KB or less.`;
  return null;
}

/* ── Lightbox ─────────────────────────────────────────────── */
const Lightbox: React.FC<{ src: string; label: string; onClose: () => void }> = ({ src, label, onClose }) => {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      role="dialog" aria-modal="true"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', maxWidth: 'min(92vw,700px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: -44, right: 0,
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            borderRadius: '50%', width: 36, height: 36, fontSize: 22,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>
        <img
          src={src} alt={label}
          style={{ maxWidth: '100%', maxHeight: '80dvh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
        />
        <p style={{ marginTop: 12, color: '#e5e7eb', fontSize: 13, letterSpacing: '0.03em' }}>{label}</p>
      </div>
    </div>
  );
};

/* ── Thumbnail ────────────────────────────────────────────── */
const ImageThumb: React.FC<{ src: string; label: string; variant?: 'square' | 'signature' }> = ({ src, label, variant = 'square' }) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isSig = variant === 'signature';
  return (
    <>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <img
          src={src}
          alt={`${label} preview`}
          onClick={() => setOpen(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title="Click to preview"
          style={{
            width: isSig ? 200 : 80,
            height: isSig ? 64 : 80,
            objectFit: isSig ? 'contain' : 'cover',
            borderRadius: 6,
            cursor: 'pointer',
            background: isSig ? '#f8fafc' : 'transparent',
            border: hovered ? '2px solid #ea580c' : '2px solid #cbd5e1',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            boxShadow: hovered ? '0 4px 16px rgba(234,88,12,0.3)' : 'none',
            transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
          }}
        />
        <span style={{ fontSize: 11, color: '#64748b' }}>👆 Tap to preview</span>
      </div>
      {open && <Lightbox src={src} label={label} onClose={() => setOpen(false)} />}
    </>
  );
};

/* ── FileInput with instant thumbnail ────────────────────── */
interface FileInputProps {
  label: string;
  error: string | null;
  onChange: (file: File | null) => void;
  variant?: 'square' | 'signature';
  maxKbLabel?: number;
}
const FileInput: React.FC<FileInputProps> = ({ label, error, onChange, variant = 'square', maxKbLabel }) => {
  const [localThumb, setLocalThumb] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) setLocalThumb(URL.createObjectURL(file));
    else setLocalThumb(null);
    onChange(file);
  };

  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium">
        {label} <span className="text-slate-400 font-normal">(max {maxKbLabel ?? MAX_KB}KB)</span>
      </label>
      <input
        type="file" accept="image/*" onChange={handleChange}
        className="text-sm text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-orange-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-orange-700 hover:file:bg-orange-100"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {localThumb && !error && <ImageThumb src={localThumb} label={label} variant={variant} />}
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────── */
export const PublicRegistration: React.FC = () => {
  const [form, setForm] = useState({
    full_name: '', father_name: '', email: '', occupation: '',
    area_district: '', assembly_constituency: '', dob: '',
    blood_group: '', contact_no: '', address: '', aadhaar_no: '',
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
  const [successData, setSuccessData] = useState<{ name: string; applicationNo: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = (
    file: File | null, label: string,
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

      const photoPath        = await uploadCompressedImage(photo,        `${basePath}/photo.${photo.name.split('.').pop()}`);
      const aadhaarFrontPath = await uploadCompressedImage(aadhaarFront, `${basePath}/aadhaar-front.${aadhaarFront.name.split('.').pop()}`);
      const aadhaarBackPath  = await uploadCompressedImage(aadhaarBack,  `${basePath}/aadhaar-back.${aadhaarBack.name.split('.').pop()}`);
      const sigPath          = await uploadCompressedImage(signature,    `${basePath}/signature.${signature.name.split('.').pop()}`);

      const { data: inserted, error } = await supabase
        .from('members')
        .insert({
          id: memberId,
          full_name: form.full_name.trim(),
          father_name: nullify(form.father_name),
          email: form.email.trim(),
          contact_no: form.contact_no.trim(),
          address: form.address.trim(),
          occupation: nullify(form.occupation),
          area_district: nullify(form.area_district),
          assembly_constituency: nullify(form.assembly_constituency),
          dob: nullify(form.dob),
          blood_group: nullify(form.blood_group),
          aadhaar_no: nullify(form.aadhaar_no),
          photo_url: photoPath,
          aadhaar_front_url: aadhaarFrontPath,
          aadhaar_back_url: aadhaarBackPath,
          signature_url: sigPath,
          status: 'pending',
        })
        .select('application_no, full_name')
        .single();

      if (error) throw error;
      setSuccessData({ name: inserted.full_name, applicationNo: inserted.application_no ?? memberId });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <PageShell title="Application Submitted!">
        <div className="max-w-md">
          <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-green-800 text-base">Application Received</p>
                <p className="text-xs text-green-600">Thank you, {successData.name}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-green-200 px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Your Form Number</p>
              <p className="font-mono font-bold text-2xl text-orange-600 tracking-wide">{successData.applicationNo}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Please save your Form Number — you will need it to track your application status.
            A membership number will be assigned after your application is reviewed and approved.
          </p>
        </div>
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
          <Input label="Occupation" name="occupation" value={form.occupation} onChange={handleChange} />
          <Input label="Area / District" name="area_district" value={form.area_district} onChange={handleChange} />
          <Input label="Assembly Constituency" name="assembly_constituency" value={form.assembly_constituency} onChange={handleChange} />
          <Input label="Aadhaar Number" name="aadhaar_no" value={form.aadhaar_no} onChange={handleChange} maxLength={14} placeholder="XXXX XXXX XXXX" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address (as per Aadhaar card)</label>
          <textarea
            name="address" value={form.address} onChange={handleChange} required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <FileInput label="Photo" error={photoError} maxKbLabel={PHOTO_MAX_KB}
            onChange={f => handleFile(f, 'Photo', setPhoto, setPhotoError, PHOTO_MAX_KB)} />
          <FileInput label="Aadhaar Front" error={aadhaarFrontError}
            onChange={f => handleFile(f, 'Aadhaar Front', setAadhaarFront, setAadhaarFrontError)} />
          <FileInput label="Aadhaar Back" error={aadhaarBackError}
            onChange={f => handleFile(f, 'Aadhaar Back', setAadhaarBack, setAadhaarBackError)} />
          <FileInput label="Signature" error={signatureError} variant="signature"
            onChange={f => handleFile(f, 'Signature', setSignature, setSignatureError)} />
        </div>
        {errorMsg && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>}
        <button
          type="submit" disabled={submitting}
          className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </PageShell>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string; }
const Input: React.FC<InputProps> = ({ label, ...rest }) => (
  <div className="flex flex-col text-sm">
    <label className="mb-1 font-medium">{label}</label>
    <input {...rest} className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
  </div>
);
