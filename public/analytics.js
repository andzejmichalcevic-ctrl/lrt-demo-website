import { Analytics } from '/node_modules/exacaster-analytics/exacaster-analytics-library.mjs';

// Configuration for the analytics SDK
const analyticsConfiguration = {
    writeKey: "demo-write-key-lrt-website",
    endpoint: window.location.origin,
    appName: "LRT Demo Website",
    appVersion: "1.0.0",
    appBuild: "1",
    enableEncryption: false,
    enableDebugLogging: true,
    flushIntervalSeconds: 5,
    flushQueueSize: 5
};

// Initialize Analytics SDK
Analytics.getInstance().initialize(analyticsConfiguration);

// Track page view
Analytics.getInstance().track('Page View', {
    page: window.location.pathname,
    title: document.title,
    url: window.location.href,
    referrer: document.referrer,
    timestamp: new Date().toISOString()
});

// Track user session
const sessionId = Math.random().toString(36).substr(2, 9);
Analytics.getInstance().track('Session Start', {
    sessionId: sessionId,
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timestamp: new Date().toISOString()
});

// Track article clicks
document.addEventListener('click', (event) => {
    const article = event.target.closest('[data-article-id]');
    if (article) {
        const articleId = article.dataset.articleId;
        const headline = article.querySelector('h1, h2, h3, p')?.textContent || 'Unknown';
        const category = article.querySelector('.category')?.textContent || 'General';

        Analytics.getInstance().track('Article Click', {
            articleId: articleId,
            articleTitle: headline,
            category: category,
            position: getElementPosition(article),
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });

        // Navigate to article page
        setTimeout(() => {
            window.location.href = `/article/${articleId}`;
        }, 100);

        // If it's a video article
        if (articleId && articleId.startsWith('v')) {
            const videoTitle = article.dataset.videoTitle || headline;
            const videoDuration = article.dataset.videoDuration || 'Unknown';

            Analytics.getInstance().track('Video Click', {
                videoId: articleId,
                videoTitle: videoTitle,
                videoDuration: videoDuration,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Track hashtag clicks
    const hashtag = event.target.closest('.hashtag');
    if (hashtag) {
        const topic = hashtag.dataset.topic || hashtag.textContent;

        Analytics.getInstance().track('Hashtag Click', {
            topic: topic,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
    }

    // Track navigation menu clicks
    const navItem = event.target.closest('.nav-item');
    if (navItem) {
        Analytics.getInstance().track('Navigation Click', {
            section: navItem.textContent,
            url: navItem.href,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
    }

    // Track radio button clicks
    const listenBtn = event.target.closest('.listen-btn');
    if (listenBtn) {
        const station = listenBtn.dataset.radioStation || 'Unknown';
        const show = listenBtn.dataset.radioShow || 'Unknown';

        Analytics.getInstance().track('Radio Listen', {
            station: station,
            show: show,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
    }

    // Track share button clicks
    const shareBtn = event.target.closest('.share-btn');
    if (shareBtn) {
        const platform = shareBtn.dataset.share || 'Unknown';

        Analytics.getInstance().track('Share Click', {
            platform: platform,
            articleUrl: window.location.href,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
    }

    // Track related article clicks
    const relatedItem = event.target.closest('.related-item');
    if (relatedItem) {
        const relatedId = relatedItem.dataset.relatedId || 'Unknown';
        const relatedTitle = relatedItem.querySelector('h4')?.textContent || 'Unknown';

        Analytics.getInstance().track('Related Article Click', {
            relatedArticleId: relatedId,
            relatedArticleTitle: relatedTitle,
            sourceArticle: window.location.pathname,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
    }
});

// Track search interactions
document.addEventListener('click', (event) => {
    if (event.target.closest('.search-btn')) {
        Analytics.getInstance().track('Search Opened', {
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
    }
});

// Track scroll behavior
let scrollTimer;
let lastScrollPosition = 0;
let maxScrollDepth = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = Math.round((currentScroll / documentHeight) * 100);

    if (scrollPercentage > maxScrollDepth) {
        maxScrollDepth = scrollPercentage;
    }

    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
        if (Math.abs(currentScroll - lastScrollPosition) > 200) {
            Analytics.getInstance().track('Page Scroll', {
                scrollDepth: scrollPercentage,
                maxScrollDepth: maxScrollDepth,
                page: window.location.pathname,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            });
            lastScrollPosition = currentScroll;
        }
    }, 500);
});

// Track time on page
const pageStartTime = Date.now();

window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);

    Analytics.getInstance().track('Page Exit', {
        timeOnPage: timeOnPage,
        maxScrollDepth: maxScrollDepth,
        page: window.location.pathname,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
    });

    Analytics.getInstance().track('Session End', {
        sessionId: sessionId,
        totalTimeOnSite: timeOnPage,
        pagesViewed: 1,
        timestamp: new Date().toISOString()
    });

    // Force flush before leaving
    Analytics.getInstance().flush();
});

// Helper function to get element position
function getElementPosition(element) {
    const parent = element.parentElement;
    if (!parent) return 0;

    const siblings = Array.from(parent.children);
    return siblings.indexOf(element) + 1;
}

// Track viewport visibility for articles
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: [0.25, 0.5, 0.75, 1.0]
};

const visibilityTracker = new Map();

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const articleId = entry.target.dataset.articleId;
        if (!articleId) return;

        const visibilityPercent = Math.round(entry.intersectionRatio * 100);

        if (!visibilityTracker.has(articleId)) {
            visibilityTracker.set(articleId, {
                maxVisibility: 0,
                startTime: null
            });
        }

        const tracking = visibilityTracker.get(articleId);

        if (entry.isIntersecting && visibilityPercent > tracking.maxVisibility) {
            tracking.maxVisibility = visibilityPercent;

            if (!tracking.startTime) {
                tracking.startTime = Date.now();
            }

            Analytics.getInstance().track('Article Impression', {
                articleId: articleId,
                visibilityPercent: visibilityPercent,
                articleTitle: entry.target.querySelector('h1, h2, h3')?.textContent || 'Unknown',
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            });
        } else if (!entry.isIntersecting && tracking.startTime) {
            const viewDuration = Math.round((Date.now() - tracking.startTime) / 1000);

            Analytics.getInstance().track('Article View Duration', {
                articleId: articleId,
                viewDuration: viewDuration,
                maxVisibility: tracking.maxVisibility,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            });

            tracking.startTime = null;
        }
    });
}, observerOptions);

// Observe all articles
document.addEventListener('DOMContentLoaded', () => {
    const articles = document.querySelectorAll('[data-article-id]');
    articles.forEach(article => observer.observe(article));

    // Log SDK initialization
    console.log('Exacaster Analytics SDK initialized for LRT Demo Website');
    console.log('Tracking enabled for:', {
        pageViews: true,
        articleClicks: true,
        scrollBehavior: true,
        timeOnPage: true,
        articleImpressions: true,
        videoClicks: true,
        radioListens: true,
        shareActions: true,
        relatedArticles: true
    });
});

// Export Analytics instance for use in other modules
export { Analytics };