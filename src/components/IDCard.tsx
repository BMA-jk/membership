import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Member } from '../types';

interface Props {
  member: Member;
}

export const IDCard: React.FC<Props> = ({ member }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `BMA_ID_${member.membership_number || member.full_name}.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="relative w-[340px] h-[210px] sm:w-[540px] sm:h-[320px] bg-cover bg-center rounded-xl overflow-hidden shadow"
        style={{ backgroundImage: "url('/card-bg.jpg')" }}
      >
        <div className="absolute inset-0 px-6 pt-20 pb-6 flex flex-col justify-between text-sm sm:text-base">
          <div className="space-y-1">
            <p>
              <span className="font-semibold">Membership No:</span>{' '}
              {member.membership_number || 'Pending'}
            </p>
            <p>
              <span className="font-semibold">Name:</span> {member.full_name}
            </p>
            <p>
              <span className="font-semibold">Designation:</span>{' '}
              {member.designation || '-'}
            </p>
            <p>
              <span className="font-semibold">Area/District:</span>{' '}
              {member.area_district || '-'}
            </p>
            <p>
              <span className="font-semibold">Date of Birth:</span>{' '}
              {member.dob || '-'}
            </p>
            <p>
              <span className="font-semibold">Blood Group:</span>{' '}
              {member.blood_group || '-'}
            </p>
            <p>
              <span className="font-semibold">Contact No.:</span>{' '}
              {member.contact_no || '-'}
            </p>
            <p>
              <span className="font-semibold">Date of Joining:</span>{' '}
              {member.approved_at?.slice(0, 10) || '-'}
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700"
      >
        Download ID Card (PNG)
      </button>
    </div>
  );
};
