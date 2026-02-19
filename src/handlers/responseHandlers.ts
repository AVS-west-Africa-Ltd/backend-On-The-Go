import { Response } from "express";

export const successHandler = (res: Response, message: string, status = 200, data = {}) => {
  return res.status(status).json({
    status_code: status,
    success: true,
    message,
    data
  });
};

export const errorHandler = (res: Response, message: string, status = 500, error: any = null) => {
  if (error) {
    console.error(error);
    // Extract more specific error message if it's a Sequelize validation error
    if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
      message = error.errors?.[0]?.message || message;
    }
  }
  return res.status(status).json({
    status_code: status,
    success: false,
    message,
  });
};
