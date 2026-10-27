import { ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaymentMethodCardProps {
  title: string;
  icon: ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: ReactNode;
  helpUrl?: string;
  helpText?: string;
}

export function PaymentMethodCard({
  title,
  icon,
  enabled,
  onToggle,
  children,
  helpUrl,
  helpText
}: PaymentMethodCardProps) {
  const { t } = useTranslation();

  return (
    <div className="border rounded-lg">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between p-4 border-b gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0">{icon}</div>
          <span className="font-medium text-sm sm:text-base break-words leading-tight">{title}</span>
        </div>
        <div className="flex items-center justify-between xl:justify-end gap-2 pt-2 xl:pt-0 border-t xl:border-t-0 border-border/50">
          <span className="text-xs text-muted-foreground xl:hidden">{t("Enable Payment Method")}</span>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </div>
      {enabled && (
        <div className="p-4 space-y-4">
          {helpUrl && helpText && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {helpText}{' '}
                <a
                  href={helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {t("Dashboard")}
                </a>
              </AlertDescription>
            </Alert>
          )}
          {children}
        </div>
      )}
    </div>
  );
}