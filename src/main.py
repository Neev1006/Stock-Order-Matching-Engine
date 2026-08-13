from Order import Order
from order_book import OrderBook


book = OrderBook()

book.add_order(Order(1, "Buy", 105, 10))

book.add_order(Order(2, "Sell", 100, 5))
book.add_order(Order(3, "Sell", 101, 3))
book.add_order(Order(4, "Sell", 105, 10))

trades = book.match_orders()

for trade in trades:
    print(trade)

print("\nBids:")
print(book.bids)

print("\nAsks:")
print(book.asks)