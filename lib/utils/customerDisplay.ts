import type { Conversation } from '@/lib/api/supabase';

/**
 * Generates a display name for a customer based on available data
 * Priority:
 * 1. If customer_name looks like @username (not all numbers), use it
 * 2. If customer_email exists, use the part before @
 * 3. If customer_phone exists, use it
 * 4. If customer_name is Instagram ID (all numbers), prefix with "User "
 * 5. Fall back to customer_name as-is
 */
export function getCustomerDisplayName(conversation: Conversation | {
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_instagram_id?: string | null;
  channel: string;
}): string {
  const { customer_name, customer_email, customer_phone, customer_instagram_id, channel } = conversation;

  // Check if customer_name is all digits (Instagram ID)
  const isNumericId = /^\d+$/.test(customer_name.replace('@', ''));

  // If it's an Instagram channel and name is numeric (the ID), try alternatives
  if (channel === 'instagram' && isNumericId) {
    // For Instagram, show as "User [ID]" or use email/phone if available
    if (customer_email) {
      const emailUsername = customer_email.split('@')[0];
      return `${emailUsername} (via Instagram)`;
    }
    if (customer_phone) {
      return `${customer_phone} (via Instagram)`;
    }
    // Last resort: show as "User [ID]"
    return `User ${customer_instagram_id || customer_name}`;
  }

  // If customer_name is a username (has @ and not all digits), use it
  if (customer_name.startsWith('@') && !isNumericId) {
    return customer_name;
  }

  // For other channels, use email or phone if name seems like an ID
  if (isNumericId) {
    if (customer_email) {
      return customer_email.split('@')[0];
    }
    if (customer_phone) {
      return customer_phone;
    }
  }

  // Default: use customer_name as-is
  return customer_name;
}

/**
 * Gets the initials for a customer avatar
 */
export function getCustomerInitials(displayName: string): string {
  // Remove @ symbol if present
  const cleanName = displayName.replace('@', '');

  // If it starts with "User ", use "U"
  if (cleanName.startsWith('User ')) {
    return 'U';
  }

  // Get first character, uppercase
  return cleanName.charAt(0).toUpperCase();
}
