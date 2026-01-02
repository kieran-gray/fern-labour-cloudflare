import baseClasses from '@styles/base.module.css';

const Base = {
  radius: 'lg',
  classNames: { description: baseClasses.description },
};

export const Error = {
  ...Base,
  color: 'var(--mantine-primary-color-7)',
  style: { backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-gray-8))' },
};

export const Success = {
  ...Base,
  color: 'var(--mantine-color-green-3)',
  style: { backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-gray-8))' },
};
