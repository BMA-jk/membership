import React, { useRef, useState, useEffect } from 'react';
import { Member } from '../types';

interface Props {
  member: Member;
  onClose?: () => void;
}

const LEADER_IMG = '/leader.png';
const MAP_HEADER_IMG = '/indian map header.png';
const SEAL_LOGO_IMG = '/logo-removebg-preview.png';

const CARD_W = 856;
const CARD_H = 540;
const SEAL_SIZE = 140;
const SEAL_TOP  = CARD_H - SEAL_SIZE - 10;  // 390
const SEAL_LEFT = CARD_W - SEAL_SIZE - 12;  // 704

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src.startsWith('http') ? src + (src.includes('?') ? '&' : '?') + '_t=' + Date.now() : src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export const IDCard: React.FC<Props> = ({ member, onClose }) => {
  const cardRef    = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [photoError, setPhotoError]   = useState(false);
  const [scale, setScale]             = useState(1);

  useEffect(() => {
    [LEADER_IMG, MAP_HEADER_IMG, SEAL_LOGO_IMG].forEach((src) => {
      const img = new Image(); img.src = src;
    });
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (!wrapperRef.current) return;
      const available = wrapperRef.current.offsetWidth - 32;
      setScale(Math.min(1, available / CARD_W));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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
    { label: 'Name:',          value: member.full_name          || '' },
    { label: 'Designation:',   value: member.designation        || '' },
    { label: 'Area/District:', value: member.area_district      || '' },
    { label: 'Date of Joining:', value: formatDate(member.approved_at) },
  ];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const DPR = 3;
      const canvas = document.createElement('canvas');
      canvas.width  = CARD_W * DPR;
      canvas.height = CARD_H * DPR;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(DPR, DPR);

      const [leaderImg, mapHeaderImg, sealLogoImg, memberImg] = await Promise.allSettled([
        loadImg(LEADER_IMG),
        loadImg(MAP_HEADER_IMG),
        loadImg(SEAL_LOGO_IMG),
        photoUrl ? loadImg(photoUrl) : Promise.reject('no photo'),
      ]);

      const getImg = (r: PromiseSettledResult<HTMLImageElement>) =>
        r.status === 'fulfilled' ? r.value : null;

      // 1. Card background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_H);
      bgGrad.addColorStop(0,    '#FF9933');
      bgGrad.addColorStop(0.22, '#FF9933');
      bgGrad.addColorStop(0.35, '#FFF5E0');
      bgGrad.addColorStop(0.50, '#FFFFF0');
      bgGrad.addColorStop(0.62, '#E8F5E0');
      bgGrad.addColorStop(0.85, '#138808');
      bgGrad.addColorStop(1,    '#0A6B04');
      roundRect(ctx, 0, 0, CARD_W, CARD_H, 20);
      ctx.fillStyle = bgGrad;
      ctx.fill();
      ctx.save();
      roundRect(ctx, 0, 0, CARD_W, CARD_H, 20);
      ctx.clip();

      // 2. Orange header banner
      const hdrGrad = ctx.createLinearGradient(0, 0, 0, 155);
      hdrGrad.addColorStop(0,   '#E65C00');
      hdrGrad.addColorStop(0.4, '#F5821F');
      hdrGrad.addColorStop(0.8, '#FF9933');
      hdrGrad.addColorStop(1,   '#FFB347');
      ctx.fillStyle = hdrGrad;
      ctx.fillRect(0, 0, CARD_W, 155);
      ctx.strokeStyle = '#CC6600'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 155); ctx.lineTo(CARD_W, 155); ctx.stroke();

      // 3. Leader photo
      const lImg = getImg(leaderImg);
      if (lImg) {
        ctx.save();
        roundRect(ctx, 10, 11, 155, 132, 6); ctx.clip();
        ctx.drawImage(lImg, 10, 11, 155, 132);
        ctx.restore();
      }

      // 4. Map header image
      const mhImg = getImg(mapHeaderImg);
      if (mhImg) {
        ctx.save();
        roundRect(ctx, CARD_W - 100, 15, 90, 124, 6); ctx.clip();
        ctx.drawImage(mhImg, CARD_W - 100, 15, 90, 124);
        ctx.restore();
      }

      // 5. Header text
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4;
      ctx.fillText('BHARTIYA MODI ARMY', CARD_W / 2, 60);
      ctx.font = '600 14px Georgia, serif';
      ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 3;
      ctx.fillText('— JAMMU & KASHMIR —', CARD_W / 2, 82);
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      const badgeW = 200, badgeH = 26, badgeX = CARD_W / 2 - 100, badgeY = 92;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 3);
      ctx.fillStyle = '#1a3a6b'; ctx.fill();
      ctx.font = 'bold 14px Georgia, serif'; ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '0.2em';
      ctx.fillText('MEMBERSHIP CARD', CARD_W / 2, badgeY + 17);
      ctx.letterSpacing = '0';

      // 6. Member photo
      const mPhotoX = 18, mPhotoY = 167, mPhotoW = 110, mPhotoH = 140;
      ctx.strokeStyle = 'rgba(80,80,80,0.35)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      roundRect(ctx, mPhotoX, mPhotoY, mPhotoW, mPhotoH, 4); ctx.stroke();
      ctx.setLineDash([]);
      const mpImg = getImg(memberImg);
      if (mpImg) {
        ctx.save();
        roundRect(ctx, mPhotoX, mPhotoY, mPhotoW, mPhotoH, 4); ctx.clip();
        ctx.drawImage(mpImg, mPhotoX, mPhotoY, mPhotoW, mPhotoH);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(180,180,180,0.2)'; ctx.fill();
        ctx.font = '11px Georgia, serif'; ctx.fillStyle = 'rgba(60,60,60,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText('Photo', mPhotoX + mPhotoW / 2, mPhotoY + mPhotoH / 2);
      }

      // 7. Info fields
      const fieldsX = mPhotoX + mPhotoW + 18;
      const fieldsW = SEAL_LEFT - fieldsX - 10;
      const fieldStartY = 170, fieldGap = 58;
      ctx.textAlign = 'left';
      fields.forEach(({ label, value }, i) => {
        const y = fieldStartY + i * fieldGap;
        ctx.font = 'bold 15px Georgia, serif'; ctx.fillStyle = '#1a2e6e';
        ctx.fillText(label, fieldsX, y + 14);
        const labelW = ctx.measureText(label).width;
        ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(fieldsX + labelW + 6, y + 16);
        ctx.lineTo(fieldsX + fieldsW, y + 16);
        ctx.stroke();
        ctx.font = 'bold 15px Georgia, serif'; ctx.fillStyle = '#111111';
        const displayVal = value.toUpperCase();
        let txt = displayVal;
        while (ctx.measureText(txt).width > fieldsW - labelW - 10 && txt.length > 0) txt = txt.slice(0, -1);
        if (txt !== displayVal) txt = txt.slice(0, -1) + '…';
        ctx.fillText(txt, fieldsX + labelW + 8, y + 13);
      });

      // 8. Bottom orange strip
      const stripGrad = ctx.createLinearGradient(0, 0, CARD_W, 0);
      stripGrad.addColorStop(0,   '#E65C00');
      stripGrad.addColorStop(0.4, '#F5821F');
      stripGrad.addColorStop(0.7, '#FF9933');
      stripGrad.addColorStop(1,   '#FFB347');
      ctx.fillStyle = stripGrad;
      ctx.fillRect(0, CARD_H - 68, CARD_W, 68);
      ctx.strokeStyle = '#CC6600'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, CARD_H - 68); ctx.lineTo(CARD_W, CARD_H - 68); ctx.stroke();
      ctx.textAlign = 'left';
      ctx.font = 'bold 17px Georgia, serif'; ctx.fillStyle = '#FFD700';
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
      ctx.fillText('MODI ON MISSION', 18, CARD_H - 38);
      ctx.font = '600 12px Georgia, serif'; ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      ctx.fillText('— NATION FIRST —', 18, CARD_H - 20);

      // 9. End card clip
      ctx.restore();

      // 10. Circular seal
      const cx = SEAL_LEFT + SEAL_SIZE / 2;
      const cy = SEAL_TOP  + SEAL_SIZE / 2;
      const r  = SEAL_SIZE / 2;

      // Outer orange circle
      ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.fillStyle = '#E65C00'; ctx.fill();
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5 * (SEAL_SIZE / 100); ctx.stroke();

      // Dashed inner ring
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 0.8 * (SEAL_SIZE / 100);
      ctx.setLineDash([2.5, 2]); ctx.stroke(); ctx.setLineDash([]);

      // White inner circle
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.64, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();

      // Logo clipped to inner circle
      const slImg = getImg(sealLogoImg);
      if (slImg) {
        const imgR = r * 0.63;
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, imgR, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(slImg, cx - imgR, cy - imgR, imgR * 2, imgR * 2);
        ctx.restore();
      }

      // --- TOP ARC TEXT: "BHARTIYA MODI ARMY" ---
      ctx.save();
      ctx.font = `bold ${7 * (SEAL_SIZE / 100)}px Georgia, serif`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      const topText = 'BHARTIYA MODI ARMY';
      const topR = r * 0.76;
      const topSpan = Math.PI * 0.72;
      const topStart = -Math.PI / 2 - topSpan / 2;
      const topStep  = topSpan / (topText.length - 1);
      for (let i = 0; i < topText.length; i++) {
        const angle = topStart + i * topStep;
        ctx.save();
        ctx.translate(cx + topR * Math.cos(angle), cy + topR * Math.sin(angle));
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillText(topText[i], 0, 0);
        ctx.restore();
      }
      ctx.restore();

      // --- BOTTOM ARC TEXT: "JAMMU & KASHMIR" ---
      ctx.save();
      ctx.font = `600 ${6.5 * (SEAL_SIZE / 100)}px Georgia, serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const botText  = 'RIMHSAK & UMMAJ';
      const botR     = r * 0.76;
      const botSpan  = Math.PI * 0.60;
      const botStart = Math.PI / 2 - botSpan / 2;
      const botStep  = botSpan / (botText.length - 1);
      for (let i = 0; i < botText.length; i++) {
        const angle = botStart + i * botStep;
        ctx.save();
        ctx.translate(cx + botR * Math.cos(angle), cy + botR * Math.sin(angle));
        ctx.rotate(angle - Math.PI / 2);
        ctx.fillText(botText[i], 0, 0);
        ctx.restore();
      }
      ctx.restore();

      // Stars on left and right of seal
      ctx.font = `${8 * (SEAL_SIZE / 100)}px Georgia, serif`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText('★', cx - r * 0.76, cy + 3);
      ctx.fillText('★', cx + r * 0.76, cy + 3);

      // 11. Export
      const a = document.createElement('a');
      a.href     = canvas.toDataURL('image/png');
      a.download = `BMA-Card-${member.membership_number || member.full_name}.png`;
      a.click();

    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '16px', width: '100%', boxSizing: 'border-box' }}
    >
      <div style={{ width: `${CARD_W * scale}px`, height: `${CARD_H * scale}px`, flexShrink: 0 }}>
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
          {/* ORANGE HEADER BANNER */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '155px',
            background: 'linear-gradient(180deg, #E65C00 0%, #F5821F 40%, #FF9933 80%, #FFB347 100%)',
            display: 'flex', alignItems: 'center',
            padding: '10px 16px', gap: '10px',
            borderBottom: '3px solid #CC6600',
          }}>
            <div style={{ flexShrink: 0, width: '155px', height: '132px', borderRadius: '6px', overflow: 'hidden' }}>
              <img src={LEADER_IMG} alt="Leader"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
              />
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
              <div style={{
                fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '32px',
                color: '#FFD700', textShadow: '1px 1px 0 #8B4513, 2px 2px 4px rgba(0,0,0,0.6)',
                letterSpacing: '0.04em', lineHeight: 1.05,
              }}>BHARTIYA MODI ARMY</div>
              <div style={{
                fontFamily: "'Georgia', serif", fontSize: '14px',
                color: '#ffffff', letterSpacing: '0.2em', marginTop: '4px',
                fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}>— JAMMU &amp; KASHMIR —</div>
              <div style={{
                background: '#1a3a6b', color: '#ffffff',
                fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '14px',
                letterSpacing: '0.2em', padding: '5px 16px',
                marginTop: '8px', borderRadius: '3px', display: 'inline-block',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}>MEMBERSHIP CARD</div>
            </div>
            <div style={{ flexShrink: 0, width: '90px', height: '124px', borderRadius: '6px', overflow: 'hidden' }}>
              <img src={MAP_HEADER_IMG} alt="India Map"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
              />
            </div>
          </div>

          {/* CARD BODY */}
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
                <img src={photoUrl} alt={member.full_name}
                  onError={() => setPhotoError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <span style={{ fontSize: '11px', color: 'rgba(60,60,60,0.4)', textAlign: 'center', lineHeight: 1.6, padding: '6px' }}>Photo</span>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', height: '100%' }}>
              {fields.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{
                    fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '15px',
                    color: '#1a2e6e', whiteSpace: 'nowrap', flexShrink: 0,
                    paddingBottom: '3px', lineHeight: 1,
                  }}>{label}</span>
                  <div style={{ flex: 1, borderBottom: '1.5px solid #4a5568', paddingBottom: '2px', minWidth: '60px' }}>
                    <span style={{
                      fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '15px',
                      color: '#111111', textTransform: 'uppercase',
                      letterSpacing: '0.02em', lineHeight: 1,
                    }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM ORANGE STRIP */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '68px',
            background: 'linear-gradient(90deg, #E65C00 0%, #F5821F 40%, #FF9933 70%, #FFB347 100%)',
            borderTop: '3px solid #CC6600',
            display: 'flex', alignItems: 'center', padding: '0 18px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '17px',
                color: '#FFD700', textShadow: '0 1px 4px rgba(0,0,0,0.5)', letterSpacing: '0.04em',
              }}>MODI ON MISSION</div>
              <div style={{
                fontFamily: "'Georgia', serif", fontSize: '12px',
                color: '#ffffff', letterSpacing: '0.16em', marginTop: '2px', fontWeight: 600,
              }}>— NATION FIRST —</div>
            </div>
            <div style={{ width: `${SEAL_SIZE + 12}px`, flexShrink: 0 }} />
          </div>

          {/* CIRCULAR SEAL (SVG preview) */}
          <div style={{
            position: 'absolute',
            top: `${SEAL_TOP}px`,
            left: `${SEAL_LEFT}px`,
            width: `${SEAL_SIZE}px`,
            height: `${SEAL_SIZE}px`,
            zIndex: 10,
          }}>
            <svg viewBox="0 0 100 100" width={SEAL_SIZE} height={SEAL_SIZE}
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
              <defs>
                <path id="sealTopArc" d="M 13 50 A 37 37 0 0 1 87 50" />
                <path id="sealBotArc" d="M 12 56 A 43 43 0 0 0 88 56" />
              </defs>
              <circle cx="50" cy="50" r="49" fill="#E65C00" stroke="#FFD700" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeDasharray="2.5,2" />
              <circle cx="50" cy="50" r="32" fill="#ffffff" />
              <text fontFamily="Georgia,serif" fontWeight="700" fontSize="7.5" fill="#FFD700" letterSpacing="0.3">
                <textPath xlinkHref="#sealTopArc" startOffset="50%" textAnchor="middle">BHARTIYA MODI ARMY</textPath>
              </text>
              <text fontFamily="Georgia,serif" fontWeight="600" fontSize="7" fill="#ffffff" letterSpacing="0.3">
                <textPath xlinkHref="#sealBotArc" startOffset="50%" textAnchor="middle">JAMMU &amp; KASHMIR</textPath>
              </text>
              <text x="10" y="53" fontSize="8" fill="#FFD700" textAnchor="middle">★</text>
              <text x="90" y="53" fontSize="8" fill="#FFD700" textAnchor="middle">★</text>
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '63%', height: '63%',
              borderRadius: '50%',
              overflow: 'hidden',
              zIndex: 2,
            }}>
              <img src={SEAL_LOGO_IMG} alt="BMA Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                crossOrigin="anonymous"
              />
            </div>
          </div>

        </div>
      </div>

      {/* DISCLAIMER */}
      <div style={{
        maxWidth: `${CARD_W * scale}px`, width: '100%',
        background: '#f8f9fa', border: '1px solid #dee2e6',
        borderRadius: '8px', padding: '12px 16px', textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'Georgia', serif", fontSize: '12px',
          color: '#6c757d', lineHeight: 1.6, margin: 0, fontStyle: 'italic',
        }}>
          <strong style={{ fontStyle: 'normal', color: '#495057' }}>Note:</strong> This card is a digital representation for reference purposes only. It does not constitute a valid identity document and is not intended for printing or official use. Physical membership cards are issued exclusively and directly by Bhartiya Modi Army, Jammu &amp; Kashmir.
        </p>
      </div>

      {/* BUTTONS */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {onClose && (
          <button type="button" onClick={onClose}
            style={{
              padding: '11px 30px', borderRadius: '8px',
              background: 'transparent', color: '#64748b',
              fontSize: '14px', fontWeight: 600,
              fontFamily: 'Georgia, serif', letterSpacing: '0.08em',
              border: '1.5px solid #cbd5e1', cursor: 'pointer',
            }}>
            ✕ CLOSE
          </button>
        )}
        <button type="button" onClick={handleDownload} disabled={downloading}
          style={{
            padding: '11px 36px', borderRadius: '8px',
            background: downloading ? '#92400e' : '#E65C00',
            color: '#ffffff', fontSize: '14px', fontWeight: 700,
            fontFamily: 'Georgia, serif', letterSpacing: '0.08em',
            border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 10px rgba(230,92,0,0.5)',
          }}>
          {downloading ? 'DOWNLOADING...' : '⬇ DOWNLOAD ID CARD'}
        </button>
      </div>
    </div>
  );
};
