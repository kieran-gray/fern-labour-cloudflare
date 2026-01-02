import { AppShell } from '@components/AppShell';
import { ContactUs } from './ContactUs';
import baseClasses from '@styles/base.module.css';

export const ContactPage = () => {
  return (
    <AppShell>
      <div className={baseClasses.flexPageColumn}>
        <ContactUs />
      </div>
    </AppShell>
  );
};
