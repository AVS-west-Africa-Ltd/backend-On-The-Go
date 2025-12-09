import { Request, Response, NextFunction } from 'express';
import Joi, { Schema } from 'joi';

// type RequestLocation = 'body' | 'query' | 'params';

// export const validateRequest = (schema: Schema, location: RequestLocation = 'body') => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const { error, value } = schema.validate(req[location], {
//       abortEarly: false,
//       stripUnknown: true,
//     });

//     if (error) {
//       const errorMessage = error.details
//         .map((details) => details.message.replace(/"/g, ''))
//         .join(', ');
      
//       return res.status(400).json({ 
//         success: false, 
//         message: "Validation Error",
//         errors: errorMessage 
//       });
//     }

//     req[location] = value;
//     next();
//   };
// };

const runValidation = (schema: Schema, value: any) =>
  schema.validate(value, { abortEarly: false, stripUnknown: true });

function makeValidator(location: "body" | "query" | "params") {
  return (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = runValidation(schema, req[location]);
    if (error) {
      const message = error.details.map(d => d.message.replace(/"/g, "")).join(", ");
      return res.status(400).json({ success: false, message: "Validation Error", errors: message });
    }
    req[location] = value;
    next();
  };
}

export const validateBody = makeValidator("body");
export const validateQuery = makeValidator("query");
export const validateParams = makeValidator("params");
