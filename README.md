# LRT Demo Website

A demo clone of LRT.lt (Lithuanian National Radio and Television) website integrated with Exacaster Analytics SDK for tracking user interactions and article engagement.

## Features

- **Responsive Design**: Matches the original LRT.lt layout and styling
- **Fake Articles**: Interactive news articles with real-looking content
- **Analytics Tracking**: Comprehensive user activity tracking using Exacaster Analytics SDK
- **Article Interactions**: Click tracking, scroll depth, time on page
- **Video Content**: Mock video content with play button tracking
- **Radio Programs**: Interactive radio program listings with listen button tracking
- **Share Functionality**: Social media sharing button tracking

## Analytics Events Tracked

### Page Analytics
- `Page View` - When a user visits any page
- `Session Start/End` - User session management
- `Page Scroll` - Scroll behavior and depth
- `Page Exit` - Time spent on page before leaving

### Article Analytics
- `Article Click` - When users click on article headlines
- `Article Impression` - When articles become visible in viewport
- `Article View Duration` - Time spent viewing specific articles
- `Article Scroll` - Scroll depth within article pages
- `Article Read Complete` - Reading completion metrics

### Media Analytics
- `Video Click` - Video content interaction tracking
- `Radio Listen` - Radio program listen button clicks

### Social Analytics
- `Share Click` - Social media sharing actions
- `Related Article Click` - Related content engagement

### Navigation Analytics
- `Navigation Click` - Menu and navigation usage
- `Search Opened` - Search functionality usage

## Project Structure

```
lrt-demo-website/
├── public/
│   ├── index.html          # Main homepage
│   ├── article.html        # Article page template
│   ├── styles.css          # LRT-style CSS
│   └── analytics.js        # Analytics implementation
├── package.json            # Node.js dependencies
├── server.js               # Express server
├── Dockerfile             # Railway deployment
├── railway.json           # Railway configuration
└── README.md              # This file
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open http://localhost:3000 in your browser

## Railway Deployment

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Railway will automatically detect the Dockerfile and deploy
4. Your app will be available at the provided Railway URL

## Analytics Configuration

The website is configured with the Exacaster Analytics SDK using these settings:

```javascript
const analyticsConfiguration = {
    writeKey: "demo-write-key-lrt-website",
    endpoint: window.location.origin,
    appName: "LRT Demo Website",
    appVersion: "1.0.0",
    enableDebugLogging: true
};
```

## Testing Analytics

Open your browser's Developer Tools console to see analytics events being tracked in real-time. You can:

1. Click on articles to track engagement
2. Scroll through pages to track reading behavior
3. Click video thumbnails to track media interaction
4. Use radio listen buttons to track audio engagement
5. Test share buttons for social media tracking

## Article Content

The demo includes 10+ fake news articles across different categories:
- Politics (Politika)
- Economy (Ekonomika)
- Business (Verslas)
- Sports (Sportas)
- Culture (Kultūra)
- Health (Sveikata)
- Technology (Technologijos)
- Environment (Aplinka)

Each article has realistic Lithuanian headlines and content structure matching LRT.lt style.

## Browser Compatibility

- Modern browsers with ES6 module support
- Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+

## License

Demo project for educational purposes only. LRT.lt design and content are property of Lithuanian National Radio and Television.