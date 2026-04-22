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
        scale: 3,
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const fields = [
    { label: 'Membership No:', value: member.membership_number || '-' },
    { label: 'Name:', value: member.full_name },
    { label: 'Designation:', value: member.designation || '-' },
    { label: 'Area/District:', value: member.area_district || '-' },
    { label: 'Date of Birth:', value: formatDate(member.dob) },
    { label: 'Blood Group:', value: member.blood_group || '-' },
    { label: 'Contact No.:', value: member.contact_no || '-' },
    { label: 'Date of Joining:', value: formatDate(member.approved_at) },
  ];

  // CR80 standard ID card ratio: 85.6mm x 54mm = 856x540px
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '24px' }}>

      {/* ── CARD: CR80 ratio 856×540px ── */}
      <div
        ref={cardRef}
        style={{
          width: '856px',
          height: '540px',
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
          background: 'linear-gradient(160deg, #f97316 0%, #ea580c 18%, #f5f5e8 38%, #ffffff 50%, #d4e8c2 65%, #4ade80 82%, #16a34a 100%)',
          fontFamily: "'Roboto', sans-serif",
          flexShrink: 0,
        }}
      >

        {/* ── TOP BANNER ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '148px',
          background: 'linear-gradient(180deg, #c2440a 0%, #e05a10 60%, #f5811f 100%)',
          display: 'flex', alignItems: 'center',
          padding: '0 18px', gap: '14px',
        }}>
          {/* Leader photo placeholder */}
          <div style={{
            flexShrink: 0, width: '160px', height: '116px', borderRadius: '6px',
            overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
            border: '1.5px dashed rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.4 }}>
              Leader Photo<br />(no-bg PNG)
            </span>
          </div>

          {/* Title block */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '30px',
              color: '#FFD700', textShadow: '1px 2px 4px rgba(0,0,0,0.6)',
              letterSpacing: '0.05em', lineHeight: 1,
            }}>
              BHARTIYA MODI ARMY
            </div>
            <div style={{
              fontFamily: "'Oswald', sans-serif", fontSize: '14px',
              color: '#FFF8DC', letterSpacing: '0.12em', marginTop: '8px', fontWeight: 400,
            }}>
              — JAMMU &amp; KASHMIR —
            </div>
            <div style={{
              background: '#1a3a6b', color: '#ffffff',
              fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: '13px',
              letterSpacing: '0.16em', padding: '5px 0', marginTop: '10px', borderRadius: '3px',
            }}>
              MEMBERSHIP CARD
            </div>
          </div>

          {/* India map placeholder */}
          <div style={{
            flexShrink: 0, width: '80px', height: '108px',
            background: 'rgba(255,255,255,0.15)', border: '1.5px dashed rgba(255,255,255,0.5)',
            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 1.4 }}>India<br />Map<br />PNG</span>
          </div>
        </div>

        {/* ── CARD BODY ── */}
        <div style={{
          position: 'absolute', top: '148px', left: 0, right: 0, bottom: '68px',
          display: 'flex', padding: '14px 18px 10px 18px', gap: '16px',
        }}>
          {/* Member photo */}
          <div style={{
            flexShrink: 0, width: '132px', height: '164px',
            alignSelf: 'flex-start',
            background: 'rgba(200,200,200,0.35)', border: '2px dashed rgba(100,100,100,0.45)',
            borderRadius: '5px', overflow: 'hidden',
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
              <span style={{ fontSize: '11px', color: 'rgba(60,60,60,0.5)', textAlign: 'center', lineHeight: 1.5, padding: '6px' }}>
                Member<br />Photo
              </span>
            )}
          </div>

          {/* Fields */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '2px' }}>
            {fields.map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'baseline', gap: '8px',
                borderBottom: '1px solid rgba(30,50,120,0.25)',
                paddingBottom: '4px',
                paddingTop: '4px',
              }}>
                <span style={{
                  fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: '12.5px',
                  color: '#1a2e6e', whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.6,
                  minWidth: '110px',
                }}>
                  {label}
                </span>
                <span style={{
                  fontFamily: "'Roboto', sans-serif", fontSize: '12.5px',
                  color: '#111111', lineHeight: 1.6, fontWeight: 500,
                  wordBreak: 'break-word', overflowWrap: 'anywhere',
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM STRIP ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '68px',
          background: 'linear-gradient(90deg, #c2440a, #e05a10 60%, #f5811f)',
          display: 'flex', alignItems: 'center', padding: '0 18px',
        }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", lineHeight: 1.4, flex: 1 }}>
            <div style={{ color: '#FFD700', fontWeight: 700, fontSize: '14px' }}>MODI ON MISSION</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', letterSpacing: '0.12em' }}>— NATION FIRST —</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginRight: '140px' }}>
            <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '11px', color: '#FFF8DC', whiteSpace: 'nowrap', paddingBottom: '2px' }}>
              Authorized Signatory:
            </span>
            <div style={{ width: '110px', height: '34px', borderBottom: '1.5px solid rgba(255,255,255,0.8)', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.12)', border: '1px dashed rgba(255,255,255,0.45)',
                borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.75)', fontSize: '9px', textAlign: 'center', overflow: 'hidden',
              }}>
                Sign PNG
              </div>
            </div>
          </div>
        </div>

        {/* ── SEAL ── */}
        <div style={{
          position: 'absolute', bottom: '8px', right: '14px',
          width: '130px', height: '130px', zIndex: 10,
        }}>
          <svg viewBox="0 0 100 100" width="130" height="130" style={{ position: 'absolute', top: 0, left: 0 }}>
            <defs>
              <path id="sealTopArc" d="M 15 50 A 35 35 0 0 1 85 50"/>
              <path id="sealBotArc" d="M 9 50 A 41 41 0 0 0 91 50"/>
            </defs>
            <circle cx="50" cy="50" r="48" fill="#1b4528" stroke="#ffffff" strokeWidth="1.2"/>
            <circle cx="50" cy="50" r="44.5" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,1.5"/>
            <circle cx="50" cy="50" r="28" fill="#ffffff"/>
            <text fontFamily="Oswald,sans-serif" fontWeight="700" fontSize="8.5" fill="#ffffff" letterSpacing="0.5">
              <textPath xlinkHref="#sealTopArc" startOffset="50%" textAnchor="middle">BHARTIYA MODI ARMY</textPath>
            </text>
            <text fontFamily="Oswald,sans-serif" fontWeight="600" fontSize="8.5" fill="#FFD700" letterSpacing="0.5">
              <textPath xlinkHref="#sealBotArc" startOffset="50%" textAnchor="middle">JAMMU &amp; KASHMIR</textPath>
            </text>
            <text x="10" y="52.5" fontSize="7" fill="#FFD700" textAnchor="middle">★</text>
            <text x="90" y="52.5" fontSize="7" fill="#FFD700" textAnchor="middle">★</text>
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: '56%', height: '56%', borderRadius: '50%', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
          }}>
            <span style={{ fontSize: '8px', color: 'rgba(30,60,120,0.55)', textAlign: 'center', lineHeight: 1.3 }}>Map<br />PNG</span>
          </div>
        </div>

      </div>

      {/* ── BUTTONS ── */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 28px',
              borderRadius: '6px',
              background: 'transparent',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: '0.08em',
              border: '1.5px solid #cbd5e1',
              cursor: 'pointer',
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
            padding: '10px 32px',
            borderRadius: '6px',
            background: downloading ? '#9a3412' : '#ea580c',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: "'Oswald', sans-serif",
            letterSpacing: '0.08em',
            border: 'none',
            cursor: downloading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 8px rgba(234,88,12,0.4)',
          }}
        >
          {downloading ? 'DOWNLOADING...' : '⬇ DOWNLOAD ID CARD'}
        </button>
      </div>
    </div>
  );
};
