from datetime import datetime
class Order:
    def __init__(self,order_id,side,price,quantity):

        self.order_id = order_id
        self.side = side
        self.price = price
        self.quantity = quantity

    def __repr__(self):
        return (f"Order("
                f"id:{self.order_id}, "
                f"side:{self.side}, "
                f"price:{self.price}, "
                f"quantity:{self.quantity}, "
                f"timestamp:{datetime.now().isoformat(timespec='milliseconds')}"
                f")"
        )

