import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Copy, Check, Users, DollarSign, TrendingUp, Award, Clock, Mail, Calendar } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { cn } from '@/lib/utils';
import { useInitials } from '@/hooks/use-initials';

interface ReferralDashboardProps {
  userType: string;
  stats: any;
  referralLink?: string;
  recentReferredUsers?: any[];
  currencySymbol?: string;
}

export default function ReferralDashboard({ userType, stats, referralLink, recentReferredUsers, currencySymbol }: ReferralDashboardProps) {
  const { t } = useTranslation();
  const getInitials = useInitials();
  const [copied, setCopied] = useState(false);

  const copyReferralLink = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(t('Referral link copied to clipboard'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (userType === 'superadmin') {
    return (
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full opacity-10" />
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 leading-tight">{t('Total Referral Users')}</p>
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">{stats.totalReferralUsers}</h3>
                <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5 block">{t('Registered users')}</span>
              </div>
              <div className="relative z-10 p-1.5 sm:p-2 md:p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl self-start shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto w-16 h-16 sm:w-20 sm:h-20 bg-amber-500 rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full opacity-10" />
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 leading-tight">{t('Pending Payouts')}</p>
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">{stats.pendingPayouts}</h3>
                <span className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5 block">{t('Awaiting approval')}</span>
              </div>
              <div className="relative z-10 p-1.5 sm:p-2 md:p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl self-start shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full opacity-10" />
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 leading-tight">{t('Total Commission Paid')}</p>
                <h3 className="text-base sm:text-xl md:text-2xl font-bold font-mono text-gray-900 dark:text-white break-words">{currencySymbol}{stats.totalCommissionPaid}</h3>
                <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium mt-0.5 block">{t('Total payouts')}</span>
              </div>
              <div className="relative z-10 p-1.5 sm:p-2 md:p-3 bg-green-100 dark:bg-green-900/40 rounded-xl self-start shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto w-16 h-16 sm:w-20 sm:h-20 bg-purple-500 rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full opacity-10" />
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 leading-tight">{t('Active Companies')}</p>
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">{stats.topCompanies?.length || 0}</h3>
                <span className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5 block">{t('Referring companies')}</span>
              </div>
              <div className="relative z-10 p-1.5 sm:p-2 md:p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl self-start shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold">{t('Top Referring Companies')}</CardTitle>
                  <CardDescription className="text-xs">{t('Companies with most referrals')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {stats.topCompanies && stats.topCompanies.length > 0 ? (
                <div className="space-y-2">
                  {stats.topCompanies.slice(0, 5).map((company: any) => (
                    <div key={company.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {company.avatar ? (
                          <img
                            src={company.avatar}
                            alt={company.name}
                            className="h-9 w-9 rounded-full object-cover shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shrink-0 text-xs font-semibold ${company.avatar ? 'hidden' : ''}`}>
                          {getInitials(company.name || '')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{company.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{company.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 justify-end">
                          <Users className="h-3.5 w-3.5" />
                          {company.referral_count}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium font-mono">{currencySymbol}{company.total_earned || 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Award className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-muted-foreground">{t('No companies yet')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold">{t('Monthly Performance')}</CardTitle>
                  <CardDescription className="text-xs">{t('This year statistics')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{t('Referral Signups')}</p>
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.monthlyReferrals || 0}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {t('Total this year')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">{t('Payouts Processed')}</p>
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-green-600 dark:text-green-400 break-words">{currencySymbol}{stats.monthlyPayouts || 0}</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {t('Total this year')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto rtl:rounded-bl-none rtl:rounded-br-full w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-bl-full opacity-10" />
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 leading-tight">{t('Total Referrals')}</p>
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">{stats.totalReferrals}</h3>
              <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium mt-0.5 block">{t('All referrals')}</span>
            </div>
            <div className="relative z-10 p-1.5 sm:p-2 md:p-3 bg-green-100 dark:bg-green-900/40 rounded-xl self-start shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto rtl:rounded-bl-none rtl:rounded-br-full w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-bl-full opacity-10" />
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 leading-tight">{t('Referred Users')}</p>
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">{stats.referredUsersCount || 0}</h3>
              <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5 block">{t('Active users')}</span>
            </div>
            <div className="relative z-10 p-1.5 sm:p-2 md:p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl self-start shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto rtl:rounded-bl-none rtl:rounded-br-full w-16 h-16 sm:w-20 sm:h-20 bg-amber-500 rounded-bl-full opacity-10" />
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 leading-tight">{t('Total Earned')}</p>
              <h3 className="text-base sm:text-xl md:text-2xl font-bold font-mono text-gray-900 dark:text-white break-words">{currencySymbol}{stats.totalEarned}</h3>
              <span className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5 block">{t('Commission earned')}</span>
            </div>
            <div className="relative z-10 p-1.5 sm:p-2 md:p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl self-start shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto rtl:rounded-bl-none rtl:rounded-br-full w-16 h-16 sm:w-20 sm:h-20 bg-purple-500 rounded-bl-full opacity-10" />
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 leading-tight">{t('Available Balance')}</p>
              <h3 className="text-base sm:text-xl md:text-2xl font-bold font-mono text-gray-900 dark:text-white break-words">{currencySymbol}{stats.availableBalance.toFixed(2)}</h3>
              <span className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5 block">{t('Ready to withdraw')}</span>
            </div>
            <div className="relative z-10 p-1.5 sm:p-2 md:p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl self-start shrink-0">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold">{t('Your Referral Link')}</CardTitle>
                <CardDescription className="text-xs">{t('Share and earn commissions')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex gap-2 min-w-0">
              <Input
                value={referralLink || ''}
                readOnly
                className="flex-1 min-w-0 font-mono text-sm"
              />
              <Button
                onClick={copyReferralLink}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded-lg">
              {t('Share this link to earn commissions when users sign up and purchase plans')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold">{t('Recent Referred Users')}</CardTitle>
                <CardDescription className="text-xs">{t('Latest referrals')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {recentReferredUsers && recentReferredUsers.length > 0 ? (
              <div className="space-y-2">
                {recentReferredUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {user.plan ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                          {user.plan.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                          {t('No Plan')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground mb-1">{t('No referred users yet')}</p>
                <p className="text-xs text-muted-foreground">{t('Share your link to get started')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
