import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (typeof err === 'object' && err && 'code' in err) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
      res.status(409).json({ success: false, message: 'This record has already been added.' });
      return;
    }
    if (code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found.' });
      return;
    }
  }

  const message = err instanceof Error ? err.message : 'Unexpected server error';
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Database or server error. Please try again.',
    details: message,
  });
}
