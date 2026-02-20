import { IconBrandWhatsapp, IconMessageCircle } from '@tabler/icons-react';
import { Text } from '@mantine/core';
import classes from './ContactMethods.module.css';

export interface MethodProps {
  type: 'WHATSAPP' | 'SMS';
}

function getMethodConfig(method: 'WHATSAPP' | 'SMS') {
  switch (method) {
    case 'WHATSAPP':
      return {
        name: 'WhatsApp',
        icon: IconBrandWhatsapp,
        dataMethod: 'whatsapp',
      };
    case 'SMS':
      return {
        name: 'Text Message',
        icon: IconMessageCircle,
        dataMethod: 'sms',
      };
    default:
      return null;
  }
}

export function ContactMethodItem({ type }: MethodProps) {
  const currentMethod = getMethodConfig(type);
  if (!currentMethod) {
    return null;
  }

  return (
    <div className={classes.currentMethod}>
      <div className={classes.methodInfo}>
        <div className={classes.methodIconWrapper} data-method={currentMethod.dataMethod}>
          <currentMethod.icon size={22} />
        </div>
        <div className={classes.methodDetails} style={{ textAlign: 'start' }}>
          <Text className={classes.methodName} style={{ paddingLeft: '2px' }}>
            {currentMethod.name}
          </Text>
          <Text className={classes.methodStatus} data-active>
            Notifications enabled
          </Text>
        </div>
      </div>
    </div>
  );
}
