import React, { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { router, usePage } from '@inertiajs/react';
import {
  CheckCircle2,
  X,
  Edit,
  Trash2,
  Globe,
  FileText,
  Bot,
  BarChart2,
  Mail,
  Box,
  Store,
  Users,
  HardDrive,
  Plus,
  Sparkles,
  Info,
  Crown,
  Zap,
  Clock,
  Banknote,
  CreditCard,
  IndianRupee,
  Wallet,
  Coins
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { useForm } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { PlanSubscriptionModal } from '@/components/plan-subscription-modal';

interface Plan {
  id: number;
  name: string;
  price: string | number;
  formatted_price?: string;
  duration: string;
  description: string;
  trial_days: number;
  features: string[];
  stats: {
    users: number | string;
    employees: number | string;
    storage: string;
  };
  status: boolean;
  recommended?: boolean;
  is_default?: boolean;
  is_current?: boolean;
  is_trial_available?: boolean;
}

interface Props {
  plans: Plan[];
  billingCycle: 'monthly' | 'yearly';
  hasDefaultPlan?: boolean;
  isAdmin?: boolean;
  currentPlan?: any;
  userTrialUsed?: boolean;
  paymentMethods?: any[];
  currency?: string;
  currencySymbol?: string;
}

export default function Plans({ plans: initialPlans, billingCycle: initialBillingCycle = 'monthly', hasDefaultPlan, isAdmin = false, currentPlan, userTrialUsed, paymentMethods = [], currency, currencySymbol }: Props) {
  const { t } = useTranslation();
  const { flash, globalSettings } = usePage().props as any;
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialBillingCycle);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const { post, processing } = useForm();


  // Helper function to safely format currency
  const formatCurrency = (amount: string | number) => {
    if (typeof window !== 'undefined' && window.appSettings?.formatCurrency) {
      // Use numeric value if available, otherwise parse the string
      const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
      return window.appSettings.formatCurrency(numericAmount, { showSymbol: true });
    }
    // Fallback if appSettings is not available
    return amount;
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Plan') }
  ]

  // Update plans when initialPlans changes
  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  // Handle flash messages from controller
  useEffect(() => {
    if (flash?.success) {
      toast.success(t(flash.success));
    }
    if (flash?.error) {
      toast.error(t(flash.error));
    }
  }, [flash, t]);


  // Function to handle billing cycle change
  const handleBillingCycleChange = (value: 'monthly' | 'yearly') => {
    setBillingCycle(value);
    router.get(route('plans.index'), { billing_cycle: value }, { preserveState: true });
  };

  // Company plan actions
  const handlePlanRequest = (planId: number) => {
    if (!globalSettings?.is_demo) {
      toast.loading(t('Submitting plan request...'));
    }

    router.post(route('plans.request'), {
      plan_id: planId,
      billing_cycle: billingCycle
    }, {
      onSuccess: () => {
        toast.dismiss();
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to submit plan request: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleStartTrial = (planId: number) => {
    if (!globalSettings?.is_demo) {
      toast.loading(t('Starting trial...'));
    }

    router.post(route('plans.trial'), {
      plan_id: planId
    }, {
      onSuccess: () => {
        toast.dismiss();
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to start trial: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleSubscribe = async (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      try {
        const response = await fetch(route('payment.methods'));
        const paymentMethods = await response.json();
        setSelectedPlan({ ...plan, paymentMethods });
        setIsSubscriptionModalOpen(true);
      } catch (error) {
        toast.error(t('Failed to load payment methods'));
      }
    }
  };

  const formatPaymentMethods = (paymentSettings: any) => {
    const methods = [];

    if (paymentSettings?.is_bank_enabled === true || paymentSettings?.is_bank_enabled === '1') {
      methods.push({
        id: 'bank',
        name: t('Bank Transfer'),
        icon: <Banknote className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_stripe_enabled === true || paymentSettings?.is_stripe_enabled === '1') {
      methods.push({
        id: 'stripe',
        name: t('Stripe'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paypal_enabled === true || paymentSettings?.is_paypal_enabled === '1') {
      methods.push({
        id: 'paypal',
        name: t('PayPal'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_razorpay_enabled === true || paymentSettings?.is_razorpay_enabled === '1') {
      methods.push({
        id: 'razorpay',
        name: t('Razorpay'),
        icon: <IndianRupee className="h-5 w-5" />,
        enabled: true
      });
    }

    if ((paymentSettings?.is_mercadopago_enabled === true || paymentSettings?.is_mercadopago_enabled === '1') && paymentSettings?.mercadopago_access_token) {
      methods.push({
        id: 'mercadopago',
        name: t('MercadoPago'),
        icon: <Wallet className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paystack_enabled === true || paymentSettings?.is_paystack_enabled === '1') {
      methods.push({
        id: 'paystack',
        name: t('Paystack'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_flutterwave_enabled === true || paymentSettings?.is_flutterwave_enabled === '1') {
      methods.push({
        id: 'flutterwave',
        name: t('Flutterwave'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paytabs_enabled === true || paymentSettings?.is_paytabs_enabled === '1') {
      methods.push({
        id: 'paytabs',
        name: t('PayTabs'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_skrill_enabled === true || paymentSettings?.is_skrill_enabled === '1') {
      methods.push({
        id: 'skrill',
        name: t('Skrill'),
        icon: <Wallet className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_coingate_enabled === true || paymentSettings?.is_coingate_enabled === '1') {
      methods.push({
        id: 'coingate',
        name: t('CoinGate'),
        icon: <Coins className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_payfast_enabled === true || paymentSettings?.is_payfast_enabled === '1') {
      methods.push({
        id: 'payfast',
        name: t('Payfast'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_tap_enabled === true || paymentSettings?.is_tap_enabled === '1') {
      methods.push({
        id: 'tap',
        name: t('Tap'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_xendit_enabled === true || paymentSettings?.is_xendit_enabled === '1') {
      methods.push({
        id: 'xendit',
        name: t('Xendit'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paytr_enabled === true || paymentSettings?.is_paytr_enabled === '1') {
      methods.push({
        id: 'paytr',
        name: t('PayTR'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_mollie_enabled === true || paymentSettings?.is_mollie_enabled === '1') {
      methods.push({
        id: 'mollie',
        name: t('Mollie'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_toyyibpay_enabled === true || paymentSettings?.is_toyyibpay_enabled === '1') {
      methods.push({
        id: 'toyyibpay',
        name: t('toyyibPay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_cashfree_enabled === true || paymentSettings?.is_cashfree_enabled === '1') {
      methods.push({
        id: 'cashfree',
        name: t('Cashfree'),
        icon: <IndianRupee className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_khalti_enabled === true || paymentSettings?.is_khalti_enabled === '1') {
      methods.push({
        id: 'khalti',
        name: t('Khalti'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_iyzipay_enabled === true || paymentSettings?.is_iyzipay_enabled === '1') {
      methods.push({
        id: 'iyzipay',
        name: t('Iyzipay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_benefit_enabled === true || paymentSettings?.is_benefit_enabled === '1') {
      methods.push({
        id: 'benefit',
        name: t('Benefit'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_ozow_enabled === true || paymentSettings?.is_ozow_enabled === '1') {
      methods.push({
        id: 'ozow',
        name: t('Ozow'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_easebuzz_enabled === true || paymentSettings?.is_easebuzz_enabled === '1') {
      methods.push({
        id: 'easebuzz',
        name: t('Easebuzz'),
        icon: <IndianRupee className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_authorizenet_enabled === true || paymentSettings?.is_authorizenet_enabled === '1') {
      methods.push({
        id: 'authorizenet',
        name: t('AuthorizeNet'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_fedapay_enabled === true || paymentSettings?.is_fedapay_enabled === '1') {
      methods.push({
        id: 'fedapay',
        name: t('FedaPay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_payhere_enabled === true || paymentSettings?.is_payhere_enabled === '1') {
      methods.push({
        id: 'payhere',
        name: t('PayHere'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_cinetpay_enabled === true || paymentSettings?.is_cinetpay_enabled === '1') {
      methods.push({
        id: 'cinetpay',
        name: t('CinetPay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paiement_enabled === true || paymentSettings?.is_paiement_enabled === '1') {
      methods.push({
        id: 'paiement',
        name: t('Paiement Pro'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_nepalste_enabled === true || paymentSettings?.is_nepalste_enabled === '1') {
      methods.push({
        id: 'nepalste',
        name: t('Nepalste'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_yookassa_enabled === true || paymentSettings?.is_yookassa_enabled === '1') {
      methods.push({
        id: 'yookassa',
        name: t('YooKassa'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_aamarpay_enabled === true || paymentSettings?.is_aamarpay_enabled === '1') {
      methods.push({
        id: 'aamarpay',
        name: t('Aamarpay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_midtrans_enabled === true || paymentSettings?.is_midtrans_enabled === '1') {
      methods.push({
        id: 'midtrans',
        name: t('Midtrans'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }



    return methods;
  };

  const getActionButton = (plan: Plan) => {
    const { auth } = usePage().props as any;
    const userExpireDate = auth?.user?.is_trial == 1 ? auth?.user?.trial_expire_date : auth?.user?.plan_expire_date;
    const expireDate = userExpireDate || currentPlan?.plan_expire_date || currentPlan?.trial_expire_date || currentPlan?.expires_at;

    let formattedExpire = '';
    if (expireDate) {
      if (typeof window !== 'undefined' && window.appSettings?.formatDateTime) {
        formattedExpire = window.appSettings.formatDateTime(expireDate, false);
      } else if (typeof window !== 'undefined' && window.appSettings?.formatDate) {
        formattedExpire = window.appSettings.formatDate(expireDate);
      } else {
        const d = new Date(expireDate);
        formattedExpire = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    // Check if user has active subscription to this plan or is on current plan
    if (plan.is_current) {
      return (
        <Button disabled className="w-full h-12 bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800 font-medium">
          <Crown className="h-4 w-4 mr-2" />
          {expireDate ? t("Expires on {{date}}", { date: formattedExpire }) : t("Current Plan")}
        </Button>
      );
    }

    if (currentPlan && currentPlan.id === plan.id && currentPlan.expires_at && new Date(currentPlan.expires_at) > new Date()) {
      return (
        <Button disabled className="w-full h-12 bg-primary/10 text-primary border border-primary/20 font-medium">
          <Crown className="h-4 w-4 mr-2" />
          {expireDate ? t("Expires on {{date}}", { date: formattedExpire }) : t("Already Subscribed")}
        </Button>
      );
    }

    if (plan.is_trial_available && !userTrialUsed) {
      return (
        <div className="space-y-3">
          <Button
            onClick={() => handleStartTrial(plan.id)}
            disabled={processing}
            variant="outline"
            className="w-full h-12 border-primary text-primary hover:bg-primary/5 font-medium"
          >
            <Zap className="h-4 w-4 mr-2" />
            {t('Start {{days}} Day Trial', { days: plan.trial_days })}
          </Button>
          <Button
            onClick={() => handleSubscribe(plan.id)}
            disabled={processing}
            className={`w-full h-12 font-medium ${plan.recommended
                ? 'bg-primary hover:bg-primary/90 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
              }`}
          >
            {t('Subscribe Now')}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Button
          onClick={() => handlePlanRequest(plan.id)}
          disabled={processing}
          variant="outline"
          className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
        >
          <Clock className="h-4 w-4 mr-2" />
          {t('Request Plan')}
        </Button>
        <Button
          onClick={() => handleSubscribe(plan.id)}
          disabled={processing || (currentPlan && currentPlan.id === plan.id && currentPlan.expires_at && new Date(currentPlan.expires_at) > new Date())}
          className={`w-full h-12 font-medium ${plan.recommended
              ? 'bg-primary hover:bg-primary/90 text-white'
              : 'bg-primary hover:bg-primary/90 text-white'
            }`}
        >
          {currentPlan && currentPlan.id === plan.id && currentPlan.expires_at && new Date(currentPlan.expires_at) > new Date()
            ? t('Already Subscribed')
            : t('Subscribe Now')
          }
        </Button>
      </div>
    );
  };

  // Function to get the appropriate icon for a feature
  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'AI Integration':
        return <Bot className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  // Function to check if a feature is included in the plan
  const isFeatureIncluded = (plan: Plan, feature: string) => {
    return plan.features.includes(feature);
  };

  // Function to toggle plan status
  const togglePlanStatus = (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    const newStatus = !plan?.status;
    if (!globalSettings?.is_demo) {
      toast.loading(`${newStatus ? t('Activating') : t('Deactivating')} plan...`);
    }

    router.post(route('plans.toggle-status', planId), {}, {
      preserveState: true,
      onSuccess: (page) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
          setPlans(plans.map(p =>
            p.id === planId ? { ...p, status: !p.status } : p
          ));
        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to update plan status: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  // Function to handle delete
  const handleDelete = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  // Function to handle delete confirmation
  const handleDeleteConfirm = () => {
    if (planToDelete) {
      if (!globalSettings?.is_demo) {
        toast.loading(t('Deleting plan...'));
      }

      router.delete(route('plans.destroy', planToDelete.id), {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setPlanToDelete(null);
          toast.dismiss();
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(t(errors));
          } else {
            toast.error(t('Failed to delete plan: {{errors}}', { errors: Object.values(errors).join(', ') }));
          }
        }
      });
    }
  };

  // Common features to display for all plans
  const commonFeatures = [
    'AI Integration'
  ];

  // Define stat icons
  const statIcons = {
    users: <Users className="h-5 w-5" />,
    employees: <Users className="h-5 w-5" />,
    storage: <HardDrive className="h-5 w-5" />
  };

  return (
    <PageTemplate
      title={t("Plans")}
      breadcrumbs={breadcrumbs}
      description={t("Manage subscription plans for your customers")}
      url="/plans"
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Header with controls */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {isAdmin ? t("Subscription Plans") : t("Choose Your Plan")}
            </h1>
            <p className="text-lg text-gray-600">
              {isAdmin
                ? t("Create and manage subscription plans to offer different service tiers to your customers.")
                : t("Select the perfect plan for your business needs and start growing today.")
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Billing Cycle Toggle */}
            <div className="bg-gray-100 rounded-lg p-1">
              <Tabs
                value={billingCycle}
                onValueChange={(v) => handleBillingCycleChange(v as 'monthly' | 'yearly')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto">
                  <TabsTrigger
                    value="monthly"
                    className="px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md"
                  >
                    {t("Monthly")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="yearly"
                    className="px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md relative"
                  >
                    {t("Yearly")}
                    <Badge className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5">
                      {t("Save 20%")}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Add Plan Button - Admin only */}
            {isAdmin && (
              <Button
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 font-medium"
                onClick={() => router.get(route('plans.create'))}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("Add Plan")}
              </Button>
            )}
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto pt-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative h-full flex flex-col transition-all duration-200 ${
                plan.recommended ? 'sm:transform sm:scale-105 z-10' : ''
              }`}
            >
              {/* Main Card */}
              <div className={`
                relative h-full flex flex-col rounded-xl border-2 transition-all duration-200
                ${plan.recommended
                  ? 'border-primary shadow-xl bg-white dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 hover:shadow-lg'
                }
                ${isAdmin && !plan.status && !globalSettings?.is_demo ? 'grayscale opacity-60' : ''}
              `}>
                {/* Recommended Badge */}
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-primary text-white px-3.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm whitespace-nowrap">
                      {t("Recommended")}
                    </div>
                  </div>
                )}

                {/* Status Indicators */}
                <div className="absolute top-3 right-3 z-10 flex flex-wrap justify-end gap-1 max-w-[50%]">
                  {isAdmin && (
                    <>
                      {plan.is_default && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {t("Default")}
                        </span>
                      )}
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        plan.status
                          ? 'bg-green-50 text-green-700 ring-green-600/20'
                          : 'bg-red-50 text-red-700 ring-red-600/20'
                      }`}>
                        {plan.status ? t("Active") : t("Inactive")}
                      </span>
                    </>
                  )}
                  {!isAdmin && plan.is_current && (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      <Crown className="h-3 w-3 mr-1 shrink-0" />
                      {t("Current")}
                    </span>
                  )}
                </div>

                {/* Card Header */}
                <div className="p-5 sm:p-6 text-center border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 pr-12 text-left sm:text-center truncate">
                    {plan.name}
                  </h3>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center flex-wrap gap-1">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 font-mono break-all">
                        {currencySymbol}{plan.price}
                      </span>
                      <span className="text-gray-500 text-xs sm:text-sm font-medium">
                        /{t(plan.duration.toLowerCase())}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 line-clamp-3 min-h-[2.5rem]">
                    {plan.description}
                  </p>

                  {/* Trial Badge */}
                  {plan.trial_days > 0 && (isAdmin || userTrialUsed != 0) && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium">
                      <Zap className="h-3 w-3 shrink-0" />
                      <span>{t("{{days}} days free trial", { days: plan.trial_days })}</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex flex-col flex-1 p-5 sm:p-6">
                  {/* Usage Stats */}
                  <div className="mb-6">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 tracking-wide uppercase">
                      {t("What's Included")}
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Users className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 truncate">{t("Users")}</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">{plan.stats.users}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Users className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 truncate">{t("Employees")}</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">{plan.stats.employees}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <HardDrive className="h-4 w-4 text-purple-500 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 truncate">{t("Storage")}</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">{plan.stats.storage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6 flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 tracking-wide uppercase">
                      {t("Features")}
                    </h4>
                    <ul className="space-y-2">
                      {commonFeatures.map((feature, index) => {
                        const included = isFeatureIncluded(plan, feature);
                        return (
                          <li key={index} className="flex items-start gap-2">
                            <div className={`shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center mt-0.5 ${
                              included
                                ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                            }`}>
                              {included ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </div>
                            <span className={`text-xs sm:text-sm leading-snug ${
                              included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {t(feature)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-2">
                    {isAdmin ? (
                      <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.status}
                            onCheckedChange={() => togglePlanStatus(plan.id)}
                            className={plan.status ? "data-[state=checked]:bg-primary" : ""}
                          />
                          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {plan.status ? t("Active") : t("Inactive")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                                onClick={() => router.get(route('plans.edit', plan.id))}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('Edit')}</TooltipContent>
                          </Tooltip>

                          {!plan.is_default && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-red-600"
                                  onClick={() => handleDelete(plan)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('Delete')}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    ) : (
                      getActionButton(plan)
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Delete Modal - Admin only */}
        {isAdmin && (
          <CrudDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            itemName={planToDelete?.name || ''}
            entityName="plan"
          />
        )}

        {/* Subscription Modal - Company only */}
        {!isAdmin && selectedPlan && (
          <PlanSubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => {
              setIsSubscriptionModalOpen(false);
              setSelectedPlan(null);
            }}
            plan={selectedPlan}
            billingCycle={billingCycle}
            paymentMethods={formatPaymentMethods(selectedPlan.paymentMethods)}
            currencySymbol={currencySymbol}
          />
        )}
      </div>
    </PageTemplate>
  );
}
