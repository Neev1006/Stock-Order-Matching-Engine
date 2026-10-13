import sys

import pytest
from fastapi.testclient import TestClient

sys.path.append("src")

import server
from order_book import OrderBook


@pytest.fixture
def client():
    # Reset module-level state so tests do not affect one another.
    server.book = OrderBook()
    server.connection.active_connections.clear()

    with TestClient(server.app) as test_client:
        yield test_client

    server.connection.active_connections.clear()


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_resting_order_returns_snapshot(client):
    with client.websocket_connect("/ws") as websocket:
        websocket.send_json({
            "type": "new_order",
            "order_id": 1,
            "side": "Sell",
            "price": 100,
            "quantity": 5,
        })

        order_received = websocket.receive_json()
        snapshot = websocket.receive_json()

        assert order_received == {
            "type": "order_received",
            "order_id": 1,
        }

        assert snapshot == {
            "type": "order_book_snapshot",
            "bids": [],
            "asks": [
                {"price": 100, "quantity": 5}
            ],
        }


def test_trade_is_broadcast_to_two_clients(client):
    with client.websocket_connect("/ws") as seller:
        with client.websocket_connect("/ws") as buyer:

            # Seller submits a sell order
            seller.send_json({
                "type": "new_order",
                "order_id": 1,
                "side": "Sell",
                "price": 100,
                "quantity": 5,
            })

            # Seller receives acknowledgement
            assert seller.receive_json() == {
                "type": "order_received",
                "order_id": 1,
            }

            # Seller receives updated snapshot
            expected_sell_snapshot = {
                "type": "order_book_snapshot",
                "bids": [],
                "asks": [
                    {"price": 100.0, "quantity": 5}
                ],
            }

            assert seller.receive_json() == expected_sell_snapshot

            # Buyer also receives the seller's snapshot
            assert buyer.receive_json() == expected_sell_snapshot

            # Buyer submits a buy order
            buyer.send_json({
                "type": "new_order",
                "order_id": 2,
                "side": "Buy",
                "price": 105,
                "quantity": 5,
            })

            # Buyer receives direct acknowledgement
            assert buyer.receive_json() == {
                "type": "order_received",
                "order_id": 2,
            }

            expected_trade = {
                "type": "trade_executed",
                "trade": {
                    "buy_order_id": 2,
                    "sell_order_id": 1,
                    "price": 105.0,
                    "quantity": 5,
                },
            }

            # Both clients receive the trade
            seller_trade = seller.receive_json()
            buyer_trade = buyer.receive_json()

            assert seller_trade == expected_trade
            assert buyer_trade == expected_trade

            # Both clients receive the empty-book snapshot
            expected_snapshot = {
                "type": "order_book_snapshot",
                "bids": [],
                "asks": [],
            }

            assert seller.receive_json() == expected_snapshot
            assert buyer.receive_json() == expected_snapshot


def test_cancel_order_returns_empty_snapshot(client):
    with client.websocket_connect("/ws") as websocket:
        websocket.send_json({
            "type": "new_order",
            "order_id": 10,
            "side": "Buy",
            "price": 100,
            "quantity": 5,
        })

        assert websocket.receive_json() == {
            "type": "order_received",
            "order_id": 10,
        }

        assert websocket.receive_json() == {
            "type": "order_book_snapshot",
            "bids": [
                {"price": 100, "quantity": 5}
            ],
            "asks": [],
        }

        websocket.send_json({
            "type": "cancel_order",
            "order_id": 10,
            "side": "Buy",
        })

        assert websocket.receive_json() == {
            "type": "order_cancelled",
            "order_id": 10,
        }

        assert websocket.receive_json() == {
            "type": "order_book_snapshot",
            "bids": [],
            "asks": [],
        }


def test_unknown_message_does_not_broadcast_snapshot(client):
    with client.websocket_connect("/ws") as websocket:
        websocket.send_json({
            "type": "something_else"
        })

        assert websocket.receive_json() == {
            "type": "error",
            "message": "Unknown message type",
        }

        # If the server incorrectly broadcast a snapshot after the error,
        # that old snapshot would be received before this acknowledgement.
        websocket.send_json({
            "type": "new_order",
            "order_id": 20,
            "side": "Sell",
            "price": 100,
            "quantity": 5,
        })

        assert websocket.receive_json() == {
            "type": "order_received",
            "order_id": 20,
        }

        assert websocket.receive_json() == {
            "type": "order_book_snapshot",
            "bids": [],
            "asks": [
                {"price": 100, "quantity": 5}
            ],
        }