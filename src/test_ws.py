import asyncio
import websockets
import json


ORDERS = [
    {"type": "new_order", "order_id": 1, "side": "Sell", "price": 100, "quantity": 5},
    {"type": "new_order", "order_id": 2, "side": "Sell", "price": 102, "quantity": 8},
    {"type": "new_order", "order_id": 3, "side": "Sell", "price": 105, "quantity": 10},
    {"type": "new_order", "order_id": 4, "side": "Buy", "price": 103, "quantity": 10},
    {"type": "new_order", "order_id": 5, "side": "Buy", "price": 106, "quantity": 12},
]


async def receive_messages(ws):
    try:
        while True:
            response = await ws.recv()
            data = json.loads(response)

            print("\nReceived:")
            print(json.dumps(data, indent=4))

    except websockets.exceptions.ConnectionClosed:
        print("Connection closed")


async def test():
    async with websockets.connect("ws://127.0.0.1:8000/ws") as ws:

        receiver = asyncio.create_task(receive_messages(ws))

        for order in ORDERS:
            print(f"\nSending Order: {order}")

            await ws.send(json.dumps(order))

            # Give server time to process and broadcast
            await asyncio.sleep(0.5)

        await asyncio.sleep(2)

        receiver.cancel()


asyncio.run(test())