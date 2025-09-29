import { Request, Response, NextFunction } from "express";

export type FunctionEventType = {
  req: Request;
  res: Response;
  next: NextFunction;
};

export type FunctionHandlerType<T, K> = (
  event: FunctionEventType,
  args: T
) => K;

export function defineStackifyFunction<T, K>(
  handler: FunctionHandlerType<T, K>
) {
  return handler;
}

export function getPreviousFunctionResponse() {
  return null;
}
