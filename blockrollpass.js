/**
 * BlockRollPass Captcha - Core Engine
 * A kinetic HTML5 Canvas captcha where characters tumble like invisible blocks along a floor.
 *
 * Repository: https://github.com
 * Author: BjornEriksson
 * License: MIT
 */

class BlockRollPass {
  constructor(canvasId, userOptions = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // DOM elements
    this.launchBtn = document.getElementById('launch-btn');
    this.verifyBtn = document.getElementById('verify-btn');
    this.inputField = document.getElementById('captcha-input');
    this.statusMsg = document.getElementById('status-msg');

    // Default configuration (can be overridden via userOptions)
    const defaultConfig = {
      letterCount: 5,                         // Number of target letters to solve
      direction: 'rtl',                       // 'rtl' (right-to-left) or 'ltr' (left-to-right)
      tumbleSpeed: 0.045,                     // Base step progress per frame (0.01 - 0.1)
      blockSize: 44,                          // Size of the invisible rolling square block (px)
      floorY: 82,                             // Vertical Y-position of the invisible floor (px)
      
      // Appearance, typography, and sizing
      fontSize: 32,                           // Font size for letters and ASCII symbols (px)
      fontFamily: '"Courier New", monospace', // Font family for letters and symbols
      fontWeight: 'bold',                     // Font weight ('normal', 'bold', '700', etc.)
      shapeRadius: 12,                        // Radius for geometric decoy shapes (px)
      itemColor: '#f8fafc',                   // Color of tumbling letters and decoy objects
      shapeLineWidth: 3,                      // Stroke width for geometric shapes (px)

      // Decoys and flow control
      decoyMode: 'mixed',                     // 'mixed', 'symbols', 'shapes', 'none'
      decoyChance: 0.35,                      // Probability (0.0 - 1.0) of inserting a decoy
      minGapRatio: 0.34,                      // Minimum spawn gap (ratio of canvas width)
      maxGapRatio: 0.52,                      // Maximum spawn gap (ratio of canvas width)
      safeDistance: null,                     // Minimum px between items (null = auto-calculated)

      // Character sets
      letters: 'ABCDEFGHJKLMNPQRSTUVWXYZ',    // Excludes I and O to prevent visual confusion
      symbols: ['#', '@', '&', '%', '*', '+'],
      shapes: ['triangle', 'square', 'circle', 'star']
    };

    this.config = { ...defaultConfig, ...userOptions };

    // Auto-calculate collision safe distance based on block size if not manually set
    if (this.config.safeDistance === null) {
      this.config.safeDistance = this.config.blockSize * 1.65;
    }

    // Internal state
    this.isRunning = false;
    this.queue = [];
    this.activeItems = [];
    this.targetCode = '';
    this.animationId = null;

    this.bindEvents();
    this.drawIdleScreen();
  }

