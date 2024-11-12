//import * as winston from 'winston';

export function Logger(Method, Msg) {
  return console.log("Message:: " + " -> " + Method + " -> " + Msg);
}

export function Tracer(Method, Msg, Exception) {
  return console.log(
    " Exception -> " + Method + ": " + Msg,
    JSON.stringify(Exception)
  );
}
