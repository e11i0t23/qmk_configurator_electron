import {Transition} from './types';

// Transitions
export const EV_READY = 'READY';
export const EV_VALIDATED = 'VALIDATED';
export const EV_TIMED_OUT = 'TIMED-OUT';
export const EV_ERRORED = 'ERRORED';
export const EV_ERASED = 'ERASED';
export const EV_FLASHED = 'FLASHED';
export const EV_RESTARTED = 'RESTARTED';
export const EV_RESPONSE_NEEDED = 'RESPONSE_NEEDED';
export const EV_RESPONSE_RECEIVED = 'RESPONSE_RECEIVED';

// STATES
export const WAITING = 'WAITING';
export const VALIDATING = 'VALIDATING';
export const ERASING = 'ERASING';
export const FLASHING = 'FLASHING';
export const RESTARTING = 'RESTARTING';
export const FAILED = 'FAILED';
export const SUCCESS = 'SUCCESS';
export const AWAITING_RESPONSE = 'AWAITING_RESPONSE';

const transitions: Transition[] = [
  {
    name: EV_READY,
    from: WAITING,
    to: VALIDATING,
  },
  {
    name: EV_RESPONSE_NEEDED,
    from: VALIDATING,
    to: AWAITING_RESPONSE,
  },
  {
    name: EV_RESPONSE_RECEIVED,
    from: AWAITING_RESPONSE,
    to: VALIDATING,
  },
  {
    name: EV_VALIDATED,
    from: VALIDATING,
    to: ERASING,
  },
  {
    name: EV_TIMED_OUT,
    from: [VALIDATING, WAITING, ERASING, FLASHING, RESTARTING],
    to: FAILED,
  },
  {
    name: EV_ERRORED,
    from: [VALIDATING, WAITING, ERASING, FLASHING, RESTARTING],
    to: FAILED,
  },
  {
    name: EV_ERASED,
    from: ERASING,
    to: FLASHING,
  },
  {
    name: EV_FLASHED,
    from: FLASHING,
    to: RESTARTING,
  },
  {
    name: EV_RESTARTED,
    from: RESTARTING,
    to: SUCCESS,
  },
];

export default transitions;
