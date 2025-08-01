class Stopwatch {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.intervalId = null;
        this.lapTimes = [];
        this.lapStartTime = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        this.initializeTheme();
    }
    
    initializeElements() {
        this.mainTimeEl = document.getElementById('mainTime');
        this.millisecondsEl = document.getElementById('milliseconds');
        this.startStopBtn = document.getElementById('startStopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.lapBtn = document.getElementById('lapBtn');
        this.lapList = document.getElementById('lapList');
        this.clearLapsBtn = document.getElementById('clearLaps');
        this.themeToggle = document.getElementById('themeToggle');
        this.progressCircle = document.getElementById('progressCircle');
        this.totalLapsEl = document.getElementById('totalLaps');
        this.bestLapEl = document.getElementById('bestLap');
        this.avgLapEl = document.getElementById('avgLap');
    }
    
    bindEvents() {
        this.startStopBtn.addEventListener('click', () => this.toggleStopwatch());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.lapBtn.addEventListener('click', () => this.recordLap());
        this.clearLapsBtn.addEventListener('click', () => this.clearLaps());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.toggleStopwatch();
                    break;
                case 'KeyL':
                    e.preventDefault();
                    if (this.isRunning) this.recordLap();
                    break;
                case 'KeyR':
                    e.preventDefault();
                    this.reset();
                    break;
            }
        });
        
        // Prevent space from scrolling
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
            }
        });
    }
    
    toggleStopwatch() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.startTime = Date.now() - this.elapsedTime;
            this.lapStartTime = this.startTime;
            this.isRunning = true;
            
            this.intervalId = setInterval(() => {
                this.elapsedTime = Date.now() - this.startTime;
                this.updateDisplay();
                this.updateProgress();
            }, 10);
            
            this.updateButtons();
            this.addRippleEffect(this.startStopBtn);
        }
    }
    
    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.intervalId);
            this.updateButtons();
            this.addRippleEffect(this.startStopBtn);
        }
    }
    
    reset() {
        this.stop();
        this.elapsedTime = 0;
        this.startTime = 0;
        this.lapStartTime = 0;
        this.updateDisplay();
        this.updateProgress();
        this.updateButtons();
        this.addRippleEffect(this.resetBtn);
    }
    
    recordLap() {
        if (this.isRunning) {
            const currentTime = Date.now();
            const lapTime = currentTime - this.lapStartTime;
            const totalTime = this.elapsedTime;
            
            this.lapTimes.push({
                lapNumber: this.lapTimes.length + 1,
                lapTime: lapTime,
                totalTime: totalTime,
                timestamp: currentTime
            });
            
            this.lapStartTime = currentTime;
            this.updateLapDisplay();
            this.updateStats();
            this.addRippleEffect(this.lapBtn);
        }
    }
    
    clearLaps() {
        this.lapTimes = [];
        this.updateLapDisplay();
        this.updateStats();
        this.addRippleEffect(this.clearLapsBtn);
    }
    
    updateDisplay() {
        const time = this.formatTime(this.elapsedTime);
        this.mainTimeEl.textContent = time.main;
        this.millisecondsEl.textContent = time.milliseconds;
    }
    
    updateProgress() {
        // Create a visual progress based on seconds (resets every minute)
        const seconds = (this.elapsedTime / 1000) % 60;
        const progress = seconds / 60;
        const circumference = 2 * Math.PI * 140; // radius = 140
        const offset = circumference - (progress * circumference);
        
        this.progressCircle.style.strokeDashoffset = offset;
    }
    
    updateButtons() {
        if (this.isRunning) {
            this.startStopBtn.textContent = 'Pause';
            this.startStopBtn.classList.add('running');
            this.lapBtn.disabled = false;
        } else {
            this.startStopBtn.textContent = this.elapsedTime > 0 ? 'Resume' : 'Start';
            this.startStopBtn.classList.remove('running');
            this.lapBtn.disabled = true;
        }
    }
    
    updateLapDisplay() {
        if (this.lapTimes.length === 0) {
            this.lapList.innerHTML = '<div class="no-laps">No lap times recorded yet</div>';
            return;
        }
        
        // Find best and worst lap times
        const lapTimesOnly = this.lapTimes.map(lap => lap.lapTime);
        const bestTime = Math.min(...lapTimesOnly);
        const worstTime = Math.max(...lapTimesOnly);
        
        // Sort laps by lap number (most recent first)
        const sortedLaps = [...this.lapTimes].reverse();
        
        this.lapList.innerHTML = sortedLaps.map((lap, index) => {
            const lapTimeFormatted = this.formatTime(lap.lapTime);
            const totalTimeFormatted = this.formatTime(lap.totalTime);
            
            let diffText = '';
            let diffClass = '';
            
            if (this.lapTimes.length > 1 && index < sortedLaps.length - 1) {
                const avgTime = lapTimesOnly.reduce((a, b) => a + b, 0) / lapTimesOnly.length;
                const diff = lap.lapTime - avgTime;
                
                if (Math.abs(diff) > 100) { // Only show if difference is > 100ms
                    diffText = (diff > 0 ? '+' : '') + this.formatTimeDifference(Math.abs(diff));
                    diffClass = diff > 0 ? 'slower' : 'faster';
                }
            }
            
            let itemClass = 'lap-item';
            if (lap.lapTime === bestTime && this.lapTimes.length > 1) itemClass += ' best';
            if (lap.lapTime === worstTime && this.lapTimes.length > 1) itemClass += ' worst';
            
            return `
                <div class="${itemClass}">
                    <span class="lap-number">Lap ${lap.lapNumber}</span>
                    <span class="lap-time">${lapTimeFormatted.main}.${lapTimeFormatted.milliseconds}</span>
                    <span class="lap-diff ${diffClass}">${diffText}</span>
                </div>
            `;
        }).join('');
    }
    
    updateStats() {
        this.totalLapsEl.textContent = this.lapTimes.length;
        
        if (this.lapTimes.length > 0) {
            const lapTimesOnly = this.lapTimes.map(lap => lap.lapTime);
            const bestTime = Math.min(...lapTimesOnly);
            const avgTime = lapTimesOnly.reduce((a, b) => a + b, 0) / lapTimesOnly.length;
            
            const bestFormatted = this.formatTime(bestTime);
            const avgFormatted = this.formatTime(avgTime);
            
            this.bestLapEl.textContent = `${bestFormatted.main}.${bestFormatted.milliseconds}`;
            this.avgLapEl.textContent = `${avgFormatted.main}.${avgFormatted.milliseconds}`;
        } else {
            this.bestLapEl.textContent = '--:--:--';
            this.avgLapEl.textContent = '--:--:--';
        }
    }
    
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);
        
        return {
            main: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            milliseconds: ms.toString().padStart(2, '0')
        };
    }
    
    formatTimeDifference(milliseconds) {
        if (milliseconds < 1000) {
            return `${Math.floor(milliseconds)}ms`;
        } else {
            const seconds = (milliseconds / 1000).toFixed(2);
            return `${seconds}s`;
        }
    }
    
    addRippleEffect(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }
    
    initializeTheme() {
        const savedTheme = localStorage.getItem('stopwatch-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('stopwatch-theme', newTheme);
        
        this.addRippleEffect(this.themeToggle);
    }
}

