<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payslip;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PayslipApiController extends Controller
{
    use ApiResponseTrait;

    // ---------------------------------------------------------------
    // GET /api/payslips
    // ---------------------------------------------------------------
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('manage-payslips')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $companyUserIds = getCompanyAndUsersId();

        $query = Payslip::with(['employee.employee', 'payrollEntry.payrollRun'])
            ->where(function ($q) use ($companyUserIds) {
                if (Auth::user()->can('manage-any-payslips')) {
                    $q->whereIn('created_by', $companyUserIds);
                } elseif (Auth::user()->can('manage-own-payslips')) {
                    $q->where('employee_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            });

        // Month & Year filter — default to current month
        $month = $request->filled('month') ? (int) $request->month : (int) Carbon::now()->month;
        $year  = $request->filled('year')  ? (int) $request->year  : (int) Carbon::now()->year;

        $monthStart = Carbon::createFromDate($year, $month, 1)->startOfMonth()->format('Y-m-d');
        $monthEnd   = Carbon::createFromDate($year, $month, 1)->endOfMonth()->format('Y-m-d');

        $query->where('pay_period_start', '>=', $monthStart)
            ->where('pay_period_end', '<=', $monthEnd);

        // Employee filter (HR/Company only)
        if ($request->filled('employee_id') && ! in_array(strtolower((string) $request->employee_id), ['all', ''])) {
            $query->where('employee_id', $request->employee_id);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('payslip_number', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($subQ) use ($search) {
                        $subQ->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Status counts before applying status filter
        $statusCounts = [
            'all'        => (clone $query)->count(),
            'generated'  => (clone $query)->where('status', 'generated')->count(),
            'downloaded' => (clone $query)->where('status', 'downloaded')->count(),
        ];

        // Status filter
        if ($request->filled('status') && ! in_array(strtolower((string) $request->status), ['all', ''])) {
            $query->where('status', strtolower($request->status));
        }

        // Sorting
        $sortField = $request->filled('sort_field') && in_array($request->sort_field, ['pay_date', 'created_at'])
            ? $request->sort_field
            : 'pay_date';

        $sortDirection = $request->filled('sort_direction') && in_array(strtolower($request->sort_direction), ['asc', 'desc'])
            ? strtolower($request->sort_direction)
            : 'desc';

        $perPage = (int) $request->input('per_page', 20);
        $page    = (int) $request->input('page', 1);

        $paginated = $query->orderBy($sortField, $sortDirection)->paginate($perPage, ['*'], 'page', $page);

        $records = $paginated->getCollection()->map(function ($payslip) {
            return $this->transformPayslip($payslip);
        })->values()->toArray();

        // Employee options dropdown (HR/Company only)
        $employeeOptions = [];
        if (Auth::user()->can('manage-any-payslips') || in_array(strtolower($user->type), ['company', 'hr'])) {
            $employeeOptions = User::where('type', 'employee')
                ->whereIn('created_by', $companyUserIds)
                ->where('status', 'active')
                ->select('id', 'name')
                ->orderBy('name', 'asc')
                ->get()
                ->map(function ($emp) {
                    return ['id' => $emp->id, 'name' => $emp->name];
                })->toArray();
        }

        return $this->successResponse([
            'records'          => $records,
            'total_records'    => $paginated->total(),
            'status_counts'    => $statusCounts,
            'pagination'       => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'has_more'     => $paginated->hasMorePages(),
            ],
            'filters'          => [
                'month'          => $month,
                'year'           => $year,
                'status'         => $request->input('status', 'all'),
                'employee_id'    => $request->input('employee_id', 'all'),
                'search'         => $request->input('search', ''),
                'sort_field'     => $sortField,
                'sort_direction' => $sortDirection,
                'page'           => $page,
                'per_page'       => $perPage,
            ],
            'employee_options' => $employeeOptions,
        ], __('Payslips retrieved successfully.'));
    }

    // ---------------------------------------------------------------
    // GET /api/payslips/{id}
    // Returns full payslip detail including all breakdown sections
    // needed by the mobile PayslipsScreen detail dialog
    // ---------------------------------------------------------------
    public function show($id)
    {
        $user = Auth::user();

        if (! $user) {
            return $this->errorResponse(__('Unauthenticated.'), null, 401);
        }

        if (! $user->can('manage-payslips')) {
            return $this->errorResponse(__('Permission Denied.'), null, 403);
        }

        $payslip = Payslip::with(['employee.employee', 'payrollEntry.payrollRun'])
            ->where('id', $id)
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-payslips')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-payslips')) {
                    $q->where('employee_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->first();

        if (! $payslip) {
            return $this->errorResponse(__('Payslip not found.'), null, 404);
        }

        return $this->successResponse(
            $this->transformPayslipDetail($payslip),
            __('Payslip retrieved successfully.')
        );
    }

    // ---------------------------------------------------------------
    // Private: list-level transform (for index)
    // ---------------------------------------------------------------
    private function transformPayslip(Payslip $payslip): array
    {
        $entry      = $payslip->payrollEntry;
        $payrollRun = $entry?->payrollRun;

        $rawAvatar = $payslip->employee?->getRawOriginal('avatar');
        $avatar    = check_file($rawAvatar) ? get_file($rawAvatar) : get_file('avatars/avatar.png');

        $empCode   = $payslip->employee?->employee?->employee_id ?? null;

        $startDate = formatDate($payslip->pay_period_start);
        $endDate   = formatDate($payslip->pay_period_end);
        $payDate   = formatDate($payslip->pay_date);

        return [
            'id'                   => $payslip->id,
            'payslip_number'       => $payslip->payslip_number,
            'employee_id'          => $payslip->employee_id,
            'employee_code'        => $empCode,
            'emp_id'               => $empCode,
            'employee_name'        => $payslip->employee?->name ?? 'Employee',
            'avatar'               => $avatar,
            'pay_period_start'     => $payslip->pay_period_start ? $payslip->pay_period_start->format('Y-m-d') : null,
            'pay_period_end'       => $payslip->pay_period_end ? $payslip->pay_period_end->format('Y-m-d') : null,
            'pay_date'             => $payslip->pay_date ? $payslip->pay_date->format('Y-m-d') : null,
            'formatted_pay_period_start' => $startDate,
            'formatted_pay_period_end'   => $endDate,
            'formatted_pay_date'         => $payDate,
            'formatted_period'     => ($startDate && $endDate) ? "{$startDate} – {$endDate}" : null,
            // Month label for the card title e.g. "August 2026 Payslip"
            'month_label'          => $payslip->pay_period_start
                ? $payslip->pay_period_start->format('F Y')
                : null,
            'payroll_frequency'    => $payrollRun?->payroll_frequency ?? 'monthly',
            // Summary figures from payroll entry
            'gross_pay'            => $entry ? (float) $entry->gross_pay : 0.0,
            'total_deductions'     => $entry ? (float) $entry->total_deductions : 0.0,
            'net_pay'              => $entry ? (float) $entry->net_pay : 0.0,
            'status'               => strtolower($payslip->status),
            'status_label'         => ucfirst($payslip->status),
            'downloaded_at'        => $payslip->downloaded_at ? $payslip->downloaded_at->format('Y-m-d H:i:s') : null,
            'formatted_downloaded_at' => formatDate($payslip->downloaded_at, true),
            'created_at'           => $payslip->created_at ? $payslip->created_at->format('Y-m-d H:i:s') : null,
            'formatted_created_at' => formatDate($payslip->created_at),
        ];
    }

    // ---------------------------------------------------------------
    // Private: detail-level transform (for show)
    // Includes all sections shown in the mobile detail dialog:
    //   1. Attendance summary
    //   2. Gross pay calculation
    //   3. Itemized earnings/allowances
    //   4. Itemized deductions
    //   5. Net pay summary
    // ---------------------------------------------------------------
    private function transformPayslipDetail(Payslip $payslip): array
    {
        $base  = $this->transformPayslip($payslip);
        $entry = $payslip->payrollEntry;

        if (! $entry) {
            $base['attendance']         = null;
            $base['gross_calculation']  = null;
            $base['earnings_breakdown'] = [];
            $base['deductions_breakdown'] = [];
            $base['net_summary']        = null;
            return $base;
        }

        // 1. Attendance summary
        $base['attendance'] = [
            'working_days'        => (int)   $entry->working_days,
            'present_days'        => (float) $entry->present_days,
            'full_present_days'   => (int)   $entry->full_present_days,
            'absent_days'         => (int)   $entry->absent_days,
            'half_days'           => (float) $entry->half_days,
            'holiday_days'        => (int)   $entry->holiday_days,
            'paid_leave_days'     => (float) $entry->paid_leave_days,
            'unpaid_leave_days'   => (float) $entry->unpaid_leave_days,
            'lop_days'            => (float) $entry->lop_days,
            'effective_paid_days' => (float) $entry->effective_paid_days,
            'overtime_hours'      => (float) $entry->overtime_hours,
        ];

        // 2. Gross pay calculation
        $base['gross_calculation'] = [
            'basic_salary'           => (float) $entry->basic_salary,
            'component_earnings'     => (float) $entry->component_earnings,
            'total_earnings'         => (float) $entry->total_earnings,
            'lop_deduction'          => (float) $entry->lop_deduction,
            'unpaid_leave_deduction' => (float) $entry->unpaid_leave_deduction,
            'overtime_amount'        => (float) $entry->overtime_amount,
            'gross_pay'              => (float) $entry->gross_pay,
        ];

        // 3. Itemized earnings breakdown (from payroll entry JSON column)
        $base['earnings_breakdown'] = $entry->earnings_breakdown ?? [];

        // 4. Itemized deductions breakdown (from payroll entry JSON column)
        $base['deductions_breakdown'] = $entry->deductions_breakdown ?? [];

        // 5. Net pay summary
        $base['net_summary'] = [
            'basic_salary'     => (float) $entry->basic_salary,
            'total_earnings'   => (float) $entry->total_earnings,
            'gross_pay'        => (float) $entry->gross_pay,
            'total_deductions' => (float) $entry->total_deductions,
            'net_pay'          => (float) $entry->net_pay,
        ];

        return $base;
    }
}
