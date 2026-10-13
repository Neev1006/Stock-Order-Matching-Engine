import argparse
import asyncio
import json
import math
import platform
import statistics
import time
from pathlib import Path

import websockets


PROJECT_ROOT = Path(__file__).resolve().parents[1]
WS_URL = "ws://127.0.0.1:8000/ws"


async def receive_until_snapshot(websocket):
    received_messages = []

    while True:
        response = json.loads(await websocket.recv())
        received_messages.append(response)

        if response["type"] == "order_book_snapshot":
            return received_messages


def percentile(values, percentage):
    ordered_values = sorted(values)
    index = math.ceil((percentage / 100) * len(ordered_values)) - 1
    return ordered_values[index]


async def benchmark(samples: int, warmup: int) -> dict:
    latencies_ms = []

    async with websockets.connect(WS_URL) as websocket:
        total_requests = samples + warmup

        for order_id in range(1, total_requests + 1):
            payload = {
                "type": "new_order",
                "order_id": order_id,
                "side": "Buy",
                "price": 100.0,
                "quantity": 1,
            }

            started_at = time.perf_counter()

            await websocket.send(json.dumps(payload))
            messages = await receive_until_snapshot(websocket)

            elapsed_ms = (time.perf_counter() - started_at) * 1000

            assert messages[0] == {
                "type": "order_received",
                "order_id": order_id,
            }

            assert messages[-1]["type"] == "order_book_snapshot"

            if order_id > warmup:
                latencies_ms.append(elapsed_ms)

    return {
        "benchmark": "websocket_order_acknowledgement_and_snapshot",
        "samples": samples,
        "warmup_requests": warmup,
        "p50_latency_ms": round(statistics.median(latencies_ms), 3),
        "p95_latency_ms": round(percentile(latencies_ms, 95), 3),
        "min_latency_ms": round(min(latencies_ms), 3),
        "max_latency_ms": round(max(latencies_ms), 3),
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "scenario": (
            "One local WebSocket client submits non-crossing Buy orders and "
            "measures time until order_received plus order_book_snapshot."
        ),
        "environment": "Local loopback benchmark; not a production network benchmark.",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples", type=int, default=200)
    parser.add_argument("--warmup", type=int, default=20)
    args = parser.parse_args()

    if args.samples <= 0 or args.warmup < 0:
        raise ValueError("samples must be positive and warmup must not be negative")

    result = asyncio.run(benchmark(args.samples, args.warmup))

    print(json.dumps(result, indent=2))

    output_path = PROJECT_ROOT / "benchmark_websocket_results.json"
    output_path.write_text(json.dumps(result, indent=2))
    print(f"\nSaved results to: {output_path}")