<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\AttendanceRegularization;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceRegularizationApiController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        if (Auth::user()->can('manage-attendance-regularizations')) {
            $query = AttendanceRegularization::with(['employee.employee', 'attendanceRecord', 'approver', 'creator'])
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-attendance-regularizations')) {
                        $q->whereIn('created_by', getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-attendance-regularizations')) {
                        $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id())->orWhere('approved_by', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });

            $user = Auth::user();
            $companyUserIds = getCompanyAndUsersId();
            $canManageAny = $user->can('manage-any-attendance-regularizations');

            // Extract month & year filters (default: current month & current year)
            $month = (int) $request->input('month', Carbon::now()->month);
            $year = (int) $request->input('year', Carbon::now()->year);

            // Employee Filter
            if ($request->filled('employee_id') && !in_array(strtolower((string) $request->employee_id), ['all', 'all employees', ''])) {
                $query->where('employee_id', $request->employee_id);
            }

            // Filter by Month and Year
            if ($month > 0 && $year > 0) {
                $query->whereYear('date', $year)->whereMonth('date', $month);
            }

            // Search Filter
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('reason', 'like', "%{$search}%")
                        ->orWhereHas('employee', function ($subQ) use ($search) {
                            $subQ->where('name', 'like', "%{$search}%");
                        });
                });
            }

            // Status counts calculation for tabs before status filter is applied
            $statusCounts = [
                'all'      => (clone $query)->count(),
                'pending'  => (clone $query)->where('status', 'pending')->count(),
                'approved' => (clone $query)->where('status', 'approved')->count(),
                'rejected' => (clone $query)->where('status', 'rejected')->count(),
            ];

            // Status Filter
            if ($request->filled('status') && !in_array(strtolower((string) $request->status), ['all', 'all statuses', ''])) {
                $statusInput = strtolower(trim((string) $request->status));
                $query->where('status', $statusInput);
            }

            // Sort by id desc to ensure latest created data is shown first
            $perPage = (int) $request->input('per_page', 20);
            $page = (int) $request->input('page', 1);

            $paginated = $query->orderBy('id', 'desc')->paginate($perPage, ['*'], 'page', $page);

            // Transform records
            $formattedRecords = $paginated->getCollection()->map(function ($rec) {
                return $this->transformRecord($rec);
            })->values()->toArray();

            // Fetch Employee Options based on employee permissions
            $employees = User::where('type', 'employee')
                ->where('status', 'active')
                ->whereHas('employee', function ($q) {
                    $q->whereIn('employee_status', ['active', 'probation']);
                })
                ->where(function ($q) use ($user, $companyUserIds) {
                    if ($user->can('manage-any-employees')) {
                        $q->whereIn('created_by', $companyUserIds);
                    } elseif ($user->can('manage-own-employees')) {
                        $q->where('id', $user->id);
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->select('id', 'name')
                ->orderBy('name', 'asc')
                ->get();


            $employeeOptions = $employees->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                ];
            })->toArray();

            return $this->successResponse([
                'records' => $formattedRecords,
                'total_records' => $paginated->total(),
                'status_counts' => $statusCounts,
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
            ], __('Attendance regularizations retrieved successfully.'));
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    public function getEmployeeAttendance($employeeId)
    {
        try {
            $companyUserIds = getCompanyAndUsersId();

            $query = AttendanceRecord::where('employee_id', $employeeId)
                ->whereIn('created_by', $companyUserIds)
                ->orderBy('date', 'desc');

            $query->whereDate('date', '>=', Carbon::now()->subDays(30))
                ->whereDate('date', '<=', Carbon::now());

            $records = $query->get([
                'id',
                'employee_id',
                'date',
                'clock_in',
                'clock_out',
                'status',
                'is_late',
                'is_early_departure'
            ]);

            $datesForDropdown = $records->map(function ($rec) {
                return [
                    'id' => $rec->id,
                    'value' => $rec->id,
                    'label' => formatDate($rec->date),
                    'date' => Carbon::parse($rec->date)->format('Y-m-d'),
                    'formatted_date' => formatDate($rec->date),
                ];
            })->values()->toArray();

            return $this->successResponse($datesForDropdown, __('Employee attendance records retrieved successfully.'));
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 500);
        }
    }

    public function store(Request $request)
    {
        if (Auth::user()->can('create-attendance-regularizations')) {
            $validated = $request->validate([
                'employee_id' => 'required|exists:users,id',
                'attendance_record_id' => 'required|exists:attendance_records,id',
                'requested_clock_in' => 'required|string',
                'requested_clock_out' => 'required|string',
                'reason' => 'required|string|max:1000',
            ]);

            $user = Auth::user();
            if ($user->can('manage-own-attendance-regularizations') && !$user->can('manage-any-attendance-regularizations')) {
                if ((int) $validated['employee_id'] !== (int) $user->id) {
                    return $this->errorResponse(__('You can only submit regularization requests for yourself.'), null, 403);
                }
            }

            $companyUserIds = getCompanyAndUsersId();

            $attendanceRecord = AttendanceRecord::where('id', $validated['attendance_record_id'])
                ->whereIn('created_by', $companyUserIds)
                ->first();

            if (!$attendanceRecord) {
                return $this->errorResponse(__('Attendance record not found.'), null, 404);
            }

            if ((int) $attendanceRecord->employee_id !== (int) $validated['employee_id']) {
                return $this->errorResponse(__('Selected attendance record does not belong to the selected employee.'), null, 422);
            }

            $exists = AttendanceRegularization::where('attendance_record_id', $validated['attendance_record_id'])
                ->whereIn('created_by', $companyUserIds)
                ->exists();

            if ($exists) {
                return $this->errorResponse(__('Regularization request already exists for this attendance record.'), null, 422);
            }

            $requestedClockIn = $this->formatTimeInput($validated['requested_clock_in']);
            $requestedClockOut = $this->formatTimeInput($validated['requested_clock_out']);

            $regularizationData = [
                'employee_id' => $validated['employee_id'],
                'attendance_record_id' => $attendanceRecord->id,
                'date' => $attendanceRecord->date,
                'original_clock_in' => $attendanceRecord->clock_in,
                'original_clock_out' => $attendanceRecord->clock_out,
                'requested_clock_in' => $requestedClockIn,
                'requested_clock_out' => $requestedClockOut,
                'reason' => trim($validated['reason']),
                'status' => 'pending',
                'created_by' => creatorId(),
            ];

            $regularization = AttendanceRegularization::create($regularizationData);
            $regularization->load(['employee.employee', 'attendanceRecord', 'approver', 'creator']);

            return $this->successResponse(
                $this->transformRecord($regularization),
                __('Regularization request created successfully.')
            );
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    public function show($id)
    {
        if (Auth::user()->can('manage-attendance-regularizations')) {
            $regularization = AttendanceRegularization::with(['employee.employee', 'attendanceRecord', 'approver', 'creator'])
                ->where('id', $id)
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-attendance-regularizations')) {
                        $q->whereIn('created_by', getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-attendance-regularizations')) {
                        $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id())->orWhere('approved_by', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->first();

            if (!$regularization) {
                return $this->errorResponse(__('Regularization request Not Found.'), null, 404);
            }

            return $this->successResponse(
                $this->transformRecord($regularization),
                __('Regularization request details retrieved successfully.')
            );
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    public function update(Request $request, $id)
    {
        if (Auth::user()->can('edit-attendance-regularizations')) {
            $regularization = AttendanceRegularization::where('id', $id)
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-attendance-regularizations')) {
                        $q->whereIn('created_by', getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-attendance-regularizations')) {
                        $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id())->orWhere('approved_by', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->first();

            if (!$regularization) {
                return $this->errorResponse(__('Regularization request Not Found.'), null, 404);
            }

            if (strtolower($regularization->status) !== 'pending') {
                return $this->errorResponse(__('Cannot update processed regularization request.'), null, 422);
            }

            $validated = $request->validate([
                'employee_id' => 'required|exists:users,id',
                'attendance_record_id' => 'required|exists:attendance_records,id',
                'requested_clock_in' => 'required|string',
                'requested_clock_out' => 'required|string',
                'reason' => 'required|string|max:1000',
            ]);

            $companyUserIds = getCompanyAndUsersId();

            $attendanceRecord = AttendanceRecord::where('id', $validated['attendance_record_id'])
                ->whereIn('created_by', $companyUserIds)
                ->first();

            if (!$attendanceRecord) {
                return $this->errorResponse(__('Attendance record not found.'), null, 404);
            }

            if ((int) $attendanceRecord->employee_id !== (int) $validated['employee_id']) {
                return $this->errorResponse(__('Selected attendance record does not belong to the selected employee.'), null, 422);
            }

            $exists = AttendanceRegularization::where('attendance_record_id', $validated['attendance_record_id'])
                ->where('id', '!=', $id)
                ->whereIn('created_by', $companyUserIds)
                ->exists();

            if ($exists) {
                return $this->errorResponse(__('Regularization request already exists for this attendance record.'), null, 422);
            }

            $requestedClockIn = $this->formatTimeInput($validated['requested_clock_in']);
            $requestedClockOut = $this->formatTimeInput($validated['requested_clock_out']);

            $regularization->update([
                'employee_id' => $validated['employee_id'],
                'attendance_record_id' => $attendanceRecord->id,
                'date' => $attendanceRecord->date,
                'original_clock_in' => $attendanceRecord->clock_in,
                'original_clock_out' => $attendanceRecord->clock_out,
                'requested_clock_in' => $requestedClockIn,
                'requested_clock_out' => $requestedClockOut,
                'reason' => trim($validated['reason']),
            ]);

            $regularization->load(['employee.employee', 'attendanceRecord', 'approver', 'creator']);

            return $this->successResponse(
                $this->transformRecord($regularization),
                __('Regularization request updated successfully.')
            );
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    public function destroy($id)
    {
        if (Auth::user()->can('delete-attendance-regularizations')) {
            $regularization = AttendanceRegularization::where('id', $id)
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-attendance-regularizations')) {
                        $q->whereIn('created_by', getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-attendance-regularizations')) {
                        $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id())->orWhere('approved_by', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->first();

            if (!$regularization) {
                return $this->errorResponse(__('Regularization request Not Found.'), null, 404);
            }

            if (strtolower($regularization->status) !== 'pending') {
                return $this->errorResponse(__('Cannot delete processed regularization request.'), null, 422);
            }

            $regularization->delete();

            return $this->successResponse(null, __('Regularization request deleted successfully.'));
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        if (Auth::user()->can('approve-attendance-regularizations')) {
            $validated = $request->validate([
                'status' => 'required|in:approved,rejected',
                'manager_comments' => 'nullable|string|max:1000',
            ]);

            $regularization = AttendanceRegularization::where('id', $id)
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-attendance-regularizations')) {
                        $q->whereIn('created_by', getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-attendance-regularizations')) {
                        $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id())->orWhere('approved_by', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->first();

            if (!$regularization) {
                return $this->errorResponse(__('Regularization request Not Found.'), null, 404);
            }

            if (strtolower($regularization->status) !== 'pending') {
                return $this->errorResponse(__('Regularization request has already been processed.'), null, 422);
            }

            $regularization->update([
                'status' => $validated['status'],
                'manager_comments' => $validated['manager_comments'] ?? null,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            if ($validated['status'] === 'approved') {
                $regularization->applyToAttendanceRecord();
            }

            $regularization->load(['employee.employee', 'attendanceRecord', 'approver', 'creator']);

            return $this->successResponse(
                $this->transformRecord($regularization),
                __('Regularization request status updated successfully.')
            );
        } else {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }
    }

    private function formatTimeInput($timeStr)
    {
        if (empty($timeStr)) {
            return null;
        }

        try {
            return Carbon::parse($timeStr)->format('H:i');
        } catch (\Exception $e) {
            return $timeStr;
        }
    }

    private function transformRecord($rec)
    {
        $rawAv = $rec->employee?->getRawOriginal('avatar');
        $av = check_file($rawAv) ? get_file($rawAv) : get_file('avatars/avatar.png');

        return [
            'id' => $rec->id,
            'employee_id' => $rec->employee_id,
            'employee_name' => $rec->employee?->name ?? 'Employee',
            'employee_code' => $rec->employee?->employee?->employee_id ?? ('WD-' . str_pad($rec->employee_id, 4, '0', STR_PAD_LEFT)),
            'avatar' => $av,
            'attendance_record_id' => $rec->attendance_record_id,
            'date' => $rec->date ? Carbon::parse($rec->date)->format('Y-m-d') : null,
            'formatted_date' => formatDate($rec->date),
            'original_clock_in' => $rec->original_clock_in,
            'original_clock_out' => $rec->original_clock_out,
            'requested_clock_in' => $rec->requested_clock_in,
            'requested_clock_out' => $rec->requested_clock_out,
            'reason' => $rec->reason,
            'status' => strtolower($rec->status),
            'status_label' => ucfirst($rec->status),
            'created_at' => $rec->created_at ? $rec->created_at->format('Y-m-d H:i:s') : null,
            'formatted_created_at' => formatDate($rec->created_at),
            'manager_comments' => $rec->manager_comments,
            'approved_by' => $rec->approver?->name,
            'approved_at' => $rec->approved_at ? Carbon::parse($rec->approved_at)->format('Y-m-d H:i:s') : null,
        ];
    }
}