// Sound effects (optional - using Web Audio API)
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.initializeAudio();
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playBeep(frequency = 800, duration = 100) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
    }
    
    update() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
        
        requestAnimationFrame(() => this.update());
    }
    
    getFPS() {
        return this.fps;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const stopwatch = new Stopwatch();
    const soundManager = new SoundManager();
    const performanceMonitor = new PerformanceMonitor();
    
    // Start performance monitoring
    performanceMonitor.update();
    
    // Add sound effects to button clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', () => {
            soundManager.playBeep(600, 50);
        });
    });
    
    // Add visual feedback for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const key = e.code;
        const shortcuts = document.querySelectorAll('.shortcut-item');
        
        shortcuts.forEach(shortcut => {
            const kbd = shortcut.querySelector('kbd');
            if (kbd && kbd.textContent.toLowerCase() === e.key.toLowerCase()) {
                kbd.style.background = 'var(--primary-color)';
                kbd.style.color = 'white';
                kbd.style.transform = 'scale(1.1)';
                
                setTimeout(() => {
                    kbd.style.background = '';
                    kbd.style.color = '';
                    kbd.style.transform = '';
                }, 200);
            }
        });
    });
    
    // Add page visibility handling
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && stopwatch.isRunning) {
            // Optionally pause when tab is hidden
            console.log('Tab hidden - stopwatch continues running');
        } else if (!document.hidden && stopwatch.isRunning) {
            console.log('Tab visible - stopwatch running');
        }
    });
    
    // Add beforeunload warning if stopwatch is running
    window.addEventListener('beforeunload', (e) => {
        if (stopwatch.isRunning) {
            e.preventDefault();
            e.returnValue = 'Stopwatch is still running. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
    
    console.log('StopWatch Pro initialized successfully!');
});