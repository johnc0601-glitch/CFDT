import http.server, socketserver, webbrowser, threading, os
from pathlib import Path
PORT=8765
os.chdir(Path(__file__).resolve().parent)
class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address=True
url=f'http://localhost:{PORT}/index.html'
threading.Timer(1.0, lambda: webbrowser.open(url)).start()
print(f'CFDT Graphics Launcher is running at {url}')
print('Keep this window open while using the browser. Press Ctrl+C to stop.')
with ReuseTCPServer(('127.0.0.1',PORT), http.server.SimpleHTTPRequestHandler) as httpd:
    httpd.serve_forever()
