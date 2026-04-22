import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Member } from '../types';

interface Props {
  member: Member;
}

export const IDCard: React.FC<Props> = ({ member }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
      });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `BMA-Card-${member.membership_number || member.full_name}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  // Format date as DD/MM/YYYY
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px' }}>

      {/* ── FONTS ── */}
      <link
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto:wght@400;700&display=swap"
        rel="stylesheet"
      />

      {/* ── CARD ── */}
      <div
        ref={cardRef}
        style={{
          width: 'min(90vw, 520px)',
          aspectRatio: '1.586 / 1',
          position: 'relative',
          borderRadius: '3.5% / 5.5%',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          background: 'linear-gradient(160deg, #f97316 0%, #ea580c 18%, #f5f5e8 38%, #ffffff 50%, #d4e8c2 65%, #4ade80 82%, #16a34a 100%)',
          fontFamily: "'Roboto', sans-serif",
        }}
      >

        {/* ── TOP BANNER ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '30%',
          background: 'linear-gradient(180deg, #c2440a 0%, #e05a10 60%, #f5811f 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 2%', gap: '2%',
        }}>

          {/* Leader photo placeholder */}
          <div style={{
            flexShrink: 0, width: '28%', height: '90%', borderRadius: '4px',
            overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
            border: '1px dashed rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 'clamp(4px,1.2vw,7px)', color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontFamily: 'Roboto,sans-serif', lineHeight: 1.3 }}>
              Leader<br />Photo<br />(no-bg PNG)
            </span>
          </div>

          {/* Title block */}
          <div style={{ flex: 1, textAlign: 'center', padding: '0 1%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4%', marginBottom: '1%' }}>
              {/* Ashoka Chakra SVG */}
              <svg viewBox="0 0 40 40" style={{ width: 'clamp(8px,2.5vw,16px)', height: 'clamp(8px,2.5vw,16px)', flexShrink: 0 }}>
                <circle cx="20" cy="20" r="18" fill="none" stroke="#1a3a6b" strokeWidth="2"/>
                <circle cx="20" cy="20" r="3" fill="none" stroke="#1a3a6b" strokeWidth="1.5"/>
                {Array.from({ length: 12 }, (_, i) => (
                  <line key={i}
                    x1={20} y1={4} x2={20} y2={17}
                    stroke="#1a3a6b" strokeWidth="1.2"
                    style={{ transformOrigin: '20px 20px', transform: `rotate(${i * 15}deg)` }}
                  />
                ))}
                {Array.from({ length: 12 }, (_, i) => (
                  <line key={i + 12}
                    x1={20} y1={23} x2={20} y2={36}
                    stroke="#1a3a6b" strokeWidth="1.2"
                    style={{ transformOrigin: '20px 20px', transform: `rotate(${i * 15}deg)` }}
                  />
                ))}
              </svg>

              <div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 'clamp(9px,3vw,18px)', color: '#FFD700', textShadow: '1px 1px 3px rgba(0,0,0,0.6)', letterSpacing: '0.03em', lineHeight: 1 }}>
                BHARTIYA MODI ARMY
              </div>

              <svg viewBox="0 0 40 40" style={{ width: 'clamp(8px,2.5vw,16px)', height: 'clamp(8px,2.5vw,16px)', flexShrink: 0 }}>
                <circle cx="20" cy="20" r="18" fill="none" stroke="#1a3a6b" strokeWidth="2"/>
                <circle cx="20" cy="20" r="3" fill="none" stroke="#1a3a6b" strokeWidth="1.5"/>
                {Array.from({ length: 12 }, (_, i) => (
                  <line key={i}
                    x1={20} y1={4} x2={20} y2={17}
                    stroke="#1a3a6b" strokeWidth="1.2"
                    style={{ transformOrigin: '20px 20px', transform: `rotate(${i * 15}deg)` }}
                  />
                ))}
                {Array.from({ length: 12 }, (_, i) => (
                  <line key={i + 12}
                    x1={20} y1={23} x2={20} y2={36}
                    stroke="#1a3a6b" strokeWidth="1.2"
                    style={{ transformOrigin: '20px 20px', transform: `rotate(${i * 15}deg)` }}
                  />
                ))}
              </svg>
            </div>
            <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 'clamp(5px,1.6vw,10px)', color: '#FFF8DC', letterSpacing: '0.08em', marginTop: '1%', fontWeight: 400 }}>
              — JAMMU &amp; KASHMIR —
            </div>
            <div style={{ background: '#1a3a6b', color: '#ffffff', fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 'clamp(5px,1.5vw,9px)', letterSpacing: '0.12em', padding: 'clamp(1px,0.4vw,3px) 0', marginTop: '2%', borderRadius: '2px' }}>
              MEMBERSHIP CARD
            </div>
          </div>

          {/* India map placeholder */}
          <div style={{
            flexShrink: 0, width: '14%', height: '82%',
            background: 'rgba(255,255,255,0.15)', border: '1px dashed rgba(255,255,255,0.5)',
            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <span style={{ fontSize: 'clamp(3px,0.9vw,6px)', color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 1.2 }}>India<br />Map<br />PNG</span>
          </div>
        </div>

        {/* ── CARD BODY ── */}
        <div style={{
          position: 'absolute', top: '30%', left: 0, right: 0, bottom: 0,
          display: 'flex', padding: '1.5% 2% 1% 2%', gap: '2%',
        }}>

          {/* Member photo */}
          <div style={{
            flexShrink: 0, width: '22%', aspectRatio: '35/45', maxHeight: '88%',
            alignSelf: 'flex-start', marginTop: '1%',
            background: 'rgba(200,200,200,0.35)', border: '1.5px dashed rgba(100,100,100,0.5)',
            borderRadius: '3px', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                crossOrigin="anonymous"
              />
            ) : (
              <span style={{ fontSize: 'clamp(4px,1.1vw,6px)', color: 'rgba(60,60,60,0.55)', textAlign: 'center', lineHeight: 1.3 }}>
                Passport<br />Size<br />Photo
              </span>
            )}
          </div>

          {/* Fields */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '1%' }}>
            {[
              { label: 'Membership No:', value: member.membership_number || '-' },
              { label: 'Name:', value: member.full_name },
              { label: 'Designation:', value: member.designation || '-' },
              { label: 'Area/District:', value: member.area_district || '-' },
              { label: 'Date of Birth:', value: formatDate(member.dob) },
              { label: 'Blood Group:', value: member.blood_group || '-' },
              { label: 'Contact No.:', value: member.contact_no || '-' },
              { label: 'Date of Joining:', value: formatDate(member.approved_at) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-end', gap: '2%', borderBottom: '1px solid rgba(30,50,120,0.35)', paddingBottom: '1px' }}>
                <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 'clamp(5px,1.45vw,9px)', color: '#1a2e6e', whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.6 }}>
                  {label}
                </span>
                <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 'clamp(5px,1.4vw,8.5px)', color: '#1a1a1a', flex: 1, lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM STRIP ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '14%',
          background: 'linear-gradient(90deg, #c2440a, #e05a10 60%, #f5811f)',
          display: 'flex', alignItems: 'center', padding: '0 3%',
        }}>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 'clamp(5px,1.6vw,9px)', lineHeight: 1.3, flex: 1 }}>
            <div style={{ color: '#FFD700', fontWeight: 700 }}>MODI ON MISSION</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7em', letterSpacing: '0.1em' }}>— NATION FIRST —</div>
          </div>

          {/* Authorized Signatory */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginRight: '24%', marginBottom: '1%' }}>
            <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 'clamp(4px,1.3vw,8px)', color: '#FFF8DC', whiteSpace: 'nowrap', paddingBottom: '2px' }}>
              Authorized Signatory:
            </span>
            <div style={{ width: 'clamp(50px,14vw,90px)', height: 'clamp(18px,4vw,26px)', borderBottom: '1px solid rgba(255,255,255,0.8)', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.15)', border: '1px dashed rgba(255,255,255,0.5)',
                borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(4px,1vw,6px)', textAlign: 'center',
                overflow: 'hidden',
              }}>
                Sign<br />PNG
              </div>
            </div>
          </div>
        </div>

        {/* ── SEAL ── */}
        <div style={{ position: 'absolute', bottom: '2.5%', right: '2.5%', width: '22%', aspectRatio: '1', zIndex: 10 }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            <defs>
              <path id="topArc" d="M 15 50 A 35 35 0 0 1 85 50"/>
              <path id="botArc" d="M 9 50 A 41 41 0 0 0 91 50"/>
            </defs>
            <circle cx="50" cy="50" r="48" fill="#1b4528" stroke="#ffffff" strokeWidth="1.2"/>
            <circle cx="50" cy="50" r="44.5" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,1.5"/>
            <circle cx="50" cy="50" r="28" fill="#ffffff"/>
            <text fontFamily="Oswald,sans-serif" fontWeight="700" fontSize="8.5" fill="#ffffff" letterSpacing="0.5">
              <textPath href="#topArc" startOffset="50%" textAnchor="middle">BHARTIYA MODI ARMY</textPath>
            </text>
            <text fontFamily="Oswald,sans-serif" fontWeight="600" fontSize="8.5" fill="#FFD700" letterSpacing="0.5">
              <textPath href="#botArc" startOffset="50%" textAnchor="middle">JAMMU &amp; KASHMIR</textPath>
            </text>
            <text x="10" y="52.5" fontSize="7" fill="#FFD700" textAnchor="middle">★</text>
            <text x="90" y="52.5" fontSize="7" fill="#FFD700" textAnchor="middle">★</text>
          </svg>
          {/* Seal inner map placeholder */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: '56%', height: '56%', borderRadius: '50%', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
          }}>
            <span style={{ fontSize: 'clamp(3px,0.8vw,5px)', color: 'rgba(30,60,120,0.6)', textAlign: 'center', lineHeight: 1.2, fontFamily: 'Roboto,sans-serif' }}>
              Map<br />PNG
            </span>
          </div>
        </div>

      </div>

      {/* ── DOWNLOAD BUTTON ── */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        style={{
          padding: '10px 28px',
          borderRadius: '6px',
          background: downloading ? '#9a3412' : '#ea580c',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: "'Oswald',sans-serif",
          letterSpacing: '0.08em',
          border: 'none',
          cursor: downloading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {downloading ? 'DOWNLOADING...' : '⬇ DOWNLOAD ID CARD'}
      </button>
    </div>
  );
};
