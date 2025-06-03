from threading import Lock
import requests

class WarrantyCacheManager:
    def __init__(self, flush_callback=None, flush_threshold=2):
        self.cache = []
        self.counter = 0
        self.lock = Lock()
        self.flush_threshold = flush_threshold
        self.flush_callback = flush_callback  # function to call on flush

    def add_warranty(self, warranty_data):
        with self.lock:
            self.cache.append(warranty_data)
            self.counter += 1

            if self.counter >= self.flush_threshold:
                print("self.counter >= self.flush_threshold")
                self.flush()

    def flush(self):
        print(f"🚿 Auto-flushing {self.counter} cached warranties...")
        if self.flush_callback:
            self.flush_callback(self.cache)

        self.cache.clear()
        self.counter = 0

    def get_and_clear_cache(self):
        with self.lock:
            data_copy = list(self.cache)
            self.cache.clear()
            self.counter = 0
            return data_copy

    def get_counter(self):
        return self.counter
    
