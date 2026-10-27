import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Users, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { useInitials } from '@/hooks/use-initials';

interface ReferredUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
  plan?: {
    id: number;
    name: string;
    price: number;
    yearly_price?: number;
  };
  plan_orders?: Array<{
    id: number;
    billing_cycle: string;
    final_price: number;
  }>;
  referrals?: Array<{
    id: number;
    amount: number;
    commission_percentage: number;
    created_at: string;
  }>;
}

interface ReferredUsersSectionProps {
  referredUsers: {
    data: ReferredUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: any[];
  };
  userType: string;
  currencySymbol: string;
}

export default function ReferredUsersSection({ referredUsers, userType, currencySymbol }: ReferredUsersSectionProps) {
  const { t } = useTranslation();
  const getInitials = useInitials();

const getTotalCommission = (user: ReferredUser) => {
    return user.referrals?.reduce((total, referral) => total + (Number(referral.amount) || 0), 0) || 0;
  };

  const getTotalCommissionAll = () => {
    return referredUsers.data.reduce((total, user) => total + getTotalCommission(user), 0) || 0;
  };

  const getPlanDisplayInfo = (user: ReferredUser) => {
    if (!user.plan) return null;

    const latestOrder = user.plan_orders?.[0];

    if (latestOrder) {
      const isYearly = latestOrder.billing_cycle === 'yearly';
      return {
        name: user.plan.name,
        price: latestOrder.final_price,
        cycle: isYearly ? 'year' : 'month'
      };
    }

    return {
      name: user.plan.name,
      price: user.plan.price,
      cycle: 'month'
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full opacity-10" />
          <div className="relative flex flex-col gap-3">
            <div className="p-2 md:p-2.5 bg-green-100 dark:bg-green-900/40 rounded-xl self-start">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 leading-snug">{t('Total Referred Users')}</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{referredUsers.total}</h3>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium mt-1 block">{t('All time')}</span>
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full opacity-10" />
          <div className="relative flex flex-col gap-3">
            <div className="p-2 md:p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl self-start">
              <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 leading-snug">{t('Users with Plans')}</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{referredUsers.data.filter(user => user.plan).length}</h3>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 block">{t('Active subscriptions')}</span>
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto w-16 h-16 sm:w-20 sm:h-20 bg-amber-500 rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full opacity-10" />
          <div className="relative flex flex-col gap-3">
            <div className="p-2 md:p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl self-start">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 leading-snug">{t('Total Commission Earned')}</p>
              <h3 className="text-2xl md:text-3xl font-bold font-mono text-gray-900 dark:text-white break-all">{currencySymbol}{getTotalCommissionAll().toFixed(2)}</h3>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 block">{t('Commission earned')}</span>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('Referred Users List')}</CardTitle>
        </CardHeader>
        <CardContent>
          {referredUsers.data.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base font-semibold text-muted-foreground mb-2">{t('No referred users yet')}</p>
              <p className="text-sm text-muted-foreground">
                {userType === 'superadmin'
                  ? t('No users have registered using referral codes yet.')
                  : t('Share your referral link to start earning commissions.')
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referredUsers.data.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white flex-shrink-0 ${user.avatar ? 'hidden' : ''}`}>
                          {getInitials(user.name)}
                        </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate mb-1">{user.email}</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {t('Registered')} {window.appSettings?.formatDateTimeSimple(user.created_at, false) || new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 sm:flex-col sm:items-end sm:gap-2">
                      <div className="rtl:text-left ltr:text-right">
                        {(() => {
                          const planInfo = getPlanDisplayInfo(user);
                          return planInfo ? (
                            <div>
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-1.5">
                                {planInfo.name}
                              </span>
                              <p className="text-sm text-muted-foreground font-mono">
                                {currencySymbol}{planInfo.price}/{t(planInfo.cycle)}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              {t('No Plan')}
                            </span>
                          );
                        })()}
                      </div>

                      {getTotalCommission(user) > 0 && (
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-semibold font-mono text-green-600">
                            +{currencySymbol}{getTotalCommission(user).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('Commission')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {user.referrals && user.referrals.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold mb-2">{t('Commission History')}</p>
                      <div className="space-y-2">
                        {user.referrals.map((referral) => (
                          <div key={referral.id} className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {referral.commission_percentage}% {t('commission')}
                            </span>
                            <span className="text-sm font-semibold font-mono text-green-600">
                              +{currencySymbol}{referral.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {referredUsers.last_page > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <Pagination
            from={referredUsers.from}
            to={referredUsers.to}
            total={referredUsers.total}
            links={referredUsers.links}
            currentPage={referredUsers.current_page}
            lastPage={referredUsers.last_page}
            entityName={t('users')}
            hidePerPage
            onPageChange={(url) => {
                router.visit(url, {
                preserveState: true,
                preserveScroll: true,
                only: ['referredUsers']
                });
            }}
            />
        </div>
      )}
    </div>
  );
}
