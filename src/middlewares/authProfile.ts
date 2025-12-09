import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../handlers/responseHandlers';
import * as jwtUtil from '../utils/jwtUtil';

export const authProfile = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorHandler(res, 'Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwtUtil.verifyToken(token);

  if (!decoded) {
    return errorHandler(res, 'Invalid token', 401);
  }
  
  req.user = decoded.user;

  if(!decoded.profile || decoded.profile == null){
    return errorHandler(res, "Please select a profile!", 400);
  }
  req.profile = decoded.profile;

  if (decoded.branch) {
    req.branch = decoded.branch;
  }
  next();
};