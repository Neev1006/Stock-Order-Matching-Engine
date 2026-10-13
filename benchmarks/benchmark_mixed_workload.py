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


def submit_and_match(book, order_id, side, price, quantity):
    order = Order(
        order_id,
        side,
        price,
        quantity,
    )

    assert book.add_order(order)
    trades = book.match_orders()

    return len(trades)


def benchmark(batch_count, price_levels):
    book = OrderBook()

    total_orders = 0
    total_trades = 0
    next_order_id = 1

    start = time.perf_counter()

    for batch_number in range(batch_count):

        # 7 passive Sell orders.
        # Prices stay above 100, so they do not cross passive Buy orders.
        for offset in range(7):
            price = round(
                100.0 + ((batch_number + offset) % price_levels) * 0.01,
                2,
            )

            total_trades += submit_and_match(
                book,
                next_order_id,
                "Sell",
                price,
                10,
            )

            total_orders += 1
            next_order_id += 1

        # 7 passive Buy orders.
        # Prices stay below 100, so they do not cross passive Sell orders.
        for offset in range(7):
            price = round(
                99.0 - ((batch_number + offset) % price_levels) * 0.01,
                2,
            )

            total_trades += submit_and_match(
                book,
                next_order_id,
                "Buy",
                price,
                10,
            )

            total_orders += 1
            next_order_id += 1

        # 3 aggressive Buy orders.
        # They cross existing Sell orders and generate trades.
        for _ in range(3):
            total_trades += submit_and_match(
                book,
                next_order_id,
                "Buy",
                101.0,
                10,
            )

            total_orders += 1
            next_order_id += 1

        # 3 aggressive Sell orders.
        # They cross existing Buy orders and generate trades.
        for _ in range(3):
            total_trades += submit_and_match(
                book,
                next_order_id,
                "Sell",
                98.0,
                10,
            )

            total_orders += 1
            next_order_id += 1

    elapsed_seconds = time.perf_counter() - start

    expected_orders = batch_count * 20
    expected_trades = batch_count * 6
    expected_resting_orders = batch_count * 8

    assert total_orders == expected_orders
    assert total_trades == expected_trades
    assert len(book.orders) == expected_resting_orders
    assert book.can_match() is False

    result = {
        "benchmark": "mixed_limit_order_workload",
        "batches": batch_count,
        "orders_processed": total_orders,
        "trades_generated": total_trades,
        "remaining_resting_orders": len(book.orders),
        "active_bid_price_levels": len(book.bids),
        "active_ask_price_levels": len(book.asks),
        "elapsed_seconds": round(elapsed_seconds, 6),
        "orders_per_second": round(total_orders / elapsed_seconds, 2),
        "trades_per_second": round(total_trades / elapsed_seconds, 2),
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "scenario": (
            "Each batch contains 14 passive limit orders (70%) across "
            "multiple price levels and 6 aggressive crossing orders (30%)."
        ),
        "workload_details": {
            "passive_buy_orders_per_batch": 7,
            "passive_sell_orders_per_batch": 7,
            "crossing_buy_orders_per_batch": 3,
            "crossing_sell_orders_per_batch": 3,
            "quantity_per_order": 10,
            "configured_price_levels_per_side": price_levels,
        },
    }

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Benchmark the order matching engine with a mixed workload."
    )

    parser.add_argument(
        "--batches",
        type=int,
        default=10000,
        help="Number of 20-order mixed-workload batches.",
    )

    parser.add_argument(
        "--price-levels",
        type=int,
        default=50,
        help="Number of distinct passive price levels on each side.",
    )

    args = parser.parse_args()

    if args.batches <= 0:
        raise ValueError("--batches must be greater than zero")

    if args.price_levels <= 0:
        raise ValueError("--price-levels must be greater than zero")

    benchmark_result = benchmark(
        batch_count=args.batches,
        price_levels=args.price_levels,
    )

    print(json.dumps(benchmark_result, indent=2))

    output_path = PROJECT_ROOT / "benchmark_mixed_workload_results.json"
    output_path.write_text(
        json.dumps(benchmark_result, indent=2),
        encoding="utf-8",
    )

    print(f"\nSaved results to: {output_path}")