// TimeBox Ultimate - Complete JavaScript with Enhanced Features
console.log('🚀 TimeBox Ultimate with Smart Auto-Detection initializing...');

// Global State
let appState = {
    // Timer
    minutes: 25,
    seconds: 0,
    isActive: false,
    isBreak: false,
    currentSession: 'Work',
    timerInterval: null,
    
    // Tasks
    tasks: JSON.parse(localStorage.getItem('timebox-tasks') || '[]'),
    currentTask: null,
    
    // User Stats
    stats: JSON.parse(localStorage.getItem('timebox-stats') || JSON.stringify({
        sessionsToday: 0,
        tasksCompleted: 0,
        totalTasks: 0,
        focusTime: 0,
        currentStreak: 0,
        level: 1,
        xp: 0,
        lastActiveDate: new Date().toDateString()
    })),
    
    // Boxi AI
    boxi: JSON.parse(localStorage.getItem('timebox-boxi') || JSON.stringify({
        level: 1,
        xp: 0,
        mood: 'happy',
        heartRate: 60,
        energy: 100,
        lastMessage: '🚀 Welcome to TimeBox Ultimate with SMART AUTO-DETECTION! Just start working and I\'ll detect what you\'re doing and suggest the perfect timer. Let\'s achieve greatness together! ⚡'
    })),
    
    // Settings
    settings: JSON.parse(localStorage.getItem('timebox-settings') || JSON.stringify({
        workTime: 25,
        shortBreak: 5,
        longBreak: 15,
        sounds: true,
        notifications: true,
        autoDetection: true,
        smartSuggestions: true
    })),
    
    // Smart Detection
    lastActivity: Date.now(),
    showingSmartPrompt: false,
    detectedContext: null,
    
    // PWA
    deferredPrompt: null,
    isOnline: navigator.onLine,
    currentTab: 'home'
};

// DOM Elements
const elements = {
    // Timer
    timerDisplay: document.getElementById('timerDisplay'),
    timerProgress: document.getElementById('timerProgress'),
    sessionType: document.getElementById('sessionType'),
    timerStatus: document.getElementById('timerStatus'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playPauseIcon: document.getElementById('playPauseIcon'),
    resetBtn: document.getElementById('resetBtn'),
    breakBtn: document.getElementById('breakBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    
    // Current Task
    currentTaskSection: document.getElementById('currentTaskSection'),
    currentTaskText: document.getElementById('currentTaskText'),
    currentTaskProgress: document.getElementById('currentTaskProgress'),
    taskProgressFill: document.getElementById('taskProgressFill'),
    
    // Tasks
    newTaskInput: document.getElementById('newTaskInput'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    tasksList: document.getElementById('tasksList'),
    
    // Stats
    sessionsToday: document.getElementById('sessionsToday'),
    currentStreak: document.getElementById('currentStreak'),
    completionRate: document.getElementById('completionRate'),
    totalTime: document.getElementById('totalTime'),
    userLevel: document.getElementById('userLevel'),
    userXP: document.getElementById('userXP'),
    xpProgress: document.getElementById('xpProgress'),
    
    // Detailed Stats
    detailedSessions: document.getElementById('detailedSessions'),
    detailedFocusTime: document.getElementById('detailedFocusTime'),
    detailedTasksCompleted: document.getElementById('detailedTasksCompleted'),
    productivityScore: document.getElementById('productivityScore'),
    
    // Boxi
    boxiEmoji: document.getElementById('boxiEmoji'),
    boxiLevel: document.getElementById('boxiLevel'),
    boxiHeartRate: document.getElementById('boxiHeartRate'),
    boxiEnergy: document.getElementById('boxiEnergy'),
    boxiMessage: document.getElementById('boxiMessage'),
    getInsight: document.getElementById('getInsight'),
    testDetection: document.getElementById('testDetection'),
    
    // Smart Detection Modal
    smartModal: document.getElementById('smartModal'),
    smartEmoji: document.getElementById('smartEmoji'),
    smartTitle: document.getElementById('smartTitle'),
    smartSubtitle: document.getElementById('smartSubtitle'),
    smartTasks: document.getElementById('smartTasks'),
    createNewTask: document.getElementById('createNewTask'),
    cancelSmart: document.getElementById('cancelSmart'),
    customTime: document.getElementById('customTime'),
    
    // Settings
    workDuration: document.getElementById('workDuration'),
    shortBreak: document.getElementById('shortBreak'),
    longBreak: document.getElementById('longBreak'),
    soundAlerts: document.getElementById('soundAlerts'),
    browserNotifications: document.getElementById('browserNotifications'),
    autoDetection: document.getElementById('autoDetection'),
    smartSuggestions: document.getElementById('smartSuggestions'),
    exportData: document.getElementById('exportData'),
    importData: document.getElementById('importData'),
    clearData: document.getElementById('clearData'),
    
    // PWA
    installBanner: document.getElementById('installBanner'),
    installBtn: document.getElementById('installBtn'),
    dismissBtn: document.getElementById('dismissBtn'),
    offlineIndicator: document.getElementById('offlineIndicator'),
    
    // Navigation & Tabs
    navBtns: document.querySelectorAll('.nav-btn'),
    homeTab: document.getElementById('homeTab'),
    tasksTab: document.getElementById('tasksTab'),
    statsTab: document.getElementById('statsTab'),
    settingsTab: document.getElementById('settingsTab')
};

// Utility Functions
function formatTime(min, sec) {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function saveData() {
    try {
        localStorage.setItem('timebox-tasks', JSON.stringify(appState.tasks));
        localStorage.setItem('timebox-stats', JSON.stringify(appState.stats));
        localStorage.setItem('timebox-boxi', JSON.stringify(appState.boxi));
        localStorage.setItem('timebox-settings', JSON.stringify(appState.settings));
    } catch (error) {
        console.log('❌ Failed to save data:', error);
    }
}

function showNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted' && appState.settings.notifications) {
        const notification = new Notification(title, {
            body,
            icon: 'icon-192.png',
            badge: 'icon-72.png',
            tag: 'timebox-notification',
            requireInteraction: true,
            ...options
        });
        
        setTimeout(() => notification.close(), 5000);
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

function playSound(soundType = 'complete') {
    if (!appState.settings.sounds) return;
    
    // Create audio context for sound effects
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (soundType === 'complete') {
            // Success sound
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.4); // G5
        } else if (soundType === 'start') {
            // Start sound
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        }
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
        console.log('Audio not supported');
    }
}

function updateBoxiMood(mood) {
    appState.boxi.mood = mood;
    const moods = {
        happy: '😊',
        excited: '🤩',
        focused: '🧠',
        celebrating: '🎉',
        encouraging: '💪',
        analytical: '🤓',
        sleepy: '😴',
        energetic: '⚡'
    };
    elements.boxiEmoji.textContent = moods[mood] || '🤖';
    
    // Update heart rate based on mood
    const heartRates = {
        sleepy: 50,
        happy: 60,
        focused: 65,
        analytical: 70,
        encouraging: 75,
        excited: 85,
        celebrating: 90,
        energetic: 95
    };
    
    appState.boxi.heartRate = heartRates[mood] || 60;
    elements.boxiHeartRate.textContent = appState.boxi.heartRate;
}

function updateBoxiMessage(message) {
    appState.boxi.lastMessage = message;
    elements.boxiMessage.textContent = message;
    saveData();
}

// Check daily streak
function checkDailyStreak() {
    const today = new Date().toDateString();
    const lastActive = appState.stats.lastActiveDate;
    
    if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActive === yesterday.toDateString()) {
            // Consecutive day
            appState.stats.currentStreak++;
        } else if (lastActive !== today) {
            // Streak broken
            appState.stats.currentStreak = 0;
        }
        
        // Reset daily stats
        appState.stats.sessionsToday = 0;
        appState.stats.lastActiveDate = today;
        saveData();
    }
}

