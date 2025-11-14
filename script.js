const installBtn = document.getElementById('installBtn');
const feedUrlsTextarea = document.getElementById('feedUrls');
const loadFeedsBtn = document.getElementById('loadFeedsBtn');
const feedBox = document.getElementById('feedBox');

let deferredPrompt;

// PWA install prompt handling
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    installBtn.style.display = 'none';
    deferredPrompt = null;
  }
});

// Feed reader functions
function detectFeedType(url) {
  if (url.includes('blogspot.') || url.includes('feeds/posts') || url.includes('blogger.com')) return 'blogger';
  return 'blogger';
}

function postHTML(img, title, link, date) {
  return `
    <div class="feed-item">
      <img src="${img}" alt="Thumbnail" />
      <div>
        <a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a><br/>
        <small>${date}</small>
      </div>
    </div>
  `;
}

async function loadBlogger(url) {
  try {
    const rss = url.replace(/\/$/, '') + '/feeds/posts/default?alt=rss';
    const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rss)}`;
    const res = await fetch(api);
    const data = await res.json();
    if (!data.items || !data.items.length) {
      return `<p>No posts found for <strong>${url}</strong>.</p>`;
    }
    let html = `<h3>Feed from ${url}</h3>`;
    data.items.slice(0, 5).forEach(item => {
      const title = item.title;
      const link = item.link;
      const date = new Date(item.pubDate).toLocaleDateString();
      const img = item.thumbnail || 'https://via.placeholder.com/65';
      html += postHTML(img, title, link, date);
    });
    return html;
  } catch (e) {
    console.error(e);
    return `<p>Failed to load feed for <strong>${url}</strong>.</p>`;
  }
}

async function loadFeeds(urls) {
  feedBox.innerHTML = '<p>Loading feeds...</p>';
  const uniqueUrls = [...new Set(urls.filter(u => u.trim() !== ''))];
  if (!uniqueUrls.length) {
    feedBox.innerHTML = '<p>Please enter at least one valid URL.</p>';
    return;
  }

  feedBox.innerHTML = '';
  for (const url of uniqueUrls) {
    const type = detectFeedType(url);
    if (type === 'blogger') {
      const feedHtml = await loadBlogger(url);
      feedBox.innerHTML += feedHtml;
    } else {
      feedBox.innerHTML += `<p>Unsupported feed type for <strong>${url}</strong>.</p>`;
    }
  }
}

loadFeedsBtn.addEventListener('click', () => {
  const urls = feedUrlsTextarea.value.split('\n').map(u => u.trim());
  loadFeeds(urls);
});

// Load saved URLs from localStorage (optional)
const STORAGE_KEY = 'savedFeedUrls';
window.addEventListener('load', () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    feedUrlsTextarea.value = saved;
    loadFeeds(saved.split('\n'));
  }
});

loadFeedsBtn.addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEY, feedUrlsTextarea.value);
});

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.error('SW registration failed:', err));
}
