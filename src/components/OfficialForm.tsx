import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Member } from '../types';

interface Props {
  member: Member;
  adminFields?: {
    assembly_constituency: string;
  };
}

async function getSignedUrl(bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

export const OfficialForm: React.FC<Props> = ({ member, adminFields }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sigUrl, setSigUrl] = useState<string | null>(null);

  useEffect(() => {
    getSignedUrl('member-files', member.photo_url).then(setPhotoUrl);
    getSignedUrl('member-documents', member.signature_url).then(setSigUrl);
  }, [member.photo_url, member.signature_url]);

  const dob = member.dob || '';
  const [dobYear, dobMonth, dobDay] = dob ? dob.split('-') : ['', '', ''];
  const constituency = adminFields?.assembly_constituency ?? member.assembly_constituency ?? '';
  const approvedDate = (member.approved_at || member.created_at || '').slice(0, 10);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        aspectRatio: '210 / 297',
        background: 'white',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        containerType: 'inline-size',
        fontFamily: 'Arial, Helvetica, sans-serif',
      } as React.CSSProperties}
    >
      {/* Flag placeholder - absolute positioned */}
      <div style={{
        position: 'absolute',
        left: '2cqw',
        bottom: '4cqw',
        width: '13cqw',
        height: '18cqw',
        zIndex: 10,
        background: 'transparent',
        border: '1px dashed rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2cqw',
        color: 'rgba(0,0,0,0.4)',
        textAlign: 'center',
      }}>
        Flag<br />Placeholder
      </div>

      {/* Header image placeholder */}
      <div style={{
        width: '100%',
        height: '25%',
        background: '#f9fafb',
        border: '2px dashed #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2cqw',
        color: '#888',
        fontWeight: 'bold',
        flexShrink: 0,
      }}>
        Image Placeholder (Header Section)
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', color: '#e06020', fontSize: '4cqw', fontWeight: 900, margin: '2cqw 0', letterSpacing: '0.1cqw' }}>
        BHARTIYA MODI ARMY JAMMU &amp; KASHMIR
      </div>

      {/* Orange divider */}
      <div style={{ height: '0.3cqw', background: '#e06020', width: '100%' }} />

      {/* Blue subtitle */}
      <div style={{ background: '#1b458d', color: 'white', textAlign: 'center', fontSize: '3.5cqw', fontWeight: 'bold', padding: '1.5cqw 0', letterSpacing: '0.1cqw' }}>
        MEMBERSHIP FORM
      </div>

      {/* Form body */}
      <div style={{ padding: '3cqw 6cqw', flexGrow: 1, display: 'flex', flexDirection: 'column', fontSize: '2.1cqw', color: '#222' }}>

        {/* Membership No - top right */}
        <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'flex-end', marginBottom: '3cqw', width: '45%' }}>
          <span style={{ fontWeight: 'bold', marginRight: '1cqw', whiteSpace: 'nowrap' }}>Membership No.</span>
          <div style={{ flexGrow: 1, borderBottom: '0.2cqw solid #4b628f', paddingBottom: '0.2cqw', fontSize: '2.1cqw' }}>
            {member.membership_number || ''}
          </div>
        </div>

        {/* Name */}
        <FormRow label="Name:" value={member.full_name} />
        {/* Father's Name */}
        <FormRow label="Father's Name:" value={member.father_name || ''} />
        {/* DOB */}
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '2.8cqw', width: '100%' }}>
          <span style={{ fontWeight: 'bold', marginRight: '1cqw', whiteSpace: 'nowrap' }}>Date of Birth:</span>
          <DobSegment value={dobDay} width="5cqw" /> /
          <DobSegment value={dobMonth} width="5cqw" /> /
          <DobSegment value={dobYear} width="8cqw" />
          <div style={{ flexGrow: 1 }} />
        </div>
        {/* Address */}
        <FormRow label="Address:" value={member.address || ''} />
        {/* District */}
        <FormRow label="District:" value={member.area_district || ''} />
        {/* Assembly Constituency */}
        <FormRow label="Assembly Constituency:" value={constituency} />

        {/* Split: left fields + photo box */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginTop: '1cqw' }}>
          <div style={{ width: '65%', display: 'flex', flexDirection: 'column' }}>
            <FormRow label="Occupation:" value={member.occupation || member.designation || ''} />
            <FormRow label="Mobile Number:" value={member.contact_no || ''} />
            <FormRow label="Email ID:" value={member.email} />
            <FormRow label="Aadhaar No.:" value={member.aadhaar_no || ''} />
            <FormRow label="Reference (if any):" value="" />
          </div>

          {/* Photo box */}
          <div style={{
            width: '30%',
            border: '0.3cqw dashed red',
            background: photoUrl ? 'transparent' : '#fffafb',
            color: 'red',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '2.5cqw',
            padding: photoUrl ? '0' : '2cqw',
            borderRadius: '0.5cqw',
            marginBottom: '2cqw',
            overflow: 'hidden',
          }}>
            {photoUrl
              ? <img src={photoUrl} alt="Member photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : 'member photo goes here'
            }
          </div>
        </div>
      </div>

      {/* Declaration divider */}
      <hr style={{ border: 'none', borderTop: '0.2cqw solid #e06020', margin: '1cqw 6cqw 3cqw 6cqw' }} />

      {/* Declaration */}
      <div style={{ textAlign: 'center', fontSize: '1.7cqw', padding: '0 10cqw', lineHeight: 1.5, marginBottom: '4cqw', color: '#222' }}>
        I hereby declare that I will work for the ideology of Hon'ble Prime Minister Narendra Modi<br />
        and serve <strong>the nation with full dedication.</strong>
      </div>

      {/* Signatures area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 6cqw 5cqw 16cqw', position: 'relative' }}>
        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'flex-end', width: '25%' }}>
          <span style={{ fontWeight: 'bold', marginRight: '1cqw', fontSize: '1.7cqw', whiteSpace: 'nowrap' }}>Date:</span>
          <div style={{ flexGrow: 1, borderBottom: '0.2cqw solid #4b628f', paddingBottom: '0.2cqw', fontSize: '1.7cqw' }}>
            {approvedDate}
          </div>
        </div>

        {/* Signature */}
        <div style={{ display: 'flex', alignItems: 'flex-end', width: '35%' }}>
          <span style={{ fontWeight: 'bold', marginRight: '1cqw', fontSize: '1.7cqw', whiteSpace: 'nowrap' }}>Signature:</span>
          <div style={{ position: 'relative', flexGrow: 1, height: '6cqw' }}>
            {sigUrl
              ? <img src={sigUrl} alt="Signature" style={{ position: 'absolute', bottom: '0.2cqw', left: 0, width: '100%', height: '6cqw', objectFit: 'contain' }} />
              : <div style={{ position: 'absolute', bottom: '0.2cqw', left: 0, width: '100%', height: '6cqw', border: '1px dashed rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2cqw', color: 'rgba(0,0,0,0.4)' }}>Signature Placeholder</div>
            }
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '0.2cqw', background: '#4b628f' }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#e06020', color: 'white', textAlign: 'center', padding: '2.5cqw 0', marginTop: 'auto', position: 'relative', zIndex: 1 }}>
        <p style={{ margin: '0.5cqw 0', fontSize: '2.5cqw', fontWeight: 'bold', letterSpacing: '0.15cqw' }}>NATION FIRST &bull; MODI FOREVER &bull;</p>
        <p style={{ margin: '0.5cqw 0', fontSize: '2.5cqw', fontWeight: 'bold', letterSpacing: '0.15cqw' }}>राष्ट्र प्रथम &bull; मोदी सदैव &bull;</p>
      </div>
    </div>
  );
};

// ── Helpers ──
const FormRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '2.8cqw', width: '100%' }}>
    <span style={{ fontWeight: 'bold', marginRight: '1cqw', whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ flexGrow: 1, borderBottom: '0.2cqw solid #4b628f', paddingBottom: '0.2cqw', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
      {value}
    </div>
  </div>
);

const DobSegment: React.FC<{ value: string; width: string }> = ({ value, width }) => (
  <div style={{ display: 'inline-block', width, borderBottom: '0.2cqw solid #4b628f', margin: '0 0.5cqw', textAlign: 'center' }}>
    {value}
  </div>
);
