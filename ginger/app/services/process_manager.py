import os
import multiprocessing
import traceback
from typing import Dict, Any, Callable
import redis

class ProcessManager:
    def __init__(self):
        # In-memory map for active Process objects
        self.processes: Dict[int, multiprocessing.Process] = {}
        # Redis client for status and locks
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        self.redis = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=1,
            decode_responses=True,
        )

    def spawn(self, target: Callable, *args: Any, **kwargs: Any) -> int:
        """
        Spawn a new OS process for the given target function.
        Returns the PID of the spawned process and stores its status in Redis.
        """
        def wrapper(*args: Any, **kwargs: Any) -> None:
            pid = multiprocessing.current_process().pid
            try:
                self.redis.set(f"process:{pid}:status", "running")
                target(*args, **kwargs)
                self.redis.set(f"process:{pid}:status", "completed")
            except Exception:
                self.redis.set(f"process:{pid}:status", "failed")
                traceback.print_exc()

        p = multiprocessing.Process(target=wrapper, args=args, kwargs=kwargs)
        p.start()
        pid = p.pid
        self.processes[pid] = p
        # Persist PID and status in Redis
        self.redis.sadd("process:all", pid)
        self.redis.set(f"process:{pid}:status", "running")
        return pid

    def spawn_for_query(self, query: str, target: Callable, *args: Any, **kwargs: Any) -> int:
        """
        Spawn a process for a specific query only if no other running process exists for that query.
        Uses a Redis lock to ensure concurrency safety.
        """
        lock = self.redis.lock(f"lock:{query}", blocking_timeout=5, timeout=600)
        with lock:
            existing = self.redis.get(f"process:query:{query}")
            if existing:
                pid = int(existing)
                status = self.get_status(pid)
                if status == "running":
                    return pid
            # No running process for this query; spawn a new one
            pid = self.spawn(target, *args, **kwargs)
            # Map query to PID
            self.redis.set(f"process:query:{query}", pid)
            return pid

    def get_status(self, pid: int) -> str:
        """Get status of a single process by PID from Redis or in-memory check."""
        if not self.redis.sismember("process:all", pid):
            return "not_found"
        proc = self.processes.get(pid)
        if proc and proc.is_alive():
            return "running"
        status = self.redis.get(f"process:{pid}:status")
        return status or "unknown"

    def get_all(self) -> Dict[int, str]:
        """Statuses of all spawned processes."""
        pids = self.redis.smembers("process:all")
        return {int(pid): self.get_status(int(pid)) for pid in pids}

    def get_running(self) -> Dict[int, str]:
        """Statuses of running processes only."""
        return {pid: st for pid, st in self.get_all().items() if st == "running"}

    def get_completed(self) -> Dict[int, str]:
        return {pid: st for pid, st in self.get_all().items() if st == "completed"}

    def get_failed(self) -> Dict[int, str]:
        return {pid: st for pid, st in self.get_all().items() if st == "failed"}

# Singleton instance
eprocess_manager = ProcessManager()