"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.successHandler = void 0;
const successHandler = (res, message, status = 200, data = {}) => {
    return res.status(status).json({
        status_code: status,
        success: true,
        message,
        data
    });
};
exports.successHandler = successHandler;
const errorHandler = (res, message, status = 500, error = null) => {
    if (error)
        console.error(error);
    return res.status(status).json({
        status_code: status,
        success: false,
        message,
    });
};
exports.errorHandler = errorHandler;