// Smart Auto-Detection System
const SmartDetection = {
    contextPatterns: {
        coding: {
            indicators: ['github.com', 'stackoverflow', 'codepen', 'repl.it', 'localhost', 'vscode', 'code', '.js', '.html', '.css', '.py', '.java'],
            suggestedTime: 50,
            emoji: '💻',
            description: 'Coding Session'
        },
        writing: {
            indicators: ['docs.google', 'notion.so', 'medium.com', 'wordpress', 'blogger', 'draft', 'write'],
            suggestedTime: 30,
            emoji: '✍️',
            description: 'Writing Session'
        },
        design: {
            indicators: ['figma.com', 'canva.com', 'dribbble', 'behance', 'sketch', 'photoshop', 'illustrator'],
            suggestedTime: 45,
            emoji: '🎨',
            description: 'Design Session'
        },
        research: {
            indicators: ['google.com/search', 'wikipedia', 'scholar.google', 'research', 'pubmed'],
            suggestedTime: 25,
            emoji: '🔍',
            description: 'Research Session'
        },
        learning: {
            indicators: ['youtube.com/watch', 'coursera', 'udemy', 'pluralsight', 'khan', 'tutorial', 'course'],
            suggestedTime: 25,
            emoji: '📚',
            description: 'Learning Session'
        },
        meeting: {
            indicators: ['zoom.us', 'meet.google', 'teams.microsoft', 'meeting', 'conference'],
            suggestedTime: 45,
            emoji: '🤝',
            description: 'Meeting Focus'
        }
    },

    detectContext() {
        const currentUrl = window.location.href.toLowerCase();
        const windowTitle = document.title.toLowerCase();
        const currentHour = new Date().getHours();
        
        // Check URL and title patterns
        for (const [contextType, config] of Object.entries(this.contextPatterns)) {
            const matchesUrl = config.indicators.some(indicator => 
                currentUrl.includes(indicator)
            );
            const matchesTitle = config.indicators.some(indicator => 
                windowTitle.includes(indicator)
            );
            
            if (matchesUrl || matchesTitle) {
                return {
                    type: contextType,
                    config: config,
                    confidence: matchesUrl ? 0.9 : 0.7,
                    detectedFrom: matchesUrl ? 'URL' : 'Title'
                };
            }
        }
        
        // Time-based suggestions
        if (currentHour >= 9 && currentHour <= 11) {
            return { 
                type: 'morning-focus', 
                config: { ...this.contextPatterns.coding, description: 'Morning Focus Session' }, 
                confidence: 0.4, 
                detectedFrom: 'Time Pattern' 
            };
        } else if (currentHour >= 14 && currentHour <= 16) {
            return { 
                type: 'afternoon-work', 
                config: { ...this.contextPatterns.writing, description: 'Afternoon Work Session' }, 
                confidence: 0.3, 
                detectedFrom: 'Time Pattern' 
            };
        }
        
        return { 
            type: 'general', 
            config: { suggestedTime: 25, emoji: '⚡', description: 'Focus Session' }, 
            confidence: 0.2,
            detectedFrom: 'Default'
        };
    },

    getRelevantTasks(context) {
        if (!context || !appState.tasks.length) return [];
        
        const contextKeywords = {
            coding: ['code', 'bug', 'feature', 'api', 'website', 'app', 'develop', 'fix', 'build', 'program'],
            writing: ['write', 'blog', 'article', 'document', 'report', 'email', 'content', 'draft'],
            design: ['design', 'logo', 'ui', 'ux', 'mockup', 'prototype', 'visual', 'graphic'],
            research: ['research', 'study', 'analyze', 'investigate', 'explore', 'review'],
            learning: ['learn', 'course', 'tutorial', 'practice', 'study', 'training', 'skill'],
            meeting: ['meeting', 'call', 'discussion', 'presentation', 'review', 'standup']
        };
        
        const keywords = contextKeywords[context.type] || [];
        const incompleteTasks = appState.tasks.filter(task => !task.completed);
        
        // Score and sort tasks
        const scoredTasks = incompleteTasks.map(task => {
            const taskText = task.text.toLowerCase();
            const relevanceScore = keywords.reduce((score, keyword) => {
                return taskText.includes(keyword) ? score + 1 : score;
            }, 0);
            
            const progressBonus = (task.timeSpent || 0) > 0 ? 2 : 0;
            const priorityBonus = task.priority === 'High' ? 1 : task.priority === 'Medium' ? 0.5 : 0;
            const recentBonus = task.lastWorkedOn && 
                (Date.now() - new Date(task.lastWorkedOn).getTime()) < 86400000 ? 1 : 0; // 24 hours
            
            return {
                ...task,
                relevanceScore: relevanceScore + progressBonus + priorityBonus + recentBonus
            };
        });
        
        return scoredTasks
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 3);
    },

    showSmartPrompt(context, relevantTasks) {
        if (appState.showingSmartPrompt || !appState.settings.autoDetection) return;
        
        appState.showingSmartPrompt = true;
        appState.detectedContext = context;
        
        // Update modal content
        elements.smartEmoji.textContent = context.config.emoji;
        elements.smartTitle.textContent = `${context.config.emoji} ${context.config.description} Detected!`;
        elements.smartSubtitle.textContent = `Suggested Timer: ${context.config.suggestedTime} minutes • Detected: ${context.detectedFrom}`;
        
        // Clear and populate tasks
        elements.smartTasks.innerHTML = '';
        
        if (relevantTasks.length > 0) {
            relevantTasks.forEach((task, index) => {
                const taskElement = document.createElement('div');
                taskElement.className = `smart-task ${index === 0 ? 'recommended' : ''}`;
                taskElement.innerHTML = `
                    <div style="font-weight: 600; margin-bottom: 5px;">${task.text}</div>
                    <div style="display: flex; gap: 8px; font-size: 12px; flex-wrap: wrap;">
                        <span class="task-tag ${task.category?.toLowerCase() || 'work'}">${task.category || 'Work'}</span>
                        <span class="task-tag ${task.priority?.toLowerCase() || 'medium'}">${task.priority || 'Medium'}</span>
                        ${task.timeSpent > 0 ? `<span class="task-tag">⏱️ ${Math.round(task.timeSpent)}min</span>` : ''}
                        ${index === 0 ? '<span style="background: #3B82F6; color: white; padding: 2px 8px; border-radius: 10px; font-weight: bold;">Recommended</span>' : ''}
                    </div>
                `;
                taskElement.onclick = () => this.selectTask(task);
                elements.smartTasks.appendChild(taskElement);
            });
        } else {
            elements.smartTasks.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #6B7280;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🎯</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">No relevant tasks found</div>
                    <div style="font-size: 14px;">Let's create a new one!</div>
                </div>
            `;
        }
        
        // Show modal
        elements.smartModal.classList.add('show');
        
        // Update Boxi
        updateBoxiMessage(`🧠 I detected you're starting ${context.config.description.toLowerCase()}! I suggest ${context.config.suggestedTime} minutes. Let's begin!`);
        updateBoxiMood('analytical');
        
        console.log('🧠 Smart Detection triggered:', context);
    },

    selectTask(task) {
        if (!appState.detectedContext) return;
        
        const context = appState.detectedContext;
        
        // Set task and timer
        appState.currentTask = task;
        appState.minutes = context.config.suggestedTime;
        appState.seconds = 0;
        appState.isBreak = false;
        appState.currentSession = 'Work';
        
        // Mark task as recently worked on
        task.lastWorkedOn = new Date();
        
        // Start timer
        startTimer();
        
        // Close modal
        this.hideSmartPrompt();
        
        // Update Boxi
        updateBoxiMessage(`🎯 Excellent! Starting ${context.config.suggestedTime} minutes on "${task.text}". I'm here with you!`);
        updateBoxiMood('excited');
        
        // Save pattern for learning
        this.savePattern(context, task);
        
        console.log('🎯 Task selected from Smart Detection:', task);
    },

    createNewTask() {
        const taskText = prompt(`Create new task for ${appState.detectedContext?.config.description || 'work session'}:`);
        if (!taskText || !taskText.trim()) return;
        
        const newTask = {
            id: Date.now(),
            text: taskText.trim(),
            completed: false,
            category: appState.detectedContext?.type === 'coding' ? 'Work' : 
                      appState.detectedContext?.type === 'learning' ? 'Study' : 'Work',
            priority: 'Medium',
            timeSpent: 0,
            pomodorosSpent: 0,
            createdAt: new Date(),
            lastWorkedOn: new Date(),
            source: 'smart_detection'
        };
        
        appState.tasks.unshift(newTask);
        appState.stats.totalTasks++;
        
        this.selectTask(newTask);
        renderTasks();
        updateStats();
    },

    savePattern(context, task) {
        try {
            const patterns = JSON.parse(localStorage.getItem('smartPatterns') || '[]');
            const pattern = {
                timeOfDay: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                context: context.type,
                selectedTask: task.id,
                suggestedTime: context.config.suggestedTime,
                timestamp: new Date()
            };
            
            patterns.push(pattern);
            localStorage.setItem('smartPatterns', JSON.stringify(patterns.slice(-100))); // Keep last 100
            console.log('🎯 Smart pattern saved:', pattern);
        } catch (error) {
            console.log('❌ Failed to save pattern:', error);
        }
    },

    hideSmartPrompt() {
        appState.showingSmartPrompt = false;
        appState.detectedContext = null;
        elements.smartModal.classList.remove('show');
    },

    triggerDetection() {
        if (appState.isActive || appState.showingSmartPrompt || !appState.settings.autoDetection) return;
        
        const context = this.detectContext();
        const relevantTasks = this.getRelevantTasks(context);
        
        setTimeout(() => {
            this.showSmartPrompt(context, relevantTasks);
        }, 1000);
    }
};

