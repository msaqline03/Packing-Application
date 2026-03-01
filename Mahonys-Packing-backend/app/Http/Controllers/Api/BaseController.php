<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller as LaravelController;
use Illuminate\Http\JsonResponse;

abstract class BaseController extends LaravelController
{
    protected function success($data = null, int $code = 200): JsonResponse
    {
        return response()->json($data ?? ['ok' => true], $code);
    }

    protected function created($data): JsonResponse
    {
        return response()->json($data, 201);
    }

    protected function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return response()->json(['message' => $message], 404);
    }

    protected function validationError($errors): JsonResponse
    {
        return response()->json(['message' => 'Validation failed', 'errors' => $errors], 422);
    }
}
