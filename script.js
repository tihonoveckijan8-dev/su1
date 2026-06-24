(function() {
  'use strict';

  // ----- Состояние калькулятора -----
  const state = {
    currentOperand: '0',
    previousOperand: '',
    operation: null,
    shouldResetScreen: false,
    lastResult: null
  };

  // ----- DOM элементы -----
  const currentOperandEl = document.getElementById('current-operand');
  const previousOperandEl = document.getElementById('previous-operand');
  const clearBtn = document.getElementById('clear-btn');

  // ----- Утилиты -----
  function updateDisplay() {
    currentOperandEl.textContent = state.currentOperand;
    
    if (state.operation && state.previousOperand !== '') {
      previousOperandEl.textContent = `${state.previousOperand} ${state.operation}`;
    } else if (state.previousOperand && !state.operation) {
      previousOperandEl.textContent = state.previousOperand;
    } else {
      previousOperandEl.textContent = '';
    }

    // Меняем текст AC/C в зависимости от состояния
    if (state.currentOperand !== '0' || state.previousOperand !== '' || state.operation) {
      clearBtn.textContent = 'C';
    } else {
      clearBtn.textContent = 'AC';
    }
  }

  function formatOperand(value) {
    if (value === '' || value === '.') return '0';
    // Ограничим длину, чтобы не вылезало за экран
    if (value.length > 12) {
      return parseFloat(value).toExponential(5);
    }
    return value;
  }

  // ----- Основные операции -----
  function clearAll() {
    state.currentOperand = '0';
    state.previousOperand = '';
    state.operation = null;
    state.shouldResetScreen = false;
    state.lastResult = null;
  }

  function clearEntry() {
    state.currentOperand = '0';
    state.shouldResetScreen = false;
  }

  function appendNumber(number) {
    if (state.shouldResetScreen) {
      state.currentOperand = '';
      state.shouldResetScreen = false;
    }
    
    // Не даём вводить больше одной точки
    if (number === '.' && state.currentOperand.includes('.')) return;
    
    // Ограничение на длину (без точки)
    if (state.currentOperand.replace('.', '').length >= 12) return;

    if (state.currentOperand === '0' && number !== '.') {
      state.currentOperand = number;
    } else {
      state.currentOperand += number;
    }
  }

  function toggleSign() {
    if (state.currentOperand === '0') return;
    if (state.currentOperand.startsWith('-')) {
      state.currentOperand = state.currentOperand.slice(1);
    } else {
      state.currentOperand = '-' + state.currentOperand;
    }
  }

  function percent() {
    if (state.currentOperand === '0') return;
    const num = parseFloat(state.currentOperand);
    if (isNaN(num)) return;
    state.currentOperand = (num / 100).toString();
    // Убираем лишние нули после точки
    if (state.currentOperand.includes('.')) {
      state.currentOperand = parseFloat(state.currentOperand).toString();
    }
  }

  function chooseOperation(op) {
    if (state.currentOperand === '' && state.previousOperand === '') return;
    
    if (state.previousOperand !== '' && state.operation && !state.shouldResetScreen) {
      compute();
    }

    state.operation = op;
    state.previousOperand = state.currentOperand;
    state.shouldResetScreen = true;
  }

  function compute() {
    const prev = parseFloat(state.previousOperand);
    const current = parseFloat(state.currentOperand);
    
    if (isNaN(prev) || isNaN(current)) return;
    
    let result;
    switch (state.operation) {
      case '+':
        result = prev + current;
        break;
      case '−':
        result = prev - current;
        break;
      case '×':
        result = prev * current;
        break;
      case '÷':
        if (current === 0) {
          alert('Деление на ноль невозможно');
          clearAll();
          updateDisplay();
          return;
        }
        result = prev / current;
        break;
      default:
        return;
    }

    // Округляем результат, чтобы избежать проблем с плавающей точкой
    result = Math.round((result + Number.EPSILON) * 100000000) / 100000000;
    
    state.currentOperand = result.toString();
    state.operation = null;
    state.previousOperand = '';
    state.shouldResetScreen = true;
    state.lastResult = result;
  }

  function handleEquals() {
    if (!state.operation || state.shouldResetScreen) {
      // Если нет операции, но было previous, возможно повторное равно
      if (state.previousOperand && state.lastResult !== null && !state.operation) {
        // Повтор последней операции? Не реализуем сложную логику, просто ничего.
      }
      return;
    }
    compute();
  }

  // ----- Обработчики событий кнопок -----
  function handleButtonClick(e) {
    const button = e.target.closest('button');
    if (!button) return;
    
    const action = button.dataset.action;
    
    // Анимация нажатия (тактильная)
    button.style.transform = 'scale(0.92)';
    setTimeout(() => {
      button.style.transform = '';
    }, 100);

    if (action === 'number') {
      const value = button.dataset.value;
      appendNumber(value);
    } else if (action === 'decimal') {
      appendNumber('.');
    } else if (action === 'clear') {
      if (state.currentOperand !== '0' || state.previousOperand !== '' || state.operation) {
        clearEntry();
      } else {
        clearAll();
      }
    } else if (action === 'sign') {
      toggleSign();
    } else if (action === 'percent') {
      percent();
    } else if (action === 'operation') {
      const op = button.dataset.value;
      chooseOperation(op);
    } else if (action === 'equals') {
      handleEquals();
    }
    
    updateDisplay();
  }

  // ----- Смена темы -----
  function switchTheme(theme) {
    document.body.className = ''; // сброс
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else if (theme === 'rose') {
      document.body.classList.add('theme-rose');
    } else {
      document.body.classList.add('theme-default');
    }
    
    // Обновляем активную точку
    document.querySelectorAll('.theme-dot').forEach(dot => {
      dot.classList.remove('active');
      if (dot.dataset.theme === theme) {
        dot.classList.add('active');
      }
    });

    // Сохраняем предпочтение
    localStorage.setItem('calculatorTheme', theme);
  }

  // ----- Инициализация -----
  function init() {
    // Вешаем обработчик на весь калькулятор (делегирование)
    const calculatorElement = document.querySelector('.calculator');
    calculatorElement.addEventListener('click', handleButtonClick);

    // Поддержка клавиатуры
    window.addEventListener('keydown', (e) => {
      const key = e.key;
      // Цифры и точка
      if ((key >= '0' && key <= '9') || key === '.') {
        e.preventDefault();
        if (key === '.') {
          appendNumber('.');
        } else {
          appendNumber(key);
        }
        updateDisplay();
      }
      // Операторы
      if (key === '+' || key === '-' || key === '*' || key === '/') {
        e.preventDefault();
        let op = key;
        if (key === '*') op = '×';
        if (key === '/') op = '÷';
        if (key === '-') op = '−';
        chooseOperation(op);
        updateDisplay();
      }
      // Enter или равно
      if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
        updateDisplay();
      }
      // Backspace
      if (key === 'Backspace') {
        e.preventDefault();
        if (state.shouldResetScreen) {
          clearAll();
        } else {
          if (state.currentOperand.length > 1) {
            state.currentOperand = state.currentOperand.slice(0, -1);
          } else {
            state.currentOperand = '0';
          }
        }
        updateDisplay();
      }
      // Escape (очистка)
      if (key === 'Escape') {
        e.preventDefault();
        clearAll();
        updateDisplay();
      }
    });

    // Обработчики точек темы
    document.querySelectorAll('.theme-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme;
        switchTheme(theme);
      });
    });

    // Загрузка сохранённой темы
    const savedTheme = localStorage.getItem('calculatorTheme') || 'default';
    switchTheme(savedTheme);
    
    // Начальное отображение
    updateDisplay();
  }

  // Старт
  init();
})();
