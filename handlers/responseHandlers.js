exports.successHandler = (res, message, status = 200, data = {}) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

exports.errorHandler = (res, message, status = 500, error = null) => {
  if (error) console.error(error);
  return res.status(status).json({
    success: false,
    message,
    error: error ? error.message || error : undefined
  });
};
