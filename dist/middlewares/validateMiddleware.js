"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
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
const runValidation = (schema, value) => schema.validate(value, { abortEarly: false, stripUnknown: true });
function makeValidator(location) {
    return (schema) => (req, res, next) => {
        const { error, value } = runValidation(schema, req[location]);
        if (error) {
            const message = error.details.map(d => d.message.replace(/"/g, "")).join(", ");
            return res.status(400).json({ success: false, message: "Validation Error", errors: message });
        }
        req[location] = value;
        next();
    };
}
exports.validateBody = makeValidator("body");
exports.validateQuery = makeValidator("query");
exports.validateParams = makeValidator("params");
