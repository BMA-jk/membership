import React, { useRef, useState } from 'react';
import { Member } from '../types';

interface Props {
  member: Member;
  onClose?: () => void;
}

export const IDCard: React.FC<Props> = ({ member, onClose }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
      });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `BMA-Card-${member.membership_number || member.full_name}.png`;
      a.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Only essential fields for a standard ID card
  const fields = [
    { label: 'Membership No.', value: member.membership_number || '—' },
    { label: 'Name', value: member.full_name },
    { label: 'Designation', value: member.designation || '—' },
    { label: 'Area / District', value: member.area_district || '—' },
    { label: 'Valid From', value: formatDate(member.approved_at) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '24px' }}>

      {/* CR80 standard: 85.6mm x 54mm → rendered at 856x540px */}
      <div
        ref={cardRef}
        style={{
          width: '856px',
          height: '540px',
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 10px 48px rgba(0,0,0,0.6)',
          background: 'linear-gradient(160deg, #f97316 0%, #ea580c 20%, #fef9f0 40%, #ffffff 55%, #e8f5e0 72%, #4ade80 88%, #16a34a 100%)',
          fontFamily: "'Oswald', 'Roboto', sans-serif",
          flexShrink: 0,
        }}
      >

        {/* ── TOP BANNER ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '160px',
          background: 'linear-gradient(180deg, #7f1d1d 0%, #b91c1c 40%, #dc2626 75%, #ef4444 100%)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: '16px',
        }}>
          {/* Leader photo box */}
          <div style={{
            flexShrink: 0, width: '140px', height: '124px', borderRadius: '8px',
            overflow: 'hidden', background: 'rgba(255,255,255,0.12)',
            border: '2px dashed rgba(255,255,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 1.5 }}>
              Leader<br />Photo
            </span>
          </div>

          {/* Organisation title */}
          <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
            <div style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '34px',
              color: '#FFD700', textShadow: '0 2px 8px rgba(0,0,0,0.7)',
              letterSpacing: '0.04em', lineHeight: 1.1,
            }}>
              BHARTIYA MODI ARMY
            </div>
            <div style={{
              fontFamily: "'Oswald', sans-serif", fontSize: '15px',
              color: '#FFF8DC', letterSpacing: '0.18em', marginTop: '8px', fontWeight: 400,
            }}>
              — JAMMU &amp; KASHMIR —
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.35)',
              color: '#ffffff',
              fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: '14px',
              letterSpacing: '0.22em', padding: '5px 12px', marginTop: '10px',
              borderRadius: '4px', display: 'inline-block',
            }}>
              MEMBERSHIP IDENTITY CARD
            </div>
          </div>

          {/* India map box */}
          <div style={{
            flexShrink: 0, width: '80px', height: '116px',
            background: 'rgba(255,255,255,0.12)', border: '2px dashed rgba(255,255,255,0.45)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 1.5 }}>India<br />Map</span>
          </div>
        </div>

        {/* ── CARD BODY ── */}
        <div style={{
          position: 'absolute', top: '160px', left: 0, right: 0, bottom: '72px',
          display: 'flex', padding: '16px 20px 12px 20px', gap: '18px',
          alignItems: 'stretch',
        }}>
          {/* Member photo */}
          <div style={{
            flexShrink: 0, width: '138px',
            background: 'rgba(180,180,180,0.25)',
            border: '2px dashed rgba(80,80,80,0.4)',
            borderRadius: '8px', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {member.photo_url && !photoError ? (
              <img
                src={member.photo_url}
                alt={member.full_name}
                onError={() => setPhotoError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                crossOrigin="anonymous"
              />
            ) : (
              <span style={{ fontSize: '12px', color: 'rgba(60,60,60,0.45)', textAlign: 'center', lineHeight: 1.6, padding: '8px' }}>
                Member<br />Photo
              </span>
            )}
          </div>

          {/* Fields — large readable text */}
          <div style={{
            flex: 1,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-evenly',
          }}>
            {fields.map(({ label, value }) => (
              <div key={label} style={{
                borderBottom: '1.5px solid rgba(20,40,120,0.2)',
                paddingBottom: '6px',
                paddingTop: '2px',
              }}>
                <div style={{
                  fontFamily: "'Oswald', sans-serif", fontWeight: 400, fontSize: '11px',
                  color: '#6b7280', letterSpacing: '0.14em', textTransform: 'uppercase',
                  marginBottom: '2px',
                }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '18px',
                  color: '#111827', textTransform: 'uppercase', lineHeight: 1.2,
                  letterSpacing: '0.03em',
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM STRIP ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '72px',
          background: 'linear-gradient(90deg, #7f1d1d 0%, #b91c1c 40%, #dc2626 75%, #ea580c 100%)',
          display: 'flex', alignItems: 'center', padding: '0 20px',
          gap: '12px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '16px',
              color: '#FFD700', letterSpacing: '0.06em',
            }}>MODI ON MISSION</div>
            <div style={{
              fontFamily: "'Oswald', sans-serif", fontSize: '11px',
              color: 'rgba(255,255,255,0.75)', letterSpacing: '0.18em', marginTop: '3px',
            }}>— NATION FIRST —</div>
          </div>

          {/* Signature area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginRight: '148px' }}>
            <div style={{
              width: '120px', height: '34px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px dashed rgba(255,255,255,0.5)',
              borderBottom: '2px solid rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>SIGNATURE</span>
            </div>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>
              AUTHORIZED SIGNATORY
            </span>
          </div>
        </div>

        {/* ── SEAL ── */}
        <div style={{
          position: 'absolute', bottom: '6px', right: '12px',
          width: '138px', height: '138px', zIndex: 10,
        }}>
          <svg viewBox="0 0 100 100" width="138" height="138" style={{ position: 'absolute', top: 0, left: 0 }}>
            <defs>
              <path id="sealTopArc" d="M 14 50 A 36 36 0 0 1 86 50" />
              <path id="sealBotArc" d="M 8 50 A 42 42 0 0 0 92 50" />
            </defs>
            <circle cx="50" cy="50" r="48" fill="#14532d" stroke="#FFD700" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" strokeDasharray="2,2" />
            <circle cx="50" cy="50" r="30" fill="#ffffff" />
            <text fontFamily="Oswald,sans-serif" fontWeight="700" fontSize="8" fill="#FFD700" letterSpacing="0.6">
              <textPath xlinkHref="#sealTopArc" startOffset="50%" textAnchor="middle">BHARTIYA MODI ARMY</textPath>
            </text>
            <text fontFamily="Oswald,sans-serif" fontWeight="600" fontSize="8" fill="#ffffff" letterSpacing="0.6">
              <textPath xlinkHref="#sealBotArc" startOffset="50%" textAnchor="middle">JAMMU &amp; KASHMIR</textPath>
            </text>
            <text x="10" y="53" fontSize="8" fill="#FFD700" textAnchor="middle">★</text>
            <text x="90" y="53" fontSize="8" fill="#FFD700" textAnchor="middle">★</text>
          </svg>
          {/* Map inside seal */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%', height: '60%', borderRadius: '50%', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
          }}>
            <span style={{ fontSize: '8px', color: 'rgba(20,83,45,0.5)', textAlign: 'center', lineHeight: 1.4 }}>Map<br />PNG</span>
          </div>
        </div>

      </div>

      {/* ── ACTION BUTTONS ── */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '11px 30px', borderRadius: '8px',
              background: 'transparent', color: '#64748b',
              fontSize: '14px', fontWeight: 600,
              fontFamily: "'Oswald', sans-serif", letterSpacing: '0.1em',
              border: '1.5px solid #cbd5e1', cursor: 'pointer',
            }}
          >
            ✕ CLOSE
          </button>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          style={{
            padding: '11px 36px', borderRadius: '8px',
            background: downloading ? '#9a3412' : '#dc2626',
            color: '#ffffff', fontSize: '14px', fontWeight: 600,
            fontFamily: "'Oswald', sans-serif", letterSpacing: '0.1em',
            border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 10px rgba(220,38,38,0.45)',
          }}
        >
          {downloading ? 'DOWNLOADING...' : '⬇ DOWNLOAD ID CARD'}
        </button>
      </div>
    </div>
  );
};
