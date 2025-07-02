import { makeEnvironmentProviders } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { ToastService } from '../services/toast.service';

export interface NotificationConfig {
  position: 'top-right' | 'bottom-right' | 'bottom-center';
  duration: number;
  soundEnabled: boolean;
}

export function provideNotifications(config?: Partial<NotificationConfig>) {
  const defaultConfig: NotificationConfig = {
    position: 'bottom-right',
    duration: 5000,
    soundEnabled: true,
    ...config
  };
  
  return makeEnvironmentProviders([
    {
      provide: 'NOTIFICATION_CONFIG',
      useValue: defaultConfig
    },
    NotificationService,
    ToastService
  ]);
}