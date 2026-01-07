import { EventEmitter } from 'events';

class AppEmitter extends EventEmitter { }

export const appEvents = new AppEmitter();