// Activity Detection
function initActivityDetection() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
        const now = Date.now();
        const timeSinceLastActivity = now - appState.lastActivity;
        
        // If user was inactive for 5+ minutes and timer is not running
        if (timeSinceLastActivity > 300000 && !appState.isActive && !appState.showingSmartPrompt) {
            console.log('🟢 Activity detected after inactivity!');
            SmartDetection.triggerDetection();
        }
        
        appState.lastActivity = now;
    };
    
    events.forEach(event => {
        document.addEventListener(event, activityHandler, { passive: true });
    });
    
    console.log('👁️ Activity detection initialized');
}

// Timer Functions
function updateTimerDisplay() {
    elements.timerDisplay.textContent = formatTime(appState.minutes, appState.seconds);
    elements.sessionType.textContent = appState.currentSession;
    
    // Update progress circle
    const totalTime = (appState.isBreak ? appState.settings.shortBreak : appState.settings.workTime) * 60;
    const currentTime = appState.minutes * 60 + appState.seconds;
    const progress = currentTime / totalTime;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference * (1 - progress);
    
    elements.timerProgress.style.strokeDashoffset = offset;
    
    // Update status
    if (appState.isActive) {
        elements.timerStatus.textContent = appState.isBreak ? 'Break Time ☕' : 'Focus Mode Active ⚡';
        elements.playPauseIcon.textContent = '⏸️';
        elements.timerStatus.classList.add('pulse');
    } else {
        elements.timerStatus.textContent = 'Ready to start';
        elements.playPauseIcon.textContent = '▶️';
        elements.timerStatus.classList.remove('pulse');
    }
}

