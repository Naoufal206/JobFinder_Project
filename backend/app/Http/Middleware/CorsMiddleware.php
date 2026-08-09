<?php

namespace App\Http\Middleware;

use Closure;

/**
 * DEPRECATED: Using Laravel built-in CORS config instead.
 * Remove this middleware if not referenced in Kernel.php.
 */
class CorsMiddleware
{
    public function handle($request, Closure $next)
    {
        return $next($request);
    }
}
