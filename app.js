// JomAI Badminton Booking System - Main Application Logic
// Uses Puter.js for AI and storage

// Global state
let isDemoMode = false;
let currentUser = null;
let bookings = [];
let matchmakingSlots = [];
let priorityScores = {};

// Demo data
const demoCourts = [
    { id: 'court-a', name: 'Court A', available: true },
    { id: 'court-b', name: 'Court B', available: true },
    { id: 'court-c', name: 'Court C', available: false },
    { id: 'court-d', name: 'Court D', available: true }
];

const demoBookings = [
    {
        id: '1',
        date: '2026-04-25',
        time: '09:00-10:00',
        court: 'Court A',
        player: 'John Doe',
        shareSlot: false
    },
    {
        id: '2',
        date: '2026-04-25',
        time: '14:00-15:00',
        court: 'Court C',
        player: 'Jane Smith',
        shareSlot: true
    }
];

const demoMatchmakingSlots = [
    {
        id: '1',
        date: '2026-04-25',
        time: '16:00-17:00',
        court: 'Court B',
        player: 'Mike Johnson',
        skillLevel: 'Intermediate',
        notes: 'Looking for doubles partner'
    },
    {
        id: '2',
        date: '2026-04-26',
        time: '19:00-20:00',
        court: 'Court A',
        player: 'Sarah Lee',
        skillLevel: 'Advanced',
        notes: 'Practice session'
    }
];

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    await initializeApp();
    setupEventListeners();
    loadCurrentPage();
});

async function initializeApp() {
    try {
        // Try to initialize Puter
        if (window.puter) {
            await puter.auth.signIn();
            currentUser = await puter.auth.getUser();
            console.log('Puter initialized successfully');
            
            // Load data from Puter storage
            await loadDataFromStorage();
        } else {
            console.log('Puter not available, using demo mode');
            isDemoMode = true;
            updateDemoModeUI();
        }
    } catch (error) {
        console.log('Error initializing Puter, using demo mode:', error);
        isDemoMode = true;
        updateDemoModeUI();
    }
}

function setupEventListeners() {
    // Booking form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }

    // Matchmaking form
    const postSlotForm = document.getElementById('postSlotForm');
    if (postSlotForm) {
        postSlotForm.addEventListener('submit', handlePostSlot);
    }

    // Date change listeners
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        bookingDate.addEventListener('change', updateCourtsDisplay);
        bookingDate.value = new Date().toISOString().split('T')[0];
    }

    const timeSlot = document.getElementById('timeSlot');
    if (timeSlot) {
        timeSlot.addEventListener('change', updateCourtsDisplay);
    }
}

function loadCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('matchmaking')) {
        loadMatchmakingPage();
    } else if (path.includes('admin')) {
        loadAdminPage();
    } else {
        loadBookingPage();
    }
}

// Demo mode functions
function toggleDemoMode() {
    isDemoMode = !isDemoMode;
    updateDemoModeUI();
    loadCurrentPage();
}

function updateDemoModeUI() {
    const demoModeText = document.getElementById('demoModeText');
    if (demoModeText) {
        demoModeText.textContent = `Demo: ${isDemoMode ? 'ON' : 'OFF'}`;
    }
}

// Booking page functions
async function loadBookingPage() {
    updateCourtsDisplay();
    loadCurrentBookings();
    loadCancellationAlerts();
    await loadAISuggestions();
}

function updateCourtsDisplay() {
    const courtsList = document.getElementById('courtsList');
    if (!courtsList) return;

    const date = document.getElementById('bookingDate')?.value;
    const time = document.getElementById('timeSlot')?.value;

    if (!date || !time) {
        courtsList.innerHTML = '<p class="text-gray-500 text-sm">Please select date and time</p>';
        return;
    }

    const courts = isDemoMode ? demoCourts : getAvailableCourts(date, time);
    
    courtsList.innerHTML = courts.map(court => `
        <div class="court-card border rounded-lg p-4 cursor-pointer ${court.available ? 'hover:border-blue-500' : 'border-red-300 bg-red-50'}" 
             onclick="selectCourt('${court.id}', '${court.name}', ${court.available})">
            <div class="flex justify-between items-center">
                <div>
                    <h4 class="font-semibold">${court.name}</h4>
                    <p class="text-sm text-gray-600">${court.available ? 'Available' : 'Booked'}</p>
                </div>
                <div class="w-4 h-4 rounded-full ${court.available ? 'bg-green-500' : 'bg-red-500'}"></div>
            </div>
        </div>
    `).join('');
}

