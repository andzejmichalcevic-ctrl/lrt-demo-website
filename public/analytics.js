import { Analytics } from '/node_modules/exacaster-analytics/exacaster-analytics-library.mjs';

Analytics.getInstance().initialize({
    writeKey: "demo-write-key-lrt-website",
    endpoint: window.location.origin,
    appName: "LRT Demo Website",
    appVersion: "1.0.0",
    appBuild: "1",
    enableEncryption: false,
    enableDebugLogging: false,
    flushIntervalSeconds: 3,
    flushQueueSize: 1
});

// ── Shared context ────────────────────────────────────────────────────────────

const sessionId = Math.random().toString(36).substr(2, 9);

const visitCount = parseInt(localStorage.getItem('lrt_visit_count') || '0') + 1;
localStorage.setItem('lrt_visit_count', String(visitCount));
const userType = visitCount === 1 ? 'new' : visitCount < 5 ? 'returning' : 'loyal';

const urlParams   = new URLSearchParams(window.location.search);
const utmSource   = urlParams.get('utm_source')   || '';
const utmMedium   = urlParams.get('utm_medium')   || '';
const utmCampaign = urlParams.get('utm_campaign') || '';

function getReferrerDomain() {
    try { return document.referrer ? new URL(document.referrer).hostname : ''; }
    catch(e) { return ''; }
}
function getTrafficSource() {
    if (utmSource) {
        if (/facebook|twitter|instagram|linkedin|youtube|tiktok/i.test(utmSource)) return 'social';
        return 'referral';
    }
    if (!document.referrer) return 'direct';
    try {
        const host = new URL(document.referrer).hostname.toLowerCase();
        if (host === window.location.hostname) return 'internal';
        if (/google|bing|yahoo|duckduckgo|yandex/.test(host)) return 'search';
        if (/facebook|twitter|instagram|linkedin|youtube|tiktok|reddit/.test(host)) return 'social';
        return 'referral';
    } catch(e) { return 'direct'; }
}
function getDeviceType() {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024 && 'ontouchstart' in window) return 'tablet';
    return 'desktop';
}
function getPageType() {
    const path = window.location.pathname;
    if (path === '/' || path === '') return 'homepage';
    if (path.startsWith('/article/')) {
        const id = path.split('/').pop();
        return id && id.startsWith('v') ? 'video' : 'article';
    }
    if (path.startsWith('/category/')) return 'category';
    return 'other';
}
function getContentId() {
    const path = window.location.pathname;
    if (path.startsWith('/article/') || path.startsWith('/category/')) return path.split('/').pop();
    return '';
}

// Returns category for an element or the whole page
function getContentGroup(el) {
    if (el) {
        // data-category attribute is the most reliable source
        if (el.dataset.category) return el.dataset.category;
        // Look for any category label inside the element
        const span = el.querySelector('.category, .hero-category, .section-label, .article-category');
        if (span) return span.textContent.trim();
        return '';
    }
    // Page level: category pages derive from URL
    const path = window.location.pathname;
    if (path.startsWith('/category/')) return path.split('/').pop().replace(/-/g, ' ');
    // Article pages: set by article renderer on body dataset
    if (document.body.dataset.contentGroup) return document.body.dataset.contentGroup;
    // Meta tag fallback
    const meta = document.querySelector('meta[name="content-group"]');
    if (meta) return meta.content;
    return '';
}

// Returns the headline text of an article card
function getArticleTitle(el) {
    if (el.dataset.title) return el.dataset.title;
    return el.querySelector('h1, h2, h3')?.textContent?.trim().slice(0, 150) ||
           el.querySelector('p')?.textContent?.trim().slice(0, 150) || '';
}

const platform       = 'web';
const deviceType     = getDeviceType();
const trafficSource  = getTrafficSource();
const referrerDomain = getReferrerDomain();
const pageType       = getPageType();
const contentId      = getContentId();
const isRecirculation = document.referrer
    ? new URL(document.referrer).hostname === window.location.hostname
    : false;

let _anonId = localStorage.getItem('lrt_anon_id');
if (!_anonId) { _anonId = Math.random().toString(36).substr(2, 9); localStorage.setItem('lrt_anon_id', _anonId); }

function ctx() {
    const abVariant = localStorage.getItem('lrt_ab_hero') || '';
    return { sessionId, platform, deviceType, trafficSource, referrerDomain, utmSource, utmMedium, utmCampaign, pageType, contentId, ...(abVariant ? { abVariant } : {}) };
}

function track(name, extra = {}) {
    const properties = Object.fromEntries(
        Object.entries({ ...ctx(), ...extra }).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
    fetch('/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            events: [{ name, type: 'track', anonymous_id: _anonId, timestamp: new Date().toISOString(), properties }],
            event_id: Date.now().toString()
        })
    }).catch(() => {});
}

// ── Session Start ─────────────────────────────────────────────────────────────
track('Session Start', {
    visitCount, userType,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
});

// ── Page View — delayed so article.html can set body.dataset.contentGroup first
setTimeout(() => {
    track('Page View', {
        title: document.title,
        url: window.location.href,
        referrer: document.referrer,
        contentGroup: getContentGroup(),
        isRecirculation,
        visitCount,
        userType,
    });
}, 0);

// ── Scroll milestones (25 / 50 / 75 / 100%) ──────────────────────────────────
const scrollMilestones = new Set();
let maxScrollDepth = 0;

