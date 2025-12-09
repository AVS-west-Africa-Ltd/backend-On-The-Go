export interface AmenityAttributes {
  id: string;
  name: TAmenityCategory;
  meta?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const Status = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type TStatus = typeof Status[keyof typeof Status];

export const AmenityCategory = {
  WIFI: "wifi",
  COFFEE: "coffee",
  FOOD: "food",
  EVENT_HALL: "event_hall",
} as const;

export type TAmenityCategory = (typeof AmenityCategory)[keyof typeof AmenityCategory];
