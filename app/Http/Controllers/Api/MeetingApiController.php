<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Meeting;
use App\Models\MeetingRoom;
use App\Models\MeetingType;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MeetingApiController extends Controller
{
    use ApiResponseTrait;

    // ---------------------------------------------------------------
    // GET /api/meetings/{id}
    // ---------------------------------------------------------------
    public function show($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('view-meetings')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $meeting = Meeting::with(['type', 'room', 'organizer'])
            ->where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-meetings')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-meetings')) {
                    $q->where('created_by', Auth::id())
                        ->orWhere('organizer_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $meeting) {
            return $this->errorResponse(__('Meeting not found.'), null, 404);
        }

        return $this->successResponse(
            $this->transformMeeting($meeting),
            __('Meeting retrieved successfully.')
        );
    }

    // ---------------------------------------------------------------
    // POST /api/meetings
    // ---------------------------------------------------------------
    public function store(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('create-meetings')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $validator = Validator::make($request->all(), [
            'title'               => 'required|string|max:255',
            'description'         => 'nullable|string',
            'type_id'             => 'required|exists:meeting_types,id',
            'room_id'             => 'nullable|exists:meeting_rooms,id',
            'meeting_date'        => 'required|date',
            'start_time'          => 'required|date_format:H:i',
            'end_time'            => 'required|date_format:H:i|after:start_time',
            'agenda'              => 'nullable|string',
            'recurrence'          => 'required|in:None,Daily,Weekly,Monthly',
            'recurrence_end_date' => 'nullable|date|after:meeting_date',
            'organizer_id'        => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $startTime = Carbon::createFromFormat('H:i', $request->start_time);
        $endTime   = Carbon::createFromFormat('H:i', $request->end_time);
        $duration  = $startTime->diffInMinutes($endTime);

        $meetingData = [
            'title'               => $request->title,
            'description'         => $request->description,
            'type_id'             => $request->type_id,
            'room_id'             => $request->room_id,
            'start_time'          => $request->start_time,
            'end_time'            => $request->end_time,
            'duration'            => $duration,
            'agenda'              => $request->agenda,
            'recurrence'          => $request->recurrence,
            'recurrence_end_date' => $request->recurrence_end_date,
            'organizer_id'        => $request->organizer_id,
            'created_by'          => creatorId(),
        ];

        $meetings = $this->createRecurringMeetings(
            $meetingData,
            $request->meeting_date,
            $request->recurrence,
            $request->recurrence_end_date
        );

        // Return the first (primary) meeting with full relations
        $primary = Meeting::with(['type', 'room', 'organizer'])->find($meetings[0]->id);

        return $this->successResponse(
            $this->transformMeeting($primary),
            __('Meeting created successfully.')
        );
    }

    // ---------------------------------------------------------------
    // PUT /api/meetings/{id}
    // ---------------------------------------------------------------
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('edit-meetings')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $meeting = Meeting::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-meetings')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-meetings')) {
                    $q->where('created_by', Auth::id())
                        ->orWhere('organizer_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $meeting) {
            return $this->errorResponse(__('Meeting not found.'), null, 404);
        }

        // Normalise HH:MM:SS → HH:MM (matching web controller behaviour)
        $startTime = $request->start_time;
        $endTime   = $request->end_time;

        if ($startTime && strlen($startTime) === 8) {
            $startTime = substr($startTime, 0, 5);
        }
        if ($endTime && strlen($endTime) === 8) {
            $endTime = substr($endTime, 0, 5);
        }

        $validator = Validator::make(
            array_merge($request->all(), ['start_time' => $startTime, 'end_time' => $endTime]),
            [
                'title'               => 'required|string|max:255',
                'description'         => 'nullable|string',
                'type_id'             => 'required|exists:meeting_types,id',
                'room_id'             => 'nullable|exists:meeting_rooms,id',
                'meeting_date'        => 'required|date',
                'start_time'          => 'required|date_format:H:i',
                'end_time'            => 'required|date_format:H:i',
                'agenda'              => 'nullable|string',
                'recurrence'          => 'required|in:None,Daily,Weekly,Monthly',
                'recurrence_end_date' => 'nullable|date|after_or_equal:meeting_date',
                'organizer_id'        => 'required|exists:users,id',
            ]
        );

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $duration = Carbon::createFromFormat('H:i', $startTime)
            ->diffInMinutes(Carbon::createFromFormat('H:i', $endTime));

        $meeting->update([
            'title'               => $request->title,
            'description'         => $request->description,
            'type_id'             => $request->type_id,
            'room_id'             => $request->room_id,
            'meeting_date'        => $request->meeting_date,
            'start_time'          => $startTime,
            'end_time'            => $endTime,
            'duration'            => $duration,
            'agenda'              => $request->agenda,
            'recurrence'          => $request->recurrence,
            'recurrence_end_date' => $request->recurrence_end_date,
            'organizer_id'        => $request->organizer_id,
        ]);

        $meeting->load(['type', 'room', 'organizer']);

        return $this->successResponse(
            $this->transformMeeting($meeting),
            __('Meeting updated successfully.')
        );
    }

    // ---------------------------------------------------------------
    // DELETE /api/meetings/{id}
    // ---------------------------------------------------------------
    public function destroy($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('delete-meetings')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $meeting = Meeting::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-meetings')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-meetings')) {
                    $q->where('created_by', Auth::id())
                        ->orWhere('organizer_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $meeting) {
            return $this->errorResponse(__('Meeting not found.'), null, 404);
        }

        $meeting->delete();

        return $this->successResponse(null, __('Meeting deleted successfully.'));
    }

    // ---------------------------------------------------------------
    // GET /api/meetings/options
    // Returns meeting types, rooms and employee list for dropdowns
    // ---------------------------------------------------------------
    public function options()
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('manage-meetings')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $companyUserIds = getCompanyAndUsersId();

        $meetingTypes = MeetingType::whereIn('created_by', $companyUserIds)
            ->where('status', 'active')
            ->select('id', 'name')
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn($t) => ['id' => $t->id, 'name' => $t->name])
            ->toArray();

        $meetingRooms = MeetingRoom::whereIn('created_by', $companyUserIds)
            ->where('status', 'active')
            ->select('id', 'name', 'type')
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn($r) => ['id' => $r->id, 'name' => $r->name, 'type' => $r->type])
            ->toArray();

        $employeeQuery = Employee::whereIn('created_by', $companyUserIds);

        if (Auth::user()->can('manage-own-meetings') && ! Auth::user()->can('manage-any-meetings')) {
            $employeeQuery->where(function ($q) {
                $q->where('created_by', Auth::id())->orWhere('user_id', Auth::id());
            });
        }

        $employees = User::whereIn('id', $employeeQuery->pluck('user_id'))
            ->where('type', 'employee')
            ->where('status', 'active')
            ->whereIn('created_by', $companyUserIds)
            ->select('id', 'name')
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn($u) => ['id' => $u->id, 'name' => $u->name])
            ->toArray();

        return $this->successResponse([
            'meeting_types' => $meetingTypes,
            'meeting_rooms' => $meetingRooms,
            'employees'     => $employees,
        ], __('Meeting options retrieved successfully.'));
    }

    // ---------------------------------------------------------------
    // Private: create recurring meetings (mirrors web controller)
    // ---------------------------------------------------------------
    private function createRecurringMeetings(array $meetingData, string $startDate, string $recurrence, ?string $endDate): array
    {
        $currentDate = Carbon::parse($startDate);
        $endDate     = $endDate ? Carbon::parse($endDate) : null;
        $meetings    = [];

        $meetingData['meeting_date'] = $currentDate->format('Y-m-d');
        $meetings[] = Meeting::create($meetingData);

        if ($recurrence !== 'None' && $endDate) {
            while ($currentDate->lt($endDate)) {
                switch ($recurrence) {
                    case 'Daily':
                        $currentDate->addDay();
                        break;
                    case 'Weekly':
                        $currentDate->addWeek();
                        break;
                    case 'Monthly':
                        $currentDate->addMonth();
                        break;
                }

                if ($currentDate->lte($endDate)) {
                    $meetingData['meeting_date'] = $currentDate->format('Y-m-d');
                    $meetings[] = Meeting::create($meetingData);
                }
            }
        }

        return $meetings;
    }

    // ---------------------------------------------------------------
    // Private: transform a single Meeting record
    // ---------------------------------------------------------------
    private function transformMeeting(Meeting $meeting): array
    {
        $rawAvatar = $meeting->organizer?->getRawOriginal('avatar');
        $avatar    = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        $startTime = $meeting->start_time
            ? Carbon::parse($meeting->start_time)->format('h:i A')
            : null;
        $endTime = $meeting->end_time
            ? Carbon::parse($meeting->end_time)->format('h:i A')
            : null;

        return [
            'id'                  => $meeting->id,
            'title'               => $meeting->title,
            'description'         => $meeting->description,
            'type_id'             => $meeting->type_id,
            'type_name'           => $meeting->type?->name,
            'room_id'             => $meeting->room_id,
            'room_name'           => $meeting->room?->name,
            'meeting_date'        => $meeting->meeting_date ? $meeting->meeting_date->format('Y-m-d') : null,
            'formatted_date'      => formatDate($meeting->meeting_date),
            'start_time'          => $meeting->start_time
                ? Carbon::parse($meeting->start_time)->format('H:i')
                : null,
            'end_time'            => $meeting->end_time
                ? Carbon::parse($meeting->end_time)->format('H:i')
                : null,
            'formatted_start_time' => $startTime,
            'formatted_end_time'   => $endTime,
            'time_label'           => ($startTime && $endTime) ? "$startTime - $endTime" : $startTime,
            'duration'            => $meeting->duration,
            'agenda'              => $meeting->agenda,
            'recurrence'          => $meeting->recurrence,
            'recurrence_end_date' => $meeting->recurrence_end_date
                ? $meeting->recurrence_end_date->format('Y-m-d')
                : null,
            'organizer_id'        => $meeting->organizer_id,
            'organizer_name'      => $meeting->organizer?->name,
            'organizer_avatar'    => $avatar,
            'status'              => $meeting->status,
            'created_at'          => $meeting->created_at ? $meeting->created_at->format('Y-m-d H:i:s') : null,
        ];
    }
}
