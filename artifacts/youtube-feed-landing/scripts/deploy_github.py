#!/usr/bin/env python3
"""Commit and push the generated landing-page files to a GitHub repository."""

from __future__ import annotations

import argparse
import subprocess
import sys


def run(*command: str) -> None:
    print("$", " ".join(command))
    subprocess.run(command, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--message",
        default="chore: refresh YouTube feed landing page",
        help="Commit message",
    )
    parser.add_argument("--remote", default="origin", help="Git remote name")
    parser.add_argument("--branch", default="", help="Branch; defaults to current branch")
    parser.add_argument(
        "--no-push",
        action="store_true",
        help="Create the commit but do not push it",
    )
    args = parser.parse_args()

    try:
        branch = args.branch
        if not branch:
            branch = subprocess.check_output(
                ("git", "branch", "--show-current"), text=True
            ).strip()
        if not branch:
            raise RuntimeError("Could not detect the current git branch.")
        run("git", "add", "public/data/feed.json", "public/data/feed.xml", "public/data/feed-meta.json")
        staged = subprocess.run(("git", "diff", "--cached", "--quiet"))
        if staged.returncode == 0:
            print("No feed changes to commit.")
            return 0
        run("git", "commit", "-m", args.message)
        if not args.no_push:
            run("git", "push", args.remote, branch)
    except (subprocess.CalledProcessError, RuntimeError) as error:
        print(f"Deploy failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())