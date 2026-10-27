import { CreditCard, Users, ShieldCheck, Link as LinkIcon, Briefcase, Calendar, UserCheck, FileText, Award, Clock } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useBrand } from '@/contexts/BrandContext';
import { useAppearance, THEME_COLORS } from '@/hooks/use-appearance';
import { useFavicon } from '@/hooks/use-favicon';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { getImagePath } from '@/utils/helpers';
import { Head, usePage } from '@inertiajs/react';
import React from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    icon?: ReactNode;
    status?: string;
    statusType?: 'success' | 'error';
}
function hexToAdjustedRgba(hex, opacity = 1, adjust = 0) {
    hex = hex.replace("#", "");
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const getF = (ch) =>
        typeof adjust === "number" ? clamp(adjust) : clamp(adjust[ch] ?? 0);
    const adj = (c, f) =>
        f < 0 ? Math.floor(c * (1 + f)) : Math.floor(c + (255 - c) * f);
    const rr = adj(r, getF("r"));
    const gg = adj(g, getF("g"));
    const bb = adj(b, getF("b"));
    return opacity === 1
        ? `#${rr.toString(16).padStart(2, "0")}${gg
            .toString(16)
            .padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`.toUpperCase()
        : `rgba(${rr}, ${gg}, ${bb}, ${opacity})`;
}

