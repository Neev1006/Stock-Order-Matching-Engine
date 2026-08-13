from datetime import datetime

class Trade:
    def __init__(self, buy_order_id, sell_order_id, price, quantity):
        self.buy_order_id = buy_order_id
        self.sell_order_id = sell_order_id
        self.price = price
        self.quantity = quantity

    def __repr__(self):
        return (
            f"Trade(buy={self.buy_order_id}, "
            f"sell={self.sell_order_id}, "
            f"price={self.price}, "
            f"quantity={self.quantity}, "
            f"timestamp={datetime.now().isoformat(timespec='milliseconds')})"
        )

    