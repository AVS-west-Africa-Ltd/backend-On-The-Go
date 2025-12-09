import "express";
import { TProfileType } from "../models/types/profile.types";


declare global {
  namespace Express {
    interface Request {
      user: number;
      profile: { id: number; type: TProfileType } | null; // Replace 'any' with TProfileType
      branch?: number;
    }

    namespace Multer {
      interface File {
        location?: string; 
        key?: string;
        bucket?: string;
        etag?: string;
        storageClass?: string;
        contentDisposition?: string;
      }
    }
  }
}

export {};