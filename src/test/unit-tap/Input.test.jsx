const { test } = require('tap');
const { render, screen, fireEvent } = require('@testing-library/react');
const React = require('react');
const { Input } = require('../../components/ui/input');

test('Input component renders with correct placeholder', (t) => {
  render(React.createElement(Input, { placeholder: 'Enter text' }));
  const input = screen.getByPlaceholderText(/enter text/i);
  t.ok(input, 'Input should be rendered with placeholder');
  t.end();
});

test('Input calls onChange handler when value changes', (t) => {
  let value = '';
  const handleChange = (e) => { value = e.target.value; };
  
  render(React.createElement(Input, { 
    placeholder: 'Enter text',
    onChange: handleChange 
  }));
  
  const input = screen.getByPlaceholderText(/enter text/i);
  fireEvent.change(input, { target: { value: 'test value' } });
  
  t.equal(value, 'test value', 'onChange should be called with new value');
  t.end();
});

test('Input applies disabled state correctly', (t) => {
  render(React.createElement(Input, { 
    placeholder: 'Enter text',
    disabled: true 
  }));
  
  const input = screen.getByPlaceholderText(/enter text/i);
  t.ok(input.disabled, 'Input should be disabled');
  t.end();
});

test('Input applies type attribute correctly', (t) => {
  render(React.createElement(Input, { 
    placeholder: 'Enter text',
    type: 'password' 
  }));
  
  const input = screen.getByPlaceholderText(/enter text/i);
  t.equal(input.type, 'password', 'Input should have password type');
  t.end();
});

test('Input handles controlled value', (t) => {
  render(React.createElement(Input, { 
    placeholder: 'Enter text',
    value: 'controlled value' 
  }));
  
  const input = screen.getByPlaceholderText(/enter text/i);
  t.equal(input.value, 'controlled value', 'Input should have controlled value');
  t.end();
});

test('Input applies custom className', (t) => {
  render(React.createElement(Input, { 
    placeholder: 'Enter text',
    className: 'custom-class' 
  }));
  
  const input = screen.getByPlaceholderText(/enter text/i);
  t.ok(input.classList.contains('custom-class'), 'Input should have custom class');
  t.end();
});