function startTimer() {
    if (appState.timerInterval) return;
    
    appState.isActive = true;
    appState.timerInterval = setInterval(() => {
        if (appState.seconds > 0) {
            appState.seconds--;
        } else if (appState.minutes > 0) {
            appState.minutes--;
            appState.seconds = 59;
        } else {
            // Timer finished
            completeSession();
        }
        updateTimerDisplay();
        updateCurrentTask();
    }, 1000);
    
    updateTimerDisplay();
    updateCurrentTask();
    playSound('start');
    
    if (!appState.isBreak && appState.currentTask) {
        updateBoxiMessage(`🎯 Let's focus on "${appState.currentTask.text}"! I believe in you! 🚀`);
        updateBoxiMood('focused');
    } else if (appState.isBreak) {
        updateBoxiMessage('☕ Break time! Recharge your energy and come back stronger! 💪');
        updateBoxiMood('happy');
    } else {
        updateBoxiMessage('⚡ Focus session started! Even without a specific task, you\'re building great habits!');
        updateBoxiMood('energetic');
    }
    
    console.log('▶️ Timer started');
}

function pauseTimer() {
    appState.isActive = false;
    if (appState.timerInterval) {
        clearInterval(appState.timerInterval);
        appState.timerInterval = null;
    }
    updateTimerDisplay();
    updateBoxiMessage('⏸️ Taking a pause? Sometimes the best progress happens during reflection. 🧘‍♀️');
    updateBoxiMood('analytical');
    console.log('⏸️ Timer paused');
}

function resetTimer() {
    pauseTimer();
    appState.minutes = appState.isBreak ? appState.settings.shortBreak : appState.settings.workTime;
    appState.seconds = 0;
    updateTimerDisplay();
    updateBoxiMessage('🔄 Fresh start! Sometimes we need to reset to find our rhythm. You got this! 💪');
    updateBoxiMood('encouraging');
    console.log('🔄 Timer reset');
}

