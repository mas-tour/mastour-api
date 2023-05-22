import { NextFunction, Request, Response } from 'express';

export function notFound(req: Request, res: Response, next: NextFunction) {
    const error = new Error(`Not Found at ${req.originalUrl}`);
    res.status(404);
    next(error);
}

export function errorHandler(
    error: any,
    _req: Request,
    res: Response,
    _next: NextFunction,
) {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        status: statusCode,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? 'XoX' : error.stack,
        errors: error.errors || error.message || undefined,
    });
}
