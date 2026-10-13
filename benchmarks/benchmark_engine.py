import argparse
import json
import platform
import sys
import time
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from order import Order
from order_book import OrderBook


def benchmark(pair_count: int) -> dict:
    book = OrderBook()
    trade_count = 0

    start = time.perf_counter()

    for pair_number in range(pair_count):
        sell_order_id = pair_number * 2 + 1
        buy_order_id = pair_number * 2 + 2

        sell_order = Order(
            sell_order_id,
            "Sell",
            100.0,
            10,
        )

        buy_order = Order(
            buy_order_id,
            "Buy",
            100.0,
            10,
        )

        assert book.add_order(sell_order)
        trade_count += len(book.match_orders())

        assert book.add_order(buy_order)
        trade_count += len(book.match_orders())

    elapsed_seconds = time.perf_counter() - start
    orders_processed = pair_count * 2

    assert trade_count == pair_count
    assert not book.bids
    assert not book.asks

    return {
        "benchmark": "engine_limit_order_lifecycle",
        "pairs": pair_count,
        "orders_processed": orders_processed,
        "trades_generated": trade_count,
        "elapsed_seconds": round(elapsed_seconds, 6),
        "orders_per_second": round(orders_processed / elapsed_seconds, 2),
        "trades_per_second": round(trade_count / elapsed_seconds, 2),
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "scenario": (
            "Each pair submits one resting Sell limit order followed by "
            "one crossing Buy limit order at the same price."
        ),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pairs",
        type=int,
        default=50000,
        help="Number of Sell/Buy order pairs to process.",
    )
    args = parser.parse_args()

    if args.pairs <= 0:
        raise ValueError("--pairs must be greater than zero")

    result = benchmark(args.pairs)

    print(json.dumps(result, indent=2))

    output_path = PROJECT_ROOT / "benchmark_engine_results.json"
    output_path.write_text(json.dumps(result, indent=2))
    print(f"\nSaved results to: {output_path}")