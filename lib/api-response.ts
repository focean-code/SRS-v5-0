export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    [key: string]: any
  }
}

export function successResponse<T>(data: T, message?: string, meta?: any): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  }

  return Response.json(response, { status: 200 })
}

export function createdResponse<T>(data: T, message?: string): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message: message || "Resource created successfully",
  }

  return Response.json(response, { status: 201 })
}

export function errorResponse(error: string, status = 500, details?: any): Response {
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { meta: { details } }),
  }

  return Response.json(response, { status })
}

export function validationErrorResponse(errors: Record<string, string[]>): Response {
  return Response.json(
    {
      success: false,
      error: "Validation failed",
      meta: { errors },
    },
    { status: 400 },
  )
}

export function unauthorizedResponse(message = "Unauthorized"): Response {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status: 401 },
  )
}

export function forbiddenResponse(message = "Forbidden"): Response {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status: 403 },
  )
}

export function notFoundResponse(message = "Resource not found"): Response {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status: 404 },
  )
}

export function rateLimitResponse(resetTime: number): Response {
  return Response.json(
    {
      success: false,
      error: "Too many requests",
      meta: { resetTime },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
      },
    },
  )
}
