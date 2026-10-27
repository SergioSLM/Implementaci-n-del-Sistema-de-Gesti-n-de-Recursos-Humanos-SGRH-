import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Shield, Clock, DollarSign, Lock, FileText } from 'lucide-react';
interface ViewAttendancePolicyProps {
    policy: any;
}
export default function View({ policy }: ViewAttendancePolicyProps) {
    const { t } = useTranslation();
    return (
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg shrink-0">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-semibold break-words">{t('Attendance Policy Details')}</DialogTitle>
                </div>
            </DialogHeader>
            <div className="px-4 sm:px-6 py-4 pb-6 space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Shield className="h-4 w-4 shrink-0" />
                            {t('Policy Name')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white break-words">{policy.name || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Lock className="h-4 w-4 shrink-0" />
                            {t('Status')}
                        </label>
                        <p className="mt-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${policy.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
                                {policy.status === 'active' ? t('Active') : t('Inactive')}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            {t('Late Arrival Grace')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono break-words">{policy.late_arrival_grace} {t('minutes')}</p>
                    </div>
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            {t('Early Departure Grace')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono break-words">{policy.early_departure_grace} {t('minutes')}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 shrink-0" />
                            {t('Overtime Rate Per Hour')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono break-words">
                            {policy.overtime_rate_per_hour ? `${window.appSettings?.formatCurrency(policy.overtime_rate_per_hour)}/hr` : '-'}
                        </p>
                    </div>
                </div>
                {policy.description && (
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            {t('Description')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white leading-relaxed break-words">{policy.description}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