function completeSession() {
    pauseTimer();
    playSound('complete');
    
    if (!appState.isBreak) {
        // Work session completed
        appState.stats.sessionsToday++;
        appState.stats.focusTime += appState.settings.workTime;
        appState.stats.xp += 10;
        
        // Bonus XP for consistency
        if (appState.stats.sessionsToday >= 3) {
            appState.stats.xp += 5;
        }
        
        // Update current task
        if (appState.currentTask) {
            const task = appState.tasks.find(t => t.id === appState.currentTask.id);
            if (task) {
                task.timeSpent = (task.timeSpent || 0) + appState.settings.workTime;
                task.pomodorosSpent = (task.pomodorosSpent || 0) + 1;
                task.lastWorkedOn = new Date();
            }
        }
        
        // Start break
        appState.minutes = appState.settings.shortBreak;
        appState.seconds = 0;
        appState.isBreak = true;
        appState.currentSession = 'Short Break';
        
        showNotification('🎉 Pomodoro Complete!', 'Great work! Time for a break.');
        updateBoxiMessage('🎉 AMAZING! Session complete! You are building incredible momentum. Time for a well-deserved break! ☕');
        updateBoxiMood('celebrating');
        
    } else {
        // Break finished
        appState.minutes = appState.settings.workTime;
        appState.seconds = 0;
        appState.isBreak = false;
        appState.currentSession = 'Work';
        appState.currentTask = null; // Clear current task after break
        
        showNotification('⚡ Break Over!', 'Time to get back to work!');
        updateBoxiMessage('⚡ Break over! Ready for another amazing session? Select a task and let\'s keep this momentum going! 💪');
        updateBoxiMood('excited');
    }
    
    updateTimerDisplay();
    updateCurrentTask();
    updateStats();
    saveData();
    
    console.log('✅ Session completed');
}

// Task Management
function addTask() {
    const text = elements.newTaskInput.value.trim();
    if (!text) return;
    
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        category: 'Work',
        priority: 'Medium',
        timeSpent: 0,
        pomodorosSpent: 0,
        createdAt: new Date(),
        estimatedTime: 1 // Default estimation: 1 pomodoro
    };
    
    appState.tasks.unshift(newTask);
    appState.stats.totalTasks++;
    elements.newTaskInput.value = '';
    
    renderTasks();
    updateStats();
    saveData();
    
    updateBoxiMessage(`✅ "${newTask.text}" added to your quest log! This looks like an interesting challenge! 🎯`);
    console.log('➕ Task added:', newTask);
}

function toggleTask(id) {
    const task = appState.tasks.find(t => t.id === id);
    if (!task) return;
    
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    
    if (task.completed) {
        appState.stats.tasksCompleted++;
        appState.stats.xp += 15; // More XP for completing tasks
        updateBoxiMessage(`🎉 QUEST COMPLETED! "${task.text}" conquered! The satisfaction must feel amazing! 🏆`);
        updateBoxiMood('celebrating');
        playSound('complete');
        
        // If this was the current task, clear it
        if (appState.currentTask?.id === id) {
            appState.currentTask = null;
        }
    } else {
        appState.stats.tasksCompleted = Math.max(0, appState.stats.tasksCompleted - 1);
        appState.stats.xp = Math.max(0, appState.stats.xp - 15);
    }
    
    renderTasks();
    updateStats();
    updateCurrentTask();
    saveData();
}

function deleteTask(id) {
    const task = appState.tasks.find(t => t.id === id);
    if (!task) return;
    
    if (confirm(`Are you sure you want to delete "${task.text}"?`)) {
        appState.tasks = appState.tasks.filter(t => t.id !== id);
        if (appState.currentTask?.id === id) {
            appState.currentTask = null;
        }
        renderTasks();
        updateCurrentTask();
        saveData();
        updateBoxiMessage('🗑️ Task deleted. Sometimes we need to declutter to focus better!');
    }
}

function selectTask(task) {
    if (appState.isBreak) {
        updateBoxiMessage('⏳ Please finish your break first! Rest is important for productivity.');
        return;
    }
    
    appState.currentTask = task;
    updateCurrentTask();
    updateBoxiMessage(`🎯 Quest "${task.text}" selected! Let's embark on this adventure together! 🚀`);
    updateBoxiMood('focused');
    console.log('🎯 Task selected:', task);
}

