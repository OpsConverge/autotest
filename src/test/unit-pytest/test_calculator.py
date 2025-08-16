import pytest
from typing import Union

class Calculator:
    """Simple calculator class for testing purposes."""
    
    def add(self, a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
        """Add two numbers."""
        return a + b
    
    def subtract(self, a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
        """Subtract two numbers."""
        return a - b
    
    def multiply(self, a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
        """Multiply two numbers."""
        return a * b
    
    def divide(self, a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
        """Divide two numbers."""
        if b == 0:
            raise ValueError("Division by zero is not allowed")
        return a / b

class TestCalculator:
    """Test class for Calculator."""
    
    @pytest.fixture
    def calculator(self):
        """Fixture to create a Calculator instance."""
        return Calculator()
    
    def test_addition(self, calculator):
        """Test addition functionality."""
        assert calculator.add(2, 2) == 4
        assert calculator.add(-1, 1) == 0
        assert calculator.add(0.5, 0.5) == 1.0
    
    def test_subtraction(self, calculator):
        """Test subtraction functionality."""
        assert calculator.subtract(4, 2) == 2
        assert calculator.subtract(1, 1) == 0
        assert calculator.subtract(0.5, 0.3) == 0.2
    
    def test_multiplication(self, calculator):
        """Test multiplication functionality."""
        assert calculator.multiply(2, 4) == 8
        assert calculator.multiply(-2, 3) == -6
        assert calculator.multiply(0.5, 2) == 1.0
    
    def test_division(self, calculator):
        """Test division functionality."""
        assert calculator.divide(8, 4) == 2
        assert calculator.divide(5, 2) == 2.5
        assert calculator.divide(0, 5) == 0
    
    def test_division_by_zero(self, calculator):
        """Test division by zero raises ValueError."""
        with pytest.raises(ValueError, match="Division by zero is not allowed"):
            calculator.divide(5, 0)
    
    @pytest.mark.parametrize("a,b,expected", [
        (2, 2, 4),
        (0, 5, 5),
        (-1, 1, 0),
        (10, -5, 5)
    ])
    def test_addition_parametrized(self, calculator, a, b, expected):
        """Test addition with multiple test cases."""
        assert calculator.add(a, b) == expected
