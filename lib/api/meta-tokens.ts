import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { logger } from '@/lib/logger';

type MetaPlatform = 'whatsapp' | 'instagram' | 'facebook';

interface SocialConnection {
  id: string;
  access_token: string;
  token_expires_at: string | null;
  metadata: Record<string, any> | null;
}

/**
 * Exchange a short-lived Meta token (~1 hour) for a long-lived one (~60 days).
 * Uses the same Graph API endpoint for both initial exchange and refresh.
 */
export async function exchangeForLongLivedToken(
  shortToken: string,
  platform: MetaPlatform
): Promise<{ access_token: string; expires_in: number }> {
  // Instagram may have separate app credentials
  const appId = platform === 'instagram'
    ? (process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID)
    : process.env.META_APP_ID;
  const appSecret = platform === 'instagram'
    ? (process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET)
    : process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(`Missing Meta app credentials for ${platform}`);
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${appId}&` +
    `client_secret=${appSecret}&` +
    `fb_exchange_token=${shortToken}`
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    logger.error('Failed to exchange for long-lived token', undefined, {
      platform,
      error: data.error,
    });
    throw new Error(data.error?.message || 'Failed to exchange for long-lived token');
  }

  logger.info('Exchanged for long-lived token', {
    platform,
    expiresIn: data.expires_in,
  });

  return {
    access_token: data.access_token,
    expires_in: data.expires_in || 5184000, // Default 60 days
  };
}

/**
 * Refresh a Meta long-lived token. Uses the same fb_exchange_token endpoint.
 * Updates the social_connections row with the new token and expiry.
 *
 * For Instagram: also refreshes the long_lived_user_token in metadata
 * and re-derives the page token.
 */
export async function refreshMetaToken(
  connectionId: string,
  currentToken: string,
  platform: MetaPlatform
): Promise<string> {
  const { access_token, expires_in } = await exchangeForLongLivedToken(currentToken, platform);
  const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  if (platform === 'instagram') {
    // For Instagram, the token we refresh is the long-lived USER token.
    // We need to re-fetch pages to get the new page token.
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${access_token}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.data && pagesData.data.length > 0) {
      // Get the current connection to find which page we're using
      const { data: conn } = await supabaseAdmin
        .from('social_connections')
        .select('metadata')
        .eq('id', connectionId)
        .single();

      const pageId = conn?.metadata?.page_id;
      const page = pageId
        ? pagesData.data.find((p: any) => p.id === pageId) || pagesData.data[0]
        : pagesData.data[0];

      await supabaseAdmin
        .from('social_connections')
        .update({
          access_token: page.access_token, // Page token (permanent when derived from long-lived user token)
          token_expires_at: tokenExpiresAt, // Track user token expiry for refresh scheduling
          metadata: {
            ...conn?.metadata,
            long_lived_user_token: access_token,
          },
        })
        .eq('id', connectionId);

      logger.info('Refreshed Instagram tokens', { connectionId });
      return page.access_token;
    } else {
      // Fallback: just store the user token directly
      await supabaseAdmin
        .from('social_connections')
        .update({
          access_token: access_token,
          token_expires_at: tokenExpiresAt,
        })
        .eq('id', connectionId);

      logger.warn('No pages found during Instagram token refresh, stored user token directly', { connectionId });
      return access_token;
    }
  } else {
    // WhatsApp / Facebook: straightforward token update
    await supabaseAdmin
      .from('social_connections')
      .update({
        access_token: access_token,
        token_expires_at: tokenExpiresAt,
      })
      .eq('id', connectionId);

    logger.info('Refreshed Meta token', { connectionId, platform });
    return access_token;
  }
}

/**
 * Check-and-refresh guard. Call before every Meta API call.
 * - If token expires within 7 days, silently refresh.
 * - If already expired and refresh fails, throw "please reconnect" error.
 * - If refresh fails but token still valid, log warning and continue.
 *
 * Returns the valid access_token to use.
 */
export async function ensureValidMetaToken(
  connection: SocialConnection,
  platform: MetaPlatform
): Promise<string> {
  // If no expiry tracked, token is assumed permanent (e.g. page tokens)
  if (!connection.token_expires_at) {
    return connection.access_token;
  }

  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Token is still valid and not approaching expiry
  if (expiresAt > sevenDaysFromNow) {
    return connection.access_token;
  }

  // Token expires within 7 days or is already expired — try to refresh
  const isExpired = expiresAt <= now;
  const tokenToRefresh = platform === 'instagram'
    ? (connection.metadata?.long_lived_user_token || connection.access_token)
    : connection.access_token;

  try {
    logger.info('Refreshing Meta token', {
      connectionId: connection.id,
      platform,
      isExpired,
      expiresAt: expiresAt.toISOString(),
    });

    const newToken = await refreshMetaToken(connection.id, tokenToRefresh, platform);
    return newToken;
  } catch (refreshError: any) {
    if (isExpired) {
      // Token is expired AND refresh failed — no way to recover
      throw new Error(
        `${platform} token expired and refresh failed. Please reconnect your ${platform} account in Settings.`
      );
    }

    // Token still valid but refresh failed — log warning and continue with current token
    logger.warn('Meta token refresh failed, but token still valid', {
      connectionId: connection.id,
      platform,
      error: refreshError.message,
    });
    return connection.access_token;
  }
}
