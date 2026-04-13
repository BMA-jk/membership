import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PageShell } from '../components/PageShell';
import { uploadCompressedImage } from '../utils/uploadCompressedImage';

export const PublicRegistration: React.FC = () => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    designation: '',
    area_district: '',
    dob: '',
    blood_group: '',
    contact_no: '',
    address: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!photo || !aadhaarFront || !aadhaarBack) {
      setErrorMsg('Please upload all required images.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .insert({
          ...form,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      const memberId = data.id as string;

      const basePath = `members/${memberId}`;
      const photoPath = await uploadCompressedImage(photo, `${basePath}/photo.jpg`);
      const aadhaarFrontPath = await uploadCompressedImage(
        aadhaarFront,
        `${basePath}/aadhaar-front.jpg`,
      );
      const aadhaarBackPath = await uploadCompressedImage(
        aadhaarBack,
        `${basePath}/aadhaar-back.jpg`,
      );

      const { error: updateError } = await supabase
        .from('members')
        .update({
          photo_url: photoPath,
          aadhaar_front_url: aadhaarFrontPath,
          aadhaar_back_url: aadhaarBackPath,
        })
        .eq('id', memberId);
      if (updateError) throw updateError;

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
        <p className="mb-4">
          Thank you for applying for membership of Bhartiya Modi Army J&K.
        </p>
        <p className="mb-2 text-sm">
          Your application ID is:
        </p>
        <p className="font-mono font-semibold text-lg mb-4">{successId}</p>
        <p className="text-sm text-slate-600">
          You will receive an email once your application is approved or
          rejected.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Membership Registration">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Designation"
            name="designation"
            value={form.designation}
            onChange={handleChange}
          />
          <Input
            label="Area / District"
            name="area_district"
            value={form.area_district}
            onChange={handleChange}
          />
          <Input
            label="Date of Birth"
            name="dob"
            type="date"
            value={form.dob}
            onChange={handleChange}
          />
          <Input
            label="Blood Group"
            name="blood_group"
            value={form.blood_group}
            onChange={handleChange}
          />
          <Input
            label="Contact Number"
            name="contact_no"
            value={form.contact_no}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Address (as per Aadhaar card)
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <FileInput label="Photo" onChange={setPhoto} />
          <FileInput label="Aadhaar Front" onChange={setAadhaarFront} />
          <FileInput label="Aadhaar Back" onChange={setAadhaarBack} />
        </div>
        {errorMsg && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}
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

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, ...rest }) => (
  <div className="flex flex-col text-sm">
    <label className="mb-1 font-medium">{label}</label>
    <input
      {...rest}
      className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>
);

interface FileInputProps {
  label: string;
  onChange: (file: File | null) => void;
}

const FileInput: React.FC<FileInputProps> = ({ label, onChange }) => (
  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium">{label}</label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => onChange(e.target.files?.[0] || null)}
      className="text-xs"
    />
    <p className="text-[0.7rem] text-slate-500 mt-1">
      Image will be compressed to ~50KB.
    </p>
  </div>
);
