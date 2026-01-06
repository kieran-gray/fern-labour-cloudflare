export const appRoutes = {
  home: '/',
  notFound: '/*',
  history: '/history',
  subscribe: '/s/:id/:token',
  contact: '/contact',
  completed: '/completed',
} as const;

export const EMAIL_REGEX = /^[\w-+.]+@([\w-]+.)+[\w-]{2,4}$/;
export const EMAIL_MAX_LENGTH = 254;
export const LABOUR_NAME_MAX_LENGTH = 255;
export const LABOUR_UPDATE_MAX_LENGTH = 1000;
export const CONTACT_MESSAGE_MAX_LENGTH = 5000;
