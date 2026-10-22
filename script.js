/**
 * Animated Expression Calculator Engine & UI Controller
 * Tom & Jerry Super Colorful Fun Edition
 */

class ExpressionEvaluator {
  static evaluate(expr) {
    if (!expr || expr.trim() === '') return 0;

    // Normalize characters
    let s = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\s+/g, '');

    // Convert percentage instances: e.g. "50%" into "(50/100)"
    s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

    let pos = 0;

    function peek() {
      return s[pos];
    }

    function get() {
      return s[pos++];
    }

    function parseExpression() {
      let result = parseTerm();
      while (pos < s.length) {
        const op = peek();
        if (op === '+') {
          get();
          result += parseTerm();
        } else if (op === '-') {
          get();
          result -= parseTerm();
        } else {
          break;
        }
      }
      return result;
    }

    function parseTerm() {
      let result = parseFactor();
      while (pos < s.length) {
        const op = peek();
        if (op === '*') {
          get();
          result *= parseFactor();
        } else if (op === '/') {
          get();
          const divisor = parseFactor();
          if (divisor === 0) {
            throw new Error('Cannot divide by 0');
          }
          result /= divisor;
        } else {
          break;
        }
      }
      return result;
    }

    function parseFactor() {
      if (pos >= s.length) {
        throw new Error('Incomplete expression');
      }

      // Unary operators
      if (peek() === '+') {
        get();
        return parseFactor();
      }
      if (peek() === '-') {
        get();
        return -parseFactor();
      }

      // Parentheses
      if (peek() === '(') {
        get();
        const res = parseExpression();
        if (peek() === ')') {
          get();
        }
        return res;
      }

      // Parse number
      const start = pos;
      while (pos < s.length && ((s[pos] >= '0' && s[pos] <= '9') || s[pos] === '.')) {
        pos++;
      }

      if (start === pos) {
        throw new Error('Invalid syntax');
      }

      const numStr = s.substring(start, pos);
      const val = parseFloat(numStr);
      if (isNaN(val)) {
        throw new Error('Invalid number');
      }
      return val;
    }

    const value = parseExpression();

    if (pos < s.length) {
      throw new Error('Syntax error');
    }

    return value;
  }
}

class Calculator {
  constructor(primaryDisplayElement, expressionDisplayElement, cardElement) {
    this.primaryDisplayElement = primaryDisplayElement;
    this.expressionDisplayElement = expressionDisplayElement;
    this.cardElement = cardElement;
    this.clear();
  }

  clear() {
    this.expression = '';
    this.lastResult = null;
    this.isErrorState = false;
    this.justCalculated = false;
    this.expressionDisplayElement.textContent = '';
    this.updateDisplay();
  }

  delete() {
    if (this.isErrorState || this.justCalculated) {
      this.clear();
      return;
    }

    if (this.expression.length > 0) {
      if (this.expression.endsWith(' ')) {
        this.expression = this.expression.trimEnd();
        this.expression = this.expression.slice(0, -1).trimEnd();
      } else {
        this.expression = this.expression.slice(0, -1);
      }
    }
    this.updateDisplay();
  }

  appendNumber(number) {
    if (this.isErrorState) {
      this.clear();
    }

    if (this.justCalculated) {
      this.expression = '';
      this.expressionDisplayElement.textContent = '';
      this.justCalculated = false;
    }

    if (number === '.') {
      const parts = this.expression.split(/[\s+\-×÷]+/);
      const currentSegment = parts[parts.length - 1];
      if (currentSegment.includes('.')) return;
      if (currentSegment === '' || this.expression.endsWith(' ') || this.expression === '') {
        this.expression += '0';
      }
    }

    const parts = this.expression.split(/[\s+\-×÷]+/);
    const currentSegment = parts[parts.length - 1];
    if (currentSegment === '0' && number !== '.') {
      this.expression = this.expression.slice(0, -1) + number;
      this.updateDisplay();
      return;
    }

    this.expression += number;
    this.updateDisplay();
  }

  appendOperator(operator) {
    if (this.isErrorState) {
      this.clear();
    }

    if (this.justCalculated && this.lastResult !== null) {
      this.expression = this.lastResult.toString();
      this.justCalculated = false;
    }

    if (this.expression === '') {
      if (operator === '-') {
        this.expression = '-';
        this.updateDisplay();
      }
      return;
    }

    const operatorRegex = / [+\-×÷] $/;
    if (operatorRegex.test(this.expression)) {
      if (operator === '-' && !this.expression.endsWith('- ')) {
        this.expression += '-';
      } else {
        this.expression = this.expression.replace(operatorRegex, ` ${operator} `);
      }
      this.updateDisplay();
      return;
    }

    if (this.expression.endsWith('-') && this.expression.length === 1) {
      return;
    }

    this.expression += ` ${operator} `;
    this.updateDisplay();
  }

