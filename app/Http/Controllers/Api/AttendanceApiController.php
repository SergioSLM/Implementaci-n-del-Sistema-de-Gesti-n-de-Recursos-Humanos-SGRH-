<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendancePolicy;
use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\IpRestriction;
use App\Models\LeaveApplication;
use App\Models\Shift;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AttendanceApiController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        // Permission check matching AwardController / AttendanceRecordController codeflow pattern
        if ($user->can('manage-attendance-records') || $user->can('view-attendance-records')) {
            $query = AttendanceRecord::with(['employee.employee.designation', 'shift'])
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-attendance-records')) {
                        $q->whereIn('created_by', getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-attendance-records')) {
                        $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $companyUserIds = getCompanyAndUsersId();
        $canManageAny = $user->can('manage-any-attendance-records');

        // Extract month & year filters (default: current month & current year)
        $month = (int) $request->input('month', Carbon::now()->month);
        $year = (int) $request->input('year', Carbon::now()->year);

        // Employee Filter
        if ($request->filled('employee_id') && !in_array(strtolower((string) $request->employee_id), ['all', 'all employees', ''])) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by Month and Year
        $query->whereYear('date', $year)
            ->whereMonth('date', $month);

        // Status Filter
        if ($request->filled('status') && !in_array(strtolower((string) $request->status), ['all', 'all statuses', ''])) {
            $statusInput = strtolower(trim((string) $request->status));
            $query->where(function ($q) use ($statusInput) {
                $q->whereRaw('LOWER(status) = ?', [$statusInput])
                    ->orWhereRaw('LOWER(REPLACE(REPLACE(status, "_", " "), "-", " ")) = ?', [$statusInput]);
            });
        }

        // Sort by date descending and paginate (default 20 items per page)
        $perPage = (int) $request->input('per_page', 20);
        $page = (int) $request->input('page', 1);

        $paginated = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate($perPage, ['*'], 'page', $page);

        // Transform records
        $formattedRecords = $paginated->getCollection()->map(function ($rec) {
            return $this->transformRecord($rec);
        })->values()->toArray();

        // Fetch Employee Options for filter dropdown
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
                $q->whereIn('employee_status', ['active', 'probation']);
            })
            ->select('id', 'name')
            ->orderBy('name', 'asc')
            ->get();

        if ($employees->isEmpty() && Auth::user()->type === 'employee') {
            $employees = collect([$user]);
        }

        $employeeOptions = $employees->map(function ($emp) {
            return [
                'id'   => (int) $emp->id,
                'name' => $emp->name,
            ];
        })->values()->toArray();

        return $this->successResponse([
            'records' => $formattedRecords,
            'total_records' => $paginated->total(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'has_more' => $paginated->hasMorePages(),
            ],
            'filters' => [
                'month' => $month,
                'year' => $year,
                'employee_id' => $request->input('employee_id', 'all'),
                'status' => $request->input('status', 'all'),
                'page' => $page,
                'per_page' => $perPage,
            ],
            'employee_options' => $employeeOptions,
        ], __('Attendance records retrieved successfully.'));
    }

    public function show($id)
    {
        $user = Auth::user();

        if (!$user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if ($user->can('view-attendance-records')) {
            $record = AttendanceRecord::with(['employee.employee.designation', 'shift', 'attendancePolicy'])
                ->where('id', $id)
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-attendance-records')) {
                        $q->whereIn('created_by', getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-attendance-records')) {
                        $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })->first();

            if (!$record) {
                return $this->errorResponse(__('Attendance record not found.'), null, 404);
            }

            return $this->successResponse($this->transformRecord($record), __('Attendance record retrieved successfully.'));
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if ($user->can('create-attendance-records')) {
            $validator = Validator::make($request->all(), [
                'employee_id' => 'required|exists:users,id',
                'date' => 'required|date',
                'clock_in' => 'nullable|date_format:H:i',
                'clock_out' => 'nullable|date_format:H:i',
                'is_holiday' => 'nullable|boolean',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse($validator->errors()->first(), $validator->errors(), 422);
            }

            $validated = $validator->validated();

            // Check working days configuration
            $globalSettings = settings();
            $workingDaysIndices = json_decode($globalSettings['working_days'] ?? '[]', true);

            if (!empty($workingDaysIndices)) {
                $dateIndex = Carbon::parse($validated['date'])->dayOfWeek;
                if (!in_array($dateIndex, $workingDaysIndices)) {
                    return $this->errorResponse(__('Cannot create attendance record for non-working day.'), null, 400);
                }
            }

            // Check approved leave
            $hasApprovedLeave = LeaveApplication::where('employee_id', $validated['employee_id'])
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $validated['date'])
                ->whereDate('end_date', '>=', $validated['date'])
                ->exists();

            if ($hasApprovedLeave) {
                return $this->errorResponse(__('Employee has approved leave for this date. Cannot create attendance record.'), null, 400);
            }

            // Duplicate record check
            $exists = AttendanceRecord::where('employee_id', $validated['employee_id'])
                ->where('date', $validated['date'])
                ->whereIn('created_by', getCompanyAndUsersId())
                ->exists();

            if ($exists) {
                return $this->errorResponse(__('Attendance record already exists for this employee and date.'), null, 400);
            }

            // Employee, shift, and policy resolution
            $employee = Employee::where('user_id', $validated['employee_id'])->first();

            $shift = $employee && $employee->shift_id ?
                Shift::find($employee->shift_id) :
                Shift::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

            $policy = $employee && $employee->attendance_policy_id ?
                AttendancePolicy::find($employee->attendance_policy_id) :
                AttendancePolicy::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

            $validated['shift_id'] = $shift?->id;
            $validated['attendance_policy_id'] = $policy?->id;
            $validated['created_by'] = creatorId();
            $validated['is_holiday'] = filter_var($validated['is_holiday'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $validated['break_hours'] = $validated['break_hours'] ?? 0;
            $validated['is_weekend'] = Carbon::parse($validated['date'])->isWeekend();

            $record = AttendanceRecord::create($validated);
            $record->fresh();
            $record->processAttendance();
            $record->load(['employee.employee.designation', 'shift']);

            return $this->successResponse($this->transformRecord($record), __('Attendance record created successfully.'));
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }
        if ($user->can('edit-attendance-records')) {
            $attendanceRecord = AttendanceRecord::where('id', $id)
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-attendance-records')) {
                        $q->whereIn('created_by', getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-attendance-records')) {
                        $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })->first();

            if (!$attendanceRecord) {
                return $this->errorResponse(__('Attendance record not found.'), null, 404);
            }

            $validator = Validator::make($request->all(), [
                'employee_id' => 'required|exists:users,id',
                'date' => 'required|date',
                'clock_in' => 'nullable|date_format:H:i',
                'clock_out' => 'nullable|date_format:H:i',
                'break_hours' => 'nullable|numeric|min:0',
                'is_holiday' => 'nullable|boolean',
                'status' => 'nullable|in:present,absent,half_day,on_leave,holiday',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse($validator->errors()->first(), $validator->errors(), 422);
            }

            $validated = $validator->validated();

            // Check working days configuration
            $globalSettings = settings();
            $workingDaysIndices = json_decode($globalSettings['working_days'] ?? '[]', true);

            if (!empty($workingDaysIndices)) {
                $dateIndex = Carbon::parse($validated['date'])->dayOfWeek;
                if (!in_array($dateIndex, $workingDaysIndices)) {
                    return $this->errorResponse(__('Cannot create attendance record for non-working day.'), null, 400);
                }
            }

            // Check approved leave
            $hasApprovedLeave = LeaveApplication::where('employee_id', $validated['employee_id'])
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $validated['date'])
                ->whereDate('end_date', '>=', $validated['date'])
                ->exists();

            if ($hasApprovedLeave) {
                return $this->errorResponse(__('Employee has approved leave for this date. Cannot update attendance record.'), null, 400);
            }

            // Check if employee or date changed and if duplicate exists
            if ($attendanceRecord->employee_id != $validated['employee_id'] || $attendanceRecord->date != $validated['date']) {
                $exists = AttendanceRecord::where('employee_id', $validated['employee_id'])
                    ->where('date', $validated['date'])
                    ->where('id', '!=', $id)
                    ->whereIn('created_by', getCompanyAndUsersId())
                    ->exists();

                if ($exists) {
                    return $this->errorResponse(__('Attendance record already exists for this employee and date.'), null, 400);
                }
            }

            $employee = Employee::where('user_id', $validated['employee_id'])->first();

            $shift = $employee && $employee->shift_id ?
                Shift::find($employee->shift_id) :
                Shift::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

            $policy = $employee && $employee->attendance_policy_id ?
                AttendancePolicy::find($employee->attendance_policy_id) :
                AttendancePolicy::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

            $validated['shift_id'] = $shift?->id;
            $validated['attendance_policy_id'] = $policy?->id;
            $validated['is_weekend'] = Carbon::parse($validated['date'])->isWeekend();

            $attendanceRecord->update($validated);
            $attendanceRecord->fresh();
            $attendanceRecord->processAttendance();
            $attendanceRecord->load(['employee.employee.designation', 'shift']);

            return $this->successResponse($this->transformRecord($attendanceRecord), __('Attendance record updated successfully.'));
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if (!$user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }
        if ($user->can('delete-attendance-records')) {
            $attendanceRecord = AttendanceRecord::where('id', $id)
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-attendance-records')) {
                        $q->whereIn('created_by', getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-attendance-records')) {
                        $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })->first();

            if (!$attendanceRecord) {
                return $this->errorResponse(__('Attendance record not found.'), null, 404);
            }

            $attendanceRecord->delete();

            return $this->successResponse(null, __('Attendance record deleted successfully.'));
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    public function todayAttendance(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        $employeeId = $request->input('employee_id', $user->id);
        if ($employeeId != $user->id && !$user->can('manage-any-attendance-records') && !$user->can('manage-attendance-records')) {
            $employeeId = $user->id;
        }

        $settings = settings();
        $timezone = $settings['defaultTimezone'] ?? config('app.timezone', 'UTC');
        $timeFormat = $settings['timeFormat'] ?? 'H:i';
        $dateFormat = $settings['dateFormat'] ?? 'Y-m-d';
        $today = Carbon::today($timezone);
        $now = Carbon::now($timezone);

        $record = AttendanceRecord::where('employee_id', $employeeId)
            ->whereDate('date', $today->toDateString())
            ->first();

        $data = $record ? [
            'id' => $record->id,
            'employee_id' => $record->employee_id,
            'date' => formatDate($record->date),
            'clock_in' => $record->clock_in,
            'clock_out' => $record->clock_out,
            'status' => formatStatus($record->status),
            'raw_status' => $record->status,
            'is_late' => (bool) $record->is_late,
            'is_early_departure' => (bool) $record->is_early_departure,
            'total_hours' => $record->total_hours,
            'company_settings' => [
                'timezone' => $timezone,
                'time_format' => $timeFormat,
                'date_format' => $dateFormat,
                'current_time' => $now->format('H:i:s'),
                'current_date' => $today->toDateString(),
            ],
        ] : [
            'id' => null,
            'employee_id' => $employeeId,
            'date' => $today->toDateString(),
            'clock_in' => null,
            'clock_out' => null,
            'status' => null,
            'raw_status' => null,
            'is_late' => false,
            'is_early_departure' => false,
            'total_hours' => null,
            'company_settings' => [
                'timezone' => $timezone,
                'time_format' => $timeFormat,
                'date_format' => $dateFormat,
                'current_time' => $now->format('H:i:s'),
                'current_date' => $today->toDateString(),
            ],
        ];

        return $this->successResponse($data, __('Today attendance retrieved successfully.'));
    }

    public function clockIn(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (!$user->can('clock-in-out')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        try {
            $employeeId = $request->input('employee_id', $user->id);
            if ($employeeId != $user->id && !$user->can('manage-any-attendance-records') && !$user->can('manage-attendance-records')) {
                $employeeId = $user->id;
            }

            $settings = settings();
            $timezone = $settings['defaultTimezone'] ?? config('app.timezone', 'UTC');
            $timeFormat = $settings['timeFormat'] ?? 'H:i';
            $dateFormat = $settings['dateFormat'] ?? 'Y-m-d';

            if (!empty($settings['ipRestrictionEnabled']) && $settings['ipRestrictionEnabled'] == 1) {
                $loginUserIp = request()->ip();
                $ip = IpRestriction::whereIn('created_by', getCompanyAndUsersId())->where('ip_address', $loginUserIp)->first();
                if (empty($ip) || is_null($ip)) {
                    return $this->errorResponse(__('This IP Address Is Not Allowed For Clock In & Clock Out.'), null, 403);
                }
            }

            $today = Carbon::today($timezone);
            $now = Carbon::now($timezone);

            // Get working days from settings
            $workingDaysIndices = json_decode($settings['working_days'] ?? '[1,2,3,4,5]', true);

            if (empty($workingDaysIndices)) {
                $workingDaysIndices = [1, 2, 3, 4, 5];
            }

            $dateIndex = Carbon::parse($today)->dayOfWeek;
            if (!in_array($dateIndex, $workingDaysIndices)) {
                return $this->errorResponse(__('Cannot create attendance record for non-working day.'), null, 400);
            }

            // Check if employee has approved leave for this date
            $hasApprovedLeave = LeaveApplication::where('employee_id', $employeeId)
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $today->toDateString())
                ->whereDate('end_date', '>=', $today->toDateString())
                ->exists();

            if ($hasApprovedLeave) {
                return $this->errorResponse(__('Employee has approved leave for this date. Cannot create attendance record.'), null, 400);
            }

            // Check if already clocked in today
            $existingRecord = AttendanceRecord::where('employee_id', $employeeId)
                ->whereDate('date', $today->toDateString())
                ->first();

            if ($existingRecord && $existingRecord->clock_in) {
                return $this->errorResponse(__('Already clocked in today.'), null, 400);
            }

            // Get employee with shift and policy
            $employee = Employee::where('user_id', $employeeId)->first();

            if (!$employee) {
                return $this->errorResponse(__('Employee profile not found.'), null, 404);
            }

            // Use employee's assigned shift and policy, or get defaults
            $shift = $employee->shift_id ?
                Shift::find($employee->shift_id) :
                Shift::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

            $policy = $employee->attendance_policy_id ?
                AttendancePolicy::find($employee->attendance_policy_id) :
                AttendancePolicy::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

            if (!$shift || !$policy) {
                return $this->errorResponse(__('No active shift or attendance policy found. Please contact HR.'), null, 400);
            }

            // Auto clock out previous days if not clocked out
            $previousAttendance = AttendanceRecord::where('employee_id', $employeeId)
                ->where('date', '<', $today->toDateString())
                ->whereNotNull('clock_in')
                ->whereNull('clock_out')
                ->get();

            foreach ($previousAttendance as $recordPrev) {
                $prevShift = Shift::find($recordPrev->shift_id) ?? $shift;
                if ($prevShift) {
                    $recordPrev->update([
                        'clock_out' => $prevShift->end_time,
                    ]);
                    if (method_exists($recordPrev, 'processAttendance')) {
                        $recordPrev->processAttendance();
                    }
                }
            }

            if ($existingRecord) {
                $existingRecord->update([
                    'clock_in' => $now->format('H:i:s'),
                    'shift_id' => $shift->id,
                    'attendance_policy_id' => $policy->id,
                    'status' => 'present',
                ]);
                $record = $existingRecord;
            } else {
                $record = AttendanceRecord::create([
                    'employee_id' => $employeeId,
                    'date' => $today->toDateString(),
                    'clock_in' => $now->format('H:i:s'),
                    'shift_id' => $shift->id,
                    'attendance_policy_id' => $policy->id,
                    'is_weekend' => $today->isWeekend(),
                    'status' => 'present',
                    'created_by' => creatorId(),
                ]);
            }

            // Check for late arrival if method exists
            if (method_exists($record, 'checkLateArrival')) {
                $record->checkLateArrival();
                $record->save();
            }

            $record->refresh();

            $responseData = [
                'id' => $record->id,
                'employee_id' => $record->employee_id,
                'date' => formatDate($record->date),
                'clock_in' => $record->clock_in,
                'clock_out' => $record->clock_out,
                'status' => formatStatus($record->status),
                'raw_status' => $record->status,
                'is_late' => (bool) $record->is_late,
                'is_early_departure' => (bool) $record->is_early_departure,
                'total_hours' => $record->total_hours,
                'company_settings' => [
                    'timezone' => $timezone,
                    'time_format' => $timeFormat,
                    'date_format' => $dateFormat,
                    'current_time' => $now->format('H:i:s'),
                    'current_date' => $today->toDateString(),
                ],
            ];

            return $this->successResponse($responseData, __('Clocked in successfully.'));
        } catch (\Exception $e) {
            Log::error('API Clock in failed: ' . $e->getMessage());

            return $this->errorResponse(__('Failed to clock in. Please try again.'), null, 500);
        }
    }

    public function clockOut(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (!$user->can('clock-in-out')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        try {
            $employeeId = $request->input('employee_id', $user->id);
            if ($employeeId != $user->id && !$user->can('manage-any-attendance-records') && !$user->can('manage-attendance-records')) {
                $employeeId = $user->id;
            }

            $settings = settings();
            $timezone = $settings['defaultTimezone'] ?? config('app.timezone', 'UTC');
            $timeFormat = $settings['timeFormat'] ?? 'H:i';
            $dateFormat = $settings['dateFormat'] ?? 'Y-m-d';

            if (!empty($settings['ipRestrictionEnabled']) && $settings['ipRestrictionEnabled'] == 1) {
                $loginUserIp = request()->ip();
                $ip = IpRestriction::whereIn('created_by', getCompanyAndUsersId())->where('ip_address', $loginUserIp)->first();
                if (empty($ip) || is_null($ip)) {
                    return $this->errorResponse(__('This IP Address Is Not Allowed For Clock In & Clock Out.'), null, 403);
                }
            }

            $today = Carbon::today($timezone);
            $now = Carbon::now($timezone);

            $record = AttendanceRecord::where('employee_id', $employeeId)
                ->whereDate('date', $today->toDateString())
                ->first();

            if (!$record || !$record->clock_in) {
                return $this->errorResponse(__('Must clock in first.'), null, 400);
            }

            if ($record->clock_out) {
                return $this->errorResponse(__('Already clocked out today.'), null, 400);
            }

            $record->update([
                'clock_out' => $now->format('H:i:s'),
            ]);

            // Process complete attendance calculation if method exists
            if (method_exists($record, 'processAttendance')) {
                $record->processAttendance();
            }

            $record->refresh();

            $responseData = [
                'id' => $record->id,
                'employee_id' => $record->employee_id,
                'date' => formatDate($record->date),
                'clock_in' => $record->clock_in,
                'clock_out' => $record->clock_out,
                'status' => formatStatus($record->status),
                'raw_status' => $record->status,
                'is_late' => (bool) $record->is_late,
                'is_early_departure' => (bool) $record->is_early_departure,
                'total_hours' => $record->total_hours,
                'company_settings' => [
                    'timezone' => $timezone,
                    'time_format' => $timeFormat,
                    'date_format' => $dateFormat,
                    'current_time' => $now->format('H:i:s'),
                    'current_date' => $today->toDateString(),
                ],
            ];

            return $this->successResponse($responseData, __('Clocked out successfully.'));
        } catch (\Exception $e) {
            Log::error('API Clock out failed: ' . $e->getMessage());

            return $this->errorResponse(__('Failed to clock out. Please try again.'), null, 500);
        }
    }

    // ---------------------------------------------------------------
    // Private: transform a single AttendanceRecord
    // ---------------------------------------------------------------
    private function transformRecord(AttendanceRecord $record): array
    {
        $rawAvatar = $record->employee?->getRawOriginal('avatar');
        $avatar    = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        return [
            'id' => $record->id,
            'employee_id' => $record->employee_id,
            'employee_name' => $record->employee?->name ?? 'Employee',
            'avatar' => $avatar,
            'designation' => $record->employee?->employee?->designation?->name ?? 'Staff',
            'date' => $record->date ? Carbon::parse($record->date)->format('Y-m-d') : null,
            'formatted_date' => formatDate($record->date),
            'clock_in' => $record->clock_in,
            'clock_out' => $record->clock_out,
            'total_hours' => $record->total_hours,
            'break_hours' => $record->break_hours,
            'overtime_hours' => $record->overtime_hours,
            'status' => formatStatus($record->status),
            'raw_status' => $record->status,
            'is_late' => (bool) $record->is_late,
            'is_early_departure' => (bool) $record->is_early_departure,
            'is_absent' => (bool) $record->is_absent,
            'is_holiday' => (bool) $record->is_holiday,
            'notes' => $record->notes,
        ];
    }
}
