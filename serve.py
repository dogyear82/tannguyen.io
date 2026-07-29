#!/usr/bin/env python3
"""Dev server for tannguyen.io: static files with caching disabled.

Plain `python3 -m http.server` sends no cache headers, so browsers happily
reuse stale JS modules between sessions — edits appear to "not work" until a
hard refresh. This server sends Cache-Control: no-store so every reload gets
fresh files.

Usage: python3 serve.py [port]   (default 8080)
"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
print(f'Serving on http://localhost:{port} (caching disabled)')
HTTPServer(('', port), NoCacheHandler).serve_forever()