function renderTasks() {
    if (appState.tasks.length === 0) {
        elements.tasksList.innerHTML = `
            <div class="empty-tasks">
                <div class="empty-icon">🎯</div>
                <div class="empty-title">No quests yet!</div>
                <div class="empty-subtitle">Add your first task to begin your adventure! 🚀</div>
            </div>
        `;
        return;
    }
    
    // Sort tasks: incomplete first, then by priority, then by recent activity
    const sortedTasks = [...appState.tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed - b.completed;
        
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        
        const aLastWorked = a.lastWorkedOn ? new Date(a.lastWorkedOn).getTime() : 0;
        const bLastWorked = b.lastWorkedOn ? new Date(b.lastWorkedOn).getTime() : 0;
        
        return bLastWorked - aLastWorked;
    });
    
    elements.tasksList.innerHTML = sortedTasks.map(task => {
        const isSelected = appState.currentTask?.id === task.id;
        const progressPercentage = task.pomodorosSpent && task.estimatedTime ? 
            Math.min(100, (task.pomodorosSpent / task.estimatedTime) * 100) : 0;
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'completed' : ''}" onclick="toggleTask(${task.id})">
                        ${task.completed ? '✓' : ''}
                    </div>
                    <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                    <div class="task-actions">
                        ${!task.completed && !appState.isBreak ? `
                            <button class="task-btn primary" onclick="selectTask(${JSON.stringify(task).replace(/"/g, '&quot;')})">
                                ${isSelected ? '⚡ Active' : '🎯 Select'}
                            </button>
                        ` : ''}
                        <button class="task-btn danger" onclick="deleteTask(${task.id})">🗑️</button>
                    </div>
                </div>
                ${(task.timeSpent > 0 || task.pomodorosSpent > 0 || isSelected || task.source) ? `
                    <div class="task-meta">
                        <span class="task-tag ${task.category?.toLowerCase() || 'work'}">${task.category || 'Work'}</span>
                        <span class="task-tag ${task.priority?.toLowerCase() || 'medium'}">${task.priority || 'Medium'}</span>
                        ${task.timeSpent > 0 ? `<span class="task-tag">⏱️ ${Math.round(task.timeSpent)}min</span>` : ''}
                        ${task.pomodorosSpent > 0 ? `<span class="task-tag">🍅 ${task.pomodorosSpent}</span>` : ''}
                        ${task.source === 'smart_detection' ? '<span class="task-tag">🧠 AI</span>' : ''}
                        ${isSelected ? '<span class="task-tag" style="background: #3B82F6; color: white;">🎯 Current</span>' : ''}
                    </div>
                ` : ''}
                ${progressPercentage > 0 ? `
                    <div class="task-progress" style="margin-top: 10px;">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function updateCurrentTask() {
    if (appState.currentTask && !appState.isBreak) {
        elements.currentTaskText.textContent = appState.currentTask.text;
        elements.currentTaskSection.style.display = 'block';
        
        const timeSpent = appState.currentTask.timeSpent || 0;
        const currentSessionTime = appState.isActive ? 
            (appState.settings.workTime - appState.minutes - (appState.seconds / 60)) : 0;
        const totalTime = Math.round(timeSpent + currentSessionTime);
        const pomodorosSpent = appState.currentTask.pomodorosSpent || 0;
        const estimatedPomodoros = appState.currentTask.estimatedTime || 1;
        
        elements.currentTaskProgress.innerHTML = `
            <div class="progress-text">Progress: ${pomodorosSpent}/${estimatedPomodoros} 🍅 • ${totalTime}min total${currentSessionTime > 0 ? ` (+${Math.round(currentSessionTime)})` : ''}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(100, (pomodorosSpent / estimatedPomodoros) * 100)}%"></div>
            </div>
        `;
    } else {
        elements.currentTaskText.textContent = appState.isBreak ? 
            `${appState.currentSession} - Recharge your energy! ☕` : 
            'Select a task to begin your focus session 🎯';
        elements.currentTaskSection.style.display = 'block';
        elements.currentTaskProgress.innerHTML = appState.isBreak ? 
            '<div class="progress-text">Take time to rest and reflect 🧘‍♀️</div>' : 
            '<div class="progress-text">Choose a quest from your task list below 📋</div>';
    }
}

// Stats and UI Updates
function updateStats() {
    // Check daily streak
    checkDailyStreak();
    
    // Update header stats
    elements.sessionsToday.textContent = appState.stats.sessionsToday;
    elements.currentStreak.textContent = appState.stats.currentStreak;
    elements.totalTime.textContent = `${Math.floor(appState.stats.focusTime / 60)}h`;
    
    const completionRate = appState.stats.totalTasks > 0 ? 
        Math.round((appState.stats.tasksCompleted / appState.stats.totalTasks) * 100) : 0;
    elements.completionRate.textContent = `${completionRate}%`;
    
    // Update level and XP
    const previousLevel = appState.stats.level;
    appState.stats.level = Math.floor(appState.stats.xp / 100) + 1;
    
    if (appState.stats.level > previousLevel) {
        updateBoxiMessage(`🎉 LEVEL UP! You've reached Level ${appState.stats.level}! Your dedication is truly inspiring! 🚀`);
        updateBoxiMood('celebrating');
        showNotification('🎉 Level Up!', `Congratulations! You've reached Level ${appState.stats.level}!`);
    }
    
    elements.userLevel.textContent = appState.stats.level;
    elements.userXP.textContent = appState.stats.xp;
    elements.xpProgress.style.width = `${(appState.stats.xp % 100)}%`;
    
    // Update detailed stats
    if (elements.detailedSessions) {
        elements.detailedSessions.textContent = appState.stats.sessionsToday;
        elements.detailedFocusTime.textContent = `${appState.stats.focusTime} minutes`;
        elements.detailedTasksCompleted.textContent = appState.stats.tasksCompleted;
        
        // Calculate productivity score
        const targetSessions = 8; // Goal: 8 sessions per day
        const productivityScore = Math.min(100, Math.round((appState.stats.sessionsToday / targetSessions) * 100));
        elements.productivityScore.textContent = `${productivityScore}%`;
    }
    
    // Update Boxi
    appState.boxi.level = Math.floor(appState.stats.level / 2) + 1; // Boxi levels up slower
    elements.boxiLevel.textContent = appState.boxi.level;
    elements.boxiHeartRate.textContent = appState.boxi.heartRate;
    elements.boxiEnergy.textContent = Math.max(20, appState.boxi.energy - (appState.stats.sessionsToday * 5));
}

// Tab Navigation
function switchTab(tabName) {
    // Remove active class from all nav buttons
    elements.navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(`${tabName}Tab`);
    if (targetTab) targetTab.classList.add('active');
    
    appState.currentTab = tabName;
    
    // Update Boxi message based on tab
    const tabMessages = {
        home: '🏠 Welcome home! Ready to focus and achieve great things?',
        tasks: '📋 Time to organize your quests! Which adventure will you tackle first?',
        stats: '📊 Look at your amazing progress! You\'re building incredible habits!',
        settings: '⚙️ Fine-tune your productivity setup! Small adjustments can make big differences!'
    };
    
    if (tabMessages[tabName]) {
        updateBoxiMessage(tabMessages[tabName]);
        updateBoxiMood(tabName === 'stats' ? 'analytical' : 'happy');
    }
    
    console.log(`📱 Switched to ${tabName} tab`);
}

