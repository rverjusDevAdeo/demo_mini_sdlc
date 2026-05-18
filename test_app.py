"""Unit tests for the mini calculator."""
import pytest

from app import add, sub, mul, div, mod


def test_add():
    assert add(2, 3) == 5


def test_sub():
    assert sub(5, 2) == 3


def test_mul():
    assert mul(4, 3) == 12


def test_div():
    assert div(10, 2) == 5


def test_div_by_zero_raises():
    with pytest.raises(ValueError, match="division by zero"):
        div(1, 0)


def test_mod():
    assert mod(10, 3) == 1


def test_mod_by_zero_raises():
    with pytest.raises(ValueError, match="modulo by zero"):
        mod(1, 0)
