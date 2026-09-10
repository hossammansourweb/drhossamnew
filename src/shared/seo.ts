/**
 * Central SEO configuration for Dr. Hossam Mansour Clinic.
 *
 * Single-page app: one public route (/) + one private route (/admin).
 * - Public view  -> indexable: unique Arabic/English title + description.
 * - Admin view   -> never indexed: noindex + nofollow applied dynamically
 *                   AND blocked in robots.txt AND via X-Robots-Tag (server.js).
 *
 * SITE_URL: canonical production origin. Update if a custom domain is added.
 */

export const SITE_URL = 'https://hossammansourweb-9489f.web.app';

export const SEO = {
  patient: {
    title: 'د. حسام منصور أبوكل | استشاري جراحة العظام طنطا وزفتى | Dr. Hossam Mansour',
    description:
      'احجز موعدك مع د. حسام منصور أبوكل، استشاري جراحة العظام بالقوات المسلحة. عيادتا طنطا وزفتى — حجز إلكتروني، كشف ومتابعة، دفع InstaPay. اتصل 01100171817 | Dr. Hossam Mansour Clinic',
  },
  admin: {
    title: 'لوحة تحكم العيادة | د. حسام منصور',
    description: 'لوحة الإدارة الخاصة بعيادة د. حسام منصور أبوكل — صفحة خاصة غير مخصصة للفهرسة.',
  },
} as const;

function upsertMetaByName(name: string, content: string) {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Apply per-view SEO. Call whenever currentView changes.
 * Patient view is indexable; admin view is forced noindex/nofollow
 * (defense in depth alongside robots.txt + server X-Robots-Tag).
 */
export function applySeoForView(view: 'patient' | 'admin') {
  if (typeof document === 'undefined') return;
  const isAdmin = view === 'admin';
  const seo = isAdmin ? SEO.admin : SEO.patient;

  document.title = seo.title;
  upsertMetaByName('description', seo.description);
  upsertMetaByName('robots', isAdmin ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');
  upsertCanonical(isAdmin ? `${SITE_URL}/admin` : `${SITE_URL}/`);

  // Open Graph URL should reflect the current canonical view.
  let ogUrl = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', isAdmin ? `${SITE_URL}/admin` : `${SITE_URL}/`);
}