function getAvailableCourts(date, time) {
    // In real implementation, this would check against bookings
    return [
        { id: 'court-a', name: 'Court A', available: true },
        { id: 'court-b', name: 'Court B', available: true },
        { id: 'court-c', name: 'Court C', available: false },
        { id: 'court-d', name: 'Court D', available: true }
    ];
}

let selectedCourt = null;

function selectCourt(courtId, courtName, available) {
    if (!available) return;
    
    selectedCourt = { id: courtId, name: courtName };
    
    // Update UI to show selection
    document.querySelectorAll('.court-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

async function handleBookingSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const booking = {
        id: Date.now().toString(),
        date: formData.get('bookingDate') || document.getElementById('bookingDate').value,
        time: formData.get('timeSlot') || document.getElementById('timeSlot').value,
        court: selectedCourt?.name,
        player: formData.get('playerName') || document.getElementById('playerName').value,
        shareSlot: document.getElementById('shareSlot').checked,
        timestamp: new Date().toISOString()
    };

    if (!selectedCourt) {
        showAlert('Please select a court', 'error');
        return;
    }

    try {
        if (isDemoMode) {
            bookings.push(booking);
            showAlert('Booking confirmed! (Demo mode)', 'success');
        } else {
            // Save to Puter storage
            await puter.kv.set(`booking_${booking.id}`, booking);
            showAlert('Booking confirmed!', 'success');
        }

        // Reset form
        event.target.reset();
        selectedCourt = null;
        updateCourtsDisplay();
        loadCurrentBookings();

        // If sharing slot, add to matchmaking
        if (booking.shareSlot) {
            await addToMatchmaking(booking);
        }

    } catch (error) {
        showAlert('Error creating booking', 'error');
        console.error('Booking error:', error);
    }
}

function loadCurrentBookings() {
    const container = document.getElementById('currentBookings');
    if (!container) return;

    const currentBookings = isDemoMode ? demoBookings : bookings;
    
    if (currentBookings.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No bookings yet</div>';
        return;
    }

    container.innerHTML = currentBookings.map(booking => `
        <div class="booking-card border rounded-lg p-3 hover:bg-gray-50">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold">${booking.court}</h4>
                    <p class="text-sm text-gray-600">${booking.date} • ${booking.time}</p>
                    <p class="text-sm text-gray-500">Player: ${booking.player}</p>
                    ${booking.shareSlot ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Open to share</span>' : ''}
                </div>
                <button onclick="cancelBooking('${booking.id}')" class="text-red-500 hover:text-red-700 text-sm">
                    Cancel
                </button>
            </div>
        </div>
    `).join('');
}

function loadCancellationAlerts() {
    const container = document.getElementById('cancellationAlerts');
    if (!container) return;

    // Simulate last-minute cancellations with discounts
    const cancellations = [
        {
            court: 'Court B',
            time: '18:00-19:00',
            discount: '30%',
            originalPrice: '$20',
            discountedPrice: '$14'
        },
        {
            court: 'Court D',
            time: '20:00-21:00',
            discount: '25%',
            originalPrice: '$20',
            discountedPrice: '$15'
        }
    ];

    container.innerHTML = cancellations.map(cancellation => `
        <div class="border border-yellow-300 rounded-lg p-3 bg-yellow-50">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold text-yellow-900">${cancellation.court}</h4>
                    <p class="text-sm text-yellow-700">${cancellation.time}</p>
                    <div class="flex items-center space-x-2 mt-1">
                        <span class="text-xs line-through text-gray-500">${cancellation.originalPrice}</span>
                        <span class="text-sm font-bold text-green-700">${cancellation.discountedPrice}</span>
                        <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">${cancellation.discount} OFF</span>
                    </div>
                </div>
                <button onclick="bookCancelledSlot('${cancellation.court}', '${cancellation.time}')" class="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700">
                    Book Now
                </button>
            </div>
        </div>
    `).join('');
}

async function loadAISuggestions() {
    const container = document.getElementById('aiSuggestions');
    if (!container) return;

    try {
        let suggestions;
        
        if (isDemoMode) {
            suggestions = [
                "Court A is less busy on weekdays after 6 PM",
                "Consider booking Court D for weekend mornings - it's the quietest",
                "Your preferred time slot (7-8 PM) is popular - try 6-7 PM for better availability"
            ];
        } else {
            // Use Puter AI for suggestions
            const prompt = "Based on booking patterns, suggest the best times and courts for badminton players to maximize availability and avoid crowds.";
            suggestions = await puter.ai.chat(prompt);
            suggestions = suggestions.split('\n').filter(s => s.trim());
        }

        container.innerHTML = suggestions.map(suggestion => `
            <div class="flex items-start space-x-2">
                <span class="text-blue-500 mt-1">💡</span>
                <p class="text-sm text-gray-700">${suggestion}</p>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = '<div class="text-gray-500 text-sm">AI suggestions unavailable</div>';
    }
}

// Matchmaking page functions
async function loadMatchmakingPage() {
    loadAvailableSlots();
    await loadAIMatchmaking();
}

function loadAvailableSlots() {
    const container = document.getElementById('availableSlots');
    const slotCount = document.getElementById('slotCount');
    if (!container) return;

    const slots = isDemoMode ? demoMatchmakingSlots : matchmakingSlots;
    
    slotCount.textContent = `${slots.length} slots available`;

    if (slots.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No available slots</div>';
        return;
    }

    container.innerHTML = slots.map(slot => `
        <div class="matchmaking-card border rounded-lg p-4 bg-white">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <h4 class="font-semibold">${slot.court}</h4>
                        <span class="skill-badge ${slot.skillLevel.toLowerCase()}">${slot.skillLevel}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-1">${slot.date} • ${slot.time}</p>
                    <p class="text-sm text-gray-500 mb-2">Player: ${slot.player}</p>
                    ${slot.notes ? `<p class="text-sm text-gray-700 italic">${slot.notes}</p>` : ''}
                </div>
                <button onclick="joinSlot('${slot.id}')" class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                    Join Slot
                </button>
            </div>
        </div>
    `).join('');
}

async function handlePostSlot(event) {
    event.preventDefault();
    
    const slot = {
        id: Date.now().toString(),
        date: document.getElementById('postDate').value,
        time: document.getElementById('postTime').value,
        court: document.getElementById('postCourt').value,
        player: document.getElementById('postName').value,
        skillLevel: document.getElementById('skillLevel').value,
        notes: document.getElementById('postNotes').value,
        timestamp: new Date().toISOString()
    };

    try {
        if (isDemoMode) {
            matchmakingSlots.push(slot);
        } else {
            await puter.kv.set(`matchmaking_${slot.id}`, slot);
        }

        showAlert('Slot posted successfully!', 'success');
        event.target.reset();
        loadAvailableSlots();

    } catch (error) {
        showAlert('Error posting slot', 'error');
        console.error('Post slot error:', error);
    }
}

async function loadAIMatchmaking() {
    const container = document.getElementById('aiMatchmaking');
    if (!container) return;

    try {
        let suggestions;
        
        if (isDemoMode) {
            suggestions = [
                "3 players with Intermediate skill are looking for partners this week",
                "Court B has the most available slots for doubles matches",
                "Consider posting evening slots - they get 40% more responses"
            ];
        } else {
            const prompt = "Analyze the current matchmaking slots and provide insights for players looking for partners.";
            suggestions = await puter.ai.chat(prompt);
            suggestions = suggestions.split('\n').filter(s => s.trim());
        }

        container.innerHTML = suggestions.map(suggestion => `
            <div class="flex items-start space-x-2">
                <span class="text-blue-500 mt-1">🎯</span>
                <p class="text-sm text-blue-700">${suggestion}</p>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = '<div class="text-blue-700 text-sm">AI matchmaking unavailable</div>';
    }
}

// Admin page functions
async function loadAdminPage() {
    loadStats();
    loadPriorityScores();
    loadRecentActivity();
    loadCharts();
    await loadAIInsights();
}

function loadStats() {
    const stats = isDemoMode ? {
        totalBookings: 24,
        activePlayers: 18,
        avgDuration: '1.2h',
        cancellations: 3
    } : calculateStats();

    document.getElementById('totalBookings').textContent = stats.totalBookings;
    document.getElementById('activePlayers').textContent = stats.activePlayers;
    document.getElementById('avgDuration').textContent = stats.avgDuration;
    document.getElementById('cancellations').textContent = stats.cancellations;
}

function loadPriorityScores() {
    const container = document.getElementById('priorityScores');
    if (!container) return;

    const scores = isDemoMode ? [
        { name: 'John Doe', score: 85, level: 'high', trend: '+5' },
        { name: 'Jane Smith', score: 72, level: 'medium', trend: '+2' },
        { name: 'Mike Johnson', score: 45, level: 'low', trend: '-3' },
        { name: 'Sarah Lee', score: 91, level: 'high', trend: '+8' }
    ] : Object.entries(priorityScores).map(([name, data]) => ({
        name,
        score: data.score,
        level: data.score >= 80 ? 'high' : data.score >= 60 ? 'medium' : 'low',
        trend: data.trend || '0'
    }));

    container.innerHTML = scores.map(player => `
        <div class="flex justify-between items-center p-3 border rounded-lg">
            <div>
                <h4 class="font-semibold">${player.name}</h4>
                <div class="flex items-center space-x-2 mt-1">
                    <span class="priority-score ${player.level}">${player.score}</span>
                    <span class="text-xs ${player.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}">${player.trend}</span>
                </div>
            </div>
            <div class="text-sm text-gray-500">
                ${player.level === 'high' ? 'Priority access' : player.level === 'medium' ? 'Standard access' : 'Limited access'}
            </div>
        </div>
    `).join('');
}

function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    const activities = [
        { type: 'booking', user: 'John Doe', action: 'booked Court A', time: '2 mins ago' },
        { type: 'cancellation', user: 'Jane Smith', action: 'cancelled booking', time: '15 mins ago' },
        { type: 'matchmaking', user: 'Mike Johnson', action: 'posted available slot', time: '1 hour ago' },
        { type: 'booking', user: 'Sarah Lee', action: 'booked Court D', time: '2 hours ago' }
    ];

    container.innerHTML = activities.map(activity => `
        <div class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
            <div class="w-2 h-2 rounded-full ${
                activity.type === 'booking' ? 'bg-green-500' :
                activity.type === 'cancellation' ? 'bg-red-500' : 'bg-blue-500'
            }"></div>
            <div class="flex-1">
                <p class="text-sm">
                    <span class="font-semibold">${activity.user}</span>
                    <span class="text-gray-600"> ${activity.action}</span>
                </p>
                <p class="text-xs text-gray-500">${activity.time}</p>
            </div>
        </div>
    `).join('');
}

function loadCharts() {
    // Booking trends chart
    const bookingCtx = document.getElementById('bookingChart');
    if (bookingCtx) {
        new Chart(bookingCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Bookings',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Court utilization chart
    const utilizationCtx = document.getElementById('utilizationChart');
    if (utilizationCtx) {
        new Chart(utilizationCtx, {
            type: 'doughnut',
            data: {
                labels: ['Court A', 'Court B', 'Court C', 'Court D'],
                datasets: [{
                    data: [85, 72, 90, 68],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

async function loadAIInsights() {
    const container = document.getElementById('aiInsights');
    if (!container) return;

    try {
        let insights;
        
        if (isDemoMode) {
            insights = [
                "Peak booking hours are 6-8 PM on weekdays",
                "Court C has the highest cancellation rate - consider adjusting pricing",
                "Weekend morning slots are underutilized - recommend promotion",
                "Players with high priority scores book 3x more frequently"
            ];
        } else {
            const prompt = "Analyze the badminton booking system data and provide actionable insights for court management and player engagement.";
            insights = await puter.ai.chat(prompt);
            insights = insights.split('\n').filter(s => s.trim());
        }

        container.innerHTML = insights.map(insight => `
            <div class="bg-white p-3 rounded-lg border">
                <p class="text-sm text-purple-700">${insight}</p>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = '<div class="text-purple-700 text-sm">AI insights unavailable</div>';
    }
}

// Utility functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-${type} fade-in`;
    alertDiv.textContent = message;
    
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        if (isDemoMode) {
            bookings = bookings.filter(b => b.id !== bookingId);
        } else {
            // Remove from Puter storage
            puter.kv.delete(`booking_${bookingId}`);
        }
        
        showAlert('Booking cancelled', 'success');
        loadCurrentBookings();
    }
}

function bookCancelledSlot(court, time) {
    // Redirect to booking page with pre-filled data
    window.location.href = `index.html?court=${encodeURIComponent(court)}&time=${encodeURIComponent(time)}`;
}

function joinSlot(slotId) {
    const slot = matchmakingSlots.find(s => s.id === slotId) || demoMatchmakingSlots.find(s => s.id === slotId);
    if (slot) {
        showAlert(`Joined ${slot.court} slot with ${slot.player}!`, 'success');
        // In real implementation, this would create a booking and update the slot
    }
}

function applyFilters() {
    const date = document.getElementById('filterDate')?.value;
    const skill = document.getElementById('filterSkill')?.value;
    
    let filteredSlots = isDemoMode ? demoMatchmakingSlots : matchmakingSlots;
    
    if (date) {
        filteredSlots = filteredSlots.filter(slot => slot.date === date);
    }
    
    if (skill) {
        filteredSlots = filteredSlots.filter(slot => slot.skillLevel === skill);
    }
    
    // Update display with filtered results
    const container = document.getElementById('availableSlots');
    const slotCount = document.getElementById('slotCount');
    
    slotCount.textContent = `${filteredSlots.length} slots available`;
    
    if (filteredSlots.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No slots match your filters</div>';
        return;
    }
    
    container.innerHTML = filteredSlots.map(slot => `
        <div class="matchmaking-card border rounded-lg p-4 bg-white">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <h4 class="font-semibold">${slot.court}</h4>
                        <span class="skill-badge ${slot.skillLevel.toLowerCase()}">${slot.skillLevel}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-1">${slot.date} • ${slot.time}</p>
                    <p class="text-sm text-gray-500 mb-2">Player: ${slot.player}</p>
                    ${slot.notes ? `<p class="text-sm text-gray-700 italic">${slot.notes}</p>` : ''}
                </div>
                <button onclick="joinSlot('${slot.id}')" class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                    Join Slot
                </button>
            </div>
        </div>
    `).join('');
}

async function refreshPriorityScores() {
    // Recalculate priority scores based on recent activity
    if (!isDemoMode) {
        // In real implementation, this would analyze booking history
        // and update scores based on cancellation patterns, etc.
    }
    
    loadPriorityScores();
    showAlert('Priority scores refreshed', 'success');
}

// Storage functions
async function loadDataFromStorage() {
    try {
        // Load bookings
        const bookingKeys = await puter.kv.list('booking_');
        for (const key of bookingKeys) {
            const booking = await puter.kv.get(key);
            bookings.push(booking);
        }
        
        // Load matchmaking slots
        const matchmakingKeys = await puter.kv.list('matchmaking_');
        for (const key of matchmakingKeys) {
            const slot = await puter.kv.get(key);
            matchmakingSlots.push(slot);
        }
        
        // Load priority scores
        const priorityData = await puter.kv.get('priority_scores');
        if (priorityData) {
            priorityScores = priorityData;
        }
        
    } catch (error) {
        console.error('Error loading data from storage:', error);
    }
}

async function addToMatchmaking(booking) {
    const slot = {
        id: `booking_${booking.id}`,
        date: booking.date,
        time: booking.time,
        court: booking.court,
        player: booking.player,
        skillLevel: 'Intermediate', // Default
        notes: 'Looking for players to share court',
        timestamp: new Date().toISOString()
    };
    
    if (isDemoMode) {
        matchmakingSlots.push(slot);
    } else {
        await puter.kv.set(`matchmaking_${slot.id}`, slot);
    }
}

function calculateStats() {
    return {
        totalBookings: bookings.length,
        activePlayers: new Set(bookings.map(b => b.player)).size,
        avgDuration: '1h',
        cancellations: 0 // Would be calculated from cancellation history
    };
}
