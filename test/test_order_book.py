import sys
sys.path.append("src")

from order import Order
from order_book import OrderBook


def test_exact_match():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 100, 10))
    book.add_order(Order(2, "Sell", 100, 10))

    trades = book.match_orders()

    assert len(trades) == 1
    assert trades[0].buy_order_id == 1
    assert trades[0].sell_order_id == 2
    assert trades[0].price == 100
    assert trades[0].quantity == 10
    assert not book.bids
    assert not book.asks

def test_partial_fill_leaves_remaining_sell_order():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 105, 10))
    book.add_order(Order(2, "Sell", 100, 4))

    trades = book.match_orders()

    assert len(trades) == 1
    assert trades[0].quantity == 4
    assert 1 in book.orders
    assert book.orders[1].quantity == 6
    assert not book.asks

def test_non_crossing_orders_rest_in_book():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 99, 10))
    book.add_order(Order(2, "Sell", 100, 10))

    trades = book.match_orders()

    assert trades == []
    assert book.orders[1].quantity == 10
    assert book.orders[2].quantity == 10

def test_buy_order_matches_multiple_ask_levels():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 105, 10))
    book.add_order(Order(2, "Sell", 100, 3))
    book.add_order(Order(3, "Sell", 101, 4))
    book.add_order(Order(4, "Sell", 105, 8))

    trades = book.match_orders()

    assert [trade.quantity for trade in trades] == [3, 4, 3]
    assert book.orders[4].quantity == 5
    assert 1 not in book.orders

def test_same_price_orders_use_fifo_time_priority():
    book = OrderBook()

    book.add_order(Order(1, "Sell", 100, 5))  # arrives first
    book.add_order(Order(2, "Sell", 100, 5))  # arrives second
    book.add_order(Order(3, "Buy", 100, 6))

    trades = book.match_orders()

    assert len(trades) == 2
    assert trades[0].sell_order_id == 1
    assert trades[0].quantity == 5
    assert trades[1].sell_order_id == 2
    assert trades[1].quantity == 1
    assert book.orders[2].quantity == 4

def test_duplicate_order_id_is_rejected():
    book = OrderBook()

    assert book.add_order(Order(1, "Buy", 100, 5)) is True
    assert book.add_order(Order(1, "Sell", 100, 5)) is False


def test_cancel_open_order():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 100, 5))

    assert book.cancel_order(1, "Buy") is True
    assert 1 not in book.orders
    assert not book.bids

def test_zero_quantity_order_is_rejected():
    book = OrderBook()

    assert book.add_order(Order(1, "Buy", 100, 0)) is False
    assert not book.orders


def test_negative_quantity_order_is_rejected():
    book = OrderBook()

    assert book.add_order(Order(1, "Sell", 100, -5)) is False
    assert not book.orders


def test_non_positive_price_order_is_rejected():
    book = OrderBook()

    assert book.add_order(Order(1, "Buy", 0, 10)) is False
    assert book.add_order(Order(2, "Sell", -1, 10)) is False

def test_snapshot_orders_bids_and_asks_by_best_price():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 100, 5))
    book.add_order(Order(2, "Buy", 105, 3))
    book.add_order(Order(3, "Buy", 103, 2))

    book.add_order(Order(4, "Sell", 110, 4))
    book.add_order(Order(5, "Sell", 108, 6))
    book.add_order(Order(6, "Sell", 112, 1))

    snapshot = book.get_snapshot()

    assert snapshot["bids"] == [
        {"price": 105, "quantity": 3},
        {"price": 103, "quantity": 2},
        {"price": 100, "quantity": 5},
    ]

    assert snapshot["asks"] == [
        {"price": 108, "quantity": 6},
        {"price": 110, "quantity": 4},
        {"price": 112, "quantity": 1},
    ]


def test_snapshot_aggregates_quantity_at_same_price():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 100, 3))
    book.add_order(Order(2, "Buy", 100, 7))

    snapshot = book.get_snapshot()

    assert snapshot["bids"] == [
        {"price": 100, "quantity": 10}
    ]


def test_snapshot_respects_depth():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 105, 1))
    book.add_order(Order(2, "Buy", 104, 1))
    book.add_order(Order(3, "Buy", 103, 1))

    book.add_order(Order(4, "Sell", 110, 1))
    book.add_order(Order(5, "Sell", 111, 1))
    book.add_order(Order(6, "Sell", 112, 1))

    snapshot = book.get_snapshot(depth=2)

    assert snapshot["bids"] == [
        {"price": 105, "quantity": 1},
        {"price": 104, "quantity": 1},
    ]

    assert snapshot["asks"] == [
        {"price": 110, "quantity": 1},
        {"price": 111, "quantity": 1},
    ]


def test_snapshot_shows_remaining_quantity_after_partial_fill():
    book = OrderBook()

    book.add_order(Order(1, "Sell", 100, 5))
    book.add_order(Order(2, "Buy", 105, 10))

    book.match_orders()
    snapshot = book.get_snapshot()

    assert snapshot["bids"] == [
        {"price": 105, "quantity": 5}
    ]
    assert snapshot["asks"] == []


def test_cancel_sell_order_successfully():
    book = OrderBook()

    book.add_order(Order(1, "Sell", 100, 5))

    assert book.cancel_order(1, "Sell") is True
    assert 1 not in book.orders
    assert not book.asks


def test_cancel_order_with_wrong_side_fails():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 100, 5))

    assert book.cancel_order(1, "Sell") is False
    assert 1 in book.orders


def test_cancel_missing_order_fails():
    book = OrderBook()

    assert book.cancel_order(999, "Buy") is False


def test_cancelled_order_disappears_from_snapshot():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 100, 5))
    book.add_order(Order(2, "Buy", 99, 3))

    book.cancel_order(1, "Buy")
    snapshot = book.get_snapshot()

    assert snapshot["bids"] == [
        {"price": 99, "quantity": 3}
    ]


def test_cancelling_last_order_removes_price_level():
    book = OrderBook()

    book.add_order(Order(1, "Buy", 100, 5))
    book.add_order(Order(2, "Buy", 99, 3))

    book.cancel_order(1, "Buy")

    assert 100 not in book.bids
    assert 99 in book.bids