from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from schemas import OrderRequest, CancelRequest
from order_book import OrderBook
from order import Order
from connection_manager import ConnectionManager

app = FastAPI(title="Stock Order Matching Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

book = OrderBook()
connection = ConnectionManager()

@app.get("/health")
def check_server():
    return {
        "status": "ok",
    }

@app.get("/snapshot")
def get_snapshot(depth: int = 10):
    return book.get_snapshot(depth=depth)

@app.post("/reset")
async def reset_book():
    book.clear()
    snapshot = book.get_snapshot()
    await connection.broadcast(snapshot)
    return {"status": "ok", "message": "Order book cleared", "snapshot": snapshot}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await connection.connect(websocket)
        while True:
            book_changed = False
            data = await websocket.receive_json()
            try:
                if data.get("type") == "new_order":
                    validated_data = OrderRequest(**data)
                    
                    validated_order = Order(
                        order_id = validated_data.order_id,
                        side = validated_data.side,
                        price = validated_data.price,
                        quantity = validated_data.quantity,
                    )
                    if not book.add_order(validated_order):
                        await websocket.send_json({
                            "type": "error",
                            "message": "Order ID already exists"

                        })
                    
                    else:
                        await websocket.send_json({
                            "type": "order_received",
                            "order_id": validated_order.order_id,
                        })
                        trades = book.match_orders()
                        for trade in trades:
                            trade_data = {
                                "buy_order_id": trade.buy_order_id,
                                "sell_order_id": trade.sell_order_id,
                                "price": trade.price,
                                "quantity": trade.quantity,
                            }
                            await connection.broadcast({
                                "type": "trade_executed",
                                "trade": trade_data
                            })
                        book_changed = True

                elif data.get("type") == "cancel_order":
                    cancel_request = CancelRequest(**data)
                    if not book.cancel_order(cancel_request.order_id , cancel_request.side):
                        await websocket.send_json({
                            "type": "error",
                            "message": "Order not found or side does not match"
                        })

                    else:
                        await websocket.send_json({
                            "type": "order_cancelled",
                            "order_id": cancel_request.order_id,
                        })
                        book_changed = True

                elif data.get("type") in ["clear_book", "reset_book"]:
                    book.clear()
                    await websocket.send_json({
                        "type": "book_cleared",
                        "message": "Order book successfully cleared"
                    })
                    book_changed = True

                elif data.get("type") == "get_snapshot":
                    depth = data.get("depth", 10)
                    await websocket.send_json(book.get_snapshot(depth=depth))

                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Unknown message type"
                    })

                if book_changed:
                    await connection.broadcast(book.get_snapshot())
                    book_changed = False
            except ValidationError as e:
                await websocket.send_json({
                    "type": "error",
                    "message": e.errors()
                })
    except WebSocketDisconnect:
        await connection.disconnect(websocket)