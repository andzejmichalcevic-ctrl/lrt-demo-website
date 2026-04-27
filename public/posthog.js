// PostHog SDK - loaded via CDN snippet then initialized
(function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_distinct_id getGroups group resetGroups setPersonProperties resetPersonProperties reset get_session_id get_session_replay_url alias createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

const POSTHOG_KEY  = 'phc_CbAfKsFcqYfM8Zj4ay8SQ5YiAjjUjUpDf8KYRmodxMHA';
// Proxy URL will be set once Railway service is deployed.
// Falls back to PostHog Cloud directly.
const POSTHOG_HOST = window.__POSTHOG_PROXY__ || 'https://app.posthog.com';

posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,          // auto-captures clicks, inputs, page views
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
        maskAllInputs: false
    },
    loaded: function(ph) {
        console.log('PostHog initialized. Distinct ID:', ph.get_distinct_id());
    }
});

// ── Page view with LRT-specific properties ──────────────────
posthog.capture('$pageview', {
    page_type: 'homepage',
    site: 'LRT Demo'
});

// ── Article clicks ───────────────────────────────────────────
document.addEventListener('click', e => {
    const article = e.target.closest('[data-article-id]');
    if (article) {
        posthog.capture('article_clicked', {
            article_id:    article.dataset.articleId,
            article_title: article.querySelector('h1,h2,h3,p')?.textContent?.trim().slice(0,100),
            category:      article.querySelector('.category')?.textContent?.trim(),
            position:      Array.from(article.parentElement?.children || []).indexOf(article) + 1
        });
    }

    // Video
    const video = e.target.closest('.video-card');
    if (video) {
        posthog.capture('video_clicked', {
            video_title:    video.dataset.videoTitle,
            video_duration: video.dataset.videoDuration
        });
    }

    // Radio
    const radio = e.target.closest('.listen-btn');
    if (radio) {
        posthog.capture('radio_listen', {
            station: radio.dataset.radioStation,
            show:    radio.dataset.radioShow
        });
    }

    // Hashtag
    const hashtag = e.target.closest('.hashtag');
    if (hashtag) {
        posthog.capture('hashtag_clicked', { topic: hashtag.dataset.topic });
    }

    // Share
    const share = e.target.closest('.share-btn');
    if (share) {
        posthog.capture('share_clicked', {
            platform: share.dataset.share,
            url:      window.location.href
        });
    }

    // Navigation
    const nav = e.target.closest('.nav-item');
    if (nav) {
        posthog.capture('nav_clicked', { section: nav.textContent?.trim() });
    }
});

// ── Scroll depth ─────────────────────────────────────────────
let maxDepth = 0;
let scrollTimer;
window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const depth = docH > 0 ? Math.round((window.scrollY / docH) * 100) : 0;
    if (depth > maxDepth) maxDepth = depth;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
        if (depth > 0 && depth % 25 === 0) {
            posthog.capture('scroll_depth', {
                depth_percent: depth,
                max_depth:     maxDepth,
                page:          window.location.pathname
            });
        }
    }, 500);
});

// ── Time on page ─────────────────────────────────────────────
const startTime = Date.now();
window.addEventListener('beforeunload', () => {
    posthog.capture('page_exit', {
        time_on_page_seconds: Math.round((Date.now() - startTime) / 1000),
        max_scroll_depth:     maxDepth,
        page:                 window.location.pathname
    });
});

export { posthog };