export default function AuthLayout({
    children,
    title,
    description,
    icon,
    status,
    statusType = 'success',
}: AuthLayoutProps) {
    useFavicon();
    const { t, i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const { logoLight, logoDark, themeColor, customColor, footerText: contextFooterText, titleText: contextTitleText } = useBrand();
    const { appearance } = useAppearance();

    const currentLogo = appearance === 'dark' ? logoLight : logoDark;
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];

    const pageProps = usePage().props as any;
    const globalSettings = pageProps?.globalSettings;
    const userLanguage = pageProps?.userLanguage;

    const isDemo = globalSettings?.is_demo || false;
    const titleText = (isDemo && (globalSettings?.titleText || globalSettings?.title_text)) ? (globalSettings?.titleText || globalSettings?.title_text) : contextTitleText;
    const footerText = (isDemo && (globalSettings?.footerText || globalSettings?.footer_text)) ? (globalSettings?.footerText || globalSettings?.footer_text) : contextFooterText;

    useEffect(() => {
        setMounted(true);

        // Set default language from global settings
        if (userLanguage && i18n.language !== userLanguage) {
            i18n.changeLanguage(userLanguage);
        }
    }, [userLanguage]);

    // RTL Support for auth pages
    // useEffect(() => {
    //     const globalSettings = (window as any).page?.props?.globalSettings;
    //     const isDemo = globalSettings?.is_demo || false;
    //     let storedPosition = 'left';

    //     if (isDemo) {
    //         // In demo mode, use cookies
    //         const getCookie = (name: string): string | null => {
    //             if (typeof document === 'undefined') return null;
    //             const value = `; ${document.cookie}`;
    //             const parts = value.split(`; ${name}=`);
    //             if (parts.length === 2) {
    //                 const cookieValue = parts.pop()?.split(';').shift();
    //                 return cookieValue ? decodeURIComponent(cookieValue) : null;
    //             }
    //             return null;
    //         };
    //         const stored = getCookie('layoutPosition');
    //         if (stored === 'left' || stored === 'right') {
    //             storedPosition = stored;
    //         }
    //     } else {
    //         // In normal mode, get from database via globalSettings
    //         const stored = globalSettings?.layoutDirection;
    //         if (stored === 'left' || stored === 'right') {
    //             storedPosition = stored;
    //         }
    //     }

    //     const dir = storedPosition === 'right' ? 'rtl' : 'ltr';
    //     document.documentElement.dir = dir;
    //     document.documentElement.setAttribute('dir', dir);

    //     // Check if it was actually set
    //     setTimeout(() => {
    //         const actualDir = document.documentElement.getAttribute('dir');
    //         if (actualDir !== dir) {
    //             document.documentElement.dir = dir;
    //             document.documentElement.setAttribute('dir', dir);
    //         }
    //     }, 1);
    // }, []);
    const { url } = usePage();
    const isLoginPage = url.includes('login') || url === '/' || url === '';
    const isRegisterPage = url.includes('register');
    const isForgotPasswordPage = url.includes('forgot-password') || url.includes('password/reset');
    const isResetPasswordPage = url.includes('reset-password');
    const isCenteredHeader = isForgotPasswordPage || isResetPasswordPage;

    // RTL Support for auth pages - Apply immediately and persist
    const applyRTLDirection = React.useCallback(() => {
        const isDemo = globalSettings?.is_demo || false;
        const currentLang = i18n.language || userLanguage || globalSettings?.defaultLanguage || 'en';
        const isRTLLanguage = ['ar', 'he'].includes(currentLang);
        let dir = 'ltr';

        const getCookie = (name: string): string | null => {
            if (typeof document === 'undefined') return null;
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                const cookieValue = parts.pop()?.split(';').shift();
                return cookieValue ? decodeURIComponent(cookieValue) : null;
            }
            return null;
        };

        // Check RTL setting from cookies/globalSettings
        const layoutDirection = isDemo ? getCookie('layoutPosition') : globalSettings?.layoutDirection;
        const isRTLSetting = layoutDirection === 'right';

        // Apply RTL if: 1) Language is ar/he OR 2) RTL setting is enabled
        if (isRTLLanguage || isRTLSetting) {
            dir = 'rtl';
        }

        // Apply direction immediately
        document.documentElement.dir = dir;
        document.documentElement.setAttribute('dir', dir);
        document.body.dir = dir;

        return dir;
    }, [i18n.language, userLanguage, globalSettings?.defaultLanguage, globalSettings?.is_demo, globalSettings?.layoutDirection]);

    // Apply RTL on mount, when dependencies change, and on custom languageChanged events
    React.useLayoutEffect(() => {
        const direction = applyRTLDirection();

        const handleLanguageChanged = () => {
            applyRTLDirection();
        };

        window.addEventListener('languageChanged', handleLanguageChanged);

        // Ensure direction persists after any DOM changes
        const observer = new MutationObserver(() => {
            if (document.documentElement.dir !== direction) {
                document.documentElement.dir = direction;
                document.documentElement.setAttribute('dir', direction);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir']
        });
        // return () => observer.disconnect();
        return () => {
            window.removeEventListener('languageChanged', handleLanguageChanged);
            observer.disconnect();
            document.documentElement.dir = 'ltr';
            document.documentElement.setAttribute('dir', 'ltr');
            document.body.dir = 'ltr';
        };
    }, [applyRTLDirection]);

    return (
        <div className="min-h-[100dvh] h-[100dvh] overflow-hidden flex flex-col [@media(min-width:769px)]:flex-row w-full bg-white dark:bg-gray-900 ltr:text-left rtl:text-right font-sans">
            <Head title={title} />

            {/* Left Side (Form) */}
            <div className="w-full [@media(min-width:769px)]:w-[50%] xl:w-[45%] flex flex-col justify-between h-full p-4 sm:p-6 [@media(max-height:850px)]:p-2 [@media(max-height:620px)]:p-1 lg:p-8 [@media(max-width:1300px)]:p-4 [@media(max-height:850px)]:p-3 [@media(max-height:620px)]:p-1 relative overflow-hidden">
                {/* Language Switcher for Mobile */}
                <div className="absolute top-6 end-6 z-20 bg-white dark:bg-gray-800 rounded-md shadow-sm [@media(min-width:768px)]:hidden">
                    <LanguageSwitcher />
                </div>

                {/* Header - Logo */}
                <div className="flex justify-center">
                    <div className="inline-block">
                        {currentLogo ? (
                            <img src={getImagePath(currentLogo)} alt="Logo" className="h-30 sm:h-30 [@media(max-height:850px)]:h-20 [@media(max-height:620px)]:h-14 w-auto max-w-[100px] object-contain auth-logo" />
                        ) : (
                            <div className="flex items-center justify-center space-x-2">
                                <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 [@media(max-height:850px)]:h-8 [@media(max-height:850px)]:w-8 [@media(max-height:620px)]:h-6 [@media(max-height:620px)]:w-6 auth-logo-icon" style={{ color: primaryColor }} />
                                <span className="text-3xl sm:text-4xl [@media(max-height:850px)]:text-2xl [@media(max-height:620px)]:text-xl font-bold text-gray-900 dark:text-white tracking-tight auth-logo-text">HRM</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Form Content */}
                <div className={`flex-1 flex flex-col justify-center w-full max-w-lg mx-auto py-4 [@media(max-height:680px)]:py-1 ltr:text-left rtl:text-right`}>
                    <div className={`flex flex-col ${isCenteredHeader ? 'items-center text-center' : 'items-start ltr:text-left rtl:text-right'}`}>
                        {icon && (
                            <div className={`mb-4 [@media(max-height:680px)]:mb-1 flex items-center justify-center rounded-full auth-icon ${isCenteredHeader ? 'h-16 w-16' : 'h-12 w-12'}`} style={{ backgroundColor: `${primaryColor}20` }}>
                                {icon}
                            </div>
                        )}
                        <h1 className="text-[28px] [@media(max-height:850px)]:text-[20px] [@media(max-height:620px)]:text-[16px] font-bold text-gray-900 dark:text-white mb-2 [@media(max-height:680px)]:mb-0.5 auth-title">{title}</h1>
                        <div className={`w-8 h-1 mb-3 [@media(max-height:680px)]:mb-1 ${isCenteredHeader ? 'mx-auto' : ''}`} style={{ backgroundColor: primaryColor }}></div>
                        {description && (
                            <p className="text-gray-500 dark:text-gray-400 mb-8 [@media(max-height:850px)]:mb-2 [@media(max-height:620px)]:mb-1 [@media(max-height:850px)]:text-xs auth-desc">{description}</p>
                        )}
                    </div>

                    {status && (
                        <div className={`mb-6 [@media(max-height:680px)]:mb-2 text-sm font-medium ${statusType === 'success' ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/40' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/40'} p-3 [@media(max-height:680px)]:p-1.5 rounded-lg border`}>
                            {status}
                        </div>
                    )}

                    {children}
                </div>

                {/* Footer - Copyright Info */}
                <div className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm text-center">
                    {footerText || `© ${new Date().getFullYear()} ${globalSettings?.company_name || 'HRM SaaS'}. ${t("All rights reserved.")}`}
                </div>
            </div>

            {/* Right Side (Graphics/Promotional for HRM) */}
            <div className="hidden [@media(min-width:769px)]:flex flex-col w-full [@media(min-width:769px)]:w-[50%] xl:w-[55%] bg-slate-50 dark:bg-gray-950 items-center justify-start py-8 lg:py-12 [@media(max-width:1300px)]:py-6 [@media(max-height:850px)]:py-4 [@media(max-height:620px)]:py-2 px-8 lg:px-12 [@media(max-width:1300px)]:px-6 [@media(max-height:850px)]:px-4 [@media(max-height:620px)]:px-2 relative overflow-hidden">
                {/* Language Switcher for Desktop */}
                <div className="absolute top-6 end-6 lg:top-12 lg:end-12 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <LanguageSwitcher />
                </div>

                {/* Promotional Content */}
                <div className="w-full max-w-[800px] z-10 my-auto">
                    {isLoginPage && (
                        <>
                            <h2 className="text-xl lg:text-2xl xl:text-[40px] font-bold text-[#1E293B] dark:text-white mb-1.5 lg:mb-3 xl:mb-5 leading-tight">
                                {t("Manage Your Workforce")}<br />
                                {t("Smarter with")} <span style={{ color: primaryColor }}>{t(titleText || 'HRM SaaS')}</span>
                            </h2>
                            <p className="text-[#475569] dark:text-gray-300 text-xs lg:text-sm xl:text-lg mb-3 lg:mb-5 xl:mb-8 max-w-lg leading-normal xl:leading-relaxed">
                                {t("Streamline employee management, attendance tracking, payroll, performance, and daily operations – all in one powerful platform.")}
                            </p>

                            {/* Cards wrapper */}
                            <div className="space-y-2 lg:space-y-3 xl:space-y-4 max-w-[100%] lg:max-w-[95%] mx-auto">
                                {/* Main HR Overview Card */}
                                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100/50 dark:border-gray-700 p-2.5 sm:p-3 lg:p-4 xl:p-6">
                                    <div className="flex items-center mb-2 lg:mb-3 xl:mb-4">
                                        <div className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 rounded-lg dark:bg-gray-800 flex items-center justify-center ltr:mr-2 rtl:ml-2 xl:ltr:mr-2.5 xl:rtl:ml-2.5" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <Users className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4" style={{ color: primaryColor }} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-xs lg:text-sm xl:text-lg">{t("HR Workflow Overview")}</h3>
                                    </div>

                                    {/* Workflow Steps Row */}
                                    <div className="grid grid-cols-2 xl:grid-cols-4 items-center justify-between gap-1.5 lg:gap-2 xl:gap-3 mb-2 lg:mb-3 xl:mb-5">
                                        {/* Step 1 */}
                                        <div className="min-w-0 flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-1.5 lg:p-2 xl:p-3 shadow-sm bg-white dark:bg-gray-800 min-h-[60px] lg:min-h-[75px] xl:min-h-[90px] h-auto">
                                            <div className="flex items-center mb-0.5 xl:mb-1">
                                                <UserCheck className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4.5 xl:h-4.5" style={{ color: primaryColor }} />
                                                <span className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white ltr:ml-1 rtl:mr-1 truncate line-clamp-1">{t("Onboarding")}</span>
                                            </div>
                                            <div>
                                                <div className="text-sm lg:text-lg xl:text-xl font-bold mb-0.5 xl:mb-1" style={{ color: primaryColor }}>34</div>
                                                <div className="h-1 xl:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full w-full rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="min-w-0 flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-1.5 lg:p-2 xl:p-3 shadow-sm bg-white dark:bg-gray-800 min-h-[60px] lg:min-h-[75px] xl:min-h-[90px] h-auto">
                                            <div className="flex items-center mb-0.5 xl:mb-1">
                                                <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4.5 xl:h-4.5" style={{ color: primaryColor }} />
                                                <span className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white ltr:ml-1 rtl:mr-1 truncate line-clamp-1">{t("Attendance")}</span>
                                            </div>
                                            <div>
                                                <div className="text-sm lg:text-lg xl:text-xl font-bold mb-0.5 xl:mb-1" style={{ color: primaryColor }}>96%</div>
                                                <div className="h-1 xl:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full w-11/12 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="min-w-0 flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-1.5 lg:p-2 xl:p-3 shadow-sm bg-white dark:bg-gray-800 min-h-[60px] lg:min-h-[75px] xl:min-h-[90px] h-auto">
                                            <div className="flex items-center mb-0.5 xl:mb-1">
                                                <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4.5 xl:h-4.5 flex-shrink-0" style={{ color: primaryColor }} />
                                                <span className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white ltr:ml-1 rtl:mr-1 truncate line-clamp-1">{t("Leaves")}</span>
                                            </div>
                                            <div>
                                                <div className="text-sm lg:text-lg xl:text-xl font-bold mb-0.5 xl:mb-1" style={{ color: primaryColor }}>12</div>
                                                <div className="h-1 xl:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 4 */}
                                        <div className="min-w-0 flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-1.5 lg:p-2 xl:p-3 shadow-sm bg-white dark:bg-gray-800 min-h-[60px] lg:min-h-[75px] xl:min-h-[90px] h-auto">
                                            <div className="flex items-center mb-0.5 xl:mb-1">
                                                <Award className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4.5 xl:h-4.5" style={{ color: primaryColor }} />
                                                <span className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white ltr:ml-1 rtl:mr-1 truncate line-clamp-1">{t("Payroll Done")}</span>
                                            </div>
                                            <div>
                                                <div className="text-sm lg:text-lg xl:text-xl font-bold mb-0.5 xl:mb-1" style={{ color: primaryColor }}>100%</div>
                                                <div className="h-1 xl:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full w-full rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lower Stats Row */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 lg:gap-3 xl:gap-4 mt-2 lg:mt-3 xl:mt-6">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg xl:rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] xl:shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-200 dark:border-gray-700 p-2 lg:p-3 xl:p-4 flex items-center">
                                            <div className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-full dark:bg-gray-900 flex items-center justify-center ltr:mr-2.5 rtl:ml-2.5 xl:ltr:mr-4 xl:rtl:ml-4 flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                                <Users className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" style={{ color: primaryColor }} />
                                            </div>
                                            <div>
                                                <div className="text-[11px] lg:text-xs xl:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5">{t("Active Employees")}</div>
                                                <div className="text-base lg:text-xl xl:text-3xl font-bold text-gray-400">142 <span className="text-[10px] xl:text-xs font-normal">{t("members")}</span></div>
                                                <div className="text-[10px] lg:text-[11px] xl:text-[12px] font-semibold mt-0.5" style={{ color: primaryColor }}>↑ 8.5% <span className="text-gray-400 font-normal">{t("this quarter")}</span></div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-lg xl:rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] xl:shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-200 dark:border-gray-700 p-2 lg:p-3 xl:p-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-[11px] lg:text-xs xl:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5">{t("Payroll Processed")}</div>
                                                <div className="text-base lg:text-xl xl:text-3xl font-bold" style={{ color: primaryColor }}>$58,400</div>
                                                <div className="text-[10px] lg:text-[11px] xl:text-[12px] font-semibold mt-0.5 flex items-center" style={{ color: primaryColor }}>
                                                    <svg className="w-2.5 h-2.5 xl:w-3 xl:h-3 ltr:mr-0.5 rtl:ml-0.5 xl:ltr:mr-1 xl:rtl:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                                                    100% <span className="text-gray-400 ltr:ml-1 rtl:mr-1 font-normal">{t("on time")}</span>
                                                </div>
                                            </div>
                                            <div className="h-8 w-16 lg:h-10 lg:w-20 xl:h-12 xl:w-24">
                                                <svg viewBox="0 0 100 40" className="w-full h-full fill-none overflow-visible" style={{ stroke: primaryColor }} strokeWidth="2.5" preserveAspectRatio="none">
                                                    <path d="M0,35 L10,32 L20,38 L30,25 L40,28 L50,15 L60,20 L70,10 L80,12 L90,2 L100,0" strokeLinecap="round" strokeLinejoin="round" />
                                                    <circle cx="100" cy="0" r="3" style={{ fill: primaryColor, stroke: 'none' }} />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Icons Row */}
                                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 lg:gap-3 xl:gap-4 mt-2 xl:mt-4 pt-1 xl:pt-2">
                                    <div className="text-center">
                                        <div className="w-8 h-8 lg:w-9 lg:h-9 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1 xl:mb-3" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" style={{ color: primaryColor }} />
                                        </div>
                                        <div className="text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white mb-0.5 xl:mb-1">{t("Employee Database")}</div>
                                        <div className="text-[10px] xl:text-[11px] text-gray-500 dark:text-gray-400 leading-tight xl:leading-relaxed px-1">{t("Manage records, documents, and profiles securely.")}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-8 h-8 lg:w-9 lg:h-9 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1 xl:mb-3" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" style={{ color: primaryColor }} />
                                        </div>
                                        <div className="text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white mb-0.5 xl:mb-1">{t("Attendance & Leaves")}</div>
                                        <div className="text-[10px] xl:text-[11px] text-gray-500 dark:text-gray-400 leading-tight xl:leading-relaxed px-1">{t("Track work hours, shifts, and leave approvals.")}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-8 h-8 lg:w-9 lg:h-9 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1 xl:mb-3" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <FileText className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" style={{ color: primaryColor }} />
                                        </div>
                                        <div className="text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white mb-0.5 xl:mb-1">{t("Payroll & Payslips")}</div>
                                        <div className="text-[10px] xl:text-[11px] text-gray-500 dark:text-gray-400 leading-tight xl:leading-relaxed px-1">{t("Automate salaries, allowances, and payslip generation.")}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-8 h-8 lg:w-9 lg:h-9 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1 xl:mb-3" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <Award className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" style={{ color: primaryColor }} />
                                        </div>
                                        <div className="text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white mb-0.5 xl:mb-1">{t("Performance & HR")}</div>
                                        <div className="text-[10px] xl:text-[11px] text-gray-500 dark:text-gray-400 leading-tight xl:leading-relaxed px-1">{t("Evaluate goals, feedback, and organizational growth.")}</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {isRegisterPage && (
                        <div className="w-full">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl lg:text-[38px] font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                    {t("Empower Your HR Operations")}<br />
                                    {t("in")} <span style={{ color: primaryColor }}>{t("One Place")}</span>
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-[15px] max-w-md mx-auto leading-relaxed">
                                    {t("Streamline employee management, attendance, payroll, and team productivity from one modern platform.")}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                                {/* Card 1 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Users className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">{t("Employee Management")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Centralize employee profiles, departments, and roles.")}</p>
                                    </div>
                                </div>

                                {/* Card 2 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Clock className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">{t("Attendance & Leaves")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Track work hours, shifts, and approve leave requests.")}</p>
                                    </div>
                                </div>

                                {/* Card 3 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <FileText className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">{t("Payroll Management")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Automate salary calculations, allowances, and payslips.")}</p>
                                    </div>
                                </div>

                                {/* Card 4 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Award className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">{t("Performance & Growth")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Assess performance goals, feedback, and employee growth.")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isForgotPasswordPage && (
                        <div className="w-full">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl lg:text-[36px] font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                    {t("Get Back to")} <span style={{ color: primaryColor }}>{t("Your HR Portal")}</span>
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-[15px] max-w-md mx-auto leading-relaxed">
                                    {t("Forgot your password? Recover your account securely and get back to managing your workforce effectively.")}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
                                {/* Card 1 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <ShieldCheck className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1.5">{t("Verify Your Account")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Confirm your email details securely.")}</p>
                                    </div>
                                </div>

                                {/* Card 2 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <LinkIcon className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1.5">{t("Recover Access")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Receive a password reset link directly to your inbox.")}</p>
                                    </div>
                                </div>

                                {/* Card 3 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Briefcase className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1.5">{t("Keep HR Operations Running")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Return to your daily attendance, payroll, and tasks.")}</p>
                                    </div>
                                </div>

                                {/* Card 4 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Users className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1.5">{t("Stay Connected")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Reconnect with your employees and HR team.")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="w-10 h-0.5 mx-auto mb-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                <span className="text-[15px] text-gray-500 dark:text-gray-400">{t("Your HR workspace is only a step away.")}</span>
                            </div>
                        </div>
                    )}

                    {isResetPasswordPage && (
                        <div className="w-full">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl lg:text-[36px] font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                    {t("A Fresh Start for")} <span style={{ color: primaryColor }}>{t("Secure HR Access")}</span>
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-[15px] max-w-md mx-auto leading-relaxed">
                                    {t("Create a new password and get back to managing your workforce with confidence.")}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
                                {/* Card 1 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <ShieldCheck className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1.5">{t("Protect Your Data")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Keep sensitive employee records secure.")}</p>
                                    </div>
                                </div>

                                {/* Card 2 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Clock className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1.5">{t("Manage Time & Attendance")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Return to work logs, shifts, and leaves.")}</p>
                                    </div>
                                </div>

                                {/* Card 3 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <FileText className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1.5">{t("Process Payroll")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Continue managing salaries and payslips.")}</p>
                                    </div>
                                </div>

                                {/* Card 4 */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start rtl:space-x-reverse space-x-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Users className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1.5">{t("Stay Connected")}</h4>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Return to your employees and HR team.")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="w-10 h-0.5 mx-auto mb-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                <span className="text-[15px] text-gray-500 dark:text-gray-400">{t("One secure account. Everything your HR operations need.")}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 ltr:right-0 rtl:left-0 ltr:-mt-20 rtl:-mt-20 ltr:-mr-20 rtl:-ml-20 w-[600px] h-[600px] rounded-full mix-blend-multiply opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: primaryColor }}></div>

                <div className="absolute top-12 ltr:right-24 rtl:left-24 opacity-20 pointer-events-none">
                    <svg width="80" height="80" fill="none" viewBox="0 0 80 80">
                        <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" style={{ color: primaryColor }} />
                        </pattern>
                        <rect x="0" y="0" width="80" height="80" fill="url(#dots)" />
                    </svg>
                </div>

                <div className="absolute bottom-0 ltr:left-0 rtl:right-0 ltr:-mb-20 rtl:-mb-20 ltr:-ml-20 rtl:-mr-20 w-[400px] h-[400px] rounded-full mix-blend-multiply opacity-[0.05] blur-3xl pointer-events-none" style={{ backgroundColor: primaryColor }}></div>
                <div className="absolute bottom-0 ltr:right-0 rtl:left-0 ltr:-mb-20 rtl:-mb-20 ltr:-mr-20 rtl:-ml-20 w-[400px] h-[400px] rounded-full mix-blend-multiply opacity-[0.05] blur-3xl pointer-events-none" style={{ backgroundColor: primaryColor }}></div>

                <div className="absolute bottom-12 ltr:left-24 rtl:right-24 opacity-20 pointer-events-none">
                    <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                        <pattern id="dots-bl" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" style={{ color: primaryColor }} />
                        </pattern>
                        <rect x="0" y="0" width="48" height="48" fill="url(#dots-bl)" />
                    </svg>
                </div>

                <div className="absolute bottom-12 ltr:right-24 rtl:left-24 opacity-20 pointer-events-none">
                    <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                        <pattern id="dots-br" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" style={{ color: primaryColor }} />
                        </pattern>
                        <rect x="0" y="0" width="48" height="48" fill="url(#dots-br)" />
                    </svg>
                </div>
            </div>

            <CookieConsentBanner />
        </div>
    );
}