import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const HTTP_ERROR_MAP: Record<number, { code: string; defaultMessage: string }> =
  {
    [HttpStatus.BAD_REQUEST]: {
      code: 'VALIDATION_ERROR',
      defaultMessage: 'Permintaan tidak valid atau data yang dikirimkan salah',
    },
    [HttpStatus.UNAUTHORIZED]: {
      code: 'UNAUTHORIZED',
      defaultMessage: 'Autentikasi gagal atau sesi telah berakhir',
    },
    [HttpStatus.FORBIDDEN]: {
      code: 'FORBIDDEN',
      defaultMessage:
        'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini',
    },
    [HttpStatus.NOT_FOUND]: {
      code: 'NOT_FOUND',
      defaultMessage: 'Sumber daya yang diminta tidak ditemukan',
    },
    [HttpStatus.CONFLICT]: {
      code: 'CONFLICT',
      defaultMessage: 'Terjadi konflik pada data yang dikirimkan',
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      code: 'UNPROCESSABLE_ENTITY',
      defaultMessage: 'Permintaan tidak dapat diproses',
    },
    [HttpStatus.TOO_MANY_REQUESTS]: {
      code: 'RATE_LIMITED',
      defaultMessage:
        'Terlalu banyak permintaan, silakan coba beberapa saat lagi',
    },
    [HttpStatus.INTERNAL_SERVER_ERROR]: {
      code: 'INTERNAL_SERVER_ERROR',
      defaultMessage: 'Terjadi kesalahan internal pada server',
    },
  };

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const mapping = HTTP_ERROR_MAP[status] ?? {
      code: 'GENERIC_ERROR',
      defaultMessage: 'Terjadi kesalahan pada sistem',
    };

    let code = mapping.code;
    let message = mapping.defaultMessage;
    let details: unknown = null;

    if (exception instanceof HttpException) {
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const respObj = exResponse as Record<string, unknown>;
        if (respObj.code && typeof respObj.code === 'string') {
          code = respObj.code;
        }
        if (respObj.message) {
          if (Array.isArray(respObj.message)) {
            code = 'VALIDATION_ERROR';
            message = 'Validasi data gagal';
            details = respObj.message;
          } else if (typeof respObj.message === 'string') {
            message = respObj.message;
          }
        }
        if (respObj.details !== undefined) {
          details = respObj.details;
        }
      }
    } else if (exception instanceof Error) {
      details =
        process.env.NODE_ENV !== 'production' ? exception.message : null;
    }

    const requestId =
      request.requestId ??
      (typeof request.headers['x-request-id'] === 'string'
        ? request.headers['x-request-id']
        : 'unknown');

    response.status(status).json({
      error: {
        code,
        message,
        details,
        request_id: requestId,
      },
    });
  }
}
