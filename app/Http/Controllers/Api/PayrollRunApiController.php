<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollRun;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PayrollRunApiController extends Controller
{
    use ApiResponseTrait;

    // ---------------------------------------------------------------
    // GET /api/payroll-runs
    // ---------------------------------------------------------------
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('manage-payroll-runs')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $companyUserIds = getCompanyAndUsersId();

        // Base query with multi-tenant scope
        $query = PayrollRun::where(function ($q) use ($companyUserIds) {
            if (Auth::user()->can('manage-any-payroll-runs')) {
                $q->whereIn('created_by', $companyUserIds);
            } elseif (Auth::user()->can('manage-own-payroll-runs')) {
                $q->where('created_by', Auth::id());
            } else {
                $q->whereRaw('1 = 0');
            }
        });

        // Month & Year filter — default to current month
        $month = $request->filled('month') ? (int) $request->month : (int) Carbon::now()->month;
        $year  = $request->filled('year')  ? (int) $request->year  : (int) Carbon::now()->year;

        $pivotDate    = Carbon::createFromDate($year, $month, 1);
        $startOfMonth = $pivotDate->copy()->startOfMonth()->format('Y-m-d');
        $endOfMonth   = $pivotDate->copy()->endOfMonth()->format('Y-m-d');

        $query->where(function ($q) use ($startOfMonth, $endOfMonth) {
            $q->whereBetween('pay_period_start', [$startOfMonth, $endOfMonth])
                ->orWhereBetween('pay_period_end', [$startOfMonth, $endOfMonth]);
            // ->orWhereBetween('pay_date', [$startOfMonth, $endOfMonth]);
        });

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Status counts before applying status filter
        $statusCounts = [
            'all'        => (clone $query)->count(),
            'draft'      => (clone $query)->where('status', 'draft')->count(),
            'processing' => (clone $query)->where('status', 'processing')->count(),
            'completed'  => (clone $query)->where('status', 'completed')->count(),
            'cancelled'  => (clone $query)->where('status', 'cancelled')->count(),
        ];

        // Status filter
        if ($request->filled('status') && ! in_array(strtolower((string) $request->status), ['all', ''])) {
            $query->where('status', strtolower($request->status));
        }

        // Sorting
        $sortField     = $request->filled('sort_field') && $request->sort_field === 'pay_date' ? 'pay_date' : 'id';
        $sortDirection = $request->filled('sort_direction') && in_array(strtolower($request->sort_direction), ['asc', 'desc'])
            ? strtolower($request->sort_direction)
            : 'desc';

        $perPage = (int) $request->input('per_page', 20);
        $page    = (int) $request->input('page', 1);

        $paginated = $query->orderBy($sortField, $sortDirection)->paginate($perPage, ['*'], 'page', $page);

        $records = $paginated->getCollection()->map(function ($run) {
            return $this->transformRun($run);
        })->values()->toArray();


        return $this->successResponse([
            'records'       => $records,
            'total_records' => $paginated->total(),
            'status_counts' => $statusCounts,
            'pagination'    => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'has_more'     => $paginated->hasMorePages(),
            ],
            'filters'       => [
                'month'          => $month,
                'year'           => $year,
                'status'         => $request->input('status', 'all'),
                'search'         => $request->input('search', ''),
                'sort_field'     => $sortField,
                'sort_direction' => $sortDirection,
                'page'           => $page,
                'per_page'       => $perPage,
            ],
        ], __('Payroll runs retrieved successfully.'));
    }

    // ---------------------------------------------------------------
    // GET /api/payroll-runs/{id}
    // ---------------------------------------------------------------
    public function show($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('view-payroll-runs')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $payrollRun = PayrollRun::with(['payrollEntries.employee'])
            ->where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-payroll-runs')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-payroll-runs')) {
                    $q->where('created_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $payrollRun) {
            return $this->errorResponse(__('Payroll run not found.'), null, 404);
        }

        $entries = $payrollRun->payrollEntries->map(function ($entry) {
            return $this->transformEntry($entry);
        })->values()->toArray();

        $data = $this->transformRun($payrollRun);
        $data['entries'] = $entries;

        return $this->successResponse($data, __('Payroll run retrieved successfully.'));
    }

    // ---------------------------------------------------------------
    // Private: transform a single PayrollRun
    // ---------------------------------------------------------------
    private function transformRun(PayrollRun $run): array
    {
        $startDate = formatDate($run->pay_period_start);
        $endDate   = formatDate($run->pay_period_end);
        $payDate   = formatDate($run->pay_date);

        return [
            'id'                => $run->id,
            'title'             => $run->title,
            'payroll_frequency' => $run->payroll_frequency,
            'pay_period_start'  => $run->pay_period_start ? $run->pay_period_start->format('Y-m-d') : null,
            'pay_period_end'    => $run->pay_period_end ? $run->pay_period_end->format('Y-m-d') : null,
            'pay_date'          => $run->pay_date ? $run->pay_date->format('Y-m-d') : null,
            'formatted_pay_period_start' => $startDate,
            'formatted_pay_period_end'   => $endDate,
            'formatted_pay_date'         => $payDate,
            'formatted_period'           => ($startDate && $endDate) ? "{$startDate} – {$endDate}" : null,
            'formatted_created_at'       => formatDate($run->created_at),
            'employee_count'    => (int) $run->employee_count,
            'total_gross_pay'   => (float) $run->total_gross_pay,
            'total_deductions'  => (float) $run->total_deductions,
            'total_net_pay'     => (float) $run->total_net_pay,
            'status'            => strtolower($run->status),
            'status_label'      => ucfirst($run->status),
            'notes'             => $run->notes,
            'created_at'        => $run->created_at ? $run->created_at->format('Y-m-d H:i:s') : null,
        ];
    }

    // ---------------------------------------------------------------
    // Private: transform a single PayrollEntry
    // ---------------------------------------------------------------
    private function transformEntry($entry): array
    {
        $rawAvatar = $entry->employee?->getRawOriginal('avatar');
        $avatar    = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        return [
            'id'                     => $entry->id,
            'employee_id'            => $entry->employee_id,
            'employee_name'          => $entry->employee?->name ?? 'Employee',
            'avatar'                 => $avatar,
            'basic_salary'           => (float) $entry->basic_salary,
            'component_earnings'     => (float) $entry->component_earnings,
            'total_earnings'         => (float) $entry->total_earnings,
            'total_deductions'       => (float) $entry->total_deductions,
            'gross_pay'              => (float) $entry->gross_pay,
            'net_pay'                => (float) $entry->net_pay,
            'working_days'           => (int) $entry->working_days,
            'present_days'           => (float) $entry->present_days,
            'full_present_days'      => (int) $entry->full_present_days,
            'half_days'              => (float) $entry->half_days,
            'holiday_days'           => (int) $entry->holiday_days,
            'paid_leave_days'        => (float) $entry->paid_leave_days,
            'unpaid_leave_days'      => (float) $entry->unpaid_leave_days,
            'absent_days'            => (int) $entry->absent_days,
            'lop_days'               => (float) $entry->lop_days,
            'lop_deduction'          => (float) $entry->lop_deduction,
            'effective_paid_days'    => (float) $entry->effective_paid_days,
            'overtime_hours'         => (float) $entry->overtime_hours,
            'overtime_amount'        => (float) $entry->overtime_amount,
            'per_day_salary'         => (float) $entry->per_day_salary,
            'unpaid_leave_deduction' => (float) $entry->unpaid_leave_deduction,
            'earnings_breakdown'     => $entry->earnings_breakdown ?? [],
            'deductions_breakdown'   => $entry->deductions_breakdown ?? [],
        ];
    }
}