  appendPercent() {
    if (this.isErrorState) return;

    if (this.justCalculated && this.lastResult !== null) {
      this.expression = this.lastResult.toString();
      this.justCalculated = false;
    }

    if (this.expression === '' || this.expression.endsWith(' ')) return;
    if (this.expression.endsWith('%')) return;

    this.expression += '%';
    this.updateDisplay();
  }

  negate() {
    if (this.isErrorState) return;

    if (this.justCalculated && this.lastResult !== null) {
      this.expression = this.lastResult.toString();
      this.justCalculated = false;
    }

    if (this.expression === '') {
      this.expression = '-';
      this.updateDisplay();
      return;
    }

    const tokens = this.expression.split(' ');
    const lastToken = tokens[tokens.length - 1];

    if (!lastToken || ['+', '-', '×', '÷'].includes(lastToken)) {
      if (lastToken !== '-') {
        this.expression += '-';
      }
    } else {
      if (lastToken.startsWith('-')) {
        tokens[tokens.length - 1] = lastToken.slice(1);
      } else {
        tokens[tokens.length - 1] = '-' + lastToken;
      }
      this.expression = tokens.join(' ');
    }

    this.updateDisplay();
  }

  compute() {
    if (this.isErrorState || this.expression === '') return;

    let exprToEvaluate = this.expression.trim();
    while (exprToEvaluate.endsWith('+') || exprToEvaluate.endsWith('-') ||
           exprToEvaluate.endsWith('×') || exprToEvaluate.endsWith('÷')) {
      exprToEvaluate = exprToEvaluate.slice(0, -1).trim();
    }

    if (exprToEvaluate === '') return;

    try {
      const result = ExpressionEvaluator.evaluate(exprToEvaluate);
      const formatted = this.formatNumber(result);

      this.expressionDisplayElement.textContent = `${exprToEvaluate} =`;
      this.expression = formatted;
      this.lastResult = formatted;
      this.justCalculated = true;

      this.triggerPopAnimation();
      this.updateDisplay();
    } catch (err) {
      const msg = err.message === 'Cannot divide by 0' ? 'No Cheese For 0! 🧀' : 'Oops! Try Again ⭐';
      this.triggerError(msg);
    }
  }

  formatNumber(number) {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    if (!isFinite(number)) return 'Error';

    const precisionFixed = parseFloat(number.toPrecision(12));
    const stringVal = precisionFixed.toString();

    if (stringVal.includes('e')) {
      return precisionFixed.toExponential(4);
    }
    return stringVal;
  }

  triggerPopAnimation() {
    this.primaryDisplayElement.classList.remove('pop');
    void this.primaryDisplayElement.offsetWidth;
    this.primaryDisplayElement.classList.add('pop');
  }

  triggerError(message) {
    this.isErrorState = true;
    this.expression = message;
    this.updateDisplay();

    this.cardElement.classList.remove('shake');
    void this.cardElement.offsetWidth;
    this.cardElement.classList.add('shake');
  }

  updateDisplay() {
    const textToShow = this.expression === '' ? '0' : this.expression;
    this.primaryDisplayElement.textContent = textToShow;
    this.adjustFontSize(textToShow);

    requestAnimationFrame(() => {
      this.primaryDisplayElement.scrollLeft = this.primaryDisplayElement.scrollWidth;
    });
  }

  adjustFontSize(text) {
    const len = text.length;
    if (len > 14) {
      this.primaryDisplayElement.style.fontSize = '1.7rem';
    } else if (len > 10) {
      this.primaryDisplayElement.style.fontSize = '2.2rem';
    } else if (len > 7) {
      this.primaryDisplayElement.style.fontSize = '2.6rem';
    } else {
      this.primaryDisplayElement.style.fontSize = '';
    }
  }
}

