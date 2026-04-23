import React, { useRef, useState, useEffect } from 'react';
import { Member } from '../types';

interface Props {
  member: Member;
  onClose?: () => void;
}

export const IDCard: React.FC<Props> = ({ member, onClose }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [scale, setScale] = useState(1);

  const CARD_W = 856;
  const CARD_H = 540;

  useEffect(() => {
    const updateScale = () => {
      if (!wrapperRef.current) return;
      const available = wrapperRef.current.offsetWidth - 32;
      const s = Math.min(1, available / CARD_W);
      setScale(s);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const photoUrl = member.photo_url
    ? member.photo_url.startsWith('http')
      ? member.photo_url
      : `https://ibfpyyzuarrxmokdwxns.supabase.co/storage/v1/object/public/member-files/${member.photo_url}`
    : null;

  const fields = [
    { label: 'Membership No:', value: member.membership_number || '' },
    { label: 'Name:', value: member.full_name || '' },
    { label: 'Designation:', value: member.designation || '' },
    { label: 'Area/District:', value: member.area_district || '' },
    { label: 'Date of Joining:', value: formatDate(member.approved_at) },
  ];

  return (
    <div
      ref={wrapperRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '16px', width: '100%', boxSizing: 'border-box' }}
    >
      {/* Scale wrapper — keeps card pixel-perfect for download but fits any screen */}
      <div style={{
        width: `${CARD_W * scale}px`,
        height: `${CARD_H * scale}px`,
        flexShrink: 0,
      }}>
        <div
          ref={cardRef}
          style={{
            width: `${CARD_W}px`,
            height: `${CARD_H}px`,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(0,0,0,0.55)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            background: 'linear-gradient(180deg, #FF9933 0%, #FF9933 22%, #FFF5E0 35%, #FFFFF0 50%, #E8F5E0 62%, #138808 85%, #0A6B04 100%)',
          }}
        >
          {/* ── ORANGE HEADER BANNER ── */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '155px',
            background: 'linear-gradient(180deg, #E65C00 0%, #F5821F 40%, #FF9933 80%, #FFB347 100%)',
            display: 'flex', alignItems: 'center',
            padding: '10px 16px', gap: '10px',
            borderBottom: '3px solid #CC6600',
          }}>
            <div style={{
              flexShrink: 0, width: '155px', height: '132px',
              borderRadius: '6px', overflow: 'hidden',
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px dashed rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.5 }}>
                Leader<br />Photo
              </span>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
              <div style={{ fontSize: '28px', lineHeight: 1, marginBottom: '2px' }}>🏛️</div>
              <div style={{
                fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '32px',
                color: '#FFD700',
                textShadow: '1px 1px 0 #8B4513, 2px 2px 4px rgba(0,0,0,0.6)',
                letterSpacing: '0.04em', lineHeight: 1.05,
              }}>
                BHARTIYA MODI ARMY
              </div>
              <div style={{
                fontFamily: "'Georgia', serif", fontSize: '14px',
                color: '#ffffff', letterSpacing: '0.2em', marginTop: '4px',
                fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}>
                — JAMMU &amp; KASHMIR —
              </div>
              <div style={{
                background: '#1a3a6b', color: '#ffffff',
                fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '14px',
                letterSpacing: '0.2em', padding: '5px 16px',
                marginTop: '8px', borderRadius: '3px',
                display: 'inline-block',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}>
                MEMBERSHIP CARD
              </div>
            </div>
            <div style={{
              flexShrink: 0, width: '90px', height: '124px',
              borderRadius: '6px', overflow: 'hidden',
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px dashed rgba(255,255,255,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.5 }}>India<br />Map</span>
            </div>
          </div>

          {/* ── CARD BODY ── */}
          <div style={{
            position: 'absolute',
            top: '155px', left: 0, right: 0, bottom: '68px',
            display: 'flex', alignItems: 'center',
            padding: '12px 18px 8px 18px', gap: '18px',
          }}>
            <div style={{
              flexShrink: 0, width: '110px', height: '140px',
              background: 'rgba(180,180,180,0.2)',
              border: '1.5px dashed rgba(80,80,80,0.35)',
              borderRadius: '4px', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              alignSelf: 'center',
            }}>
              {photoUrl && !photoError ? (
                <img
                  src={photoUrl}
                  alt={member.full_name}
                  onError={() => setPhotoError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <span style={{ fontSize: '11px', color: 'rgba(60,60,60,0.4)', textAlign: 'center', lineHeight: 1.6, padding: '6px' }}>
                  Photo
                </span>
              )}
            </div>
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              justifyContent: 'space-evenly', height: '100%',
            }}>
              {fields.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{
                    fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '15px',
                    color: '#1a2e6e', whiteSpace: 'nowrap', flexShrink: 0,
                    paddingBottom: '3px', lineHeight: 1,
                  }}>
                    {label}
                  </span>
                  <div style={{ flex: 1, borderBottom: '1.5px solid #4a5568', paddingBottom: '2px', minWidth: '60px' }}>
                    <span style={{
                      fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '15px',
                      color: '#111111', textTransform: 'uppercase',
                      letterSpacing: '0.02em', lineHeight: 1,
                    }}>
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── BOTTOM ORANGE STRIP ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '68px',
            background: 'linear-gradient(90deg, #E65C00 0%, #F5821F 40%, #FF9933 70%, #FFB347 100%)',
            borderTop: '3px solid #CC6600',
            display: 'flex', alignItems: 'center',
            padding: '0 18px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '17px',
                color: '#FFD700', textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                letterSpacing: '0.04em',
              }}>
                MODI ON MISSION
              </div>
              <div style={{
                fontFamily: "'Georgia', serif", fontSize: '12px',
                color: '#ffffff', letterSpacing: '0.16em', marginTop: '2px', fontWeight: 600,
              }}>
                — NATION FIRST —
              </div>
            </div>
            <div style={{ width: '155px', flexShrink: 0 }} />
          </div>

          {/* ── CIRCULAR SEAL — bottom right ── */}
          <div style={{
            position: 'absolute', bottom: '4px', right: '10px',
            width: '148px', height: '148px', zIndex: 10,
          }}>
            <svg viewBox="0 0 100 100" width="148" height="148" style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <path id="topArc2" d="M 13 50 A 37 37 0 0 1 87 50" />
                <path id="botArc2" d="M 7 50 A 43 43 0 0 0 93 50" />
              </defs>
              <circle cx="50" cy="50" r="49" fill="#E65C00" stroke="#FFD700" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeDasharray="2.5,2" />
              <circle cx="50" cy="50" r="32" fill="#ffffff" />
              <text fontFamily="Georgia,serif" fontWeight="700" fontSize="8" fill="#FFD700" letterSpacing="0.5">
                <textPath xlinkHref="#topArc2" startOffset="50%" textAnchor="middle">BHARTIYA MODI ARMY</textPath>
              </text>
              <text fontFamily="Georgia,serif" fontWeight="600" fontSize="8" fill="#ffffff" letterSpacing="0.5">
                <textPath xlinkHref="#botArc2" startOffset="50%" textAnchor="middle">JAMMU &amp; KASHMIR</textPath>
              </text>
              <text x="10" y="53" fontSize="8" fill="#FFD700" textAnchor="middle">★</text>
              <text x="90" y="53" fontSize="8" fill="#FFD700" textAnchor="middle">★</text>
            </svg>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '64%', height: '64%', borderRadius: '50%', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
              background: 'rgba(240,240,255,0.6)',
            }}>
              <span style={{ fontSize: '8px', color: 'rgba(20,60,20,0.5)', textAlign: 'center', lineHeight: 1.4 }}>Map<br />PNG</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── DISCLAIMER ── */}
      <div style={{
        maxWidth: `${CARD_W * scale}px`,
        width: '100%',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '12px 16px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'Georgia', serif",
          fontSize: '12px',
          color: '#6c757d',
          lineHeight: 1.6,
          margin: 0,
          fontStyle: 'italic',
        }}>
          <strong style={{ fontStyle: 'normal', color: '#495057' }}>Note:</strong> This card is a digital representation for reference purposes only. It does not constitute a valid identity document and is not intended for printing or official use. Physical membership cards are issued exclusively and directly by Bhartiya Modi Army, Jammu &amp; Kashmir.
        </p>
      </div>

      {/* ── BUTTONS ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '11px 30px', borderRadius: '8px',
              background: 'transparent', color: '#64748b',
              fontSize: '14px', fontWeight: 600,
              fontFamily: 'Georgia, serif', letterSpacing: '0.08em',
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
            background: downloading ? '#92400e' : '#E65C00',
            color: '#ffffff', fontSize: '14px', fontWeight: 700,
            fontFamily: 'Georgia, serif', letterSpacing: '0.08em',
            border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 10px rgba(230,92,0,0.5)',
          }}
        >
          {downloading ? 'DOWNLOADING...' : '⬇ DOWNLOAD ID CARD'}
        </button>
      </div>
    </div>
  );
};