  bindEvents() {
    this.launchBtn.addEventListener('click', () => this.launch());
    this.verifyBtn.addEventListener('click', () => this.verify());
    
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.verifyBtn.disabled) {
        this.verify();
      }
    });
  }

  drawIdleScreen() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.font = '15px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Click Launch to start', this.canvas.width / 2, this.canvas.height / 2);
  }

  generateSequence() {
    this.queue = [];
    this.targetCode = '';

    if (this.config.decoyMode !== 'none' && Math.random() < this.config.decoyChance * 0.6) {
      this.queue.push(this.createDecoy());
    }

    for (let i = 0; i < this.config.letterCount; i++) {
      const char = this.config.letters[Math.floor(Math.random() * this.config.letters.length)];
      this.targetCode += char;
      this.queue.push({ type: 'letter', value: char });

      if (this.config.decoyMode !== 'none' && Math.random() < this.config.decoyChance) {
        this.queue.push(this.createDecoy());
      }
    }
  }

  createDecoy() {
    let mode = this.config.decoyMode;
    if (mode === 'mixed') {
      mode = Math.random() < 0.5 ? 'symbols' : 'shapes';
    }

    if (mode === 'symbols') {
      const sym = this.config.symbols[Math.floor(Math.random() * this.config.symbols.length)];
      return { type: 'symbol', value: sym };
    } else {
      const shp = this.config.shapes[Math.floor(Math.random() * this.config.shapes.length)];
      return { type: 'shape', value: shp };
    }
  }

  spawnNextItem() {
    if (this.queue.length === 0) return;

    const next = this.queue.shift();
    const minGap = this.canvas.width * this.config.minGapRatio;
    const maxGap = this.canvas.width * this.config.maxGapRatio;
    const randomGap = minGap + Math.random() * (maxGap - minGap);

    const speedVariation = next.type === 'letter' 
      ? (Math.random() * 0.008 - 0.004) 
      : (Math.random() * 0.02 - 0.01);

    const isRTL = this.config.direction === 'rtl';
    const startX = isRTL 
      ? this.canvas.width + this.config.blockSize 
      : -this.config.blockSize;

    // Start with a random 90-degree orientation (0, 90, 180, or 270 deg)
    const initialQuarterTurns = Math.floor(Math.random() * 4);

    this.activeItems.push({
      ...next,
      baseX: startX,
      stepProgress: 0, // Goes from 0.0 to 1.0 per 90-degree block tip
      baseRotation: initialQuarterTurns * (Math.PI / 2),
      stepSpeed: Math.max(0.02, this.config.tumbleSpeed + speedVariation),
      nextSpawnThreshold: randomGap,
      visualX: startX
    });
  }
  
  launch() {
    if (this.isRunning) return;

    cancelAnimationFrame(this.animationId);
    this.isRunning = true;
    this.activeItems = [];
    this.statusMsg.textContent = '';
    this.statusMsg.className = 'status';
    
    this.inputField.value = '';
    this.inputField.disabled = false;
    this.verifyBtn.disabled = false;
    this.launchBtn.disabled = true;
    this.launchBtn.textContent = 'Rolling...';
    this.inputField.focus();

    this.generateSequence();
    this.spawnNextItem();
    this.loop();
  }

  // Physics easing: High velocity on floor impact (0° & 90°), slows down and balances on the corner tip (45°)
  applyTumbleEasing(t) {
    return t + 0.16 * Math.sin(2 * Math.PI * t);
  }
  
  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const isRTL = this.config.direction === 'rtl';
    const dirSign = isRTL ? -1 : 1;

    // Spawn next item when trailing item has traveled past its threshold
    if (this.queue.length > 0 && this.activeItems.length < 3) {
      const lastItem = this.activeItems[this.activeItems.length - 1];
      const traveled = lastItem 
        ? (isRTL ? (this.canvas.width + this.config.blockSize - lastItem.visualX) : (lastItem.visualX + this.config.blockSize))
        : Infinity;

      if (traveled >= lastItem.nextSpawnThreshold) {
        this.spawnNextItem();
      }
    }

    // Update tumbling block physics with collision prevention
    for (let i = 0; i < this.activeItems.length; i++) {
      const item = this.activeItems[i];
      let currentStepSpeed = item.stepSpeed;

      // Check distance to the block directly ahead
      if (i > 0) {
        const ahead = this.activeItems[i - 1];
        const distance = Math.abs(ahead.visualX - item.visualX);
        
        if (distance < this.config.safeDistance) {
          currentStepSpeed = Math.min(currentStepSpeed, ahead.stepSpeed * 0.85);
        }
      }

      item.stepProgress += currentStepSpeed;

      // Complete a 90-degree tip and advance base position by one block width
      if (item.stepProgress >= 1) {
        item.stepProgress -= 1;
        item.baseX += dirSign * this.config.blockSize;
        item.baseRotation += dirSign * (Math.PI / 2);
      }

      this.drawTumblingBlock(item, dirSign);
    }

    // Remove items that have tumbled completely off-screen
    const margin = this.config.blockSize * 1.5;
    this.activeItems = this.activeItems.filter(item => {
      return isRTL 
        ? item.visualX >= -margin 
        : item.visualX <= this.canvas.width + margin;
    });

    if (this.queue.length === 0 && this.activeItems.length === 0) {
      this.finishRoll();
      return;
    }

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  drawTumblingBlock(item, dirSign) {
    const s = this.config.blockSize;
    const half = s / 2;
    const eased = this.applyTumbleEasing(item.stepProgress);
    const tipAngle = dirSign * eased * (Math.PI / 2);

    // Pivot around the bottom-leading corner of the invisible square block
    const pivotX = item.baseX + dirSign * half;
    const pivotY = this.config.floorY;

    // Vector from bottom-leading pivot corner to block center
    const relX = -dirSign * half;
    const relY = -half;

    // Rotate center around the pivot corner
    const cos = Math.cos(tipAngle);
    const sin = Math.sin(tipAngle);
    const centerX = pivotX + (relX * cos - relY * sin);
    const centerY = pivotY + (relX * sin + relY * cos);

    item.visualX = centerX;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(item.baseRotation + tipAngle);

    this.ctx.fillStyle = this.config.itemColor;
    this.ctx.strokeStyle = this.config.itemColor;
    this.ctx.lineWidth = this.config.shapeLineWidth;

    if (item.type === 'letter' || item.type === 'symbol') {
      this.ctx.font = `${this.config.fontWeight} ${this.config.fontSize}px ${this.config.fontFamily}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(item.value, 0, 0);
    } else if (item.type === 'shape') {
      this.drawShape(item.value);
    }

    this.ctx.restore();
  }

  drawShape(shape) {
    const r = this.config.shapeRadius;
    this.ctx.beginPath();

    if (shape === 'circle') {
      this.ctx.arc(0, 0, r, 0, Math.PI * 2);
      this.ctx.stroke();
    } else if (shape === 'square') {
      this.ctx.strokeRect(-r, -r, r * 2, r * 2);
    } else if (shape === 'triangle') {
      for (let i = 0; i < 3; i++) {
        const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        const x = Math.cos(a) * (r + 2);
        const y = Math.sin(a) * (r + 2);
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.stroke();
    } else if (shape === 'star') {
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? r + 3 : r * 0.45;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.stroke();
    }
  }

  finishRoll() {
    this.isRunning = false;
    this.launchBtn.disabled = false;
    this.launchBtn.textContent = 'Launch';
    this.drawIdleScreen();
  }

  verify() {
    const userGuess = this.inputField.value.trim().toUpperCase();
    
    if (!userGuess) {
      this.statusMsg.textContent = 'Please enter the letters first.';
      this.statusMsg.className = 'status error';
      return;
    }

    if (userGuess === this.targetCode) {
      cancelAnimationFrame(this.animationId);
      this.isRunning = false;
      this.queue = [];
      this.activeItems = [];
      this.drawIdleScreen();

      this.statusMsg.textContent = '✓ Verified! Human check passed.';
      this.statusMsg.className = 'status success';
      this.inputField.disabled = true;
      this.verifyBtn.disabled = true;
      this.launchBtn.disabled = false;
      this.launchBtn.textContent = 'Launch';
    } else {
      this.statusMsg.textContent = '✗ Incorrect code. Click Launch to try again.';
      this.statusMsg.className = 'status error';
    }
  }
}
