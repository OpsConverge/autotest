package com.testmanagement.unit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

public class CalculatorTest {
    
    private Calculator calculator;
    
    @BeforeEach
    void setUp() {
        calculator = new Calculator();
    }
    
    @Test
    void testAddition() {
        assertEquals(4, calculator.add(2, 2), "2 + 2 should equal 4");
    }
    
    @Test
    void testSubtraction() {
        assertEquals(2, calculator.subtract(4, 2), "4 - 2 should equal 2");
    }
    
    @Test
    void testMultiplication() {
        assertEquals(8, calculator.multiply(2, 4), "2 * 4 should equal 8");
    }
    
    @Test
    void testDivision() {
        assertEquals(2, calculator.divide(8, 4), "8 / 4 should equal 2");
    }
    
    @Test
    void testDivisionByZero() {
        assertThrows(ArithmeticException.class, () -> {
            calculator.divide(5, 0);
        }, "Division by zero should throw ArithmeticException");
    }
    
    // Simple Calculator class for testing
    public static class Calculator {
        public int add(int a, int b) {
            return a + b;
        }
        
        public int subtract(int a, int b) {
            return a - b;
        }
        
        public int multiply(int a, int b) {
            return a * b;
        }
        
        public int divide(int a, int b) {
            if (b == 0) {
                throw new ArithmeticException("Division by zero");
            }
            return a / b;
        }
    }
}
