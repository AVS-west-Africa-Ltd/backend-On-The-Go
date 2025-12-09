export interface IPaginatedResponse {
     total: number;
  nextCursor: string | null;
}

export interface IBasicUser {
  profileId: number;
  userId: number;
  branchId?: number;
}