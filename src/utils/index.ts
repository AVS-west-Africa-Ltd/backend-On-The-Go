import { Request } from "express";
import { TProfileType } from "../models/types/profile.types";
import { AdminAttributes } from "../models/types/admin.types";

export interface TokenPayload {
  user: number;
  profile: {
    id: number;
    type: TProfileType;
  } | null;
  branch: number | null;
  admin?: AdminAttributes;
}

// declare global {
//   namespace Express {
//     interface Request {
//       user: number;
//       profile: { id: number; type: TProfileType } | null;
//       branch?: number;
//       file?: Express.Multer.File | any;
//       files?: Express.Multer.File[] | any[];
//     }
//   }
// }
