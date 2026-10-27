<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\LeaveApplication;
use App\Models\Meeting;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalendarApiController extends Controller
{
    use ApiResponseTrait;
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('view-calendar') && ! $user->can('manage-calendar')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $companyUserIds = getCompanyAndUsersId();

        // Month & Year — default to current
        $month = $request->filled('month') ? (int) $request->month : (int) Carbon::now()->month;
        $year  = $request->filled('year')  ? (int) $request->year  : (int) Carbon::now()->year;

        $monthStart = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $monthEnd   = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $typeFilter = $request->filled('type') && $request->type !== 'all'
            ? strtolower($request->type)
            : null;

        // ---------------------------------------------------------------
        // 1. HOLIDAYS
        // Permission: manage-any-holidays → all company holidays
        //             manage-own-holidays → only own created
        //             neither             → no holidays
        // ---------------------------------------------------------------
        $holidays = [];
        if (! $typeFilter || $typeFilter === 'holiday') {
            if (Auth::user()->can('manage-holidays')) {
                $holidayQuery = Holiday::where(function ($q) use ($companyUserIds) {
                    if (Auth::user()->can('manage-any-holidays')) {
                        $q->whereIn('created_by', $companyUserIds);
                    } elseif (Auth::user()->can('manage-own-holidays')) {
                        $q->where('created_by', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                    ->where(function ($q) use ($monthStart, $monthEnd) {
                        $q->whereBetween('start_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                            ->orWhereBetween('end_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                            ->orWhere(function ($sub) use ($monthStart, $monthEnd) {
                                $sub->where('start_date', '<=', $monthStart->format('Y-m-d'))
                                    ->where('end_date', '>=', $monthEnd->format('Y-m-d'));
                            });
                    });

                foreach ($holidayQuery->get() as $holiday) {
                    $holidays[] = [
                        'id'          => 'holiday_' . $holiday->id,
                        'source_id'   => $holiday->id,
                        'type'        => 'holiday',
                        'title'       => $holiday->name,
                        'date'        => $holiday->start_date ? $holiday->start_date->format('Y-m-d') : null,
                        'end_date'    => $holiday->end_date ? $holiday->end_date->format('Y-m-d') : null,
                        'description' => $holiday->description,
                        'category'    => $holiday->category,
                        'is_paid'     => (bool) $holiday->is_paid,
                        'is_half_day' => (bool) $holiday->is_half_day,
                        'time'        => null,
                        'location'    => null,
                        'organizer'   => null,
                        'recurrence'  => null,
                        'agenda'      => null,
                    ];
                }
            }
        }

        // ---------------------------------------------------------------
        // 2. MEETINGS
        // Permission: manage-any-meetings → all company meetings
        //             manage-own-meetings → only meetings where user is
        //                                   organizer or attendee
        //             neither             → no meetings
        // ---------------------------------------------------------------
        $meetings = [];
        if (! $typeFilter || $typeFilter === 'meeting') {
            if (Auth::user()->can('manage-meetings')) {
                $meetingQuery = Meeting::with(['type', 'room', 'organizer'])
                    ->whereBetween('meeting_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                    ->where(function ($q) use ($companyUserIds) {
                        if (Auth::user()->can('manage-any-meetings')) {
                            $q->whereIn('created_by', $companyUserIds);
                        } elseif (Auth::user()->can('manage-own-meetings')) {
                            $q->where('organizer_id', Auth::id())
                                ->orWhere('created_by', Auth::id())
                                ->orWhereHas('attendees', function ($sub) {
                                    $sub->where('user_id', Auth::id());
                                });
                        } else {
                            $q->whereRaw('1 = 0');
                        }
                    });

                foreach ($meetingQuery->get() as $meeting) {
                    $startTime = $meeting->start_time
                        ? Carbon::parse($meeting->start_time)->format('h:i A')
                        : null;
                    $endTime = $meeting->end_time
                        ? Carbon::parse($meeting->end_time)->format('h:i A')
                        : null;

                    $meetings[] = [
                        'id'                  => 'meeting_' . $meeting->id,
                        'source_id'           => $meeting->id,
                        'type'                => 'meeting',
                        'title'               => $meeting->title,
                        'date'                => $meeting->meeting_date ? $meeting->meeting_date->format('Y-m-d') : null,
                        'end_date'            => null,
                        'description'         => $meeting->description,
                        'category'            => $meeting->type?->name,
                        'time'                => ($startTime && $endTime) ? "$startTime - $endTime" : $startTime,
                        'location'            => $meeting->room?->name,
                        'organizer'           => $meeting->organizer?->name,
                        'recurrence'          => $meeting->recurrence,
                        'agenda'              => $meeting->agenda,
                        'status'              => $meeting->status,
                        'type_id'             => $meeting->type_id,
                        'room_id'             => $meeting->room_id,
                        'organizer_id'        => $meeting->organizer_id,
                        'start_time'          => $meeting->start_time ? Carbon::parse($meeting->start_time)->format('H:i') : null,
                        'end_time'            => $meeting->end_time ? Carbon::parse($meeting->end_time)->format('H:i') : null,
                        'recurrence_end_date' => $meeting->recurrence_end_date ? $meeting->recurrence_end_date->format('Y-m-d') : null,
                    ];
                }
            }
        }

        // ---------------------------------------------------------------
        // 3. LEAVE (approved only)
        // Permission: manage-any-leave-applications → all company leaves
        //             manage-own-leave-applications → only own leaves
        //             neither                       → no leaves
        // ---------------------------------------------------------------
        $leaves = [];
        if (! $typeFilter || $typeFilter === 'leave') {
            if (Auth::user()->can('manage-leave-applications')) {
                $leaveQuery = LeaveApplication::with(['employee', 'leaveType'])
                    ->where('status', 'approved')
                    ->where(function ($q) use ($companyUserIds) {
                        if (Auth::user()->can('manage-any-leave-applications')) {
                            $q->whereIn('created_by', $companyUserIds);
                        } elseif (Auth::user()->can('manage-own-leave-applications')) {
                            $q->where('created_by', Auth::id())
                                ->orWhere('employee_id', Auth::id());
                        } else {
                            $q->whereRaw('1 = 0');
                        }
                    })
                    ->where(function ($q) use ($monthStart, $monthEnd) {
                        $q->whereBetween('start_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                            ->orWhereBetween('end_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                            ->orWhere(function ($sub) use ($monthStart, $monthEnd) {
                                $sub->where('start_date', '<=', $monthStart->format('Y-m-d'))
                                    ->where('end_date', '>=', $monthEnd->format('Y-m-d'));
                            });
                    });

                foreach ($leaveQuery->get() as $leave) {
                    $rawAvatar = $leave->employee?->getRawOriginal('avatar');
                    $avatar    = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

                    $leaves[] = [
                        'id'               => 'leave_' . $leave->id,
                        'source_id'        => $leave->id,
                        'type'             => 'leave',
                        'title'            => ($leave->employee?->name ?? 'Employee') . ' — ' . ($leave->leaveType?->name ?? 'Leave'),
                        'date'             => $leave->start_date ? $leave->start_date->format('Y-m-d') : null,
                        'end_date'         => $leave->end_date ? $leave->end_date->format('Y-m-d') : null,
                        'description'      => $leave->reason,
                        'category'         => $leave->leaveType?->name,
                        'leave_type_color' => $leave->leaveType?->color ?? '#6b7280',
                        'employee_id'      => $leave->employee_id,
                        'employee_name'    => $leave->employee?->name,
                        'avatar'           => $avatar,
                        'total_days'       => $leave->total_days,
                        'time'             => null,
                        'location'         => null,
                        'organizer'        => null,
                        'recurrence'       => null,
                        'agenda'           => null,
                    ];
                }
            }
        }

        // ---------------------------------------------------------------
        // 4. BIRTHDAYS
        // Permission: manage-any-employees → all company employee birthdays
        //             manage-own-employees → only own birthday
        //             neither              → no birthdays
        // ---------------------------------------------------------------
        $birthdays = [];
        if (! $typeFilter || $typeFilter === 'birthday') {
            if (Auth::user()->can('manage-employees')) {
                $birthdayQuery = Employee::whereNotNull('date_of_birth')
                    ->whereRaw('MONTH(date_of_birth) = ?', [$month])
                    ->whereIn('created_by', $companyUserIds)
                    // ->where(function ($q) use ($companyUserIds) {
                    //     if (Auth::user()->can('manage-any-employees')) {
                    //         $q->whereIn('created_by', $companyUserIds);
                    //     } elseif (Auth::user()->can('manage-own-employees')) {
                    //         $q->where('user_id', Auth::id());
                    //     } else {
                    //         $q->whereRaw('1 = 0');
                    //     }
                    // })
                    ->with(['user']);

                foreach ($birthdayQuery->get() as $employee) {
                    if (! $employee->user) {
                        continue;
                    }

                    $rawAvatar = $employee->user->getRawOriginal('avatar');
                    $avatar    = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

                    $birthdayDate = Carbon::create(
                        $year,
                        Carbon::parse($employee->date_of_birth)->month,
                        Carbon::parse($employee->date_of_birth)->day
                    )->format('Y-m-d');

                    $birthdays[] = [
                        'id'            => 'birthday_' . $employee->id,
                        'source_id'     => $employee->id,
                        'type'          => 'birthday',
                        'title'         => ($employee->user->name ?? 'Employee') . "'s Birthday 🎂",
                        'date'          => $birthdayDate,
                        'end_date'      => null,
                        'description'   => null,
                        'category'      => null,
                        'employee_id'   => $employee->user_id,
                        'employee_name' => $employee->user->name,
                        'avatar'        => $avatar,
                        'time'          => null,
                        'location'      => null,
                        'organizer'     => null,
                        'recurrence'    => null,
                        'agenda'        => null,
                    ];
                }
            }
        }

        // Flat merged array for calendar marker builder
        $allEvents = array_merge($holidays, $meetings, $leaves, $birthdays);

        return $this->successResponse([
            'events'  => $allEvents,
            'grouped' => [
                'holidays'  => $holidays,
                'meetings'  => $meetings,
                'leaves'    => $leaves,
                'birthdays' => $birthdays,
            ],
            'counts'  => [
                'all'      => count($allEvents),
                'holiday'  => count($holidays),
                'meeting'  => count($meetings),
                'leave'    => count($leaves),
                'birthday' => count($birthdays),
            ],
            'filters' => [
                'month' => $month,
                'year'  => $year,
                'type'  => $typeFilter ?? 'all',
            ],
        ], __('Calendar events retrieved successfully.'));
    }
}
