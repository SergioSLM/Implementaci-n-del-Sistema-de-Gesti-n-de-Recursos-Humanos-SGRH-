<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiForceJson
{
    public function handle(Request $request, Closure $next)
    {
        // Check if demo mode is enabled
        if (isDemo()) {
            return response()->json([
                'success' => false,
                'message' => __('This Functionality is Disabled In Demo Mode.'),
                'errors'  => null,
                'demo_mode' => true,
            ], 400);
        }

        if ($request->is('api/*')) {
            $request->headers->set('Accept', 'application/json');
        }
        return $next($request);
    }
}
