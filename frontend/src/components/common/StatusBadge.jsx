import { useTranslation } from 'react-i18next';
import Badge from './Badge';

const statusConfig = {
  waiting: { variant: 'warning', dot: true },
  called: { variant: 'primary', dot: true },
  serving: { variant: 'success', dot: true },
  completed: { variant: 'secondary', dot: false },
  cancelled: { variant: 'danger', dot: false },
  no_show: { variant: 'secondary', dot: false },
  active: { variant: 'success', dot: true },
  inactive: { variant: 'secondary', dot: false },
  online: { variant: 'success', dot: true },
  offline: { variant: 'secondary', dot: false },
  busy: { variant: 'warning', dot: true },
  available: { variant: 'success', dot: true },
};

export default function StatusBadge({ status, className }) {
  const { t } = useTranslation();
  const config = statusConfig[status] || { variant: 'secondary', dot: false };

  return (
    <Badge variant={config.variant} dot={config.dot} className={className}>
      {t(`status.${status}`)}
    </Badge>
  );
}
