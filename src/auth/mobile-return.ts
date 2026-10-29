const NATIVE_RETURN = 'soma://oauth';

export function mobileReturnUrl(input = NATIVE_RETURN): string | null {
  try {
    const url = new URL(input);
    if (url.username || url.password || url.search || url.hash) return null;
    const allowed = [
      NATIVE_RETURN,
      ...(process.env.MOBILE_OAUTH_RETURN_URLS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ];
    if (!allowed.includes(input)) return null;
    if (input === NATIVE_RETURN) return input;
    if (!['exp:', 'exps:', 'https:', 'http:'].includes(url.protocol))
      return null;
    // Every development/browser address must be explicitly configured by the server owner.
    if (
      ['exp:', 'exps:'].includes(url.protocol) &&
      url.pathname !== '/--/oauth'
    )
      return null;
    if (['https:', 'http:'].includes(url.protocol) && url.pathname !== '/oauth')
      return null;
    return input;
  } catch {
    return null;
  }
}
