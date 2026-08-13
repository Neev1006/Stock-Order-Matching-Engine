import sys
sys.path.append("src")

from Order import Order
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