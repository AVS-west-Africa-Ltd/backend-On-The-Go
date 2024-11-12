// const errorHandler = (err, req, res, next) => {
//   if (err.status) {
//     return res.status(err.status).json({ msg: err.message });
//   }
//   res.status(500).json({ msg: err.message });
// };

// export default errorHandler;

export function catchErrors(fn) {
  return function (req, res, next) {
    return fn(req, res, next).catch(next);
  };
}

export function developmentErrors(err, req, res, next) {
  err.stack = err.stack || "";
  const errorDetails = {
    message: err.message,
    status: err.status,
    stackHighlighted: err.stack.replace(
      /[a-z_-\d]+.js:\d+:\d+/gi,
      "<mark>$&</mark>"
    ),
  };
  res.status(err.status || 500);
  res.format({
    // Based on the `Accept` http header
    "text/html": () => {
      res.json(errorDetails);
    }, // Form Submit, Reload the page
    "application/json": () => res.json(errorDetails), // Ajax call, send JSON back
  });
}

export function productionErrors(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {},
  });
}

/*
Not Found Error Handler
If we hit a route that is not found, we mark it as 404 and pass it along to the next error handler to display
*/
export function notFound(req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
}
