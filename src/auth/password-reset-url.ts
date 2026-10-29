export function passwordResetFrontend(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  try {
    const url = new URL(
      env.PASSWORD_RESET_FRONTEND_URL ||
        env.FRONTEND_URL ||
        'http://localhost:3000',
    );
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    const hostname = url.hostname.replace(/\.$/, '');
    const local =
      ['localhost', '[::1]', '0.0.0.0'].includes(hostname) ||
      /^127\./.test(hostname) ||
      hostname.endsWith('.localhost');
    if (env.NODE_ENV === 'production' && (url.protocol !== 'https:' || local))
      return null;
    return url.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}
