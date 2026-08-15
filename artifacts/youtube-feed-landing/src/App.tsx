import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Clipboard,
  Clock3,
  ExternalLink,
  GitBranch,
  LoaderCircle,
  Play,
  RefreshCw,
  Rss,
  Send,
} from 'lucide-react';

type Video = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  date: string;
  thumbnailUrl: string;
  url: string;
  featured?: boolean;
};

type FeedItem = {
  id: string;
  title: string;
  description: string;
  published_at: string;
  updated_at: string;
  url: string;
  thumbnail_url: string;
  author: string;
};

type FeedData = {
  generated_at: string;
  source: {
    feed_url: string;
    channel_id: string;
    channel_name: string;
    channel_url: string;
  };
  site: {
    title: string;
    description: string;
  };
  items: FeedItem[];
};

const sampleVideos: Video[] = [
  {
    id: 'field-notes',
    eyebrow: 'Field notes · 08',
    title: 'A small studio with a very large window',
    description: 'A quiet tour of the objects, rituals, and light that make a working room feel like yours.',
    date: 'May 24, 2025',
    thumbnailUrl: '',
    url: 'https://www.youtube.com',
    featured: true,
  },
  {
    id: 'slow-tools',
    eyebrow: 'Slow tools',
    title: 'The case for making fewer things',
    description: '',
    date: 'May 18, 2025',
    thumbnailUrl: '',
    url: 'https://www.youtube.com',
  },
  {
    id: 'night-shift',
    eyebrow: 'Night shift',
    title: 'Notes from the last train home',
    description: '',
    date: 'May 11, 2025',
    thumbnailUrl: '',
    url: 'https://www.youtube.com',
  },
];

