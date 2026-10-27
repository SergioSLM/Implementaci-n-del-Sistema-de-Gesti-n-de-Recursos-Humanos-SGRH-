import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { BarChart3, DollarSign, Users, Settings as SettingsIcon } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import ReferralDashboard from './components/referral-dashboard';
import PayoutRequests from './components/payout-requests';
import ReferralSettings from './components/referral-settings';
import ReferredUsersSection from './components/referred-users-section';
import { useLayout } from '@/contexts/LayoutContext';

export default function Referral() {
  const { t } = useTranslation();
  const { props } = usePage();
  const { userType, settings, stats, payoutRequests, referralLink, currencySymbol, globalSettings } = props as any;
  const [activeSection, setActiveSection] = useState('dashboard');
  const { position } = useLayout();

   const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Referral Program') }
  ]
  const sidebarNavItems: NavItem[] = [
    {
      title: t('Dashboard'),
      href: '#dashboard',
      icon: <BarChart3 className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />,
    },
    {
      title: t('Referred Users'),
      href: '#referred-users',
      icon: <Users className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />,
    },
    {
      title: t('Payout Requests'),
      href: '#payout-requests',
      icon: <DollarSign className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />,
    },
    ...(userType === 'superadmin' ? [{
      title: t('Settings'),
      href: '#settings',
      icon: <SettingsIcon className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />,
    }] : [])
  ];

  const dashboardRef = useRef<HTMLDivElement>(null);
  const referredUsersRef = useRef<HTMLDivElement>(null);
  const payoutRequestsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      const dashboardPosition = dashboardRef.current?.offsetTop || 0;
      const referredUsersPosition = referredUsersRef.current?.offsetTop || 0;
      const payoutRequestsPosition = payoutRequestsRef.current?.offsetTop || 0;
      const settingsPosition = settingsRef.current?.offsetTop || 0;

      if (userType === 'superadmin' && scrollPosition >= settingsPosition) {
        setActiveSection('settings');
      } else if (scrollPosition >= payoutRequestsPosition) {
        setActiveSection('payout-requests');
      } else if (scrollPosition >= referredUsersPosition) {
        setActiveSection('referred-users');
      } else {
        setActiveSection('dashboard');
      }
    };

    window.addEventListener('scroll', handleScroll);

    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(hash);
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [userType]);

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <PageTemplate
    breadcrumbs={breadcrumbs}
      title={t('Referral Program')}
      url="/referral"
      description={t("Manage your referral program.")}
    >
      <style>{`
        main { max-width: 100vw; overflow-x: clip !important; }
        body { overflow-x: clip !important; }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:block lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg border shadow p-3 sticky top-4 flex flex-col gap-2">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className={cn('w-full justify-start text-sm h-auto py-2 px-3', {
                  'bg-muted font-semibold': activeSection === item.href.replace('#', ''),
                })}
                onClick={() => handleNavClick(item.href)}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="whitespace-normal text-left rtl:text-right leading-tight">{item.title}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-4 min-w-0">
          <section id="dashboard" ref={dashboardRef} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('Dashboard')}</h2>
            <ReferralDashboard
              userType={userType}
              stats={stats}
              referralLink={referralLink}
              recentReferredUsers={props.recentReferredUsers}
              currencySymbol={currencySymbol}
            />
          </section>

          <section id="referred-users" ref={referredUsersRef} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('Referred Users')}</h2>
            <ReferredUsersSection
              referredUsers={props.referredUsers}
              userType={userType}
              currencySymbol={currencySymbol}
            />
          </section>

          <section id="payout-requests" ref={payoutRequestsRef} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('Payout Requests')}</h2>
            <PayoutRequests
              userType={userType}
              payoutRequests={payoutRequests}
              settings={settings}
              stats={stats}
              currencySymbol={currencySymbol}
            />
          </section>

          {userType === 'superadmin' && (
            <section id="settings" ref={settingsRef} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{t('Settings')}</h2>
              <ReferralSettings settings={settings} currencySymbol={currencySymbol} globalSettings={globalSettings} />
            </section>
          )}
        </div>
      </div>
      <Toaster />
    </PageTemplate>
  );
}
