/**
 * Centralized utilities for the application
 */

// Constants
export {
  appRoutes,
  EMAIL_REGEX,
  EMAIL_MAX_LENGTH,
  LABOUR_NAME_MAX_LENGTH,
  LABOUR_UPDATE_MAX_LENGTH,
  CONTACT_MESSAGE_MAX_LENGTH,
} from './constants';

// Errors
export { NotFoundError, PermissionDenied } from './errors';

// UUID
export { uuidv7 } from './uuid';

// Formatting utilities
export {
  dueDateToGestationalAge,
  formatTimeMilliseconds,
  formatTimeSeconds,
  formatDurationHuman,
  formatDateTime,
  pluraliseName,
} from './formatting';

// Validation utilities
export { validateEmail, validateMessage, validateLabourName } from './validation';

// Calculation utilities
export {
  getTimeSinceLastStarted,
  secondsElapsed,
  contractionDurationSeconds,
  updateTime,
} from './calculations';

// Sorting utilities
export { sortContractions, sortLabours } from './sorting';

// Alert utilities
export { calculateAlerts } from './alerts';
export type { AlertType, AlertState } from './alerts';
