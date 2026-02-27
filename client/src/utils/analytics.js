function loadScriptOnce(src, attrs = {}) {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`script[src="${src}"]`)) return;

  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    s.setAttribute(k, String(v));
  });
  document.head.appendChild(s);
}

function getEnvIds() {
  const ymIdRaw = import.meta.env.VITE_YM_COUNTER_ID;
  const gaIdRaw = import.meta.env.VITE_GA_MEASUREMENT_ID;

  // По умолчанию используем ваш счётчик 107028114,
  // но даём возможность переопределить его через VITE_YM_COUNTER_ID
  const ymId = ymIdRaw ? String(ymIdRaw).trim() : '107028114';
  const gaId = gaIdRaw ? String(gaIdRaw).trim() : '';

  return { ymId, gaId };
}

export function initAnalytics() {
  if (typeof window === 'undefined') return;

  const { ymId, gaId } = getEnvIds();

  // GA4
  if (gaId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    loadScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);
    window.gtag('js', new Date());
    window.gtag('config', gaId, { send_page_view: false });
  }

  // Yandex.Metrika
  if (ymId) {
    loadScriptOnce('https://mc.yandex.ru/metrika/tag.js');
    window.ym =
      window.ym ||
      function ym() {
        (window.ym.a = window.ym.a || []).push(arguments);
      };
    window.ym.l = Date.now();

    window.ym(Number(ymId), 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      accurateTrackBounce: true,
      trackLinks: true,
    });
  }
}

export function trackPageView({ path, title } = {}) {
  if (typeof window === 'undefined') return;
  const { ymId, gaId } = getEnvIds();

  const pagePath = path || window.location.pathname + window.location.search;
  const pageTitle = title || document.title || '';

  if (gaId && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }

  if (ymId && typeof window.ym === 'function') {
    window.ym(Number(ymId), 'hit', pagePath, { title: pageTitle });
  }
}

