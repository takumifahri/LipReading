export const LANG_COOKIE = 'lip_lang';
export const THEME_COOKIE = 'lip_theme';
export const COOKIE_OK = 'lip_cookie_ok';

export function readCookie(name) {
  if (typeof document === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1] || null;
}

export function writeCookie(name, value) {
  document.cookie = `${name}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

export function getInitialLanguage() {
  const savedLang = readCookie(LANG_COOKIE);
  return savedLang === 'id' || savedLang === 'en' ? savedLang : 'en';
}

export function getInitialTheme() {
  const savedTheme = readCookie(THEME_COOKIE);
  return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
}

export function getInitialCookiePanel() {
  return readCookie(COOKIE_OK) !== 'true';
}
