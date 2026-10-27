<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AnnouncementApiController extends Controller
{
    use ApiResponseTrait;

    // ---------------------------------------------------------------
    // GET /api/announcements
    // Returns paginated announcements with tab counts:
    //   all, high_priority, featured, upcoming
    // Filters: tab, search, category, page, per_page
    // ---------------------------------------------------------------
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('manage-announcements')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $companyUserIds = getCompanyAndUsersId();
        $today          = now()->format('Y-m-d');

        // Base query with multi-tenant scope
        $query = Announcement::where(function ($q) use ($companyUserIds) {
            if (Auth::user()->can('manage-any-announcements')) {
                $q->whereIn('created_by', $companyUserIds);
            } elseif (Auth::user()->can('manage-own-announcements')) {
                $q->where('created_by', Auth::id());
            } else {
                $q->whereRaw('1 = 0');
            }
        });

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // ---------------------------------------------------------------
        // Tab counts — calculated before applying tab filter
        // ---------------------------------------------------------------
        $tabCounts = [
            'all'           => (clone $query)->count(),
            'high_priority' => (clone $query)->where('is_high_priority', true)->count(),
            'featured'      => (clone $query)->where('is_featured', true)->count(),
            'upcoming'      => (clone $query)->where('start_date', '>', $today)->count(),
        ];

        // Tab filter — maps to the 4 tabs in the mobile screen
        $tab = $request->filled('tab') ? strtolower($request->tab) : 'all';

        switch ($tab) {
            case 'high_priority':
                $query->where('is_high_priority', true);
                break;
            case 'featured':
                $query->where('is_featured', true);
                break;
            case 'upcoming':
                $query->where('start_date', '>', $today);
                break;
            case 'all':
            default:
                break;
        }

        // Sort: high priority first, then featured, then newest
        $query->orderBy('created_at', 'desc');

        $perPage = (int) $request->input('per_page', 20);
        $page    = (int) $request->input('page', 1);

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        $records = $paginated->getCollection()->map(function ($ann) use ($user) {
            return $this->transformAnnouncement($ann, $user->name);
        })->values()->toArray();

        return $this->successResponse([
            'records'    => $records,
            'tab_counts' => $tabCounts,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'has_more'     => $paginated->hasMorePages(),
            ],
            'filters'    => [
                'tab'      => $tab,
                'search'   => $request->input('search', ''),
                'category' => $request->input('category', ''),
                'page'     => $page,
                'per_page' => $perPage,
            ],
        ], __('Announcements retrieved successfully.'));
    }

    // ---------------------------------------------------------------
    // GET /api/announcements/{id}
    // Returns full announcement detail and marks it as read
    // ---------------------------------------------------------------
    public function show($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('manage-announcements')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $announcement = Announcement::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-announcements')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-announcements')) {
                    $q->where('created_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $announcement) {
            return $this->errorResponse(__('Announcement not found.'), null, 404);
        }

        return $this->successResponse(
            $this->transformAnnouncement($announcement, $user->name),
            __('Announcement retrieved successfully.')
        );
    }

    // ---------------------------------------------------------------
    // POST /api/announcements
    // ---------------------------------------------------------------
    public function store(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('create-announcements')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $validator = Validator::make($request->all(), [
            'title'           => 'required|string|max:255',
            'category'        => 'required|string|max:255',
            'description'     => 'nullable|string',
            'content'         => 'required|string',
            'start_date'      => 'required|date',
            'end_date'        => 'nullable|date|after_or_equal:start_date',
            'is_featured'     => 'nullable|boolean',
            'is_high_priority' => 'nullable|boolean',
            'is_company_wide' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $announcement = Announcement::create([
            'title'           => $request->title,
            'category'        => $request->category,
            'description'     => $request->description,
            'content'         => $request->content,
            'start_date'      => $request->start_date,
            'end_date'        => $request->end_date,
            'is_featured'     => filter_var($request->is_featured ?? false, FILTER_VALIDATE_BOOLEAN),
            'is_high_priority' => filter_var($request->is_high_priority ?? false, FILTER_VALIDATE_BOOLEAN),
            'is_company_wide' => filter_var($request->is_company_wide ?? true, FILTER_VALIDATE_BOOLEAN),
            'created_by'      => creatorId(),
        ]);

        return $this->successResponse(
            $this->transformAnnouncement($announcement, $user->name),
            __('Announcement created successfully.')
        );
    }

    // ---------------------------------------------------------------
    // PUT /api/announcements/{id}
    // ---------------------------------------------------------------
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('edit-announcements')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $announcement = Announcement::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-announcements')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-announcements')) {
                    $q->where('created_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $announcement) {
            return $this->errorResponse(__('Announcement not found.'), null, 404);
        }

        $validator = Validator::make($request->all(), [
            'title'           => 'required|string|max:255',
            'category'        => 'required|string|max:255',
            'description'     => 'nullable|string',
            'content'         => 'required|string',
            'start_date'      => 'required|date',
            'end_date'        => 'nullable|date|after_or_equal:start_date',
            'is_featured'     => 'nullable|boolean',
            'is_high_priority' => 'nullable|boolean',
            'is_company_wide' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $announcement->update([
            'title'           => $request->title,
            'category'        => $request->category,
            'description'     => $request->description,
            'content'         => $request->content,
            'start_date'      => $request->start_date,
            'end_date'        => $request->end_date,
            'is_featured'     => filter_var($request->is_featured ?? $announcement->is_featured, FILTER_VALIDATE_BOOLEAN),
            'is_high_priority' => filter_var($request->is_high_priority ?? $announcement->is_high_priority, FILTER_VALIDATE_BOOLEAN),
            'is_company_wide' => filter_var($request->is_company_wide ?? $announcement->is_company_wide, FILTER_VALIDATE_BOOLEAN),
        ]);

        return $this->successResponse(
            $this->transformAnnouncement($announcement->fresh(), $user->name),
            __('Announcement updated successfully.')
        );
    }

    // ---------------------------------------------------------------
    // DELETE /api/announcements/{id}
    // ---------------------------------------------------------------
    public function destroy($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('delete-announcements')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $announcement = Announcement::where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-announcements')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-announcements')) {
                    $q->where('created_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $announcement) {
            return $this->errorResponse(__('Announcement not found.'), null, 404);
        }

        // Detach all relations before deleting (mirrors web controller)
        $announcement->departments()->detach();
        $announcement->branches()->detach();
        $announcement->delete();

        return $this->successResponse(null, __('Announcement deleted successfully.'));
    }


    // ---------------------------------------------------------------
    // Private: transform a single Announcement record
    // ---------------------------------------------------------------
    private function transformAnnouncement(Announcement $ann, string $currentUserName): array
    {
        return [
            'id'               => $ann->id,
            'title'            => $ann->title,
            'category'         => $ann->category,
            'description'      => $ann->description,
            'content'          => $ann->content,
            'author'           => $currentUserName,
            'start_date'       => $ann->start_date ? $ann->start_date->format('Y-m-d') : null,
            'end_date'         => $ann->end_date ? $ann->end_date->format('Y-m-d') : null,
            'formatted_start_date' => formatDate($ann->start_date),
            'formatted_end_date'   => formatDate($ann->end_date),
            'is_featured'      => (bool) $ann->is_featured,
            'is_high_priority' => (bool) $ann->is_high_priority,
            'is_company_wide'  => (bool) $ann->is_company_wide,
            'is_active'        => $ann->isActive(),
            'is_upcoming'      => $ann->start_date && $ann->start_date->isFuture(),
            'attachments'      => $ann->attachments,
            'created_at'       => $ann->created_at ? $ann->created_at->format('Y-m-d H:i:s') : null,
            'formatted_created_at' => formatDate($ann->created_at),
        ];
    }
}
