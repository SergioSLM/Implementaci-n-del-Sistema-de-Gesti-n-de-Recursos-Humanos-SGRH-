<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ProfileApiController extends Controller
{
    use ApiResponseTrait;
    public function show()
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        return $this->successResponse(
            $this->buildProfileData($user),
            __('Profile retrieved successfully.')
        );
    }


    public function update(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        $validator = Validator::make($request->all(), [
            'name'    => 'required|string|max:255',
            'email'   => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone'   => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'avatar'  => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            $rawAvatar = $user->getRawOriginal('avatar');
            if ($rawAvatar && check_file($rawAvatar)) {
                delete_file($rawAvatar);
            }

            $filenameWithExt = $request->file('avatar')->getClientOriginalName();
            $filename = pathinfo($filenameWithExt, PATHINFO_FILENAME);
            $extension = $request->file('avatar')->getClientOriginalExtension();
            $fileNameToStore = $filename . '_' . time() . '.' . $extension;

            $upload = upload_file($request, 'avatar', $fileNameToStore, 'avatars');
            if ($upload['status'] == true) {
                $user->avatar = $upload['url'];
            } else {
                return $this->validationErrorResponse(['avatar' => [$upload['msg']]]);
            }
        }

        // Update User table fields
        $user->name  = $request->name;
        $user->email = strtolower($request->email);

        // Reset email verification if email changed
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Update Employee table fields (phone, address) if record exists
        $employee = Employee::where('user_id', $user->id)->first();

        if ($employee) {
            $employeeUpdates = [];

            if ($request->filled('phone')) {
                $employeeUpdates['phone'] = $request->phone;
            }

            if ($request->filled('address')) {
                $employeeUpdates['address_line_1'] = $request->address;
            }

            if (! empty($employeeUpdates)) {
                $employee->update($employeeUpdates);
            }
        }

        return $this->successResponse(
            $this->buildProfileData($user->fresh()),
            __('Profile updated successfully.')
        );
    }


    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        $validator = Validator::make($request->all(), [
            'current_password'      => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        // Verify current password manually (mirrors 'current_password' rule)
        if (! Hash::check($request->current_password, $user->password)) {
            return $this->validationErrorResponse([
                'current_password' => [__('The provided password does not match your current password.')],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return $this->successResponse(null, __('Password updated successfully.'));
    }

    // ---------------------------------------------------------------
    // Private: build the full profile data array
    // ---------------------------------------------------------------
    private function buildProfileData($user): array
    {
        $employee = Employee::with(['designation', 'department', 'branch'])
            ->where('user_id', $user->id)
            ->first();


        $rawAvatar = $user->getRawOriginal('avatar');
        $avatar    = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        return [
            // User fields
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'type'        => $user->type,
            'avatar'      => $avatar,
            'created_at'  => $user->created_at ? $user->created_at->format('Y-m-d') : null,
            'formatted_created_at' => $user->created_at ? formatDate($user->created_at) : null,
            // Employee fields (null if no employee record)
            'employee_id' => $employee?->employee_id,
            'phone'       => $employee?->phone,
            'address'     => $employee?->address_line_1,
            'designation' => $employee?->designation?->name,
            'department'  => $employee?->department?->name,
            'branch'      => $employee?->branch?->name,
            'date_of_joining' => $employee?->date_of_joining
                ? \Carbon\Carbon::parse($employee->date_of_joining)->format('Y-m-d')
                : null,
            'formatted_date_of_joining' => $employee?->date_of_joining
                ? formatDate($employee->date_of_joining)
                : null,
            'biometric_emp_id' => $employee?->biometric_emp_id,
            'date_of_birth'    => $employee?->date_of_birth
                ? \Carbon\Carbon::parse($employee->date_of_birth)->format('Y-m-d')
                : null,
            'formatted_date_of_birth' => $employee?->date_of_birth
                ? formatDate($employee->date_of_birth)
                : null,
            'gender'           => $employee?->gender,
            'employment_type'  => $employee?->employment_type,
        ];
    }
}
