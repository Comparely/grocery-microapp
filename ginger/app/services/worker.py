# app/services/worker.py
import multiprocessing
import traceback
import redis
import importlib

def process_wrapper(target_path, redis_config, *args, **kwargs):
    redis_client = redis.Redis(**redis_config)
    pid = multiprocessing.current_process().pid
    try:
        redis_client.set(f"process:{pid}:status", "running")
        
        # Dynamically import function
        module_name, func_name = target_path.rsplit(".", 1)
        module = importlib.import_module(module_name)
        target_func = getattr(module, func_name)

        target_func(*args, **kwargs)
        redis_client.set(f"process:{pid}:status", "completed")
    except Exception:
        redis_client.set(f"process:{pid}:status", "failed")
        traceback.print_exc()