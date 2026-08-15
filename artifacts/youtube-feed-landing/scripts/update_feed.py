#!/usr/bin/env python3
"""Download a YouTube RSS/XML feed and build static landing-page data.

This script deliberately uses only Python's standard library so it runs in
GitHub Actions without installing extra packages.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ATOM = "http://www.w3.org/2005/Atom"
MEDIA = "http://search.yahoo.com/mrss/"
YT = "http://www.youtube.com/xml/schemas/2015"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--config",
        default="config/feed.json",
        help="Path to feed configuration JSON (default: config/feed.json)",
    )
    parser.add_argument(
        "--output-dir",
        default="public/data",
        help="Directory for generated feed files (default: public/data)",
    )
    return parser.parse_args()


def load_config(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as config_file:
        config = json.load(config_file)

    channel_id = os.getenv("YOUTUBE_CHANNEL_ID", config.get("channel_id", "")).strip()
    feed_url = os.getenv("YOUTUBE_FEED_URL", config.get("feed_url", "")).strip()
    if not feed_url and channel_id:
        feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    if not feed_url:
        raise ValueError(
            "Set channel_id or feed_url in the config, or set YOUTUBE_CHANNEL_ID/YOUTUBE_FEED_URL."
        )

    config["channel_id"] = channel_id
    config["feed_url"] = feed_url
    config["max_items"] = max(1, min(int(config.get("max_items", 12)), 50))
    return config


def download_feed(feed_url: str) -> bytes:
    request = urllib.request.Request(
        feed_url,
        headers={
            "User-Agent": "youtube-feed-landing/1.0 (+https://github.com)",
            "Accept": "application/atom+xml, application/xml, text/xml",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read()
    except urllib.error.URLError as error:
        raise RuntimeError(f"Could not download YouTube feed: {error}") from error


def text(element: ET.Element | None, default: str = "") -> str:
    return (element.text or "").strip() if element is not None else default


def parse_feed(raw_xml: bytes, config: dict[str, Any]) -> tuple[dict[str, Any], bytes]:
    root = ET.fromstring(raw_xml)
    channel_title = text(root.find(f"{{{ATOM}}}title"), config["channel_name"])
    channel_url = config.get("channel_url", "")
    channel = root.find(f"{{{ATOM}}}link")
    if channel is not None:
        channel_url = channel.attrib.get("href", channel_url)

    items: list[dict[str, Any]] = []
    entries = root.findall(f"{{{ATOM}}}entry")[: config["max_items"]]
    for entry in entries:
        video_id = text(entry.find(f"{{{YT}}}videoId"))
        if not video_id:
            continue
        entry_link = entry.find(f"{{{ATOM}}}link")
        published = text(entry.find(f"{{{ATOM}}}published"))
        updated = text(entry.find(f"{{{ATOM}}}updated"), published)
        media_group = entry.find(f"{{{MEDIA}}}group")
        description = text(
            media_group.find(f"{{{MEDIA}}}description") if media_group is not None else None
        )
        thumbnail = (
            media_group.find(f"{{{MEDIA}}}thumbnail") if media_group is not None else None
        )
        thumbnail_url = (
            thumbnail.attrib.get("url", "") if thumbnail is not None else ""
        )
        items.append(
            {
                "id": video_id,
                "title": text(entry.find(f"{{{ATOM}}}title"), "Untitled video"),
                "description": description,
                "published_at": published,
                "updated_at": updated,
                "url": (
                    entry_link.attrib.get("href", f"https://www.youtube.com/watch?v={video_id}")
                    if entry_link is not None
                    else f"https://www.youtube.com/watch?v={video_id}"
                ),
                "thumbnail_url": thumbnail_url
                or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                "author": text(
                    entry.find(f"{{{ATOM}}}author/{{{ATOM}}}name"),
                    channel_title,
                ),
            }
        )

    generated_at = datetime.now(timezone.utc).isoformat()
    data = {
        "generated_at": generated_at,
        "source": {
            "feed_url": config["feed_url"],
            "channel_id": config.get("channel_id", ""),
            "channel_name": channel_title,
            "channel_url": channel_url,
        },
        "site": {
            "title": config.get("site_title") or channel_title,
            "description": config.get("site_description", ""),
        },
        "items": items,
    }
    return data, raw_xml


def write_outputs(data: dict[str, Any], raw_xml: bytes, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "feed.json").write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (output_dir / "feed.xml").write_bytes(raw_xml)
    (output_dir / "feed-meta.json").write_text(
        json.dumps(
            {
                "generated_at": data["generated_at"],
                "item_count": len(data["items"]),
                "channel_name": data["source"]["channel_name"],
                "source_url": data["source"]["feed_url"],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def main() -> int:
    args = parse_args()
    try:
        config = load_config(Path(args.config))
        data, raw_xml = parse_feed(download_feed(config["feed_url"]), config)
        write_outputs(data, raw_xml, Path(args.output_dir))
    except (OSError, ValueError, RuntimeError, ET.ParseError) as error:
        print(f"Feed update failed: {error}", file=sys.stderr)
        return 1
    print(f"Updated {len(data['items'])} videos for {data['source']['channel_name']}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())