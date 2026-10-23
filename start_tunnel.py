import sys
from pyngrok import ngrok

tunnel = ngrok.connect(5000)
print(f"PUBLIC URL: {tunnel.public_url}", flush=True)
sys.stdout.flush()

# Keep alive
import time
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    ngrok.disconnect(tunnel.public_url)
