from collections import OrderedDict
from sortedcontainers import SortedDict

from Order import Order
from trade import Trade


class OrderBook:

    def __init__(self):
        # price -> FIFO queue of orders
        self.bids = SortedDict()
        self.asks = SortedDict()

        # order_id -> Order
        self.orders = {}

    # ADD BUY/SELL ORDER
    def add_order(self, order):

        if order.price <= 0 or order.quantity <= 0:
            return False

        if order.id in self.orders:
            return False

        if order.side == "Buy":

            if order.price not in self.bids:
                self.bids[order.price] = OrderedDict()

            self.bids[order.price][order.id] = order

        elif order.side == "Sell":

            if order.price not in self.asks:
                self.asks[order.price] = OrderedDict()

            self.asks[order.price][order.id] = order

        else:
            return False

        self.orders[order.id] = order

        return True


    #CHECK IF WE CAN EXECUTE A TRADE
    def can_match(self):

        if not self.bids or not self.asks:
            return False

        best_bid = self.bids.peekitem(-1)[0]
        best_ask = self.asks.peekitem(0)[0]

        return best_bid >= best_ask

    
    #EXECUTE ALL TRADES
    def match_orders(self):

        trades = []

        while self.can_match():

            # Best BUY price
            bid_price, bid_orders = self.bids.peekitem(-1)

            # Best SELL price
            ask_price, ask_orders = self.asks.peekitem(0)

            # First order at each price level
            buy_order_id, buy_order = next(iter(bid_orders.items()))
            sell_order_id, sell_order = next(iter(ask_orders.items()))

            trade_price = buy_order.price

            trade_quantity = min(
                buy_order.quantity,
                sell_order.quantity
            )

            trade = Trade(
                buy_order.id,
                sell_order.id,
                trade_price,
                trade_quantity,
            )

            trades.append(trade)

            # Reduce quantities
            buy_order.quantity -= trade_quantity
            sell_order.quantity -= trade_quantity

            # BUY completely filled
            if buy_order.quantity == 0:

                del bid_orders[buy_order.id]
                del self.orders[buy_order.id]

                if not bid_orders:
                    del self.bids[bid_price]

            # SELL completely filled
            if sell_order.quantity == 0:

                del ask_orders[sell_order.id]
                del self.orders[sell_order.id]

                if not ask_orders:
                    del self.asks[ask_price]

        return trades

    def cancel_order(self, order_id, side):

        order = self.orders.get(order_id)
        if order is None:
            return False

        if order.side != side:
            return False

        if side == "Buy":
            price_level = self.bids[order.price]

        else:
            price_level = self.asks[order.price]

        del price_level[order_id]

        if not price_level:
            if side == "Buy":
                del self.bids[order.price]
            else:
                del self.asks[order.price]

        del self.orders[order_id]

        return True 
