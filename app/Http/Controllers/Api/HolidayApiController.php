<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class HolidayApiController extends Controller
{
    use ApiResponseTrait;

    // ---------------------------------------------------------------
    // GET /api/holidays/{id}
    // ---------------------------------------------------------------
    public function show($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('manage-holidays')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $holiday = Holiday::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-holidays')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-holidays')) {
                    $q->where('created_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $holiday) {
            return $this->errorResponse(__('Holiday not found.'), null, 404);
        }

        return $this->successResponse(
            $this->transformHoliday($holiday),
            __('Holiday retrieved successfully.')
        );
    }

    // ---------------------------------------------------------------
    // POST /api/holidays
    // ---------------------------------------------------------------
    public function store(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('create-holidays')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $validator = Validator::make($request->all(), [
            'name'         => 'required|string|max:255',
            'start_date'   => 'required|date',
            'end_date'     => 'nullable|date|after_or_equal:start_date',
            'category'     => 'required|string|max:255',
            'description'  => 'nullable|string',
            'is_recurring' => 'nullable|boolean',
            'is_paid'      => 'nullable|boolean',
            'is_half_day'  => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $holiday = Holiday::create([
            'name'         => $request->name,
            'start_date'   => $request->start_date,
            'end_date'     => $request->end_date,
            'category'     => $request->category,
            'description'  => $request->description,
            'is_recurring' => filter_var($request->is_recurring ?? false, FILTER_VALIDATE_BOOLEAN),
            'is_paid'      => filter_var($request->is_paid ?? true, FILTER_VALIDATE_BOOLEAN),
            'is_half_day'  => filter_var($request->is_half_day ?? false, FILTER_VALIDATE_BOOLEAN),
            'created_by'   => creatorId(),
        ]);

        return $this->successResponse(
            $this->transformHoliday($holiday),
            __('Holiday created successfully.')
        );
    }

    // ---------------------------------------------------------------
    // PUT /api/holidays/{id}
    // ---------------------------------------------------------------
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('edit-holidays')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $holiday = Holiday::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-holidays')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-holidays')) {
                    $q->where('created_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $holiday) {
            return $this->errorResponse(__('Holiday not found.'), null, 404);
        }

        $validator = Validator::make($request->all(), [
            'name'         => 'required|string|max:255',
            'start_date'   => 'required|date',
            'end_date'     => 'nullable|date|after_or_equal:start_date',
            'category'     => 'required|string|max:255',
            'description'  => 'nullable|string',
            'is_recurring' => 'nullable|boolean',
            'is_paid'      => 'nullable|boolean',
            'is_half_day'  => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $holiday->update([
            'name'         => $request->name,
            'start_date'   => $request->start_date,
            'end_date'     => $request->end_date,
            'category'     => $request->category,
            'description'  => $request->description,
            'is_recurring' => filter_var($request->is_recurring ?? $holiday->is_recurring, FILTER_VALIDATE_BOOLEAN),
            'is_paid'      => filter_var($request->is_paid ?? $holiday->is_paid, FILTER_VALIDATE_BOOLEAN),
            'is_half_day'  => filter_var($request->is_half_day ?? $holiday->is_half_day, FILTER_VALIDATE_BOOLEAN),
        ]);

        return $this->successResponse(
            $this->transformHoliday($holiday->fresh()),
            __('Holiday updated successfully.')
        );
    }

    // ---------------------------------------------------------------
    // DELETE /api/holidays/{id}
    // ---------------------------------------------------------------
    public function destroy($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('delete-holidays')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $holiday = Holiday::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-holidays')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-holidays')) {
                    $q->where('created_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $holiday) {
            return $this->errorResponse(__('Holiday not found.'), null, 404);
        }

        $holiday->delete();

        return $this->successResponse(null, __('Holiday deleted successfully.'));
    }

    // ---------------------------------------------------------------
    // Private: transform a single Holiday record
    // ---------------------------------------------------------------
    private function transformHoliday(Holiday $holiday): array
    {
        return [
            'id'           => $holiday->id,
            'name'         => $holiday->name,
            'start_date'   => $holiday->start_date ? $holiday->start_date->format('Y-m-d') : null,
            'end_date'     => $holiday->end_date ? $holiday->end_date->format('Y-m-d') : null,
            'formatted_start_date' => formatDate($holiday->start_date),
            'formatted_end_date'   => formatDate($holiday->end_date),
            'category'     => $holiday->category,
            'description'  => $holiday->description,
            'is_recurring' => (bool) $holiday->is_recurring,
            'is_paid'      => (bool) $holiday->is_paid,
            'is_half_day'  => (bool) $holiday->is_half_day,
            'created_at'   => $holiday->created_at ? $holiday->created_at->format('Y-m-d H:i:s') : null,
        ];
    }
}
