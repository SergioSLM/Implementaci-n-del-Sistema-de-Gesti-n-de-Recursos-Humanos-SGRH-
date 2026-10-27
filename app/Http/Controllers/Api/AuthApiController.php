<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;

class AuthApiController extends Controller
{
    use ApiResponseTrait;

    /**
     * Handle mobile app user login and return Sanctum Bearer Token.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Invalid email or password credentials.', null, 401);
        }

        if (isset($user->is_enable_login) && $user->is_enable_login == 0) {
            return $this->errorResponse('Your account login access has been disabled.', null, 403);
        }

        $allowedTypes = ['company', 'hr', 'employee'];
        if (! in_array(strtolower($user->type), $allowedTypes)) {
            return $this->errorResponse('Access denied. Only company, HR, and employee accounts are allowed to log in to the mobile application.', null, 403);
        }

        // Create new Sanctum bearer token
        $token = $user->createToken('mobile_app_access_token')->plainTextToken;

        $rawAvatar = $user->getRawOriginal('avatar');
        $avatarUrl = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'type' => $user->type,
                'avatar' => $avatarUrl,
                'created_by' => $user->created_by,
            ],
            'token' => $token,
        ], 'Login successful');
    }

    /**
     * Get details of currently authenticated user.
     */
    public function user(Request $request)
    {
        $user = $request->user();
        $rawAvatar = $user->getRawOriginal('avatar');
        $avatarUrl = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'type' => $user->type,
            'avatar' => $avatarUrl,
            'created_by' => $user->created_by,
        ], 'User profile retrieved successfully');
    }

    /**
     * Logout and revoke active Sanctum bearer token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logged out successfully');
    }

    /**
     * Handle mobile app forgot password request and send reset link.
     */
    public function forgotPassword(Request $request)
    {
        if (isDemo()) {
            return $this->errorResponse("This Functionality is Disabled In Demo Mode.", null, 404);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return $this->errorResponse("We can't find a user with that email address.", null, 404);
        }

        if (isset($user->is_enable_login) && $user->is_enable_login == 0) {
            return $this->errorResponse('Your account login access has been disabled.', null, 403);
        }

        $allowedTypes = ['company', 'hr', 'employee'];
        if (! in_array(strtolower($user->type), $allowedTypes)) {
            return $this->errorResponse('Access denied. Only company, HR, and employee accounts are allowed to reset password via the mobile application.', null, 403);
        }

        try {
            $this->setEmailConfig($request->email);

            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status === Password::RESET_LINK_SENT) {
                return $this->successResponse(null, __($status) ?: 'A reset link has been sent to your email address.');
            }

            return $this->errorResponse(__($status) ?: 'Unable to send reset link.', null, 400);
        } catch (\Exception $e) {
            return $this->errorResponse('Unable to send reset link: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Dynamically configure email settings based on company / creator settings.
     */
    private function setEmailConfig($email): void
    {
        try {
            $user = User::where('email', $email)->first();
            if (! $user) {
                return;
            }

            if (isSaas()) {
                if ($user->type == 'company') {
                    $user = User::where('id', $user->created_by)->first()->id;
                } else {
                    $user = getCompanyId($user->id);
                }
            } else {
                $user = getCompanyId($user->id);
            }

            if (! $user) {
                return;
            }

            $getSettings = settings($user);

            $settings = [
                'driver' => $getSettings['email_driver'] ?? '',
                'host' => $getSettings['email_host'] ?? '',
                'port' => $getSettings['email_port'] ?? '',
                'username' => $getSettings['email_username'] ?? '',
                'password' => $getSettings['email_password'] ?? '',
                'encryption' => $getSettings['email_encryption'] ?? '',
                'fromAddress' => $getSettings['email_from_address'] ?? '',
                'fromName' => $getSettings['email_from_name'] ?? '',
            ];

            Config::set([
                'mail.default' => !empty($settings['driver']) ? $settings['driver'] : config('mail.default'),
                'mail.mailers.smtp.host' => !empty($settings['host']) ? $settings['host'] : config('mail.mailers.smtp.host'),
                'mail.mailers.smtp.port' => !empty($settings['port']) ? $settings['port'] : config('mail.mailers.smtp.port'),
                'mail.mailers.smtp.encryption' => ($settings['encryption'] === 'none' || empty($settings['encryption'])) ? null : $settings['encryption'],
                'mail.mailers.smtp.username' => !empty($settings['username']) ? $settings['username'] : config('mail.mailers.smtp.username'),
                'mail.mailers.smtp.password' => !empty($settings['password']) ? $settings['password'] : config('mail.mailers.smtp.password'),
                'mail.from.address' => !empty($settings['fromAddress']) ? $settings['fromAddress'] : config('mail.from.address'),
                'mail.from.name' => !empty($settings['fromName']) ? $settings['fromName'] : config('mail.from.name'),
            ]);
        } catch (\Exception $e) {
            throw new \Exception('Email config error: ' . $e->getMessage());
        }
    }
}
