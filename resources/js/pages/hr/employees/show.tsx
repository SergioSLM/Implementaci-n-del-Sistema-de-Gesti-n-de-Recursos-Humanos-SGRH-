// pages/hr/employees/show.tsx
import { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hasPermission } from '@/utils/authorization';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Download, FileText, Calendar, Phone, Mail, MapPin, Building, Briefcase, CreditCard, User, Lock, Unlock, ArrowLeft, Check, X, ChevronDown, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function EmployeeShow() {
  const { t } = useTranslation();
  const { auth, employee, flash, globalSettings } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  // State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic_info');

  useEffect(() => {
    if (flash?.success) {
      toast.success(t(flash.success));
    }
    if (flash?.error) {
      toast.error(t(flash.error));
    }
  }, [flash, t]);

  const handleEdit = () => {
    router.get(route('hr.employees.edit', employee.id));
  };

  const handleDeleteConfirm = () => {
    if (!globalSettings?.is_demo) toast.loading(t('Deleting employee...'));

    router.delete(route('hr.employees.destroy', employee.id), {
      onSuccess: (page) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        router.get(route('hr.employees.index'));
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to delete employee: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleToggleStatus = () => {
    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    if (!globalSettings?.is_demo) toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} employee...`);

    router.put(route('hr.employees.toggle-status', employee.id), {}, {
      onSuccess: (page) => {
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
          toast.error(t('Failed to update employee status: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleDeleteDocument = (documentId: number) => {
    if (!globalSettings?.is_demo) toast.loading(t('Deleting document...'));

    router.delete(route('hr.employees.documents.destroy', [employee.id, documentId]), {
      onSuccess: (page) => {
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
          toast.error(t('Failed to delete document: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleDocumentVerification = (documentId: number, status: 'verified' | 'rejected') => {
    const action = status === 'verified' ? 'approve' : 'reject';
    if (!globalSettings?.is_demo) toast.loading(t(`${status === 'verified' ? 'Approving' : 'Rejecting'} document...`));

    router.put(route(`hr.employees.documents.${action}`, [employee.id, documentId]), {}, {
      onSuccess: (page) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else {
          toast.success(t(`Document ${status === 'verified' ? 'approved' : 'rejected'} successfully`));
        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        const errorMessage = errors?.message || Object.values(errors)[0] || `Failed to ${action} document`;
        toast.error(t(errorMessage));
      }
    });
  };

  // Document download handlers
  const handleDocumentDownload = (documentType: string, format: string) => {
    if (documentType === 'joining_letter') {
      const url = route('hr.employees.download-joining-letter', [employee.id, format]);
      window.open(url, '_blank');
    } else if (documentType === 'experience_certificate') {
      const url = route('hr.employees.download-experience-certificate', [employee.id, format]);
      window.open(url, '_blank');
    } else if (documentType === 'noc') {
      const url = route('hr.employees.download-noc-certificate', [employee.id, format]);
      window.open(url, '_blank');
    }
  };

  // Define page actions
  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4 rtl:rotate-180" />,
      variant: 'outline',
      onClick: () => router.get(route('hr.employees.index'))
    }
  ];

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Employees'), href: route('hr.employees.index') },
    { title: employee?.name || t('Employee Details') }
  ];

  return (
    <PageTemplate
      title={employee?.name || t("Employee Details")}
      description={t("View detailed information and activity for employee.")}
      url={`/hr/employees/${employee?.id}`}
      actions={pageActions}
      breadcrumbs={breadcrumbs}
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Employee Profile Card */}
        <Card className="xl:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-primary text-white flex items-center justify-center text-2xl sm:text-3xl font-bold mb-4 overflow-hidden shrink-0">
                {employee.avatar ? (
                  <img src={employee.avatar} alt={employee.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(employee.name)
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-1 text-center text-gray-900 dark:text-gray-100 break-words w-full">{employee.name}</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 text-center break-words w-full">{employee.employee?.designation?.name || '-'}</p>
              <div className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mb-4 ${employee.employee?.employee_status === 'active'
                ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                : employee.employee?.employee_status === 'inactive'
                  ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                  : employee.employee?.employee_status === 'probation'
                    ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                    : employee.employee?.employee_status === 'terminated'
                      ? 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                      : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                }`}>
                {employee.employee?.employee_status === 'active' && t('Active')}
                {employee.employee?.employee_status === 'inactive' && t('Inactive')}
                {employee.employee?.employee_status === 'probation' && t('Probation')}
                {employee.employee?.employee_status === 'terminated' && t('Terminated')}
                {!employee.employee?.employee_status && '-'}
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center min-w-0">
                  <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 shrink-0 rtl:mr-0 rtl:ml-2" />
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{t('Employee ID')}: {employee.employee?.employee_id}</span>
                </div>
                <div className="flex items-center min-w-0">
                  <Mail className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 shrink-0 rtl:mr-0 rtl:ml-2" />
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-all">{employee.email}</span>
                </div>
                {employee.employee?.phone && (
                  <div className="flex items-center min-w-0">
                    <Phone className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 shrink-0 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{employee.employee.phone}</span>
                  </div>
                )}
                {employee.employee?.date_of_birth && (
                  <div className="flex items-center min-w-0">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 shrink-0 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{t('DOB')}: {window.appSettings?.formatDateTimeSimple(employee.employee.date_of_birth, false) || new Date(employee.employee.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
                {employee.employee?.date_of_joining && (
                  <div className="flex items-center min-w-0">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 shrink-0 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{t('Joined')}: {window.appSettings?.formatDateTimeSimple(employee.employee.date_of_joining, false) || new Date(employee.employee.date_of_joining).toLocaleDateString()}</span>
                  </div>
                )}
                {employee.employee?.department?.name && (
                  <div className="flex items-center min-w-0">
                    <Building className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 shrink-0 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{employee.employee.department.name}</span>
                  </div>
                )}
                {employee.employee?.branch?.name && (
                  <div className="flex items-center min-w-0">
                    <Building className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 shrink-0 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{employee.employee.branch.name}</span>
                  </div>
                )}
                {employee.employee?.employment_type && (
                  <div className="flex items-center min-w-0">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 shrink-0 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{employee.employee.employment_type}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Details Tabs */}
        <div className="xl:col-span-3 min-w-0 text-start rtl:text-right">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full overflow-x-auto pb-1 mb-4 scrollbar-none max-w-full">
              <TabsList className="inline-flex flex-nowrap xl:grid xl:grid-cols-6 h-auto p-1 gap-1.5 min-w-max xl:min-w-0 xl:w-full">
                <TabsTrigger value="basic_info" className="shrink-0 text-xs sm:text-sm px-3.5 py-2 whitespace-nowrap">{t('Basic Info')}</TabsTrigger>
                <TabsTrigger value="employment" className="shrink-0 text-xs sm:text-sm px-3.5 py-2 whitespace-nowrap">{t('Employment')}</TabsTrigger>
                <TabsTrigger value="contact" className="shrink-0 text-xs sm:text-sm px-3.5 py-2 whitespace-nowrap">{t('Contact')}</TabsTrigger>
                <TabsTrigger value="banking" className="shrink-0 text-xs sm:text-sm px-3.5 py-2 whitespace-nowrap">{t('Banking')}</TabsTrigger>
                {(hasPermission(permissions, 'download-joining-letter') || hasPermission(permissions, 'download-experience-certificate') || hasPermission(permissions, 'download-noc-certificate')) && (
                  <TabsTrigger value="certifications" className="shrink-0 text-xs sm:text-sm px-3.5 py-2 whitespace-nowrap">{t('Certifications')}</TabsTrigger>
                )}
                <TabsTrigger value="documents" className="shrink-0 text-xs sm:text-sm px-3.5 py-2 whitespace-nowrap">{t('Documents')}</TabsTrigger>
              </TabsList>
            </div>

            {/* Basic Info Tab */}
            <TabsContent value="basic_info">
              <Card className="text-start rtl:text-right">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 text-start rtl:text-right">{t('Basic Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-start rtl:text-right">
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Full Name')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.name}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Employee ID')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.employee_id}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Email')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-all">{employee.email}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Phone Number')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.phone || '-'}</p>
                    </div>
                     <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Employee Code')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.biometric_emp_id || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Date of Birth')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.date_of_birth ? (window.appSettings?.formatDateTimeSimple(employee.employee.date_of_birth, false) || new Date(employee.employee.date_of_birth).toLocaleDateString()) : '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Gender')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.gender ? t(employee.employee.gender.charAt(0).toUpperCase() + employee.employee.gender.slice(1)) : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employment Tab */}
            <TabsContent value="employment">
              <Card className="text-start rtl:text-right">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 text-start rtl:text-right">{t('Employment Details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-start rtl:text-right">
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Branch')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.branch?.name || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Department')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.department?.name || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Designation')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.designation?.name || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Date of Joining')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.date_of_joining ? (window.appSettings?.formatDateTimeSimple(employee.employee.date_of_joining, false) || new Date(employee.employee.date_of_joining).toLocaleDateString()) : '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Employment Type')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.employment_type || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Shift')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.shift ? `${employee.employee.shift.name} (${employee.employee.shift.start_time} - ${employee.employee.shift.end_time})` : '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Attendance Policy')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.attendance_policy?.name || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <Card className="text-start rtl:text-right">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 text-start rtl:text-right">{t('Contact Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-start rtl:text-right">
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Address Line 1')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.address_line_1 || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Address Line 2')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.address_line_2 || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('City')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.city || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('State/Province')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.state || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Country')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.country || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Postal/Zip Code')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.postal_code || '-'}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 text-start rtl:text-right">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 text-start rtl:text-right">{t('Emergency Contact')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-start rtl:text-right">
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Name')}</h3>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.emergency_contact_name || '-'}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Relationship')}</h3>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.emergency_contact_relationship || '-'}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Phone Number')}</h3>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.emergency_contact_number || '-'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Banking Tab */}
            <TabsContent value="banking">
              <Card className="text-start rtl:text-right">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 text-start rtl:text-right">{t('Banking Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-start rtl:text-right">
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Bank Name')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.bank_name || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Account Holder Name')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.account_holder_name || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Account Number')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.account_number || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Bank Identifier Code (BIC/SWIFT)')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.bank_identifier_code || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Bank Branch')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.bank_branch || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Tax Payer ID')}</h3>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 break-words">{employee.employee?.tax_payer_id || '-'}</p>
                    </div>
                    {employee.employee?.base_salary && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{t('Base Salary')}</h3>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 font-mono break-words">{employee.employee.base_salary}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications">
              {(hasPermission(permissions, 'download-joining-letter') || hasPermission(permissions, 'download-experience-certificate') || hasPermission(permissions, 'download-noc-certificate')) && (
                <Card className="text-start rtl:text-right">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 text-start rtl:text-right">{t('Employee Certifications')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {/* Joining Letter */}
                      {hasPermission(permissions, 'download-joining-letter') && (
                        <Card className="border text-start rtl:text-right">
                          <CardContent className="p-4 flex flex-col justify-between h-full">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start min-w-0">
                                <FileText className="h-7 w-7 sm:h-8 sm:w-8 mr-2.5 sm:mr-3 text-muted-foreground shrink-0 mt-0.5 rtl:mr-0 rtl:ml-2.5 rtl:sm:ml-3" />
                                <div className="min-w-0 text-start rtl:text-right">
                                  <h4 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{t('Joining Letter')}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 break-words">{t('Official joining letter document')}</p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-full">
                                    <Download className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                                    {t('Download')}
                                    <ChevronDown className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full text-start rtl:text-right">
                                  <DropdownMenuItem onClick={() => handleDocumentDownload('joining_letter', 'pdf')}>
                                    {t('PDF')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDocumentDownload('joining_letter', 'doc')}>
                                    {t('DOC')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Experience Certificate */}
                      {hasPermission(permissions, 'download-experience-certificate') && (
                        <Card className="border text-start rtl:text-right">
                          <CardContent className="p-4 flex flex-col justify-between h-full">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start min-w-0">
                                <FileText className="h-7 w-7 sm:h-8 sm:w-8 mr-2.5 sm:mr-3 text-muted-foreground shrink-0 mt-0.5 rtl:mr-0 rtl:ml-2.5 rtl:sm:ml-3" />
                                <div className="min-w-0 text-start rtl:text-right">
                                  <h4 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{t('Experience Certificate')}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 break-words">{t('Work experience certificate')}</p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-full">
                                    <Download className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                                    {t('Download')}
                                    <ChevronDown className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full text-start rtl:text-right">
                                  <DropdownMenuItem onClick={() => handleDocumentDownload('experience_certificate', 'pdf')}>
                                    {t('PDF')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDocumentDownload('experience_certificate', 'doc')}>
                                    {t('DOC')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* NOC */}
                      {hasPermission(permissions, 'download-noc-certificate') && (
                        <Card className="border text-start rtl:text-right">
                          <CardContent className="p-4 flex flex-col justify-between h-full">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start min-w-0">
                                <FileText className="h-7 w-7 sm:h-8 sm:w-8 mr-2.5 sm:mr-3 text-muted-foreground shrink-0 mt-0.5 rtl:mr-0 rtl:ml-2.5 rtl:sm:ml-3" />
                                <div className="min-w-0 text-start rtl:text-right">
                                  <h4 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{t('NOC')}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 break-words">{t('No Objection Certificate')}</p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-full">
                                    <Download className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                                    {t('Download')}
                                    <ChevronDown className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full text-start rtl:text-right">
                                  <DropdownMenuItem onClick={() => handleDocumentDownload('noc', 'pdf')}>
                                    {t('PDF')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDocumentDownload('noc', 'doc')}>
                                    {t('DOC')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card className="text-start rtl:text-right">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 text-start rtl:text-right">{t('Documents')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {employee.employee?.documents && employee.employee.documents.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {employee.employee.documents.map((document: any) => (
                        <Card key={document.id} className="border text-start rtl:text-right">
                          <CardContent className="p-3.5 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex items-start min-w-0 gap-3">
                                <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 dark:text-gray-400 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1 text-start rtl:text-right">
                                  <h4 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{document.document_type?.name}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 break-words mt-0.5">
                                    {document.expiry_date ? `${t('Expires')}: ${window.appSettings?.formatDateTimeSimple(document.expiry_date, false) || new Date(document.expiry_date).toLocaleDateString()}` : t('No expiry date')}
                                  </p>
                                  <div className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset mt-2 ${document.verification_status === 'verified'
                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                    : document.verification_status === 'rejected'
                                      ? 'bg-red-50 text-red-700 ring-red-600/20'
                                      : 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                                    }`}>
                                    {document.verification_status === 'verified'
                                      ? t('Verified')
                                      : document.verification_status === 'rejected'
                                        ? t('Rejected')
                                        : t('Pending')}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => window.open(document.document_url || document.file_path, '_blank')}>
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </Button>
                                {hasPermission(permissions, 'edit-employees') && (
                                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDeleteDocument(document.id)}>
                                    <Trash2 className="h-4 w-4 text-gray-500" />
                                  </Button>
                                )}
                                {hasPermission(permissions, 'edit-employees') && document.verification_status === 'pending' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 shrink-0"
                                      onClick={() => handleDocumentVerification(document.id, 'verified')}
                                    >
                                      <Check className="h-4 w-4 text-gray-500" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 shrink-0"
                                      onClick={() => handleDocumentVerification(document.id, 'rejected')}
                                    >
                                      <X className="h-4 w-4 text-gray-500" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                      {t('No documents found')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={employee?.name || ''}
        entityName="employee"
      />
    </PageTemplate>
  );
}
