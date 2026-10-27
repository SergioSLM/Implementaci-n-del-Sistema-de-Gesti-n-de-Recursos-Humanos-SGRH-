import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Clock, Moon, Sun, Lock, FileText, Timer } from 'lucide-react';
interface ViewShiftProps {
    shift: any;
}
export default function View({ shift }: ViewShiftProps) {
    const { t } = useTranslation();
    const calculateWorkingHours = () => {
        if (!shift.start_time || !shift.end_time) return null;
        const start = new Date(`2000-01-01 ${shift.start_time}`);
        let end = new Date(`2000-01-01 ${shift.end_time}`);
        if (end <= start) end.setDate(end.getDate() + 1);
        const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        return Math.max(0, (totalMinutes - (shift.break_duration || 0)) / 60).toFixed(1);
    };
    const workingHours = calculateWorkingHours();
    return (
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${shift.is_night_shift ? 'bg-slate-100' : 'bg-yellow-50'}`}>
                        {shift.is_night_shift ? (
                            <Moon className="h-5 w-5 text-slate-600" />
                        ) : (
                            <Sun className="h-5 w-5 text-yellow-600" />
                        )}
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-semibold break-words">{t('Shift Details')}</DialogTitle>
                </div>
            </DialogHeader>
            <div className="px-4 sm:px-6 py-4 pb-6 space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            {t('Shift Name')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white break-words">{shift.name || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            {t('Type')}
                        </label>
                        <p className="mt-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${shift.is_night_shift ? 'bg-slate-100 text-slate-700 ring-slate-600/20' : 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'}`}>
                                {shift.is_night_shift ? t('Night Shift') : t('Day Shift')}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            {t('Start Time')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono break-words">
                            {shift.start_time ? (window.appSettings?.formatTime(shift.start_time) || shift.start_time) : '-'}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            {t('End Time')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono break-words">
                            {shift.end_time ? (window.appSettings?.formatTime(shift.end_time) || shift.end_time) : '-'}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Timer className="h-4 w-4 shrink-0" />
                            {t('Break Duration')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono break-words">{shift.break_duration} {t('minutes')}</p>
                    </div>
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Timer className="h-4 w-4 shrink-0" />
                            {t('Grace Period')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400 font-mono break-words">{shift.grace_period} {t('minutes')}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            {t('Working Hours')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400 font-mono break-words">{workingHours ? `${workingHours}h` : '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Lock className="h-4 w-4 shrink-0" />
                            {t('Status')}
                        </label>
                        <p className="mt-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${shift.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
                                {shift.status === 'active' ? t('Active') : t('Inactive')}
                            </span>
                        </p>
                    </div>
                </div>
                {(shift.break_start_time || shift.break_end_time) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Clock className="h-4 w-4 shrink-0" />
                                {t('Break Start Time')}
                            </label>
                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono break-words">
                                {shift.break_start_time ? (window.appSettings?.formatTime(shift.break_start_time) || shift.break_start_time) : '-'}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Clock className="h-4 w-4 shrink-0" />
                                {t('Break End Time')}
                            </label>
                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono break-words">
                                {shift.break_end_time ? (window.appSettings?.formatTime(shift.break_end_time) || shift.break_end_time) : '-'}
                            </p>
                        </div>
                    </div>
                )}
                {shift.description && (
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            {t('Description')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white leading-relaxed break-words">{shift.description}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
