import { NextFunction, Request, Response } from "express";

export type RouteHandlerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export const defineStackifyRoute = (handler: RouteHandlerType) => {
  return handler;
};

export function getQueryParams<T = Record<string, string>>(req: Request) {
  return req.query as T;
}

export function getParams<T = Record<string, string>>(req: Request) {
  return req.params as T;
}

export function getBody<T = Record<string, string | number | boolean | null>>(
  req: Request
) {
  return req.body as T;
}
