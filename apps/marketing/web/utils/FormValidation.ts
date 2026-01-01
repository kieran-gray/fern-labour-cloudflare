const EMAIL_REGEX = /^[\w-+.]+@([\w-]+.)+[\w-]{2,4}$/;

const EMAIL_MAX_LENGTH = 254;
const NAME_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 5000;

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email) && email.length <= EMAIL_MAX_LENGTH;
}

export function validateName(name: string): string | null {
  if (name.length > NAME_MAX_LENGTH) {
    return `Name exceeds maximum length of ${NAME_MAX_LENGTH} characters`;
  }
  return null;
}

export function validateMessage(message: string): string | null {
  if (message.length > MESSAGE_MAX_LENGTH) {
    return `Message exceeds maximum length of ${MESSAGE_MAX_LENGTH} characters.`;
  }
  return null;
}
