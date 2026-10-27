// pages/hr/training/sessions/show.tsx
import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { hasPermission } from '@/utils/authorization';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, Trash, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useInitials } from '@/hooks/use-initials';
import { getImagePath } from '@/utils/helpers';

export default function TrainingSessionShow() {
  const { t } = useTranslation();
  const { auth, trainingSession, attendanceData, globalSettings } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  // State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendance, setAttendance] = useState(attendanceData || []);

  const handleBackToList = () => {
    router.get(route('hr.training-sessions.index'));
  };

  const handleEdit = () => {
    setIsFormModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleManageAttendance = () => {
    setIsAttendanceModalOpen(true);
  };

  const handleAttendanceChange = (employeeId: number, isPresent: boolean) => {
    setAttendance(attendance.map((item: any) =>
      item.employee_id === employeeId ? { ...item, is_present: isPresent } : item
    ));
  };

  const handleAttendanceNoteChange = (employeeId: number, notes: string) => {
    setAttendance(attendance.map((item: any) =>
      item.employee_id === employeeId ? { ...item, notes } : item
    ));
  };

  const handleFormSubmit = (formData: any) => {
    // Combine date and time fields
    const submitData = {
      ...formData,
      start_date: formData.start_date && formData.start_time ? `${formData.start_date} ${formData.start_time}` : formData.start_date,
      end_date: formData.end_date && formData.end_time ? `${formData.end_date} ${formData.end_time}` : formData.end_date
    };

    // Remove separate time fields
    delete submitData.start_time;
    delete submitData.end_time;

    if (!globalSettings?.is_demo) toast.loading(t('Updating session...'));

    router.put(route('hr.training-sessions.update', trainingSession.id), submitData, {
      onSuccess: (page) => {
        setIsFormModalOpen(false);
        if (!globalSettings?.is_demo) toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to update session: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleAttendanceSubmit = () => {
    if (!globalSettings?.is_demo) toast.loading(t('Updating attendance...'));

    router.post(route('hr.training-sessions.update-attendance', trainingSession.id), { attendance }, {
      onSuccess: (page) => {
        setIsAttendanceModalOpen(false);
        if (!globalSettings?.is_demo) toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to update attendance: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!globalSettings?.is_demo) toast.loading(t('Deleting session...'));

    router.delete(route('hr.training-sessions.destroy', trainingSession.id), {
      onSuccess: (page) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
        router.get(route('hr.training-sessions.index'));
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to delete session: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  // Define page actions
  const pageActions = [];

  // Add the "Back to List" button
  pageActions.push({
    label: t('Back'),
    icon: <ArrowLeft className="h-4 w-4 rtl:rotate-180" />,
    variant: 'outline' as const,
    onClick: handleBackToList
  });

  // // Add action buttons based on permissions
  // if (hasPermission(permissions, 'edit-training-sessions')) {
  //   pageActions.push({
  //     label: t('Edit'),
  //     icon: <Edit className="h-4 w-4 mr-2" />,
  //     variant: 'default' as const,
  //     onClick: handleEdit
  //   });
  // }

  // if (hasPermission(permissions, 'delete-training-sessions')) {
  //   pageActions.push({
  //     label: t('Delete'),
  //     icon: <Trash className="h-4 w-4 mr-2" />,
  //     variant: 'destructive' as const,
  //     onClick: handleDelete
  //   });
  // }

  // Add Manage Attendance button
  // if (hasPermission(permissions, 'manage-attendance')) {
  //   pageActions.push({
  //     label: t('Manage Attendance'),
  //     icon: <Check className="h-4 w-4 mr-2" />,
  //     variant: 'default' as const,
  //     onClick: handleManageAttendance
  //   });
  // }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Training & Development') },
    { title: t('Training Sessions'), href: route('hr.training-sessions.index') },
    { title: trainingSession.name || trainingSession.training_program?.name || '' }
  ];

  // Status colors for badges
  const statusClasses = {
    'scheduled': 'bg-blue-50 text-blue-700 ring-blue-600/20',
    'in_progress': 'bg-amber-50 text-amber-700 ring-amber-600/20',
    'completed': 'bg-green-50 text-green-700 ring-green-600/20',
    'cancelled': 'bg-red-50 text-red-700 ring-red-600/20'
  };

  return (
    <PageTemplate
      title={trainingSession.name || trainingSession.training_program?.name || ''}
      description={t("View the details, attendees, and materials for this training session.")}
      url={`/hr/training/sessions/${trainingSession.id}`}
      actions={pageActions}
      breadcrumbs={breadcrumbs}
    >
      <style>{`
        main { max-width: 100vw; overflow-x: clip !important; }
        body { overflow-x: clip !important; }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Session Details */}
        <div className="lg:col-span-2 min-w-0">
          <Card className="mb-6">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 break-words">{trainingSession.training_program?.name || ''}</CardTitle>
                </div>
                <div>
                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs sm:text-sm font-medium ring-1 ring-inset whitespace-nowrap ${statusClasses[trainingSession.status] || ''}`}>
                    {trainingSession.status ? trainingSession.status.charAt(0).toUpperCase() + trainingSession.status.slice(1).replace('_', ' ') : ''}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Start Date')}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{trainingSession.start_date ? window.appSettings?.formatDateTimeSimple(trainingSession.start_date, false) || format(new Date(trainingSession.start_date), 'MMMM dd, yyyy') : '-'}</p>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('End Date')}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                    {trainingSession.end_date ? window.appSettings?.formatDateTimeSimple(trainingSession.end_date, false) || format(new Date(trainingSession.end_date), 'MMMM dd, yyyy') : '-'}
                  </p>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Location Type')}</h3>
                  <p className="mt-1">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${trainingSession.location_type === 'virtual' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-green-50 text-green-700 ring-green-600/20'}`}>
                      {trainingSession.location_type === 'virtual' ? t('Virtual') : t('Physical')}
                    </span>
                  </p>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Created By')}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 truncate">{trainingSession?.creator?.name || '-'}</p>
                </div>
                <div className="min-w-0 sm:col-span-2">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">
                    {trainingSession.location_type === 'virtual' ? t('Meeting Link') : t('Location')}
                  </h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words min-w-0">
                    {trainingSession.location_type === 'virtual'
                      ? (trainingSession.meeting_link
                          ? <a href={trainingSession.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{trainingSession.meeting_link}</a>
                          : '-')
                      : (trainingSession.location || '-')
                    }
                  </p>
                </div>
              </div>

              {trainingSession.notes && (
                <div className="mt-4 min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Notes')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">{trainingSession.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card className="min-w-0">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Attendance')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {attendance && attendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="dark:bg-gray-800 dark:border-gray-700">
                        <TableHead className="whitespace-nowrap">{t('Employee')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('Status')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('Notes')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((item: any) => (
                        <TableRow key={item.employee_id} className="dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800">
                          <TableCell className="font-medium whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                  <img
                                  src={item.avatar}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-full object-cover shrink-0"
                                  onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = getImagePath('avatars/avatar.png');
                                  }}
                                  />
                                  <div className="min-w-0">
                                      <div className="font-medium truncate">{item.name}</div>
                                      <div className="text-sm text-muted-foreground truncate">{item.email}</div>
                                  </div>
                              </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.is_present ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 whitespace-nowrap">{t('Present')}</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 whitespace-nowrap">{t('Absent')}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap min-w-[150px]">
                            {item.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                  {t('No attendance data available')}
                </div>
              )}

              {hasPermission(permissions, 'manage-attendance') && (
                <div className="mt-4">
                  <Button
                    variant="default"
                    onClick={handleManageAttendance}
                    className="w-full sm:w-auto"
                  >
                    <Check className="h-4 w-4 shrink-0" />
                    {t('Manage Attendance')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Program and Trainers */}
        <div className="min-w-0">
          {/* Program Details */}
          <Card className="mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Program Details')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-4 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Program Name')}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{trainingSession.training_program?.name || '-'}</p>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Duration')}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{trainingSession.training_program?.duration ? `${trainingSession.training_program.duration} ${t('hours')}` : '-'}</p>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Cost')}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 font-mono">{trainingSession.training_program?.cost ? window.appSettings?.formatCurrency(parseFloat(trainingSession.training_program.cost)) : '-'}</p>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Capacity')}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{trainingSession.training_program?.capacity || '-'}</p>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => router.get(route('hr.training-programs.show', trainingSession.training_program_id))}
                  className="w-full h-auto py-2 whitespace-normal text-center leading-normal"
                >
                  {t('View Program Details')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trainers */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Trainers')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {trainingSession.trainers && trainingSession.trainers.length > 0 ? (
                <div className="space-y-4 min-w-0">
                  {trainingSession.trainers.map((trainer: any) => (
                    <div key={trainer.id} className="flex items-start space-x-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white overflow-hidden shrink-0 mt-0.5">
                        {trainer.avatar ? (
                          <img src={trainer.avatar} alt={trainer.name} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(trainer.name || '')
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 break-words">{trainer.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 break-all">{trainer.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                  {t('No trainers assigned')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            {
              name: 'training_program_id',
              label: t('Training Program'),
              type: 'select',
              required: true,
              options: [
                { value: trainingSession.training_program_id.toString(), label: trainingSession.training_program?.name || '' }
              ],
              disabled: true
            },
            {
              name: 'name',
              label: t('Session Name'),
              type: 'text',
              helpText: t('Leave blank to use program name')
            },
            {
              name: 'start_date',
              label: t('Start Date & Time'),
              type: 'datetime-local',
              required: true
            },
            {
              name: 'end_date',
              label: t('End Date & Time'),
              type: 'datetime-local',
              required: true
            },
            {
              name: 'location_type',
              label: t('Location Type'),
              type: 'select',
              required: true,
              options: [
                { value: 'physical', label: t('Physical') },
                { value: 'virtual', label: t('Virtual') }
              ]
            },
            {
              name: 'location',
              label: t('Location'),
              type: 'text',
              showWhen: (formData) => formData.location_type === 'physical'
            },
            {
              name: 'meeting_link',
              label: t('Meeting Link'),
              type: 'text',
              showWhen: (formData) => formData.location_type === 'virtual'
            },
            {
              name: 'status',
              label: t('Status'),
              type: 'select',
              required: true,
              options: [
                { value: 'scheduled', label: t('Scheduled') },
                { value: 'in_progress', label: t('In Progress') },
                { value: 'completed', label: t('Completed') },
                { value: 'cancelled', label: t('Cancelled') }
              ]
            },
            {
              name: 'notes',
              label: t('Notes'),
              type: 'textarea'
            },
            {
              name: 'trainer_ids',
              label: t('Trainers'),
              type: 'multiselect',
              options: auth.trainers?.map((trainer: any) => ({
                value: trainer.id.toString(),
                label: trainer.name
              })) || []
            }
          ],
          modalSize: 'lg'
        }}
        initialData={{
          ...trainingSession,
          start_date: trainingSession.start_date ? trainingSession.start_date.split(' ')[0] : '',
          start_time: trainingSession.start_date ? trainingSession.start_date.split(' ')[1]?.substring(0, 5) : '',
          end_date: trainingSession.end_date ? trainingSession.end_date.split(' ')[0] : '',
          end_time: trainingSession.end_date ? trainingSession.end_date.split(' ')[1]?.substring(0, 5) : '',
          trainer_ids: trainingSession.trainers?.map((trainer: any) => trainer.id.toString())
        }}
        title={t('Edit Training Session')}
        mode="edit"
      />

      {/* Attendance Modal */}
      <Dialog open={isAttendanceModalOpen} onOpenChange={(open) => { if (!open) setIsAttendanceModalOpen(false); }}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold">{trainingSession.name || trainingSession.training_program?.name || t('Manage Attendance')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 min-w-0">
            {attendance && attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('Employee')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('Present')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('Notes')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((item: any) => (
                      <TableRow key={item.employee_id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          <div className="flex items-center gap-3">
                              <img
                              src={item.avatar}
                              alt={item.name}
                              className="h-10 w-10 rounded-full object-cover shrink-0"
                              onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = getImagePath('avatars/avatar.png');
                              }}
                              />
                              <div className="min-w-0">
                                  <div className="font-medium truncate">{item.name}</div>
                                  <div className="text-sm text-muted-foreground truncate">{item.email}</div>
                              </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`present-${item.employee_id}`}
                              checked={item.is_present}
                              onCheckedChange={(checked) => handleAttendanceChange(item.employee_id, !!checked)}
                            />
                            <label
                              htmlFor={`present-${item.employee_id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {t('Present')}
                            </label>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[160px]">
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleAttendanceNoteChange(item.employee_id, e.target.value)}
                            className="w-full p-2 border rounded-md text-xs sm:text-sm"
                            placeholder={t('Add notes...')}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                {t('No attendance data available')}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col-reverse ">
            <Button variant="outline" onClick={() => setIsAttendanceModalOpen(false)} className="w-full sm:w-auto">
              {t('Cancel')}
            </Button>
            <Button onClick={handleAttendanceSubmit} className="w-full sm:w-auto">
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={trainingSession.name || trainingSession.training_program?.name || ''}
        entityName="training session"
      />
    </PageTemplate>
  );
}
