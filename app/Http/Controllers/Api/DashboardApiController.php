<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\Award;
use App\Models\Complaint;
use App\Models\Employee;
use App\Models\LeaveApplication;
use App\Models\Promotion;
use App\Models\User;
use App\Models\Warning;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardApiController extends Controller
{
    use ApiResponseTrait;
    public function settings(Request $request)
    {
        $settings = settings();
        $timezone = $settings['defaultTimezone'] ?? config('app.timezone', 'UTC');
        $timeFormat = $settings['timeFormat'] ?? 'H:i';
        $dateFormat = $settings['dateFormat'] ?? 'Y-m-d';
        $today = Carbon::today($timezone);
        $now = Carbon::now($timezone);

        return $this->successResponse([
            'timezone' => $timezone,
            'time_format' => $timeFormat,
            'date_format' => $dateFormat,
            'current_time' => $now->format('H:i:s'),
            'current_date' => $today->toDateString(),
        ], __('Company settings retrieved successfully.'));
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        // Separate handling for Company/HR dashboard vs Employee dashboard
        if (in_array(strtolower($user->type), ['company', 'hr']) || $user->can('manage-any-employees')) {
            $dashboardData = $this->getCompanyDashboardData($user);
        } else {
            $dashboardData = $this->getEmployeeDashboardData($user);
        }

        return $this->successResponse($dashboardData, __('Dashboard data retrieved successfully.'));
    }

    /**
     * Build Company / HR Dashboard Data with strict permission checks and multi-tenant scoping.
     */
    private function getCompanyDashboardData(User $user): array
    {
        $settings = settings();
        $timezone = $settings['defaultTimezone'] ?? config('app.timezone', 'UTC');
        $timeFormat = $settings['timeFormat'] ?? 'H:i';
        $dateFormat = $settings['dateFormat'] ?? 'Y-m-d';
        $today = Carbon::today($timezone)->toDateString();
        $now = Carbon::now($timezone);
        $companyUserIds = getCompanyAndUsersId();

        // 1. User Profile Data
        $rawAvatar = $user->getRawOriginal('avatar');
        $avatarUrl = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'type' => $user->type,
            'avatar' => $avatarUrl,
        ];

        // 2. Metrics / Counts (Permission-Gated)
        $metrics = [];

        // Total Employees
        if ($user->can('manage-employees') || $user->can('manage-any-employees') || $user->can('manage-own-employees')) {
            $metrics['total_employees'] = User::where('type', 'employee')
                ->where('status', 'active')
                ->whereHas('employee', function ($q) {
                    $q->whereIn('employee_status', ['active', 'inactive', 'probation', 'Active', 'Inactive', 'Probation']);
                })
                ->where(function ($q) use ($user, $companyUserIds) {
                    if ($user->can('manage-any-employees')) {
                        $q->whereIn('created_by', $companyUserIds);
                    } elseif ($user->can('manage-own-employees')) {
                        $q->where('created_by', $user->id)->orWhere('id', $user->id);
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })->count();
        }

        // Total Awards
        if ($user->can('manage-awards') || $user->can('manage-any-awards') || $user->can('manage-own-awards')) {
            $metrics['total_awards'] = Award::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-awards')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-awards')) {
                    $q->where('created_by', $user->id)->orWhere('employee_id', $user->id);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })->count();
        }

        // Total Warnings
        if ($user->can('manage-warnings') || $user->can('manage-any-warnings') || $user->can('manage-own-warnings')) {
            $metrics['total_warnings'] = Warning::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-warnings')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-warnings')) {
                    $q->where('created_by', $user->id)->orWhere('employee_id', $user->id);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })->count();
        }

        // Total Complaints
        if ($user->can('manage-complaints') || $user->can('manage-any-complaints') || $user->can('manage-own-complaints')) {
            $metrics['total_complaints'] = Complaint::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-complaints')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-complaints')) {
                    $q->where('created_by', $user->id)->orWhere('employee_id', $user->id)->orWhere('against_employee_id', $user->id);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })->count();
        }

        // Total Promotions
        if ($user->can('manage-promotions') || $user->can('manage-any-promotions') || $user->can('manage-own-promotions')) {
            $metrics['total_promotions'] = Promotion::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-promotions')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-promotions')) {
                    $q->where('created_by', $user->id)->orWhere('employee_id', $user->id);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })->count();
        }

        // Pending Leave Applications
        if ($user->can('manage-leave-applications') || $user->can('manage-any-leave-applications') || $user->can('manage-own-leave-applications')) {
            $metrics['pending_leaves'] = LeaveApplication::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-leave-applications')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-leave-applications')) {
                    $q->where('created_by', $user->id)->orWhere('employee_id', $user->id)->orWhere('approved_by', $user->id);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })->where('status', 'pending')->count();
        }

        // 3. Attendance Summary Statistics (Company-Wide)
        $attendanceStats = null;
        if ($user->can('manage-attendance-records') || $user->can('manage-any-attendance-records')) {
            $todayRecords = AttendanceRecord::whereIn('created_by', $companyUserIds)
                ->whereDate('date', $today)
                ->get();

            $presentCount = $todayRecords->where('status', 'present')->count();
            $lateCount = $todayRecords->where('is_late', true)->count();
            $halfDayCount = $todayRecords->where('status', 'half_day')->count();
            $onLeaveCount = LeaveApplication::whereIn('created_by', $companyUserIds)
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $today)
                ->whereDate('end_date', '>=', $today)
                ->count();

            $totalEmployeesCount = User::where('type', 'employee')
                ->where('status', 'active')
                ->whereHas('employee', function ($q) {
                    $q->whereIn('employee_status', ['active', 'inactive', 'probation', 'Active', 'Inactive', 'Probation']);
                })
                ->whereIn('created_by', $companyUserIds)
                ->count();

            $absentCount = max(0, $totalEmployeesCount - ($presentCount + $halfDayCount + $onLeaveCount));

            $attendanceStats = [
                'total_employees' => $totalEmployeesCount,
                'present' => $presentCount,
                'absent' => $absentCount,
                'on_leave' => $onLeaveCount,
                'late' => $lateCount,
                'half_day' => $halfDayCount,
            ];
        }

        // 4. Team Today Attendance List (Permission-Scoped)
        $todayTeamAttendance = [];
        if ($user->can('manage-attendance-records') || $user->can('manage-any-attendance-records') || $user->can('manage-own-attendance-records')) {
            $attQuery = AttendanceRecord::with(['employee.employee.designation'])
                ->whereDate('date', $today)
                ->where(function ($q) use ($user, $companyUserIds) {
                    if ($user->can('manage-any-attendance-records')) {
                        $q->whereIn('created_by', $companyUserIds);
                    } elseif ($user->can('manage-own-attendance-records')) {
                        $q->where('created_by', $user->id)->orWhere('employee_id', $user->id);
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->orderBy('clock_in', 'asc')
                ->take(10)
                ->get();

            $todayTeamAttendance = $attQuery->map(function ($rec) {
                $rawAv = $rec->employee?->getRawOriginal('avatar');
                $av = check_file($rawAv) ? get_file($rawAv) : get_file('avatars/avatar.png');

                return [
                    'id' => $rec->id,
                    'employee_id' => $rec->employee_id,
                    'employee_name' => $rec->employee?->name,
                    'avatar' => $av,
                    'designation' => $rec->employee?->employee?->designation?->name,
                    'clock_in' => $rec->clock_in,
                    'clock_out' => $rec->clock_out,
                    'status' => formatStatus($rec->status),
                    'is_late' => (bool) $rec->is_late,
                ];
            })->values()->toArray();
        }

        // 5. Recent Announcements (Permission-Scoped)
        $recentAnnouncements = [];
        if ($user->can('manage-announcements') || $user->can('manage-any-announcements') || $user->can('manage-own-announcements')) {
            $annQuery = Announcement::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-announcements')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-announcements')) {
                    $q->where('created_by', $user->id);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
                ->where('start_date', '<=', $today)
                ->where(function ($q) use ($today) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
                })
                ->orderBy('is_high_priority', 'desc')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();

            $recentAnnouncements = $annQuery->map(function ($ann) {
                return [
                    'id' => $ann->id,
                    'title' => $ann->title,
                    'category' => $ann->category,
                    'description' => $ann->description,
                    'content' => $ann->content,
                    'start_date' => formatDate($ann->start_date),
                    'end_date' => formatDate($ann->end_date),
                    'is_high_priority' => (bool) $ann->is_high_priority,
                    'is_featured' => (bool) $ann->is_featured,
                ];
            })->values()->toArray();
        }

        // 6. Upcoming Birthdays (Company Employees - Current Month from Today to End of Month)
        $upcomingBirthdays = [];
        if ($user->can('manage-employees') || $user->can('manage-any-employees') || $user->can('manage-own-employees')) {
            $todayCarbon = Carbon::today($timezone);
            $currentMonth = (int) $todayCarbon->month;
            $currentDay = (int) $todayCarbon->day;
            $endDay = (int) $todayCarbon->copy()->endOfMonth()->day;

            $bdayUsers = User::where('type', 'employee')
                ->whereIn('created_by', $companyUserIds)
                ->where('status', 'active')
                ->whereHas('employee', function ($q) use ($currentMonth, $currentDay, $endDay) {
                    $q->whereNotNull('date_of_birth')
                        ->whereRaw('MONTH(date_of_birth) = ?', [$currentMonth])
                        ->whereRaw('DAY(date_of_birth) >= ?', [$currentDay])
                        ->whereRaw('DAY(date_of_birth) <= ?', [$endDay]);
                })
                ->with(['employee.designation'])
                ->get();

            $sortedBdays = $bdayUsers->sortBy(function ($u) {
                return (int) Carbon::parse($u->employee?->date_of_birth)->day;
            })->values();

            $upcomingBirthdays = $sortedBdays->map(function ($u) {
                $rawAv = $u->getRawOriginal('avatar');
                $av = check_file($rawAv) ? get_file($rawAv) : get_file('avatars/avatar.png');

                $dobCarbon = $u->employee?->date_of_birth ? Carbon::parse($u->employee->date_of_birth) : null;
                $formattedBday = null;
                if ($dobCarbon) {
                    $monthName = $dobCarbon->format('M');
                    $formattedBday = $dobCarbon->format('j') . ' ' . $monthName;
                }

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'avatar' => $av,
                    'designation' => $u->employee?->designation?->name,
                    'birth_date' => $formattedBday,
                    'date_of_birth' => $formattedBday ?? formatDate($u->employee?->date_of_birth),
                    'raw_date_of_birth' => $u->employee?->date_of_birth,
                ];
            })->values()->toArray();
        }

        // 7. Recent Leave Applications (Permission-Scoped)
        $recentLeaves = [];
        if ($user->can('manage-leave-applications') || $user->can('manage-any-leave-applications') || $user->can('manage-own-leave-applications')) {
            $leaveListQuery = LeaveApplication::with(['employee', 'leaveType'])
                ->where(function ($q) use ($user, $companyUserIds) {
                    if ($user->can('manage-any-leave-applications')) {
                        $q->whereIn('created_by', $companyUserIds);
                    } elseif ($user->can('manage-own-leave-applications')) {
                        $q->where('created_by', $user->id)->orWhere('employee_id', $user->id)->orWhere('approved_by', $user->id);
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();

            $recentLeaves = $leaveListQuery->map(function ($leave) {
                $rawAv = $leave->employee?->getRawOriginal('avatar');
                $av = check_file($rawAv) ? get_file($rawAv) : get_file('avatars/avatar.png');

                return [
                    'id' => $leave->id,
                    'employee_name' => $leave->employee?->name,
                    'avatar' => $av,
                    'leave_type' => $leave->leaveType?->name,
                    'leave_type_color' => $leave->leaveType?->color ?? '#3b82f6',
                    'start_date' => formatDate($leave->start_date),
                    'end_date' => formatDate($leave->end_date),
                    'total_days' => $leave->total_days,
                    'status' => $leave->status,
                    'reason' => $leave->reason,
                ];
            })->values()->toArray();
        }

        return [
            'dashboard_type' => 'company',
            'user' => $userData,
            'company_settings' => [
                'timezone' => $timezone,
                'time_format' => $timeFormat,
                'date_format' => $dateFormat,
                'current_time' => $now->format('H:i:s'),
                'current_date' => $today,
            ],
            'metrics' => $metrics,
            'attendance_stats' => $attendanceStats,
            'today_team_attendance' => $todayTeamAttendance,
            'recent_announcements' => $recentAnnouncements,
            'upcoming_birthdays' => $upcomingBirthdays,
            'recent_leaves' => $recentLeaves,
        ];
    }

    /**
     * Build Employee Dashboard Data with strict permission checks and personal scoping.
     */
    private function getEmployeeDashboardData(User $user): array
    {
        $settings = settings();
        $timezone = $settings['defaultTimezone'] ?? config('app.timezone', 'UTC');
        $timeFormat = $settings['timeFormat'] ?? 'H:i';
        $dateFormat = $settings['dateFormat'] ?? 'Y-m-d';
        $today = Carbon::today($timezone)->toDateString();
        $now = Carbon::now($timezone);
        $companyUserIds = getCompanyAndUsersId();

        // 1. Employee Details & Shift
        $employeeDetail = Employee::with(['branch', 'department', 'designation', 'shift'])
            ->where('user_id', $user->id)
            ->first();

        $rawAvatar = $user->getRawOriginal('avatar');
        $avatarUrl = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'type' => $user->type,
            'avatar' => $avatarUrl,
            'employee_id' => $employeeDetail?->employee_id,
            'branch' => $employeeDetail?->branch?->name,
            'department' => $employeeDetail?->department?->name,
            'designation' => $employeeDetail?->designation?->name,
        ];

        $shiftData = null;
        if ($employeeDetail && $employeeDetail->shift) {
            $shiftData = [
                'id' => $employeeDetail->shift->id,
                'name' => $employeeDetail->shift->name,
                'start_time' => $employeeDetail->shift->start_time,
                'end_time' => $employeeDetail->shift->end_time,
            ];
        }

        // 2. Personal Today Attendance
        $todayAttendanceRecord = AttendanceRecord::where('employee_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        $todayAttendanceData = $todayAttendanceRecord ? [
            'id' => $todayAttendanceRecord->id,
            'date' => formatDate($todayAttendanceRecord->date),
            'clock_in' => $todayAttendanceRecord->clock_in,
            'clock_out' => $todayAttendanceRecord->clock_out,
            'status' => formatStatus($todayAttendanceRecord->status),
            'is_late' => (bool) $todayAttendanceRecord->is_late,
            'total_hours' => $todayAttendanceRecord->total_hours,
        ] : null;

        // 2.1 Check if employee is on approved leave today
        $todayLeaveRecord = LeaveApplication::with(['leaveType', 'approver'])
            ->where('employee_id', $user->id)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first();

        $todayLeaveData = null;
        if ($todayLeaveRecord) {
            $todayLeaveData = [
                'id' => $todayLeaveRecord->id,
                'leave_type' => $todayLeaveRecord->leaveType?->name ?? __('Leave'),
                'leave_type_color' => $todayLeaveRecord->leaveType?->color ?? '#3b82f6',
                'is_paid' => (bool) ($todayLeaveRecord->leaveType?->is_paid ?? false),
                'start_date' => $todayLeaveRecord->start_date ? $todayLeaveRecord->start_date->format('Y-m-d') : null,
                'end_date' => $todayLeaveRecord->end_date ? $todayLeaveRecord->end_date->format('Y-m-d') : null,
                'formatted_start_date' => formatDate($todayLeaveRecord->start_date),
                'formatted_end_date' => formatDate($todayLeaveRecord->end_date),
                'total_days' => $todayLeaveRecord->total_days,
                'status' => strtolower($todayLeaveRecord->status),
                'status_label' => ucfirst($todayLeaveRecord->status),
                'reason' => $todayLeaveRecord->reason,
                'manager_comments' => $todayLeaveRecord->manager_comments,
                'approved_by' => $todayLeaveRecord->approver?->name,
            ];
        } elseif ($todayAttendanceRecord && strtolower($todayAttendanceRecord->status) === 'on_leave') {
            $todayLeaveData = [
                'id' => null,
                'leave_type' => __('Approved Leave'),
                'leave_type_color' => '#10B981',
                'is_paid' => true,
                'start_date' => $today,
                'end_date' => $today,
                'formatted_start_date' => formatDate($today),
                'formatted_end_date' => formatDate($today),
                'total_days' => 1,
                'status' => 'approved',
                'status_label' => __('Approved'),
                'reason' => $todayAttendanceRecord->notes ?? __('On Leave'),
                'manager_comments' => null,
                'approved_by' => null,
            ];
        }

        // 3. Personal Metrics / Counts (Permission-Gated)
        $metrics = [];

        // My Awards
        if ($user->can('manage-awards') || $user->can('manage-own-awards') || $user->can('manage-any-awards')) {
            $metrics['my_awards'] = Award::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-awards')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-awards')) {
                    $q->orWhere('employee_id', $user->id);
                } else {
                    $q->where('employee_id', $user->id);
                }
            })->count();
        }

        // My Warnings
        if ($user->can('manage-warnings') || $user->can('manage-own-warnings') || $user->can('manage-any-warnings')) {
            $metrics['my_warnings'] = Warning::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-warnings')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-warnings')) {
                    $q->orWhere('employee_id', $user->id);
                } else {
                    $q->where('employee_id', $user->id);
                }
            })->count();
        }

        // My Complaints
        if ($user->can('manage-complaints') || $user->can('manage-own-complaints') || $user->can('manage-any-complaints')) {
            $metrics['my_complaints'] = Complaint::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-complaints')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-complaints')) {
                    $q->orWhere('against_employee_id', $user->id);
                } else {
                    $q->where('employee_id', $user->id);
                }
            })->count();
        }

        // My Promotions
        if ($user->can('manage-promotions') || $user->can('manage-own-promotions') || $user->can('manage-any-promotions')) {
            $metrics['my_promotions'] = Promotion::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-promotions')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-promotions')) {
                    $q->orWhere('employee_id', $user->id);
                } else {
                    $q->where('employee_id', $user->id);
                }
            })->count();
        }

        // My Pending Leaves
        if ($user->can('manage-leave-applications') || $user->can('manage-own-leave-applications') || $user->can('manage-any-leave-applications')) {
            $metrics['my_pending_leaves'] = LeaveApplication::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-leave-applications')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-leave-applications')) {
                    $q->where('created_by', $user->id)->orWhere('employee_id', $user->id)->orWhere('approved_by', $user->id);
                } else {
                    $q->where('employee_id', $user->id);
                }
            })->where('status', 'pending')->count();
        }

        // 4. Recent Announcements Relevant to Employee
        $recentAnnouncements = [];
        if ($user->can('manage-announcements') || $user->can('manage-own-announcements') || $user->can('manage-any-announcements')) {
            $annQuery = Announcement::where(function ($q) use ($user, $companyUserIds) {
                if ($user->can('manage-any-announcements')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif ($user->can('manage-own-announcements')) {
                    $q->where('created_by', $user->id);
                } else {
                    $q->whereIn('created_by', $companyUserIds);
                }
            })
                ->where('start_date', '<=', $today)
                ->where(function ($q) use ($today) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
                })
                ->orderBy('is_high_priority', 'desc')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();

            $recentAnnouncements = $annQuery->map(function ($ann) {
                return [
                    'id' => $ann->id,
                    'title' => $ann->title,
                    'category' => $ann->category,
                    'description' => $ann->description,
                    'content' => $ann->content,
                    'start_date' => formatDate($ann->start_date),
                    'end_date' => formatDate($ann->end_date),
                    'is_high_priority' => (bool) $ann->is_high_priority,
                    'is_featured' => (bool) $ann->is_featured,
                ];
            })->values()->toArray();
        }

        // 5. My Recent Leave Applications
        $recentLeaves = [];
        if ($user->can('manage-leave-applications') || $user->can('manage-own-leave-applications') || $user->can('manage-any-leave-applications')) {
            $leaveListQuery = LeaveApplication::with(['leaveType'])
                ->where('employee_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();

            $recentLeaves = $leaveListQuery->map(function ($leave) {
                return [
                    'id' => $leave->id,
                    'leave_type' => $leave->leaveType?->name,
                    'leave_type_color' => $leave->leaveType?->color ?? '#3b82f6',
                    'start_date' => formatDate($leave->start_date),
                    'end_date' => formatDate($leave->end_date),
                    'total_days' => $leave->total_days,
                    'status' => formatStatus($leave->status),
                    'reason' => $leave->reason,
                ];
            })->values()->toArray();
        }

        // 6. Upcoming Birthdays (Colleagues - Current Month from Today to End of Month)
        $upcomingBirthdays = [];
        $todayCarbon = Carbon::today($timezone);
        $currentMonth = (int) $todayCarbon->month;
        $currentDay = (int) $todayCarbon->day;
        $endDay = (int) $todayCarbon->copy()->endOfMonth()->day;

        $bdayUsers = User::where('type', 'employee')
            ->whereIn('created_by', $companyUserIds)
            ->where('status', 'active')
            ->whereHas('employee', function ($q) use ($currentMonth, $currentDay, $endDay) {
                $q->whereNotNull('date_of_birth')
                    ->whereRaw('MONTH(date_of_birth) = ?', [$currentMonth])
                    ->whereRaw('DAY(date_of_birth) >= ?', [$currentDay])
                    ->whereRaw('DAY(date_of_birth) <= ?', [$endDay]);
            })
            ->with(['employee.designation'])
            ->get();

        $sortedBdays = $bdayUsers->sortBy(function ($u) {
            return (int) Carbon::parse($u->employee?->date_of_birth)->day;
        })->values();

        $upcomingBirthdays = $sortedBdays->map(function ($u) {
            $rawAv = $u->getRawOriginal('avatar');
            $av = check_file($rawAv) ? get_file($rawAv) : get_file('avatars/avatar.png');

            $dobCarbon = $u->employee?->date_of_birth ? Carbon::parse($u->employee->date_of_birth) : null;
            $formattedBday = null;
            if ($dobCarbon) {
                $monthName = $dobCarbon->format('M');
                $formattedBday = $dobCarbon->format('j') . ' ' . $monthName;
            }

            return [
                'id' => $u->id,
                'name' => $u->name,
                'avatar' => $av,
                'designation' => $u->employee?->designation?->name,
                'birth_date' => $formattedBday,
                'date_of_birth' => $formattedBday ?? formatDate($u->employee?->date_of_birth),
                'raw_date_of_birth' => $u->employee?->date_of_birth,
            ];
        })->values()->toArray();

        return [
            'dashboard_type' => 'employee',
            'user' => $userData,
            'company_settings' => [
                'timezone' => $timezone,
                'time_format' => $timeFormat,
                'date_format' => $dateFormat,
                'current_time' => $now->format('H:i:s'),
                'current_date' => $today,
            ],
            'shift' => $shiftData,
            'today_attendance' => $todayAttendanceData,
            'today_leave' => $todayLeaveData,
            'is_on_leave_today' => $todayLeaveData !== null,
            'metrics' => $metrics,
            'recent_announcements' => $recentAnnouncements,
            'recent_leaves' => $recentLeaves,
            'upcoming_birthdays' => $upcomingBirthdays,
        ];
    }
}
