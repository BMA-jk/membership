export type MemberStatus = 'pending' | 'approved' | 'rejected';

export interface Member {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  designation: string | null;
  area_district: string | null;
  dob: string | null;
  blood_group: string | null;
  contact_no: string | null;
  address: string | null;
  photo_url: string | null; // storage path
  aadhaar_front_url: string | null;
  aadhaar_back_url: string | null;
  membership_number: string | null;
  status: MemberStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  auth_id: string | null;
}
