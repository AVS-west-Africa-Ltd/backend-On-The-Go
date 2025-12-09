export interface BranchAttributes {
  id?: number;
  profileId: number;
  name: string;
  fullAddress?: string | null;
  description?: string | null;
  streetAddress?: string | null;
  state?: string | null;
  country?: string | null;
  city?: string | null;
  ratingCount?: number;
  reviewCount?: number;
  geoLocation?: { type: string; coordinates: [number, number] } | null;
  isHQ: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}