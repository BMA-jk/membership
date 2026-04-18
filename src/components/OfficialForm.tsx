import React, { useEffect, useRef, useState } from 'react';
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

const FORM_W = 800;
const FORM_H = 1132;

const FormLightbox: React.FC<{ src: string; label: string; onClose: () => void }> = ({ src, label, onClose }) => {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.90)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      role="dialog" aria-modal="true"
    >
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 'min(94vw,800px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: -48, right: 0, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 38, height: 38, fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >×</button>
        <img src={src} alt={label} style={{ maxWidth: '100%', maxHeight: '82dvh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }} />
        <p style={{ marginTop: 14, color: '#e5e7eb', fontSize: 13, letterSpacing: '0.03em' }}>{label}</p>
      </div>
    </div>
  );
};

export const OfficialForm: React.FC<Props> = ({ member, adminFields }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [photoLightbox, setPhotoLightbox] = useState(false);
  const [sigLightbox, setSigLightbox] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSignedUrl('member-files', member.photo_url).then(setPhotoUrl);
    getSignedUrl('member-files', member.signature_url).then(setSigUrl);
  }, [member.photo_url, member.signature_url]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      setScale(width / FORM_W);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const dob = member.dob || '';
  const [dobYear, dobMonth, dobDay] = dob ? dob.split('-') : ['', '', ''];
  const constituency = adminFields?.assembly_constituency ?? member.assembly_constituency ?? '';
  const approvedDate = (member.approved_at || member.created_at || '').slice(0, 10);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: `${FORM_H * scale}px`,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          width: `${FORM_W}px`,
          height: `${FORM_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          background: 'white',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '14px',
        }}
      >
        {/* Flag placeholder */}
        <div style={{
          position: 'absolute',
          left: 16,
          bottom: 32,
          width: 104,
          height: 144,
          zIndex: 10,
          background: 'transparent',
          border: '1px dashed rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: 'rgba(0,0,0,0.4)',
          textAlign: 'center',
        }}>
          Flag<br />Placeholder
        </div>

        {/* Header image placeholder */}
        <div style={{
          width: '100%',
          height: '18.75%',
          background: '#f9fafb',
          border: '2px dashed #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: '#888',
          fontWeight: 'bold',
          flexShrink: 0,
        }}>
          Image Placeholder (Header Section)
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', color: '#e06020', fontSize: 28, fontWeight: 900, margin: '12px 0', letterSpacing: 0.8 }}>
          BHARTIYA MODI ARMY JAMMU &amp; KASHMIR
        </div>

        {/* Orange divider */}
        <div style={{ height: 2.5, background: '#e06020', width: '100%' }} />

        {/* Blue subtitle */}
        <div style={{ background: '#1b458d', color: 'white', textAlign: 'center', fontSize: 24, fontWeight: 'bold', padding: '10px 0', letterSpacing: 0.8 }}>
          MEMBERSHIP FORM
        </div>

        {/* Form body */}
        <div style={{ padding: '20px 48px', flexGrow: 1, display: 'flex', flexDirection: 'column', fontSize: 14, color: '#222' }}>

          <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'flex-end', marginBottom: 20, width: '45%' }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, whiteSpace: 'nowrap' }}>Membership No.</span>
            <div style={{ flexGrow: 1, borderBottom: '1.5px solid #4b628f', paddingBottom: 2, fontSize: 14 }}>
              {member.membership_number || ''}
            </div>
          </div>

          <FormRow label="Name:" value={member.full_name} />
          <FormRow label="Father's Name:" value={member.father_name || ''} />

          <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 20, width: '100%' }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, whiteSpace: 'nowrap' }}>Date of Birth:</span>
            <DobSegment value={dobDay} width={40} />/
            <DobSegment value={dobMonth} width={40} />/
            <DobSegment value={dobYear} width={64} />
            <div style={{ flexGrow: 1 }} />
          </div>

          <FormRow label="Address:" value={member.address || ''} />
          <FormRow label="District:" value={member.area_district || ''} />
          <FormRow label="Assembly Constituency:" value={constituency} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginTop: 8 }}>
            <div style={{ width: '65%', display: 'flex', flexDirection: 'column' }}>
              <FormRow label="Occupation:" value={member.occupation || member.designation || ''} />
              <FormRow label="Mobile Number:" value={member.contact_no || ''} />
              <FormRow label="Email ID:" value={member.email} />
              <FormRow label="Aadhaar No.:" value={member.aadhaar_no || ''} />
              <FormRow label="Reference (if any):" value="" />
            </div>

            <div
              onClick={() => photoUrl && setPhotoLightbox(true)}
              title={photoUrl ? 'Click to enlarge' : undefined}
              style={{
                width: '30%',
                border: '2px dashed red',
                background: photoUrl ? 'transparent' : '#fffafb',
                color: 'red',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 14,
                padding: photoUrl ? 0 : 16,
                borderRadius: 4,
                marginBottom: 16,
                overflow: 'hidden',
                cursor: photoUrl ? 'zoom-in' : 'default',
                position: 'relative',
              }}>
              {photoUrl
                ? <img src={photoUrl} alt="Member photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : 'member photo goes here'
              }
              {photoUrl && (
                <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#fff', pointerEvents: 'none' }}>
                  🔍
                </div>
              )}
            </div>
            {photoLightbox && photoUrl && (
              <FormLightbox src={photoUrl} label="Candidate Photo" onClose={() => setPhotoLightbox(false)} />
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1.5px solid #e06020', margin: '8px 48px 20px 48px' }} />

        <div style={{ textAlign: 'center', fontSize: 12, padding: '0 80px', lineHeight: 1.5, marginBottom: 28, color: '#222' }}>
          I hereby declare that I will work for the ideology of Hon'ble Prime Minister Narendra Modi<br />
          and serve <strong>the nation with full dedication.</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 48px 40px 128px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', width: '25%' }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, fontSize: 12, whiteSpace: 'nowrap' }}>Date:</span>
            <div style={{ flexGrow: 1, borderBottom: '1.5px solid #4b628f', paddingBottom: 2, fontSize: 12 }}>
              {approvedDate}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', width: '35%' }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, fontSize: 12, whiteSpace: 'nowrap' }}>Signature:</span>
            <div
              style={{ position: 'relative', flexGrow: 1, height: 48, cursor: sigUrl ? 'zoom-in' : 'default' }}
              onClick={() => sigUrl && setSigLightbox(true)}
              title={sigUrl ? 'Click to enlarge' : undefined}
            >
              {sigUrl
                ? <img src={sigUrl} alt="Signature" style={{ position: 'absolute', bottom: 2, left: 0, width: '100%', height: 48, objectFit: 'contain' }} />
                : <div style={{ position: 'absolute', bottom: 2, left: 0, width: '100%', height: 48, border: '1px dashed rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(0,0,0,0.4)' }}>Signature Placeholder</div>
              }
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 1.5, background: '#4b628f' }} />
              {sigUrl && (
                <div style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 5px', fontSize: 9, color: '#fff', pointerEvents: 'none' }}>🔍</div>
              )}
            </div>
            {sigLightbox && sigUrl && (
              <FormLightbox src={sigUrl} label="Signature" onClose={() => setSigLightbox(false)} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#e06020', color: 'white', textAlign: 'center', padding: '16px 0', marginTop: 'auto', flexShrink: 0 }}>
          <p style={{ margin: '4px 0', fontSize: 18, fontWeight: 'bold', letterSpacing: 1.2 }}>NATION FIRST &bull; MODI FOREVER &bull;</p>
          <p style={{ margin: '4px 0', fontSize: 18, fontWeight: 'bold', letterSpacing: 1.2 }}>राष्ट्र प्रथम &bull; मोदी सदैव &bull;</p>
        </div>
      </div>
    </div>
  );
};

const FormRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 20, width: '100%' }}>
    <span style={{ fontWeight: 'bold', marginRight: 8, whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ flexGrow: 1, borderBottom: '1.5px solid #4b628f', paddingBottom: 2, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
      {value}
    </div>
  </div>
);

const DobSegment: React.FC<{ value: string; width: number }> = ({ value, width }) => (
  <div style={{ display: 'inline-block', width, borderBottom: '1.5px solid #4b628f', margin: '0 4px', textAlign: 'center' }}>
    {value}
  </div>
);