// Initial setup & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const primaryDisplay = document.getElementById('primary-display');
  const expressionDisplay = document.getElementById('expression-display');
  const calculatorCard = document.querySelector('.calculator-card');
  const themeToggle = document.getElementById('theme-toggle');

  const calculator = new Calculator(primaryDisplay, expressionDisplay, calculatorCard);

  // Theme Persistence (Party Rainbow Mode vs Candy Wonderland)
  const savedTheme = localStorage.getItem('calc-party-theme');
  if (savedTheme === 'party') {
    document.body.classList.add('party-mode');
  }

  themeToggle.addEventListener('click', () => {
    const isParty = document.body.classList.toggle('party-mode');
    localStorage.setItem('calc-party-theme', isParty ? 'party' : 'candy');
    // Animate theme button
    themeToggle.animate([
      { transform: 'rotate(0deg) scale(1)' },
      { transform: 'rotate(360deg) scale(1.3)' },
      { transform: 'rotate(360deg) scale(1)' }
    ], { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
  });

  // Tom & Jerry Interactive Click Reactions
  const jerry = document.querySelector('.jerry-runner');
  const tom = document.querySelector('.tom-runner');

  if (jerry) {
    jerry.addEventListener('click', () => {
      const bubble = jerry.querySelector('.runner-bubble');
      if (bubble) bubble.textContent = "Squeak! Faster, faster! 🧀";
      const img = jerry.querySelector('.runner-img');
      if (img) {
        img.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.4) rotate(15deg)' },
          { transform: 'scale(1)' }
        ], { duration: 400 });
      }
    });
  }

  // Nibbles (Tuffy) Interactive Reaction
  const nibbles = document.getElementById('nibbles-character');
  const nibblesQuotes = [
    "Go Jerry! Save the cheese! 🧀",
    "Yum! More Swiss cheese! 🍼",
    "Allez Jerry! You can do it! ✨",
    "Squeak! Watch out for Tom! 🐭"
  ];
  let nibblesIdx = 0;

  if (nibbles) {
    nibbles.addEventListener('click', () => {
      nibblesIdx = (nibblesIdx + 1) % nibblesQuotes.length;
      const bubble = nibbles.querySelector('.character-speech');
      if (bubble) bubble.textContent = nibblesQuotes[nibblesIdx];
      const img = nibbles.querySelector('.scene-char-img');
      if (img) {
        img.animate([
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(-25px) scale(1.35) rotate(-15deg)' },
          { transform: 'translateY(0) scale(1) rotate(0deg)' }
        ], { duration: 500, easing: 'ease-out' });
      }
      if (navigator.vibrate) { try { navigator.vibrate([10, 30, 15]); } catch (_) {} }
    });
  }

  // Spike & Tyke Interactive Reaction
  const spike = document.getElementById('spike-character');
  const spikeQuotes = [
    "Don't wake my boy, Tom! 🐶🦴",
    "Good boy, Tyke! *wag wag* 🐾",
    "Listen here, cat! One step closer and... 💥",
    "That's my puppy! Leave him be! 🦴"
  ];
  let spikeIdx = 0;

  if (spike) {
    spike.addEventListener('click', () => {
      spikeIdx = (spikeIdx + 1) % spikeQuotes.length;
      const bubble = spike.querySelector('.character-speech');
      if (bubble) bubble.textContent = spikeQuotes[spikeIdx];
      const img = spike.querySelector('.scene-char-img');
      if (img) {
        img.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.2) translateY(-15px) rotate(4deg)' },
          { transform: 'scale(1) translateY(0) rotate(0deg)' }
        ], { duration: 550, easing: 'ease-out' });
      }
      if (navigator.vibrate) { try { navigator.vibrate([20, 40, 20]); } catch (_) {} }
    });
  }

  // Colorful Starburst / Ripple Helper
  function createRipple(event, button) {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');

    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;

    const clientX = event.clientX || (event.touches && event.touches[0].clientX) || (rect.left + rect.width / 2);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY) || (rect.top + rect.height / 2);

    ripple.style.left = `${clientX - rect.left - size / 2}px`;
    ripple.style.top = `${clientY - rect.top - size / 2}px`;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 450);
  }

  // Keypad Click Delegation
  document.querySelector('.keypad').addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    // Haptic vibration feedback on mobile
    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch (_) {}
    }

    createRipple(e, button);

    if (button.dataset.number !== undefined) {
      calculator.appendNumber(button.dataset.number);
    } else if (button.dataset.operator !== undefined) {
      calculator.appendOperator(button.dataset.operator);
    } else if (button.dataset.action !== undefined) {
      switch (button.dataset.action) {
        case 'clear':
          calculator.clear();
          break;
        case 'delete':
          calculator.delete();
          break;
        case 'equals':
          calculator.compute();
          break;
        case 'percent':
          calculator.appendPercent();
          break;
        case 'negate':
          calculator.negate();
          break;
      }
    }
  });

  // Keyboard Navigation & Shortcuts
  window.addEventListener('keydown', (e) => {
    let buttonSelector = null;

    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
      calculator.appendNumber(e.key);
      buttonSelector = `.btn[data-number="${e.key}"]`;
    } else if (e.key === '+') {
      calculator.appendOperator('+');
      buttonSelector = `.btn[data-operator="+"]`;
    } else if (e.key === '-') {
      calculator.appendOperator('-');
      buttonSelector = `.btn[data-operator="-"]`;
    } else if (e.key === '*' || e.key.toLowerCase() === 'x') {
      calculator.appendOperator('×');
      buttonSelector = `.btn[data-operator="×"]`;
    } else if (e.key === '/') {
      e.preventDefault();
      calculator.appendOperator('÷');
      buttonSelector = `.btn[data-operator="÷"]`;
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calculator.compute();
      buttonSelector = `.btn-candy-rainbow`;
    } else if (e.key === 'Backspace') {
      calculator.delete();
      buttonSelector = `.btn[data-action="delete"]`;
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      calculator.clear();
      buttonSelector = `.btn[data-action="clear"]`;
    } else if (e.key === '%') {
      calculator.appendPercent();
      buttonSelector = `.btn[data-action="percent"]`;
    }

    if (buttonSelector) {
      const btn = document.querySelector(buttonSelector);
      if (btn) {
        btn.classList.add('pressed');
        createRipple({ clientX: undefined, clientY: undefined }, btn);
        setTimeout(() => btn.classList.remove('pressed'), 130);
      }
    }
  });
});
