export class StateMachine {
  constructor(options: Partial<Options>);
  static factory(options: Partial<Options>): IFSM;
  // this is part of upstream signature
  // eslint-disable-next-line
  static factory<T>(instance: T, options: Partial<Options>): IFSM | T;
  [action: string]: (...args: any[]) => any;
  is: StateMachineIs;
  can: StateMachineCan;
  cannot: StateMachineCan;
  transitions: StateMachineTransitions;
  allTransitions: StateMachineTransitions;
  allStates: StateMachineStates;
  observe: Observe;
  // history: string[];
  clearHistory(): void;
  historyBack(): void;
  historyForward(): void;
  canHistory(): boolean;
  canhistoryForward(): boolean;
}
//
// types
export type StateMachineIs = (state: string) => boolean;
export type StateMachineCan = (evt: string) => boolean;
export type StateMachineTransitions = () => string[];
export type StateMachineStates = () => string[];
export type Callback = (...args: any[]) => any;
export interface Observe {
  (event: string, callback: Callback): void;
  [name: string]: Callback;
}

export interface LifeCycle {
  transition: string;
  from: string;
  to: string;
}

export interface Transition {
  name: string;
  from: string | string[] | '*';
  to: string | ((...args: any[]) => string);
}

export interface Methods {
  [method: string]: Callback | undefined;
  onBeforeTransition?(
    lifecycle: LifeCycle,
    ...args: any[]
  ): boolean | Promise<boolean>; // 1
  onLeaveState?(
    lifecycle: LifeCycle,
    ...args: any[]
  ): boolean | Promise<boolean>; // 2
  onTransition?(
    lifecycle: LifeCycle,
    ...args: any[]
  ): boolean | Promise<boolean>; // 3
  onEnterState?(lifecycle: LifeCycle, ...args: any[]): any | Promise<any>; // 4
  onAfterTransition?(lifecycle: LifeCycle, ...args: any[]): any | Promise<any>; // 5
  onPendingTransition?(
    transition: string,
    from: string,
    to: string
  ): any | Promise<any>;
}

export interface Options {
  name?: string;
  past?: string;
  future?: string;
  init?: string;
  max?: number; // max history
  state?: string;
  transitions?: Transition[];
  methods?: Methods;
  data?: any; // {} | any[] | ((...args: any[]) => {} | any[]);
  plugins?: any[];
}

// this is part of upstream signature
// eslint-disable-next-line
export interface IFSM {
  new (...data: any[]): StateMachine;
}

export interface FlashWriter {
  validator?(): PromiseLike<boolean | Error>;
  eraser?(): PromiseLike<boolean | Error>;
  flasher(): PromiseLike<boolean | Error>;
  restarter?(): PromiseLike<boolean | Error>;
  failer?(): PromiseLike<boolean | Error>;
  succeeder?(): PromiseLike<boolean | Error>;
}

export interface ResponseNeeded {
  title?: string;
  question?: string;
  height?: number;
  defaultValue: string | number | boolean;
}

export type StateMachineRet = boolean | Error;
