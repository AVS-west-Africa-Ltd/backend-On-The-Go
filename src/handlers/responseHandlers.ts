import { Response } from "express";

export const successHandler = (res: Response, message: string, status = 200, data = {}) => {
  return res.status(status).json({
    status_code: status,
    success: true,
    message,
    data
  });
};

export const errorHandler = (res: Response, message: string, status = 500, error: Error | null = null) => {
  if (error) console.error(error);
  return res.status(status).json({
    status_code: status,
    success: false,
    message,
  });
};
