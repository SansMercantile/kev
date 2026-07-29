import time
import logging

class KevWatchdog:
    def __init__(self, interval=10):
        self.interval = interval
        self.last_heartbeat = time.time()
        self.logger = logging.getLogger("KevWatchdog")

    def heartbeat(self):
        self.last_heartbeat = time.time()
        self.logger.info(f"[KevWatchdog] Heartbeat at {self.last_heartbeat}")

    def is_alive(self):
        alive = (time.time() - self.last_heartbeat) < self.interval * 2
        self.logger.info(f"[KevWatchdog] Alive: {alive}")
        return alive
