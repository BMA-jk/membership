import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Member } from '../types';

interface Props {
  member: Member;
}

export const OfficialForm: React.FC<Props> = ({ member }) => {
  const formRef = useRef<HTMLDivElement | null>(null);

  const handleDownload = async () => {
    if (!formRef.current) return;
    const canvas = await html2canvas(formRef.current, { scale: 2 });
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `BMA_Form_${member.membership_number || member.full_name}.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div
        ref={formRef}
        className="relative w-[360px] sm:w-[620px] aspect-[3/4] bg-cover bg-top rounded-lg overflow-hidden shadow"
        style={{ backgroundImage: "url('/form-bg.jpg')" }}
      >
        <div className="absolute inset-0 px-7 pt-40 pb-10 text-xs sm:text-sm flex flex-col gap-1">
          <div className="flex justify-between mb-2">
            <span>
              <span className="font-semibold">Membership No.: </span>
              {member.membership_number || 'Pending'}
            </span>
            <span>
              <span className="font-semibold">Date: </span>
              {(member.approved_at || member.created_at || '').slice(0, 10)}
            </span>
          </div>
          <p>
            <span className="font-semibold">Name: </span>
            {member.full_name}
          </p>
          <p>
            <span className="font-semibold">Date of Birth: </span>
            {member.dob || '-'}
          </p>
          <p>
            <span className="font-semibold">Address: </span>
            {member.address || '-'}
          </p>
          <p>
            <span className="font-semibold">District: </span>
            {member.area_district || '-'}
          </p>
          <p>
            <span className="font-semibold">Occupation: </span>
            {member.designation || '-'}
          </p>
          <p>
            <span className="font-semibold">Mobile Number: </span>
            {member.contact_no || '-'}
          </p>
          <p>
            <span className="font-semibold">Email ID: </span>
            {member.email}
          </p>
          <p className="mt-6 text-[0.7rem] sm:text-xs leading-snug">
            I hereby declare that I will work for the ideology of Hon'ble Prime
            Minister Narendra Modi and serve the nation with full dedication.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
      >
        Download Official Form (PNG)
      </button>
    </div>
  );
};
