from fastapi import Request, HTTPException
import time
from collections import defaultdict

# Simple In-Memory Rate Limiter
# Structure: { "user_id_or_ip": { "endpoint": [timestamp1, timestamp2, ...] } }
_rate_limits = defaultdict(lambda: defaultdict(list))

def rate_limiter(max_requests: int = 5, window_seconds: int = 60):
    async def _rate_limit(request: Request):
        # Prefer user from request state (if auth middleware set it), else use IP
        # We can extract token from auth header manually if needed, or rely on IP
        identifier = request.client.host
        
        endpoint = request.url.path
        now = time.time()
        
        # Clean up old timestamps
        history = _rate_limits[identifier][endpoint]
        history = [ts for ts in history if now - ts < window_seconds]
        
        if len(history) >= max_requests:
            raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")
            
        history.append(now)
        _rate_limits[identifier][endpoint] = history
        
    return _rate_limit