// Settings Functions
function loadSettings() {
    if (elements.workDuration) elements.workDuration.value = appState.settings.workTime;
    if (elements.shortBreak) elements.shortBreak.value = appState.settings.shortBreak;
    if (elements.longBreak) elements.longBreak.value = appState.settings.longBreak;
    if (elements.soundAlerts) elements.soundAlerts.checked = appState.settings.sounds;
    if (elements.browserNotifications) elements.browserNotifications.checked = appState.settings.notifications;
    if (elements.autoDetection) elements.autoDetection.checked = appState.settings.autoDetection;
    if (elements.smartSuggestions) elements.smartSuggestions.checked = appState.settings.smartSuggestions;
}

function saveSettings() {
    if (elements.workDuration) appState.settings.workTime = parseInt(elements.workDuration.value);
    if (elements.shortBreak) appState.settings.shortBreak = parseInt(elements.shortBreak.value);
    if (elements.longBreak) appState.settings.longBreak = parseInt(elements.longBreak.value);
    if (elements.soundAlerts) appState.settings.sounds = elements.soundAlerts.checked;
    if (elements.browserNotifications) appState.settings.notifications = elements.browserNotifications.checked;
    if (elements.autoDetection) appState.settings.autoDetection = elements.autoDetection.checked;
    if (elements.smartSuggestions) appState.settings.smartSuggestions = elements.smartSuggestions.checked;
    
    saveData();
    updateBoxiMessage('💾 Settings saved! Your customized setup is ready to boost your productivity!');
}

// Data Management
function exportData() {
    const exportData = {
        tasks: appState.tasks,
        stats: appState.stats,
        settings: appState.settings,
        patterns: JSON.parse(localStorage.getItem('smartPatterns') || '[]'),
        exportDate: new Date(),
        version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `timebox-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    updateBoxiMessage('📤 Data exported successfully! Keep your progress safe! 💾');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (confirm('This will replace all your current data. Are you sure?')) {
                    if (importedData.tasks) appState.tasks = importedData.tasks;
                    if (importedData.stats) appState.stats = importedData.stats;
                    if (importedData.settings) appState.settings = importedData.settings;
                    if (importedData.patterns) localStorage.setItem('smartPatterns', JSON.stringify(importedData.patterns));
                    
                    saveData();
                    loadSettings();
                    renderTasks();
                    updateStats();
                    
                    updateBoxiMessage('📥 Data imported successfully! Welcome back to your productivity journey! 🎉');
                    updateBoxiMood('celebrating');
                }
            } catch (error) {
                alert('Invalid file format. Please select a valid TimeBox export file.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllData() {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
        if (confirm('This will permanently delete all tasks, stats, and settings. Are you absolutely sure?')) {
            localStorage.clear();
            location.reload();
        }
    }
}

// PWA Functions
function initPWA() {
    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        appState.deferredPrompt = e;
        
        setTimeout(() => {
            elements.installBanner.classList.add('show');
        }, 10000); // Show after 10 seconds
    });
    
    // Online/offline status
    window.addEventListener('online', () => {
        appState.isOnline = true;
        elements.offlineIndicator.classList.remove('show');
        updateBoxiMessage('🟢 Back online! Your data is safe and synced! 🌐');
        console.log('🟢 Back online');
    });
    
    window.addEventListener('offline', () => {
        appState.isOnline = false;
        elements.offlineIndicator.classList.add('show');
        updateBoxiMessage('📴 You\'re offline, but don\'t worry! Everything still works and your data is safe locally! 💾');
        console.log('🔴 Gone offline');
    });
    
    // App installed
    window.addEventListener('appinstalled', () => {
        elements.installBanner.classList.remove('show');
        updateBoxiMessage('🎉 Amazing! TimeBox is now installed as an app! You can find it on your home screen and use it anytime, even offline! Welcome to the future of productivity! 🚀');
        updateBoxiMood('celebrating');
        console.log('🎉 PWA installed successfully');
    });
    
    console.log('📱 PWA features initialized');
}

// Event Listeners
function initEventListeners() {
    // Timer controls
    elements.playPauseBtn.onclick = () => {
        if (appState.isActive) {
            pauseTimer();
        } else {
            startTimer();
        }
    };
    
    elements.resetBtn.onclick = resetTimer;
    
    elements.breakBtn.onclick = () => {
        if (!appState.isBreak) {
            pauseTimer();
            appState.minutes = appState.settings.shortBreak;
            appState.seconds = 0;
            appState.isBreak = true;
            appState.currentSession = 'Manual Break';
            appState.currentTask = null;
            updateTimerDisplay();
            updateCurrentTask();
            updateBoxiMessage('☕ Perfect timing for a break! Recharge and come back stronger! 💪');
            updateBoxiMood('happy');
            startTimer();
        }
    };
    
    elements.voiceBtn.onclick = () => {
        updateBoxiMessage('🎤 Voice commands coming soon! For now, try the smart detection button! 🧪');
        updateBoxiMood('excited');
    };
    
    // Tasks
    elements.addTaskBtn.onclick = addTask;
    elements.newTaskInput.onkeypress = (e) => {
        if (e.key === 'Enter') addTask();
    };
    
    // Boxi interactions
    elements.getInsight.onclick = () => {
        const insights = [
            "📊 I notice you're most productive in the morning. Try scheduling your hardest tasks then!",
            "🎯 Your focus sessions are getting longer! You're building amazing concentration muscles!",
            "⚡ You've completed " + appState.stats.sessionsToday + " perfect sessions today! Your consistency is improving dramatically!",
            "🧠 Pro tip: Taking regular breaks actually makes you MORE productive, not less!",
            "🌟 Your productivity has increased significantly this week. Keep up the incredible work!",
            "🔥 Your " + appState.stats.currentStreak + "-day streak shows real commitment! You're building life-changing habits!",
            "🏆 You're at Level " + appState.stats.level + "! Each session makes you stronger and more focused!"
        ];
        const randomInsight = insights[Math.floor(Math.random() * insights.length)];
        updateBoxiMessage(randomInsight);
        updateBoxiMood('analytical');
    };
    
    elements.testDetection.onclick = () => {
        console.log('🧪 Testing Smart Detection...');
        SmartDetection.triggerDetection();
    };
    
    // Smart Detection Modal
    elements.createNewTask.onclick = () => SmartDetection.createNewTask();
    elements.cancelSmart.onclick = () => SmartDetection.hideSmartPrompt();
    elements.customTime.onclick = () => {
        const customTime = prompt('How many minutes for the timer?', '25');
        if (customTime && !isNaN(parseInt(customTime))) {
            appState.minutes = parseInt(customTime);
            appState.seconds = 0;
            appState.isBreak = false;
            appState.currentSession = 'Work';
            startTimer();
            SmartDetection.hideSmartPrompt();
            updateBoxiMessage(`⏰ ${customTime} minute timer started! Without a specific task this time, but that's okay too! 💪`);
        }
    };
    
    // Settings
    if (elements.workDuration) elements.workDuration.onchange = saveSettings;
    if (elements.shortBreak) elements.shortBreak.onchange = saveSettings;
    if (elements.longBreak) elements.longBreak.onchange = saveSettings;
    if (elements.soundAlerts) elements.soundAlerts.onchange = saveSettings;
    if (elements.browserNotifications) elements.browserNotifications.onchange = saveSettings;
    if (elements.autoDetection) elements.autoDetection.onchange = saveSettings;
    if (elements.smartSuggestions) elements.smartSuggestions.onchange = saveSettings;
    
    if (elements.exportData) elements.exportData.onclick = exportData;
    if (elements.importData) elements.importData.onclick = importData;
    if (elements.clearData) elements.clearData.onclick = clearAllData;
    
    // PWA
    elements.installBtn.onclick = () => {
        if (appState.deferredPrompt) {
            appState.deferredPrompt.prompt();
            appState.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('✅ PWA installation accepted');
                } else {
                    console.log('❌ PWA installation declined');
                }
                appState.deferredPrompt = null;
                elements.installBanner.classList.remove('show');
            });
        }
    };
    
    elements.dismissBtn.onclick = () => {
        elements.installBanner.classList.remove('show');
    };
    
    // Navigation
    elements.navBtns.forEach(btn => {
        btn.onclick = () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        };
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        switch(e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                if (appState.isActive) {
                    pauseTimer();
                } else {
                    startTimer();
                }
                break;
            case 'r':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    resetTimer();
                }
                break;
            case 't':
                e.preventDefault();
                console.log('🧪 Testing Smart Detection via keyboard...');
                SmartDetection.triggerDetection();
                break;
            case '1':
                e.preventDefault();
                switchTab('home');
                break;
            case '2':
                e.preventDefault();
                switchTab('tasks');
                break;
            case '3':
                e.preventDefault();
                switchTab('stats');
                break;
            case '4':
                e.preventDefault();
                switchTab('settings');
                break;
        }
    });
    
    console.log('🎛️ Event listeners initialized');
}