window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct  = docH > 0 ? Math.round((window.scrollY / docH) * 100) : 0;
    if (pct > maxScrollDepth) maxScrollDepth = pct;
    [25, 50, 75, 100].forEach(m => {
        if (pct >= m && !scrollMilestones.has(m)) {
            scrollMilestones.add(m);
            track('Page Scroll', { scrollDepthMilestone: m, contentGroup: getContentGroup() });
        }
    });
}, { passive: true });

// ── Page Exit ─────────────────────────────────────────────────────────────────
const pageStartTime = Date.now();
let linkClickCount  = 0;

window.addEventListener('beforeunload', () => {
    const engagementTimeSec = Math.round((Date.now() - pageStartTime) / 1000);
    const readCompletion    = maxScrollDepth >= 80;
    track('Page Exit', { engagementTimeSec, finalScrollDepth: maxScrollDepth, readCompletion, linkClickCount, contentGroup: getContentGroup() });
    track('Session End', { engagementTimeSec, finalScrollDepth: maxScrollDepth, isRecirculation, visitCount, userType });
    Analytics.getInstance().flush();
});

// ── Click tracking ────────────────────────────────────────────────────────────
document.addEventListener('click', (e) => {

    const article = e.target.closest('[data-article-id]');
    if (article) {
        const articleId    = article.dataset.articleId;
        const articleTitle = getArticleTitle(article);
        const category     = getContentGroup(article);

        track('Article Click', {
            articleId, articleTitle, contentGroup: category,
            impressionRank: getElementPosition(article),
            sourcePageType: pageType,
        });

        if (articleId?.startsWith('v')) {
            track('Video Click', {
                videoId: articleId,
                videoTitle: article.dataset.videoTitle || articleTitle,
                videoDuration: article.dataset.videoDuration || '',
                contentGroup: category,
            });
        }

        // Recirculation: user is already on an article and clicks to another
        if (pageType === 'article' || pageType === 'video' || article.closest('.sidebar, .top-list')) {
            track('Recirculation Click', {
                targetContentId: articleId,
                targetContentTitle: articleTitle,
                sourceContentId: contentId,
                contentGroup: category,
                recirculationSource: article.closest('.sidebar, .top-list') ? 'sidebar' : 'article-body',
            });
        }

        setTimeout(() => { window.location.href = `/article/${articleId}`; }, 100);
        return;
    }

    const related = e.target.closest('.related-item');
    if (related) {
        track('Recirculation Click', {
            targetContentId: related.dataset.relatedId || related.dataset.articleId || '',
            targetContentTitle: related.querySelector('h4')?.textContent?.trim() || '',
            sourceContentId: contentId,
            contentGroup: getContentGroup(),
            recirculationSource: 'related-articles',
        });
        return;
    }

    const share = e.target.closest('.share-btn');
    if (share) {
        track('Share Click', {
            shareDestination: share.dataset.share || '',
            articleId: contentId,
            articleTitle: document.title,
            contentGroup: getContentGroup(),
            articleUrl: window.location.href,
        });
        return;
    }

    const hashtag = e.target.closest('.hashtag');
    if (hashtag) {
        track('Hashtag Click', { topic: hashtag.dataset.topic || hashtag.textContent?.trim(), contentGroup: getContentGroup() });
        return;
    }

    const nav = e.target.closest('.nav-item');
    if (nav) {
        track('Navigation Click', { section: nav.textContent?.trim(), targetUrl: nav.href });
        return;
    }

    const radio = e.target.closest('.listen-btn');
    if (radio) {
        track('Radio Listen', { station: radio.dataset.radioStation || '', show: radio.dataset.radioShow || '' });
        return;
    }

    const link = e.target.closest('a[href]');
    if (link) {
        linkClickCount++;
        track('Link Click', {
            linkUrl: link.href,
            linkText: link.textContent?.trim().slice(0, 100) || '',
            linkType: link.href.includes(window.location.hostname) ? 'internal' : 'external',
            contentGroup: getContentGroup(),
        });
    }
});

// ── Article impression + view duration ───────────────────────────────────────
const visibilityTracker = new Map();

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const el        = entry.target;
        const articleId = el.dataset.articleId;
        if (!articleId) return;

        const pct = Math.round(entry.intersectionRatio * 100);
        if (!visibilityTracker.has(articleId)) visibilityTracker.set(articleId, { maxVisibility: 0, startTime: null });
        const tracking = visibilityTracker.get(articleId);

        if (entry.isIntersecting && pct > tracking.maxVisibility) {
            tracking.maxVisibility = pct;
            if (!tracking.startTime) tracking.startTime = Date.now();
            track('Article Impression', {
                articleId,
                articleTitle: getArticleTitle(el),
                contentGroup: getContentGroup(el),
                visibilityPct: pct,
                impressionRank: getElementPosition(el),
            });
        } else if (!entry.isIntersecting && tracking.startTime) {
            const viewDurationSec = Math.round((Date.now() - tracking.startTime) / 1000);
            track('Article View Duration', {
                articleId,
                viewDurationSec,
                maxVisibilityPct: tracking.maxVisibility,
                readCompletion: tracking.maxVisibility >= 80,
                contentGroup: getContentGroup(el),
            });
            tracking.startTime = null;
        }
    });
}, { threshold: [0.25, 0.5, 0.75, 1.0] });

// ── Search tracking + observer setup ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-article-id]').forEach(el => observer.observe(el));

    const searchBtn   = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => track('Search Open', { pageType }));
    }
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (searchInput.value.trim().length >= 2) {
                    track('Search Query', { searchQuery: searchInput.value.trim(), pageType });
                }
            }, 800);
        });
    }
});

function getElementPosition(el) {
    return Array.from(el.parentElement?.children || []).indexOf(el) + 1;
}

export { Analytics };
