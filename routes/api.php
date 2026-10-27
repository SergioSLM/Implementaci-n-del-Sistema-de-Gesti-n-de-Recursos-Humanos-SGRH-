<?php

use App\Http\Controllers\Api\AnnouncementApiController;
use App\Http\Controllers\Api\AttendanceApiController;
use App\Http\Controllers\Api\AttendanceRegularizationApiController;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\Api\CalendarApiController;
use App\Http\Controllers\Api\HolidayApiController;
use App\Http\Controllers\Api\LeaveApplicationApiController;
use App\Http\Controllers\Api\MeetingApiController;
use App\Http\Controllers\Api\ProfileApiController;
use App\Http\Controllers\Api\PayrollRunApiController;
use App\Http\Controllers\Api\PayslipApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mobile API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('api.json')->group(function () {
    // Public Authentication Routes
    Route::post('/login', [AuthApiController::class, 'login']);
    Route::post('/forgot-password', [AuthApiController::class, 'forgotPassword']);

    // Protected API Routes (Requires Sanctum Bearer Token & Company Setting Middleware)
    Route::middleware(['auth:sanctum', 'setting'])->group(function () {
        Route::get('/user', [AuthApiController::class, 'user']);
        Route::post('/logout', [AuthApiController::class, 'logout']);
        Route::get('/dashboard', [DashboardApiController::class, 'index']);
        Route::get('/settings', [DashboardApiController::class, 'settings']);

        // Attendance Module API Routes
        Route::get('/attendance', [AttendanceApiController::class, 'index']);
        Route::post('/attendance', [AttendanceApiController::class, 'store']);
        Route::get('/attendance/today', [AttendanceApiController::class, 'todayAttendance']);
        Route::post('/attendance/clock-in', [AttendanceApiController::class, 'clockIn']);
        Route::post('/attendance/clock-out', [AttendanceApiController::class, 'clockOut']);
        Route::get('/attendance/{id}', [AttendanceApiController::class, 'show']);
        Route::post('/attendance/{id}', [AttendanceApiController::class, 'update']);
        Route::put('/attendance/{id}', [AttendanceApiController::class, 'update']);
        Route::delete('/attendance/{id}', [AttendanceApiController::class, 'destroy']);

        // Attendance Regularization Module API Routes
        Route::get('/attendance-regularizations', [AttendanceRegularizationApiController::class, 'index']);
        Route::get('/attendance-regularizations/employee-records/{employee_id}', [AttendanceRegularizationApiController::class, 'getEmployeeAttendance']);
        Route::post('/attendance-regularizations', [AttendanceRegularizationApiController::class, 'store']);
        Route::get('/attendance-regularizations/{id}', [AttendanceRegularizationApiController::class, 'show']);
        Route::post('/attendance-regularizations/{id}', [AttendanceRegularizationApiController::class, 'update']);
        Route::put('/attendance-regularizations/{id}', [AttendanceRegularizationApiController::class, 'update']);
        Route::delete('/attendance-regularizations/{id}', [AttendanceRegularizationApiController::class, 'destroy']);
        Route::post('/attendance-regularizations/{id}/status', [AttendanceRegularizationApiController::class, 'updateStatus']);
        Route::put('/attendance-regularizations/{id}/status', [AttendanceRegularizationApiController::class, 'updateStatus']);

        // Leave Application Module API Routes
        Route::get('/leave-applications', [LeaveApplicationApiController::class, 'index']);
        Route::get('/leave-applications/employee-balances/{employee_id}', [LeaveApplicationApiController::class, 'getEmployeeBalances']);
        Route::post('/leave-applications', [LeaveApplicationApiController::class, 'store']);
        Route::get('/leave-applications/{id}', [LeaveApplicationApiController::class, 'show']);
        Route::post('/leave-applications/{id}', [LeaveApplicationApiController::class, 'update']);
        Route::put('/leave-applications/{id}', [LeaveApplicationApiController::class, 'update']);
        Route::delete('/leave-applications/{id}', [LeaveApplicationApiController::class, 'destroy']);
        Route::post('/leave-applications/{id}/status', [LeaveApplicationApiController::class, 'updateStatus']);
        Route::put('/leave-applications/{id}/status', [LeaveApplicationApiController::class, 'updateStatus']);

        // Payroll Run Module API Routes
        Route::get('/payroll-runs', [PayrollRunApiController::class, 'index']);
        Route::get('/payroll-runs/{id}', [PayrollRunApiController::class, 'show']);

        // Payslip Module API Routes
        Route::get('/payslips', [PayslipApiController::class, 'index']);
        Route::get('/payslips/{id}', [PayslipApiController::class, 'show']);

        // Calendar Module API Routes
        Route::get('/calendar', [CalendarApiController::class, 'index']);

        // Holiday API Routes
        Route::get('/holidays/{id}', [HolidayApiController::class, 'show']);
        Route::post('/holidays', [HolidayApiController::class, 'store']);
        Route::post('/holidays/{id}', [HolidayApiController::class, 'update']);
        Route::put('/holidays/{id}', [HolidayApiController::class, 'update']);
        Route::delete('/holidays/{id}', [HolidayApiController::class, 'destroy']);

        // Meeting API Routes
        Route::get('/meetings/options', [MeetingApiController::class, 'options']);
        Route::get('/meetings/{id}', [MeetingApiController::class, 'show']);
        Route::post('/meetings', [MeetingApiController::class, 'store']);
        Route::post('/meetings/{id}', [MeetingApiController::class, 'update']);
        Route::put('/meetings/{id}', [MeetingApiController::class, 'update']);
        Route::delete('/meetings/{id}', [MeetingApiController::class, 'destroy']);

        // Profile API Routes
        Route::get('/profile', [ProfileApiController::class, 'show']);
        Route::post('/profile', [ProfileApiController::class, 'update']);
        Route::put('/profile', [ProfileApiController::class, 'update']);
        Route::post('/profile/password', [ProfileApiController::class, 'updatePassword']);
        Route::put('/profile/password', [ProfileApiController::class, 'updatePassword']);

        // Announcement API Routes
        Route::get('/announcements', [AnnouncementApiController::class, 'index']);
        Route::post('/announcements', [AnnouncementApiController::class, 'store']);
        Route::get('/announcements/{id}', [AnnouncementApiController::class, 'show']);
        Route::post('/announcements/{id}', [AnnouncementApiController::class, 'update']);
        Route::put('/announcements/{id}', [AnnouncementApiController::class, 'update']);
        Route::delete('/announcements/{id}', [AnnouncementApiController::class, 'destroy']);
    });
});