// Make functions global for onclick handlers
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.selectTask = selectTask;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 TimeBox Ultimate starting up...');
    
    // Initialize all systems
    initEventListeners();
    initActivityDetection();
    initPWA();
    
    // Load settings
    loadSettings();
    
    // Initial render
    updateTimerDisplay();
    updateCurrentTask();
    updateStats();
    renderTasks();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('🔔 Notification permission:', permission);
            if (permission === 'granted') {
                updateBoxiMessage('🔔 Notifications enabled! I\'ll let you know when sessions complete! 📱');
            }
        });
    }
    
    // Update Boxi message
    elements.boxiMessage.textContent = appState.boxi.lastMessage;
    
    // Show appropriate tab based on current state
    if (appState.currentTab !== 'home') {
        switchTab(appState.currentTab);
    }
    
    console.log('✅ TimeBox Ultimate initialized successfully!');
    console.log('📊 Activity detection: Active');
    console.log('🧠 Context analysis: Ready');
    console.log('🎯 Smart prompts: Enabled');
    console.log('📱 PWA features: Ready');
    console.log('⌨️ Keyboard shortcuts: Space (play/pause), R (reset), T (test detection), 1-4 (tabs)');
    
    // Welcome message based on time of day and stats
    setTimeout(() => {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        const motivationalMessage = appState.stats.currentStreak > 0 ? 
            `You're on a ${appState.stats.currentStreak}-day streak! 🔥` : 
            'Let\'s start building amazing habits! 💪';
        
        updateBoxiMessage(`${greeting}! 👋 ${motivationalMessage} Ready to focus and achieve great things? Start working and I'll automatically detect what you're doing! ⚡`);
        updateBoxiMood(appState.stats.currentStreak > 0 ? 'excited' : 'happy');
    }, 2000);
});