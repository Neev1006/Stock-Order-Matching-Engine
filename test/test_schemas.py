import sys
import pytest
from pydantic import ValidationError

sys.path.append("src")

from schemas import OrderRequest


def test_valid_buy_order():
    order = OrderRequest(
        type="new_order",
        order_id=101,
        side="Buy",
        price=105.5,
        quantity=10,
    )

    assert order.type == "new_order"
    assert order.order_id == 101
    assert order.side == "Buy"
    assert order.price == 105.5
    assert order.quantity == 10


def test_valid_sell_order():
    order = OrderRequest(
        type="new_order",
        order_id=102,
        side="Sell",
        price=100,
        quantity=5,
    )

    assert order.side == "Sell"


@pytest.mark.parametrize(
    "field, invalid_value",
    [
        ("type", "cancel_order"),
        ("side", "Hold"),
        ("price", 0),
        ("price", -10),
        ("quantity", 0),
        ("quantity", -5),
    ],
)
def test_invalid_order_values_are_rejected(field, invalid_value):
    valid_order = {
        "type": "new_order",
        "order_id": 101,
        "side": "Buy",
        "price": 105.5,
        "quantity": 10,
    }

    valid_order[field] = invalid_value

    with pytest.raises(ValidationError):
        OrderRequest(**valid_order)


def test_missing_required_field_is_rejected():
    incomplete_order = {
        "type": "new_order",
        "order_id": 101,
        "side": "Buy",
        "price": 105.5,
        # quantity deliberately missing
    }

    with pytest.raises(ValidationError):
        OrderRequest(**incomplete_order)