function formatDate(date: string) {
  if (!date) return 'Recently';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function toVideos(feed: FeedData): Video[] {
  return feed.items.map((item, index) => ({
    id: item.id,
    eyebrow: `${index === 0 ? 'Latest release' : 'From the archive'} · ${String(index + 1).padStart(2, '0')}`,
    title: item.title,
    description: item.description || 'Watch the latest release from this channel.',
    date: formatDate(item.published_at),
    thumbnailUrl: item.thumbnail_url,
    url: item.url,
    featured: index === 0,
  }));
}

function Home() {
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [feedError, setFeedError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/feed.json`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Feed data unavailable');
        return response.json() as Promise<FeedData>;
      })
      .then((nextFeed) => {
        if (!cancelled) setFeed(nextFeed);
      })
      .catch(() => {
        if (!cancelled) setFeedError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const videos = useMemo(
    () => (feed?.items.length ? toVideos(feed) : sampleVideos),
    [feed],
  );
  const channelName = feed?.source.channel_name || 'Mira & the Machine';
  const siteTitle = feed?.site.title || channelName;
  const siteDescription =
    feed?.site.description ||
    'Livefeed turns a YouTube RSS feed into a home that feels edited, alive, and unmistakably yours.';
  const generatedAt = feed?.generated_at ? new Date(feed.generated_at) : null;
  const lastChecked =
    generatedAt && !Number.isNaN(generatedAt.getTime())
      ? formatDate(feed.generated_at)
      : 'Preview data';
  const sourceUrl = feed?.source.feed_url || 'youtube.com/feeds/videos.xml';

  const handleRefresh = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    window.setTimeout(() => setIsSyncing(false), 1500);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        feed?.source.feed_url || 'youtube.com/feeds/videos.xml',
      );
    } catch {
      // Clipboard access can be unavailable in a preview iframe.
    }
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  return (
    <main className="page-shell">
      <div className="container-wide">
        <header className="site-header rise-in">
          <a className="brand-mark" href="#top" data-testid="link-brand">
            <span className="brand-symbol">lf</span>
            <span className="brand-word">live<span>feed</span></span>
          </a>
          <nav className="nav-links" aria-label="Primary navigation">
            <a className="nav-link" href="#feed" data-testid="link-latest">Latest</a>
            <a className="nav-link" href="#relay" data-testid="link-relay">The relay</a>
            <a className="nav-link" href="#source" data-testid="link-source">Source status</a>
            <a className="nav-button" href="#source" data-testid="link-publish">
              Publish your feed <ArrowUpRight size={13} strokeWidth={2.3} />
            </a>
          </nav>
        </header>

        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow rise-in delay-1">A publishing home for independent video</div>
              <h1 className="display-title rise-in delay-1" id="hero-title">
                Your next video is already on the <em>front page.</em>
              </h1>
                <p className="rise-in delay-2">
                  {siteDescription}
              </p>
              <div className="hero-actions rise-in delay-3">
                <a className="primary-action" href="#feed" data-testid="button-see-feed">
                  See the live feed <ChevronRight size={15} />
                </a>
                <a className="text-action" href="#relay" data-testid="link-how-it-works">
                  How the relay works <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            <div className="studio-board rise-in delay-2" aria-label="Livefeed preview">
              <div className="board-top">
                <span className="board-kicker">{channelName}</span>
                <span className="board-sync"><i className="pulse-dot" /> {feedError ? 'preview mode' : 'feed is live'}</span>
              </div>
              <div className="board-content">
                <div className="eyebrow" style={{ color: 'hsl(42 18% 70%)' }}>The living archive</div>
                  <div className="board-title">{siteTitle}</div>
                <div className="board-meta">
                  <span className="creator-avatar">MM</span>
                  <span>Independent video journal</span>
                  <span>·</span>
                  <span>{feed?.items.length || 24} films</span>
                </div>
              </div>
              <div className="board-preview">
                <span className="preview-label">now playing</span>
              </div>
              <span className="board-tail">updated {lastChecked} / via rss.xml</span>
            </div>
          </div>
        </section>

        <section className="feed-section" id="feed" aria-labelledby="feed-title">
          <div className="section-heading">
            <div>
              <div className="eyebrow">The latest from the channel</div>
              <h2 className="display-title" id="feed-title">A feed with a point of view.</h2>
            </div>
            <p className="section-note">No upload dashboard. No empty grid. Just the work, in the order it was made.</p>
          </div>

          <div className="feed-layout">
            <article className="feature-card" data-testid="card-video-field-notes">
              <div className="feature-image" style={videos[0].thumbnailUrl ? { backgroundImage: `linear-gradient(140deg, rgba(225,183,109,.2), rgba(23,36,65,.5)), url("${videos[0].thumbnailUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} role="img" aria-label={`Thumbnail for ${videos[0].title}`}>
                <span className="image-ribbon">new in the archive</span>
                <span className="play-button" aria-hidden="true"><Play size={16} fill="currentColor" /></span>
              </div>
              <div className="feature-copy">
                <div className="eyebrow">{videos[0].eyebrow}</div>
                <h3>{videos[0].title}</h3>
                <p>{videos[0].description}</p>
                <div className="card-footer">
                  <span>{videos[0].date}</span>
                  <a className="arrow" href={videos[0].url} target="_blank" rel="noreferrer" aria-label={`Watch ${videos[0].title}`} data-testid="link-watch-field-notes"><ExternalLink size={14} /></a>
                </div>
              </div>
            </article>

            <div className="side-feed">
              {videos.slice(1).map((video) => (
                <article className="video-card" key={video.id} data-testid={`card-video-${video.id}`}>
                  <div className="video-image" style={video.thumbnailUrl ? { backgroundImage: `linear-gradient(145deg, rgba(92,126,121,.2), rgba(198,111,82,.35)), url("${video.thumbnailUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} role="img" aria-label={`Thumbnail for ${video.title}`}>
                    <span className="play-button" aria-hidden="true"><Play size={13} fill="currentColor" /></span>
                  </div>
                  <div className="video-copy">
                    <div className="eyebrow">{video.eyebrow}</div>
                    <h3>{video.title}</h3>
                    <div className="card-footer">
                      <span>{video.date}</span>
                      <a className="arrow" href={video.url} target="_blank" rel="noreferrer" aria-label={`Watch ${video.title}`} data-testid={`link-watch-${video.id}`}><ExternalLink size={13} /></a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="relay-section" id="relay" aria-labelledby="relay-title">
        <div className="container-wide relay-grid">
          <div className="relay-intro">
            <div className="eyebrow">The invisible part</div>
            <h2 className="display-title" id="relay-title">A tiny relay that keeps showing up.</h2>
            <p>
              Every six hours, a GitHub Action checks your channel&apos;s XML feed, finds what&apos;s new, and rebuilds this page. You make the video. The front page takes care of itself.
            </p>
          </div>
          <div className="steps" aria-label="How the feed relay works">
            <div className="step">
              <span className="step-number">01</span>
              <div><h3>Listen to the source</h3><p>The channel&apos;s public RSS/XML feed is the only source of truth.</p></div>
              <span className="step-time">every 6h</span>
            </div>
            <div className="step">
              <span className="step-number">02</span>
              <div><h3>Notice what changed</h3><p>New films are sorted into an editorial order, without touching your existing uploads.</p></div>
              <span className="step-time">on commit</span>
            </div>
            <div className="step">
              <span className="step-number">03</span>
              <div><h3>Publish the home</h3><p>GitHub Pages serves the updated archive, ready for the next curious visitor.</p></div>
              <span className="step-time">automatic <span className="signal" aria-hidden="true"><i /><i /><i /><i /><i /></span></span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide">
        <section className="source-section" id="source" aria-labelledby="source-title">
          <div className="source-grid">
            <div className="source-copy">
              <div className="eyebrow">Source / channel state</div>
              <h2 className="display-title" id="source-title">Nothing hidden in the machinery.</h2>
              <p>
                A good publishing system should tell you where its words came from. This one makes the source, the last sync, and the next check plain to see.
              </p>
              <button className="primary-action" type="button" onClick={() => setIsSubscribed(!isSubscribed)} data-testid="button-subscribe">
                {isSubscribed ? <><Check size={14} /> You&apos;re on the list</> : <><Send size={14} /> Keep me posted</>}
              </button>
            </div>

            <div className="source-status" data-testid="panel-source-status">
              <div className="status-head">
                <strong>Channel health</strong>
                <span className="health"><i /> operating normally</span>
              </div>
              <label className="url-label" htmlFor="feed-url">Listening to</label>
              <div className="url-row">
                <input className="url-input" id="feed-url" readOnly value={sourceUrl} data-testid="input-feed-url" />
                <button className="copy-button" type="button" onClick={handleCopy} data-testid="button-copy-url">
                  {isCopied ? <Check size={13} /> : <Clipboard size={13} />} {isCopied ? 'Copied' : 'Copy address'}
                </button>
              </div>
              <div className="status-list">
                <div className="status-row"><span><Rss size={13} style={{ verticalAlign: 'middle', marginRight: 7 }} /> Source feed</span><span className="ok">reachable</span></div>
                <div className="status-row"><span><Clock3 size={13} style={{ verticalAlign: 'middle', marginRight: 7 }} /> Last checked</span><span>{lastChecked}</span></div>
                <div className="status-row"><span><GitBranch size={13} style={{ verticalAlign: 'middle', marginRight: 7 }} /> Next refresh</span><span>in 4 hours</span></div>
              </div>
              <button className="refresh-button" type="button" onClick={handleRefresh} disabled={isSyncing} data-testid="button-refresh">
                {isSyncing ? <><LoaderCircle size={13} className="animate-spin" /> Checking the feed…</> : <><RefreshCw size={13} /> Check now</>}
              </button>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="footer-inner">
            <strong>livefeed / a small home for the work</strong>
            <span className="footer-note">static by design · refreshed by github actions · <a href="#top" data-testid="link-back-top">back to top ↑</a></span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return <Home />;
}

function App() {
  return <Router />;
}

export default App;