import { SessionLaunchFormImpl } from '@/app/implementation/sessionLaunchForm';
import { SessionLaunchFormProps } from '@/app/types/SessionLaunchFormProps';

export function SessionLaunchForm(props: SessionLaunchFormProps) {
  return <SessionLaunchFormImpl {...props} />;
}
