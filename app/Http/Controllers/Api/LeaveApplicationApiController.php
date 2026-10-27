<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\LeaveApplication;
use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\LeaveType;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LeaveApplicationApiController extends Controller
{
    use ApiResponseTrait;

    // ---------------------------------------------------------------
    // GET /api/leave-applications
    // ---------------------------------------------------------------
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('manage-leave-applications')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $companyUserIds = getCompanyAndUsersId();

        $query = LeaveApplication::with(['employee', 'leaveType', 'leavePolicy', 'approver'])
            ->where(function ($q) use ($companyUserIds) {
                if (Auth::user()->can('manage-any-leave-applications')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif (Auth::user()->can('manage-own-leave-applications')) {
                    $q->where('created_by', Auth::id())
                        ->orWhere('employee_id', Auth::id())
                        ->orWhere('approved_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            });

        // Month & Year filter
        $month = $request->filled('month') ? (int) $request->month : null;
        $year  = $request->filled('year')  ? (int) $request->year  : null;

        if ($month && $year) {
            $query->whereYear('start_date', $year)->whereMonth('start_date', $month);
        } elseif ($year) {
            $query->whereYear('start_date', $year);
        }

        // Employee filter
        if ($request->filled('employee_id') && ! in_array(strtolower((string) $request->employee_id), ['all', ''])) {
            $query->where('employee_id', $request->employee_id);
        }

        // Leave type filter
        if ($request->filled('leave_type_id') && ! in_array(strtolower((string) $request->leave_type_id), ['all', ''])) {
            $query->where('leave_type_id', $request->leave_type_id);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reason', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($subQ) use ($search) {
                        $subQ->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('leaveType', function ($subQ) use ($search) {
                        $subQ->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Status counts before applying status filter
        $statusCounts = [
            'all'      => (clone $query)->count(),
            'pending'  => (clone $query)->where('status', 'pending')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
        ];

        // Status filter
        $statusFilter = $request->filled('status') && ! in_array(strtolower((string) $request->status), ['all', ''])
            ? strtolower(trim((string) $request->status))
            : null;

        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        // Sorting & Pagination
        $sortField = $request->filled('sort_field') && in_array($request->sort_field, ['start_date', 'end_date', 'created_at'])
            ? $request->sort_field
            : 'id';

        $sortDirection = $request->filled('sort_direction') && in_array(strtolower($request->sort_direction), ['asc', 'desc'])
            ? strtolower($request->sort_direction)
            : 'desc';

        $perPage = (int) $request->input('per_page', 20);
        $page    = (int) $request->input('page', 1);

        $paginated = $query->orderBy($sortField, $sortDirection)->paginate($perPage, ['*'], 'page', $page);

        $records = $paginated->getCollection()->map(function ($application) {
            return $this->transformRecord($application);
        })->values()->toArray();

        // Leave balances & Leave Type Options
        $effectiveBalanceEmpId = null;
        if (! Auth::user()->can('manage-any-leave-applications') && Auth::user()->can('manage-own-leave-applications')) {
            $effectiveBalanceEmpId = $user->id;
        } elseif ($request->filled('employee_id') && ! in_array(strtolower((string) $request->employee_id), ['all', ''])) {
            $effectiveBalanceEmpId = (int) $request->employee_id;
        }

        // Employee options dropdown (loaded based on permissions)
        $employeeOptions = $this->getFilteredEmployees();

        // Default balance employee ID for HR/Company if not set
        if (! $effectiveBalanceEmpId) {
            $effectiveBalanceEmpId = ! empty($employeeOptions) ? $employeeOptions[0]['id'] : $user->id;
        }

        // Fetch balances for the effective employee
        $balanceRecords = LeaveBalance::with(['leaveType'])
            ->where('employee_id', $effectiveBalanceEmpId)
            ->where('year', now()->year)
            ->whereIn('created_by', $companyUserIds)
            ->get();

        $leaveBalances = $balanceRecords->map(function ($balance) {
            return $this->transformBalance($balance);
        })->values()->toArray();

        $balanceMap = $balanceRecords->keyBy('leave_type_id');

        // Leave type options dropdown with balance metadata
        $leaveTypeOptions = LeaveType::whereIn('created_by', $companyUserIds)
            ->where('status', 'active')
            ->select('id', 'name', 'color', 'is_paid')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($lt) use ($balanceMap) {
                $balance = $balanceMap->get($lt->id);
                $remaining = $balance ? (float) $balance->remaining_days : 0;
                $allocated = $balance ? (float) $balance->allocated_days : 0;
                $used      = $balance ? (float) $balance->used_days : 0;

                return [
                    'id'             => $lt->id,
                    'name'           => $lt->name,
                    'color'          => $lt->color ?? '#6b7280',
                    'is_paid'        => (bool) $lt->is_paid,
                    'remaining_days' => $remaining,
                    'allocated_days' => $allocated,
                    'used_days'      => $used,
                    'is_disabled'    => $remaining <= 0,
                ];
            })->toArray();

        return $this->successResponse([
            'records'            => $records,
            'total_records'      => $paginated->total(),
            'status_counts'      => $statusCounts,
            'leave_balances'     => $leaveBalances,
            'pagination'         => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'has_more'     => $paginated->hasMorePages(),
            ],
            'filters'            => [
                'status'         => $statusFilter ?? 'all',
                'employee_id'    => $request->input('employee_id', 'all'),
                'leave_type_id'  => $request->input('leave_type_id', 'all'),
                'month'          => $month,
                'year'           => $year,
                'search'         => $request->input('search', ''),
                'sort_field'     => $sortField,
                'sort_direction' => $sortDirection,
                'page'           => $page,
                'per_page'       => $perPage,
            ],
            'employee_options'   => $employeeOptions,
            'leave_type_options' => $leaveTypeOptions,
        ], __('Leave applications retrieved successfully.'));
    }

    // ---------------------------------------------------------------
    // GET /api/leave-applications/employee-balances/{employee_id}
    // ---------------------------------------------------------------
    public function getEmployeeBalances($employee_id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        // Permission check: own leave applicants can only view their allowed employees
        if (! Auth::user()->can('manage-any-leave-applications') && Auth::user()->can('manage-own-leave-applications')) {
            $allowedIds = collect($this->getFilteredEmployees())->pluck('id')->toArray();
            if (! in_array((int) $employee_id, $allowedIds)) {
                return $this->errorResponse(__('Permission Denied.'), null, 403);
            }
        }

        $companyUserIds = getCompanyAndUsersId();
        $currentYear    = now()->year;

        // Fetch active leave types
        $leaveTypes = LeaveType::whereIn('created_by', $companyUserIds)
            ->where('status', 'active')
            ->select('id', 'name', 'color', 'is_paid')
            ->orderBy('name', 'asc')
            ->get();

        // Fetch balances for this employee
        $balanceRecords = LeaveBalance::with(['leaveType'])
            ->where('employee_id', $employee_id)
            ->where('year', $currentYear)
            ->whereIn('created_by', $companyUserIds)
            ->get();

        $balanceMap = $balanceRecords->keyBy('leave_type_id');

        $leaveTypeOptions = $leaveTypes->map(function ($lt) use ($balanceMap) {
            $balance = $balanceMap->get($lt->id);
            $remaining = $balance ? (float) $balance->remaining_days : 0;
            $allocated = $balance ? (float) $balance->allocated_days : 0;
            $used      = $balance ? (float) $balance->used_days : 0;

            return [
                'id'             => $lt->id,
                'name'           => $lt->name,
                'color'          => $lt->color ?? '#6b7280',
                'is_paid'        => (bool) $lt->is_paid,
                'remaining_days' => $remaining,
                'allocated_days' => $allocated,
                'used_days'      => $used,
                'is_disabled'    => $remaining <= 0,
            ];
        })->values()->toArray();

        $leaveBalances = $balanceRecords->map(function ($balance) {
            return $this->transformBalance($balance);
        })->values()->toArray();

        return $this->successResponse([
            'employee_id'        => (int) $employee_id,
            'leave_balances'     => $leaveBalances,
            'leave_type_options' => $leaveTypeOptions,
        ], __('Employee leave balances retrieved successfully.'));
    }

    // ---------------------------------------------------------------
    // GET /api/leave-applications/{id}
    // ---------------------------------------------------------------
    public function show($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('manage-leave-applications')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $application = LeaveApplication::with(['employee', 'leaveType', 'leavePolicy', 'approver'])
            ->where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-leave-applications')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-leave-applications')) {
                    $q->where('created_by', Auth::id())
                        ->orWhere('employee_id', Auth::id())
                        ->orWhere('approved_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $application) {
            return $this->errorResponse(__('Leave application not found.'), null, 404);
        }

        return $this->successResponse(
            $this->transformRecord($application),
            __('Leave application retrieved successfully.')
        );
    }

    // ---------------------------------------------------------------
    // POST /api/leave-applications
    // ---------------------------------------------------------------
    public function store(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('create-leave-applications')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $validator = Validator::make($request->all(), [
            'employee_id'   => 'required|exists:users,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'reason'        => 'required|string',
            'attachment'    => 'nullable',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $validated = $validator->validated();
        $validated['created_by'] = creatorId();

        // Handle attachment file upload or string using upload_file helper
        if ($request->hasFile('attachment')) {
            $filenameWithExt = $request->file('attachment')->getClientOriginalName();
            $extension       = $request->file('attachment')->getClientOriginalExtension();
            $fileNameToStore = 'leave_' . time() . '.' . $extension;
            $upload          = upload_file($request, 'attachment', $fileNameToStore, 'leave_attachment');

            if ($upload['status'] == true) {
                $validated['attachment'] = $upload['url'];
            } else {
                return $this->errorResponse($upload['msg'], null, 422);
            }
        } elseif ($request->filled('attachment') && is_string($request->attachment)) {
            $validated['attachment'] = $request->attachment;
        } else {
            $validated['attachment'] = null;
        }

        // Calculate total working days
        $globalSettings     = settings();
        $workingDaysIndices = json_decode($globalSettings['working_days'] ?? '[1,2,3,4,5]', true);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate   = Carbon::parse($validated['end_date']);
        $totalDays = 0;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            if (in_array($date->dayOfWeek, $workingDaysIndices)) {
                $totalDays++;
            }
        }

        $validated['total_days'] = $totalDays;

        // Get leave policy
        $leavePolicy = LeavePolicy::where('leave_type_id', $validated['leave_type_id'])
            ->whereIn('created_by', getCompanyAndUsersId())
            ->where('status', 'active')
            ->first();

        if (! $leavePolicy) {
            return $this->errorResponse(__('No active policy found for selected leave type.'), null, 422);
        }

        $validated['leave_policy_id'] = $leavePolicy->id;

        // Validate days per application against policy
        if (
            $totalDays < $leavePolicy->min_days_per_application ||
            $totalDays > $leavePolicy->max_days_per_application
        ) {
            return $this->errorResponse(
                __('Leave days must be between :min and :max days as per the leave policy.', [
                    'min' => $leavePolicy->min_days_per_application,
                    'max' => $leavePolicy->max_days_per_application,
                ]),
                null,
                422
            );
        }

        // Check leave balance
        $currentYear  = now()->year;
        $leaveBalance = LeaveBalance::where('employee_id', $validated['employee_id'])
            ->where('leave_type_id', $validated['leave_type_id'])
            ->where('year', $currentYear)
            ->first();

        if (! $leaveBalance) {
            $leaveBalance = LeaveBalance::create([
                'employee_id'     => $validated['employee_id'],
                'leave_type_id'   => $validated['leave_type_id'],
                'leave_policy_id' => $leavePolicy->id,
                'year'            => $currentYear,
                'allocated_days'  => $leavePolicy->max_days_per_year ?? 10,
                'used_days'       => 0,
                'remaining_days'  => $leavePolicy->max_days_per_year ?? 10,
                'created_by'      => creatorId(),
            ]);
        }

        if ($leaveBalance->remaining_days < $totalDays) {
            return $this->errorResponse(
                __('Insufficient leave balance. Available: :available days, Requested: :requested days', [
                    'available' => $leaveBalance->remaining_days,
                    'requested' => $totalDays,
                ]),
                null,
                422
            );
        }

        // Set status based on policy
        $validated['status'] = $leavePolicy->requires_approval ? 'pending' : 'approved';

        $leaveApplication = LeaveApplication::create($validated);

        if ($validated['status'] === 'approved') {
            $leaveApplication->createAttendanceRecords();
        }

        $leaveApplication->load(['employee', 'leaveType', 'leavePolicy', 'approver']);

        return $this->successResponse(
            $this->transformRecord($leaveApplication),
            __('Leave application created successfully.')
        );
    }

    // ---------------------------------------------------------------
    // PUT /api/leave-applications/{id}
    // ---------------------------------------------------------------
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('edit-leave-applications')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $application = LeaveApplication::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-leave-applications')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-leave-applications')) {
                    $q->where('created_by', Auth::id())
                        ->orWhere('employee_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $application) {
            return $this->errorResponse(__('Leave application not found.'), null, 404);
        }

        if (strtolower($application->status) !== 'pending') {
            return $this->errorResponse(__('Only pending leave applications can be edited.'), null, 422);
        }

        $validator = Validator::make($request->all(), [
            'employee_id'   => 'required|exists:users,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'reason'        => 'required|string',
            'attachment'    => 'nullable',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $validated = $validator->validated();

        // Handle attachment file upload or update using upload_file helper
        if ($request->hasFile('attachment')) {
            // Delete old attachment if exists
            if ($application->attachment && check_file($application->attachment)) {
                delete_file($application->attachment);
            }

            $filenameWithExt = $request->file('attachment')->getClientOriginalName();
            $extension       = $request->file('attachment')->getClientOriginalExtension();
            $fileNameToStore = 'leave_' . time() . '.' . $extension;
            $upload          = upload_file($request, 'attachment', $fileNameToStore, 'leave_attachment');

            if ($upload['status'] == true) {
                $validated['attachment'] = $upload['url'];
            } else {
                return $this->errorResponse($upload['msg'], null, 422);
            }
        } elseif ($request->has('attachment')) {
            // If attachment was explicitly cleared, delete old file
            if (empty($request->attachment) && $application->attachment && check_file($application->attachment)) {
                delete_file($application->attachment);
            }
            $validated['attachment'] = $request->attachment;
        }

        // Calculate total working days
        $globalSettings     = settings();
        $workingDaysIndices = json_decode($globalSettings['working_days'] ?? '[1,2,3,4,5]', true);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate   = Carbon::parse($validated['end_date']);
        $totalDays = 0;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            if (in_array($date->dayOfWeek, $workingDaysIndices)) {
                $totalDays++;
            }
        }

        $validated['total_days'] = $totalDays;

        // Get leave policy
        $leavePolicy = LeavePolicy::where('leave_type_id', $validated['leave_type_id'])
            ->whereIn('created_by', getCompanyAndUsersId())
            ->where('status', 'active')
            ->first();

        if (! $leavePolicy) {
            return $this->errorResponse(__('No active policy found for selected leave type.'), null, 422);
        }

        $validated['leave_policy_id'] = $leavePolicy->id;

        $application->update($validated);
        $application->load(['employee', 'leaveType', 'leavePolicy', 'approver']);

        return $this->successResponse(
            $this->transformRecord($application),
            __('Leave application updated successfully.')
        );
    }

    // ---------------------------------------------------------------
    // DELETE /api/leave-applications/{id}
    // ---------------------------------------------------------------
    public function destroy($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('delete-leave-applications')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $application = LeaveApplication::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-leave-applications')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-leave-applications')) {
                    $q->where('created_by', Auth::id())
                        ->orWhere('employee_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $application) {
            return $this->errorResponse(__('Leave application not found.'), null, 404);
        }

        // Delete attachment file if exists
        if ($application->attachment && check_file($application->attachment)) {
            delete_file($application->attachment);
        }

        $application->delete();

        return $this->successResponse(null, __('Leave application deleted successfully.'));
    }

    // ---------------------------------------------------------------
    // POST /api/leave-applications/{id}/status
    // ---------------------------------------------------------------
    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('approve-leave-applications')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $validator = Validator::make($request->all(), [
            'status'           => 'required|in:approved,rejected',
            'manager_comments' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $application = LeaveApplication::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-leave-applications')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-leave-applications')) {
                    $q->where('created_by', Auth::id())
                        ->orWhere('employee_id', Auth::id())
                        ->orWhere('approved_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $application) {
            return $this->errorResponse(__('Leave application not found.'), null, 404);
        }

        if (strtolower($application->status) !== 'pending') {
            return $this->errorResponse(__('Only pending leave applications can be approved or rejected.'), null, 422);
        }

        // Check balance before approving
        if ($request->status === 'approved') {
            $leaveBalance = LeaveBalance::where('employee_id', $application->employee_id)
                ->where('leave_type_id', $application->leave_type_id)
                ->where('year', now()->year)
                ->first();

            if ($leaveBalance && $leaveBalance->remaining_days < $application->total_days) {
                return $this->errorResponse(
                    __('Cannot approve: Insufficient leave balance. Available: :available days, Required: :required days', [
                        'available' => $leaveBalance->remaining_days,
                        'required'  => $application->total_days,
                    ]),
                    null,
                    422
                );
            }
        }

        $application->update([
            'status'           => $request->status,
            'manager_comments' => $request->manager_comments ?? null,
            'approved_by'      => Auth::id(),
            'approved_at'      => now(),
        ]);

        if ($request->status === 'approved') {
            $application->createAttendanceRecords();
        }

        $application->load(['employee', 'leaveType', 'leavePolicy', 'approver']);

        return $this->successResponse(
            $this->transformRecord($application),
            __('Leave application status updated successfully.')
        );
    }

    // ---------------------------------------------------------------
    // Private: transform a single LeaveApplication record
    // ---------------------------------------------------------------
    private function transformRecord(LeaveApplication $application): array
    {
        $rawAvatar = $application->employee?->getRawOriginal('avatar');
        $avatar    = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        return [
            'id'                   => $application->id,
            'employee_id'          => $application->employee_id,
            'employee_name'        => $application->employee?->name ?? 'Employee',
            'avatar'               => $avatar,
            'leave_type_id'        => $application->leave_type_id,
            'leave_type'           => $application->leaveType?->name,
            'leave_type_color'     => $application->leaveType?->color ?? '#6b7280',
            'is_paid'              => (bool) ($application->leaveType?->is_paid ?? false),
            'leave_policy_id'      => $application->leave_policy_id,
            'start_date'           => $application->start_date ? $application->start_date->format('Y-m-d') : null,
            'end_date'             => $application->end_date ? $application->end_date->format('Y-m-d') : null,
            'formatted_start_date' => formatDate($application->start_date),
            'formatted_end_date'   => formatDate($application->end_date),
            'total_days'           => $application->total_days,
            'reason'               => $application->reason,
            'attachment'           => $application->attachment,
            'attachment_url'       => $application->attachment ? get_file($application->attachment) : null,
            'status'               => strtolower($application->status),
            'status_label'         => ucfirst($application->status),
            'manager_comments'     => $application->manager_comments,
            'approved_by'          => $application->approver?->name,
            'approved_at'          => $application->approved_at ? $application->approved_at->format('Y-m-d H:i:s') : null,
            'created_at'           => $application->created_at ? $application->created_at->format('Y-m-d H:i:s') : null,
            'formatted_created_at' => formatDate($application->created_at),
        ];
    }

    // ---------------------------------------------------------------
    // Private: transform a single LeaveBalance record
    // ---------------------------------------------------------------
    private function transformBalance(LeaveBalance $balance): array
    {
        return [
            'id'                => (int) $balance->id,
            'leave_type_id'     => (int) $balance->leave_type_id,
            'leave_type'        => $balance->leaveType?->name,
            'leave_type_color'  => $balance->leaveType?->color ?? '#6b7280',
            'is_paid'           => (bool) ($balance->leaveType?->is_paid ?? false),
            'year'              => (int) $balance->year,
            'allocated_days'    => (float) $balance->allocated_days,
            'used_days'         => (float) $balance->used_days,
            'remaining_days'    => (float) $balance->remaining_days,
            'carried_forward'   => (float) $balance->carried_forward,
            'manual_adjustment' => (float) $balance->manual_adjustment,
        ];
    }

    /**
     * Get filtered employees list based on permissions
     */
    private function getFilteredEmployees(): array
    {
        $user = Auth::user();
        if (! $user) {
            return [];
        }

        $companyUserIds = getCompanyAndUsersId();

        $employees = User::where(function ($q) use ($companyUserIds) {
            if (Auth::user()->can('manage-any-employees')) {
                $q->whereIn('created_by', $companyUserIds);
            } elseif (Auth::user()->can('manage-own-employees')) {
                $q->where('created_by', Auth::id())->orWhere('id', Auth::id());
            } else {
                $q->whereRaw('1 = 0');
            }
        })
            ->where('type', 'employee')
            ->where('status', 'active')
            ->whereHas('employee', function ($q) {
                $q->whereIn('employee_status', ['active', 'Active', 'probation', 'Probation']);
            })
            ->select('id', 'name')
            ->orderBy('id', 'asc')
            ->get();

        if ($employees->isEmpty() && Auth::user()->type === 'employee') {
            $employees = collect([$user]);
        }

        return $employees->map(function ($emp) {
            return [
                'id'   => (int) $emp->id,
                'name' => $emp->name,
            ];
        })->values()->toArray();
    }
}
