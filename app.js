// JomAI Badminton Court Booking System - Complete Application
// Features: Court Booking, Face Recognition (face-api.js), Admin Panel

// Global state
let currentMode = 'user';
let isDarkMode = false;
let selectedCourt = null;
let selectedTimeSlot = null;
let capturedFaceData = null;
let videoStream = null;
let faceScannerActive = false;
let faceApiLoaded = false;
let faceDescriptors = new Map(); // Store face descriptors for matching

// Data storage (in production, this would be a proper database)
let bookings = [];
let faceData = [];
let verificationLog = [];
let cancellationQueue = []; // Queue for cancelled slots
let userProfiles = []; // User profiles for AI ranking

// AI Ranking System Configuration
const rankingRules = {
    age: { weight: 0.3, maxScore: 30 },
    frequency: { weight: 0.4, maxScore: 40 },
    reliability: { weight: 0.2, maxScore: 20 },
    seniority: { weight: 0.1, maxScore: 10 },
    maxTotalScore: 100
};

// Court pricing
const courtPricing = {
    'Court A': 20,
    'Court B': 15,
    'Court C': 15,
    'Court D': 10
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadUserPreferences();
    initializeApp();
    setupEventListeners();
    requestCameraPermission();
    loadFaceApiModels();
    switchMode('user');
});

// Camera permission handling
async function requestCameraPermission() {
    try {
        const result = await navigator.permissions.query({ name: 'camera' });
        
        if (result.state === 'denied') {
            showAlert('Camera access is denied. Please enable camera permissions in your browser settings for face recognition features.', 'warning');
        } else if (result.state === 'prompt') {
            console.log('Camera permission will be prompted on first use');
        } else if (result.state === 'granted') {
            console.log('Camera permission already granted');
        }
        
        // Listen for permission changes
        result.addEventListener('change', () => {
            if (result.state === 'denied') {
                showAlert('Camera permission was revoked. Face recognition features will not work.', 'error');
            }
        });
        
    } catch (error) {
        console.log('Permissions API not supported, will prompt on camera access');
    }
}

// Load face-api.js models
async function loadFaceApiModels() {
    try {
        // Load the models
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
        await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
        
        faceApiLoaded = true;
        console.log('Face API models loaded successfully');
    } catch (error) {
        console.error('Error loading Face API models:', error);
        faceApiLoaded = false;
    }
}

function loadUserPreferences() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
        isDarkMode = savedDarkMode === 'true';
        updateDarkModeUI();
    }
}

function initializeApp() {
    // Load demo data
    loadDemoData();
    updateStats();
    loadCancellationQueue();
    loadUserProfiles();
    updateRankingQueue();
}

function setupEventListeners() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
    }
}

// Mode switching
function switchMode(mode) {
    currentMode = mode;
    
    // Hide all modes
    document.querySelectorAll('.mode-content').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show selected mode
    const modeElement = document.getElementById(mode + 'Mode');
    if (modeElement) {
        modeElement.classList.remove('hidden');
    }
    
    // Update button states
    updateModeButtons(mode);
    
    // Load mode-specific data
    loadModeData(mode);
}

function updateModeButtons(activeMode) {
    const buttons = {
        'user': document.getElementById('userModeBtn'),
        'face': document.getElementById('faceModeBtn'),
        'admin': document.getElementById('adminModeBtn')
    };
    
    Object.keys(buttons).forEach(mode => {
        const btn = buttons[mode];
        if (btn) {
            if (mode === activeMode) {
                btn.classList.remove('bg-gray-600');
                btn.classList.add('bg-blue-600', 'text-white');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-600');
            }
        }
    });
}

function loadModeData(mode) {
    switch(mode) {
        case 'user':
            loadUserMode();
            break;
        case 'face':
            loadFaceMode();
            break;
        case 'admin':
            loadAdminMode();
            break;
    }
}

// User Interface Functions
function loadUserMode() {
    updateOrderSummary();
}

function selectCourt(courtName) {
    selectedCourt = courtName;
    
    // Update UI
    document.getElementById('selectedCourt').value = courtName;
    
    // Update court card selection
    document.querySelectorAll('.court-card').forEach(card => {
        card.classList.remove('selected');
        if (card.textContent.includes(courtName)) {
            card.classList.add('selected');
        }
    });
    
    updateOrderSummary();
}

function updateOrderSummary() {
    const summaryElement = document.getElementById('orderSummary');
    if (!summaryElement || !selectedCourt) return;
    
    const price = courtPricing[selectedCourt];
    const date = document.getElementById('bookingDate')?.value || '';
    const time = document.getElementById('timeSlot')?.value || '';
    
    summaryElement.innerHTML = `
        <div class="space-y-2">
            <div class="flex justify-between">
                <span class="font-medium">Court:</span>
                <span>${selectedCourt}</span>
            </div>
            <div class="flex justify-between">
                <span class="font-medium">Date:</span>
                <span>${date || 'Not selected'}</span>
            </div>
            <div class="flex justify-between">
                <span class="font-medium">Time:</span>
                <span>${time || 'Not selected'}</span>
            </div>
            <div class="flex justify-between">
                <span class="font-medium">Price:</span>
                <span class="text-green-600 font-bold">$${price}/hr</span>
            </div>
            <div class="border-t pt-2">
                <div class="flex justify-between font-bold">
                    <span>Total:</span>
                    <span class="text-green-600">$${price}</span>
                </div>
            </div>
        </div>
    `;
}

async function captureFace() {
    if (!faceApiLoaded) {
        showAlert('Face recognition models are still loading. Please wait...', 'warning');
        return;
    }
    
    try {
        const video = document.getElementById('videoElement');
        const canvas = document.getElementById('canvasElement');
        
        if (!video || !canvas) {
            showAlert('Camera elements not found', 'error');
            return;
        }
        
        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        
        video.srcObject = stream;
        video.classList.remove('hidden');
        video.play();
        
        showAlert('Position your face in the camera and click "Capture Face"', 'info');
        
        // Add face detection overlay
        addFaceDetectionOverlay(video);
        
    } catch (error) {
        console.error('Camera access error:', error);
        showAlert('Camera access denied. Please allow camera access.', 'error');
        
        // Demo fallback - use placeholder
        capturedFaceData = 'demo_face_' + Date.now();
        showAlert('Face registered (Demo Mode)', 'success');
    }
}

function addFaceDetectionOverlay(video) {
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none';
    overlay.id = 'faceOverlay';
    video.parentElement.appendChild(overlay);
    
    // Start face detection
    detectFaceInRealTime(video, overlay);
}

async function detectFaceInRealTime(video, overlay) {
    if (!faceApiLoaded || !video.srcObject) return;
    
    try {
        const detections = await faceapi.detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors();
        
        if (detections.length > 0) {
            overlay.style.borderColor = '#10b981'; // Green
            overlay.style.borderWidth = '3px';
        } else {
            overlay.style.borderColor = '#ef4444'; // Red
            overlay.style.borderWidth = '2px';
        }
        
        // Continue detection
        if (faceScannerActive || video.srcObject) {
            requestAnimationFrame(() => detectFaceInRealTime(video, overlay));
        }
    } catch (error) {
        console.error('Face detection error:', error);
    }
}

async function captureFaceImage() {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    
    if (!video || !canvas) {
        showAlert('Camera elements not found', 'error');
        return;
    }
    
    try {
        // Detect face and extract descriptor
        const detections = await faceapi.detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors();
        
        if (detections.length === 0) {
            showAlert('No face detected. Please position your face clearly in the camera.', 'error');
            return;
        }
        
        if (detections.length > 1) {
            showAlert('Multiple faces detected. Please ensure only one face is visible.', 'error');
            return;
        }
        
        // Get the face descriptor
        const faceDescriptor = detections[0].descriptor;
        
        // Capture the image
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg');
        
        // Store face data with descriptor
        capturedFaceData = {
            image: imageData,
            descriptor: Array.from(faceDescriptor), // Convert Float32Array to regular array for storage
            timestamp: new Date().toISOString()
        };
        
        // Stop camera
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        
        video.classList.add('hidden');
        
        // Remove overlay
        const overlay = document.getElementById('faceOverlay');
        if (overlay) overlay.remove();
        
        showAlert('Face captured and registered successfully!', 'success');
        
    } catch (error) {
        console.error('Face capture error:', error);
        showAlert('Error capturing face. Please try again.', 'error');
    }
}

async function processBooking() {
    // Validate form
    const form = document.getElementById('bookingForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    if (!selectedCourt) {
        showAlert('Please select a court', 'error');
        return;
    }
    
    if (!selectedTimeSlot) {
        selectedTimeSlot = document.getElementById('timeSlot').value;
    }
    
    if (!capturedFaceData) {
        showAlert('Please capture your face for verification', 'error');
        return;
    }
    
    // Process payment (demo)
    const paymentSuccess = await processPayment();
    if (!paymentSuccess) {
        return;
    }
    
    // Create booking
    const booking = {
        id: 'BK' + Date.now(),
        court: selectedCourt,
        date: document.getElementById('bookingDate').value,
        time: selectedTimeSlot,
        playerName: document.getElementById('playerName').value,
        playerEmail: document.getElementById('playerEmail').value,
        playerPhone: document.getElementById('playerPhone').value,
        faceData: capturedFaceData,
        paymentStatus: 'paid',
        verificationStatus: 'pending',
        createdAt: new Date().toISOString()
    };
    
    bookings.push(booking);
    
    // Store face data
    faceData.push({
        bookingId: booking.id,
        playerName: booking.playerName,
        faceData: capturedFaceData,
        createdAt: new Date().toISOString()
    });
    
    showAlert('Booking confirmed! Please arrive 10 minutes early for face verification.', 'success');
    
    // Reset form
    resetBookingForm();
    updateStats();
}

async function processPayment() {
    // Simulate payment processing
    showAlert('Processing payment...', 'info');
    
    return new Promise((resolve) => {
        setTimeout(() => {
            // 90% success rate for demo
            const success = Math.random() > 0.1;
            if (success) {
                showAlert('Payment successful!', 'success');
                resolve(true);
            } else {
                showAlert('Payment failed. Please try again.', 'error');
                resolve(false);
            }
        }, 2000);
    });
}

function resetBookingForm() {
    document.getElementById('bookingForm').reset();
    selectedCourt = null;
    selectedTimeSlot = null;
    capturedFaceData = null;
    document.getElementById('selectedCourt').value = '';
    document.querySelectorAll('.court-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateOrderSummary();
}

// Face Checker Functions
function loadFaceMode() {
    loadTodayBookings();
    loadVerificationLog();
}

function loadTodayBookings() {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === today);
    const container = document.getElementById('todayBookings');
    
    if (!container) return;
    
    if (todayBookings.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No bookings for today</div>';
        return;
    }
    
    container.innerHTML = todayBookings.map(booking => `
        <div class="booking-item border rounded-lg p-3 hover:bg-gray-50">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold">${booking.court}</h4>
                    <p class="text-sm text-gray-600">${booking.time}</p>
                    <p class="text-sm text-gray-500">${booking.playerName}</p>
                    <span class="status-badge ${booking.verificationStatus}">${booking.verificationStatus}</span>
                </div>
                <button onclick="verifyBooking('${booking.id}')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Verify
                </button>
            </div>
        </div>
    `).join('');
}

async function startFaceScanning() {
    if (!faceApiLoaded) {
        showAlert('Face recognition models are still loading. Please wait...', 'warning');
        return;
    }
    
    try {
        const video = document.getElementById('faceVideo');
        if (!video) return;
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        
        video.srcObject = stream;
        video.play();
        faceScannerActive = true;
        videoStream = stream;
        
        showAlert('Face scanner started - Position face for detection', 'success');
        
        // Start real face detection
        startRealFaceDetection(video);
        
    } catch (error) {
        console.error('Camera error:', error);
        showAlert('Camera access denied', 'error');
        // Demo mode
        simulateFaceScanning();
    }
}

function stopFaceScanning() {
    const video = document.getElementById('faceVideo');
    if (video && videoStream) {
        const tracks = videoStream.getTracks();
        tracks.forEach(track => track.stop());
        videoStream = null;
    }
    
    faceScannerActive = false;
    showAlert('Face scanner stopped', 'info');
}

async function startRealFaceDetection(video) {
    if (!faceApiLoaded || !faceScannerActive) return;
    
    try {
        const detections = await faceapi.detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors();
        
        const resultDiv = document.getElementById('faceResult');
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            
            if (detections.length > 0) {
                resultDiv.className = 'mt-4 p-3 rounded-md bg-green-100 text-green-800';
                resultDiv.innerHTML = `✅ Face detected! (${detections.length} face${detections.length > 1 ? 's' : ''})`;
                
                // Store current face descriptor for matching
                if (detections.length === 1) {
                    window.currentFaceDescriptor = detections[0].descriptor;
                }
            } else {
                resultDiv.className = 'mt-4 p-3 rounded-md bg-yellow-100 text-yellow-800';
                resultDiv.innerHTML = '👤 No face detected - Position face in camera';
                window.currentFaceDescriptor = null;
            }
        }
        
        // Continue scanning
        if (faceScannerActive) {
            requestAnimationFrame(() => startRealFaceDetection(video));
        }
        
    } catch (error) {
        console.error('Face detection error:', error);
        if (faceScannerActive) {
            setTimeout(() => startRealFaceDetection(video), 1000);
        }
    }
}

function simulateFaceScanning() {
    // Demo mode simulation
    const resultDiv = document.getElementById('faceResult');
    if (resultDiv) {
        resultDiv.classList.remove('hidden');
        resultDiv.className = 'mt-4 p-3 rounded-md bg-yellow-100 text-yellow-800';
        resultDiv.innerHTML = '📷 Demo mode: Face scanner ready';
    }
}

async function verifyBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    if (!faceApiLoaded) {
        showAlert('Face recognition models not loaded. Please wait...', 'warning');
        return;
    }
    
    if (!window.currentFaceDescriptor) {
        showAlert('No face detected. Please position face in camera first.', 'error');
        return;
    }
    
    showAlert('Matching face with booking data...', 'info');
    
    try {
        // Get the stored face descriptor for this booking
        const storedFaceData = booking.faceData;
        if (!storedFaceData ||typeof storedFaceData === 'string') {
            // Demo mode or invalid data
            performDemoVerification(booking);
            return;
        }
        
        // Convert stored descriptor back to Float32Array
        const storedDescriptor = new Float32Array(storedFaceData.descriptor);
        
        // Calculate face distance (similarity)
        const distance = faceapi.euclideanDistance(
            window.currentFaceDescriptor, 
            storedDescriptor
        );
        
        // Threshold for face matching (lower is more similar)
        const threshold = 0.6;
        const match = distance < threshold;
        
        setTimeout(() => {
            if (match) {
                booking.verificationStatus = 'verified';
                verificationLog.push({
                    bookingId: booking.id,
                    playerName: booking.playerName,
                    court: booking.court,
                    time: booking.time,
                    status: 'verified',
                    confidence: ((1 - distance) * 100).toFixed(1) + '%',
                    timestamp: new Date().toISOString()
                });
                
                showAlert(`✅ Verification successful for ${booking.playerName} (Confidence: ${((1 - distance) * 100).toFixed(1)}%)`, 'success');
            } else {
                booking.verificationStatus = 'failed';
                verificationLog.push({
                    bookingId: booking.id,
                    playerName: booking.playerName,
                    court: booking.court,
                    time: booking.time,
                    status: 'failed',
                    confidence: ((1 - distance) * 100).toFixed(1) + '%',
                    timestamp: new Date().toISOString()
                });
                
                showAlert(`❌ Verification failed for ${booking.playerName} (Confidence: ${((1 - distance) * 100).toFixed(1)}%)`, 'error');
            }
            
            loadTodayBookings();
            loadVerificationLog();
            updateStats();
        }, 1500);
        
    } catch (error) {
        console.error('Face matching error:', error);
        performDemoVerification(booking);
    }
}

function performDemoVerification(booking) {
    // Fallback demo verification
    setTimeout(() => {
        const match = Math.random() > 0.2; // 80% success rate
        
        if (match) {
            booking.verificationStatus = 'verified';
            verificationLog.push({
                bookingId: booking.id,
                playerName: booking.playerName,
                court: booking.court,
                time: booking.time,
                status: 'verified',
                confidence: '85%',
                timestamp: new Date().toISOString()
            });
            
            showAlert(`✅ Verification successful for ${booking.playerName} (Demo Mode)`, 'success');
        } else {
            booking.verificationStatus = 'failed';
            verificationLog.push({
                bookingId: booking.id,
                playerName: booking.playerName,
                court: booking.court,
                time: booking.time,
                status: 'failed',
                confidence: '45%',
                timestamp: new Date().toISOString()
            });
            
            showAlert(`❌ Verification failed for ${booking.playerName} (Demo Mode)`, 'error');
        }
        
        loadTodayBookings();
        loadVerificationLog();
        updateStats();
    }, 1500);
}

function loadVerificationLog() {
    const container = document.getElementById('verificationLog');
    if (!container) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = verificationLog.filter(log => 
        log.timestamp.startsWith(today)
    ).reverse();
    
    if (todayLogs.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No verifications yet today</div>';
        return;
    }
    
    container.innerHTML = todayLogs.map(log => `
        <div class="flex items-center justify-between p-2 border rounded verification-${log.status}">
            <div>
                <span class="font-medium">${log.playerName}</span>
                <span class="text-sm text-gray-600 ml-2">${log.court} - ${log.time}</span>
            </div>
            <span class="status-badge ${log.status}">${log.status}</span>
        </div>
    `).join('');
}

// Admin Panel Functions
function loadAdminMode() {
    loadBookingsList();
    loadFaceDataList();
    updateStats();
}

function loadBookingsList() {
    const container = document.getElementById('bookingsList');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No bookings yet</div>';
        return;
    }
    
    // Sort by date, most recent first
    const sortedBookings = [...bookings].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    container.innerHTML = sortedBookings.slice(0, 10).map(booking => `
        <div class="border rounded-lg p-3">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold">${booking.playerName}</h4>
                    <p class="text-sm text-gray-600">${booking.court} - ${booking.date} ${booking.time}</p>
                    <p class="text-sm text-gray-500">${booking.playerEmail}</p>
                    <div class="flex space-x-2 mt-1">
                        <span class="status-badge ${booking.verificationStatus}">${booking.verificationStatus}</span>
                        <span class="status-badge ${booking.paymentStatus}">${booking.paymentStatus}</span>
                    </div>
                </div>
                <button onclick="cancelBooking('${booking.id}')" class="text-red-500 hover:text-red-700">
                    Cancel
                </button>
            </div>
        </div>
    `).join('');
}

function loadFaceDataList() {
    const container = document.getElementById('faceDataList');
    if (!container) return;
    
    if (faceData.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No face data yet</div>';
        return;
    }
    
    container.innerHTML = faceData.slice(0, 5).map(data => `
        <div class="border rounded-lg p-3">
            <div class="flex justify-between items-center">
                <div>
                    <h4 class="font-semibold">${data.playerName}</h4>
                    <p class="text-sm text-gray-600">Booking: ${data.bookingId}</p>
                    <p class="text-xs text-gray-500">${new Date(data.createdAt).toLocaleString()}</p>
                </div>
                <button onclick="deleteFaceData('${data.bookingId}')" class="text-red-500 hover:text-red-700">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === today);
    const verified = todayBookings.filter(b => b.verificationStatus === 'verified');
    const pending = todayBookings.filter(b => b.verificationStatus === 'pending');
    
    document.getElementById('todayBookingsCount').textContent = todayBookings.length;
    document.getElementById('verifiedCount').textContent = verified.length;
    document.getElementById('pendingCount').textContent = pending.length;
    document.getElementById('registeredFacesCount').textContent = faceData.length;
}

function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
        bookings.splice(index, 1);
        
        // Also remove face data
        const faceIndex = faceData.findIndex(f => f.bookingId === bookingId);
        if (faceIndex !== -1) {
            faceData.splice(faceIndex, 1);
        }
        
        showAlert('Booking cancelled', 'success');
        loadBookingsList();
        loadFaceDataList();
        updateStats();
    }
}

function deleteFaceData(bookingId) {
    if (!confirm('Are you sure you want to delete this face data?')) return;
    
    const index = faceData.findIndex(f => f.bookingId === bookingId);
    if (index !== -1) {
        faceData.splice(index, 1);
        showAlert('Face data deleted', 'success');
        loadFaceDataList();
        updateStats();
    }
}

function exportBookings() {
    const dataStr = JSON.stringify(bookings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bookings_export.json';
    link.click();
    
    showAlert('Bookings exported successfully', 'success');
}

function clearFaceData() {
    if (!confirm('Are you sure you want to clear all face data? This cannot be undone.')) return;
    
    faceData = [];
    showAlert('All face data cleared', 'success');
    loadFaceDataList();
    updateStats();
}

function generateReport() {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === today);
    const verified = todayBookings.filter(b => b.verificationStatus === 'verified');
    const revenue = todayBookings.reduce((sum, b) => sum + (courtPricing[b.court] || 0), 0);
    
    const report = `
Daily Report - ${today}
====================
Total Bookings: ${todayBookings.length}
Verified: ${verified.length}
Pending: ${todayBookings.length - verified.length}
Revenue: $${revenue}
Verification Rate: ${todayBookings.length > 0 ? Math.round((verified.length / todayBookings.length) * 100) : 0}%
    `;
    
    const dataBlob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily_report_${today}.txt`;
    link.click();
    
    showAlert('Report generated successfully', 'success');
}

// Cancellation and Queue Functions
function loadCancellationQueue() {
    const container = document.getElementById('cancellationQueue');
    if (!container) return;
    
    if (cancellationQueue.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No cancellations in queue</div>';
        return;
    }
    
    container.innerHTML = cancellationQueue.map((item, index) => `
        <div class="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
            <div>
                <span class="font-medium">${item.court} - ${item.time}</span>
                <span class="text-xs text-gray-500 ml-2">Cancelled by: ${item.cancelledBy}</span>
            </div>
            <div class="text-right">
                <span class="text-xs text-gray-500">Position: ${index + 1}</span>
                <button onclick="joinQueue('${item.id}')" class="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    Join Queue
                </button>
            </div>
        </div>
    `).join('');
}

function joinQueue(cancellationId) {
    const item = cancellationQueue.find(c => c.id === cancellationId);
    if (!item) return;
    
    // Check if user already in queue
    const existingQueue = cancellationQueue.filter(c => c.joinedBy === currentUser);
    if (existingQueue.length > 0) {
        showAlert('You are already in another queue. Please leave that queue first.', 'warning');
        return;
    }
    
    // Add user to queue
    item.joinedBy = currentUser;
    item.joinedAt = new Date().toISOString();
    
    showAlert(`You've joined the queue for ${item.court} at ${item.time}`, 'success');
    loadCancellationQueue();
    updateQueuePosition();
}

function cancelBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    // Add to cancellation queue
    const cancelledSlot = {
        id: 'CQ' + Date.now(),
        court: booking.court,
        date: booking.date,
        time: booking.time,
        cancelledBy: booking.playerName,
        originalBookingId: bookingId,
        joinedBy: null,
        joinedAt: null,
        createdAt: new Date().toISOString()
    };
    
    cancellationQueue.push(cancelledSlot);
    
    // Update original booking status
    booking.verificationStatus = 'cancelled';
    
    showAlert('Booking cancelled and added to queue system', 'success');
    loadCancellationQueue();
    updateQueuePosition();
}

function updateQueuePosition() {
    const container = document.getElementById('queuePosition');
    if (!container) return;
    
    const userQueueItems = cancellationQueue.filter(c => c.joinedBy === currentUser);
    
    if (userQueueItems.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-600">Not in queue</p>';
        return;
    }
    
    const position = cancellationQueue.indexOf(userQueueItems[0]) + 1;
    container.innerHTML = `
        <div class="space-y-2">
            <p class="text-sm font-medium text-gray-900">Queue Position: ${position}</p>
            <p class="text-xs text-gray-600">${userQueueItems.length} ${userQueueItems.length === 1 ? 'slot' : 'slots'} in queue</p>
        </div>
    `;
}

// AI Ranking System Functions
function loadUserProfiles() {
    // Initialize demo user profiles with ranking data
    userProfiles = [
        {
            id: 'user1',
            name: 'John Doe',
            age: 25,
            seniority: 2, // years
            frequency: 15, // bookings per month
            reliability: 85, // percentage
            totalScore: 0
        },
        {
            id: 'user2',
            name: 'Jane Smith',
            age: 35,
            seniority: 5,
            frequency: 20,
            reliability: 95,
            totalScore: 0
        },
        {
            id: 'user3',
            name: 'Robert Chen',
            age: 65,
            seniority: 8,
            frequency: 12,
            reliability: 90,
            totalScore: 0
        }
    ];
    
    // Calculate scores for all users
    userProfiles = userProfiles.map(user => ({
        ...user,
        ageScore: calculateAgeScore(user.age),
        frequencyScore: calculateFrequencyScore(user.frequency),
        reliabilityScore: calculateReliabilityScore(user.reliability),
        seniorityScore: calculateSeniorityScore(user.seniority),
        totalScore: 0
    }));
    
    // Calculate total scores
    userProfiles.forEach(user => {
        user.totalScore = 
            user.ageScore + 
            user.frequencyScore + 
            user.reliabilityScore + 
            user.seniorityScore;
    });
    
    // Sort by total score (highest first)
    userProfiles.sort((a, b) => b.totalScore - a.totalScore);
}

function calculateAgeScore(age) {
    // Younger players get higher scores
    if (age <= 25) return rankingRules.age.maxScore;
    if (age <= 35) return rankingRules.age.maxScore * 0.8;
    if (age <= 50) return rankingRules.age.maxScore * 0.6;
    if (age <= 65) return rankingRules.age.maxScore * 0.4;
    return rankingRules.age.maxScore * 0.2;
}

function calculateFrequencyScore(frequency) {
    // More frequent players get higher scores
    const normalizedScore = (frequency / 20) * rankingRules.frequency.maxScore;
    return Math.min(normalizedScore, rankingRules.frequency.maxScore);
}

function calculateReliabilityScore(reliability) {
    // Higher reliability percentage gets higher scores
    return (reliability / 100) * rankingRules.reliability.maxScore;
}

function calculateSeniorityScore(seniority) {
    // More years as member gets higher scores
    const normalizedScore = (seniority / 10) * rankingRules.seniority.maxScore;
    return Math.min(normalizedScore, rankingRules.seniority.maxScore);
}

function updateRankingQueue() {
    const container = document.getElementById('rankingQueue');
    if (!container) return;
    
    if (userProfiles.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm">No users in queue</div>';
        return;
    }
    
    container.innerHTML = userProfiles.map((user, index) => `
        <div class="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
            <div class="flex items-center space-x-3">
                <div class="text-lg font-bold text-gray-900">${index + 1}</div>
                <div>
                    <div class="font-medium text-gray-900">${user.name}</div>
                    <div class="text-xs text-gray-600">Age: ${user.age} | Seniority: ${user.seniority}y</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-lg font-bold text-blue-600">${user.totalScore}</div>
                <div class="text-xs text-gray-600">Total Score</div>
                <div class="mt-1 space-y-1">
                    <div class="text-xs text-gray-500">📅 ${user.ageScore.toFixed(1)}</div>
                    <div class="text-xs text-gray-500">🎾 ${user.frequencyScore.toFixed(1)}</div>
                    <div class="text-xs text-gray-500">✅ ${user.reliabilityScore.toFixed(1)}</div>
                    <div class="text-xs text-gray-500">👤 ${user.seniorityScore.toFixed(1)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Demo Data
function loadDemoData() {
    // Add some demo bookings
    const today = new Date().toISOString().split('T')[0];
    
    bookings = [
        {
            id: 'BK001',
            court: 'Court A',
            date: today,
            time: '09:00-10:00',
            playerName: 'John Doe',
            playerEmail: 'john@example.com',
            playerPhone: '+1234567890',
            faceData: 'demo_face_1',
            paymentStatus: 'paid',
            verificationStatus: 'pending',
            createdAt: new Date().toISOString()
        },
        {
            id: 'BK002',
            court: 'Court B',
            date: today,
            time: '14:00-15:00',
            playerName: 'Jane Smith',
            playerEmail: 'jane@example.com',
            playerPhone: '+1234567891',
            faceData: 'demo_face_2',
            paymentStatus: 'paid',
            verificationStatus: 'verified',
            createdAt: new Date().toISOString()
        }
    ];
    
    faceData = [
        {
            bookingId: 'BK001',
            playerName: 'John Doe',
            faceData: 'demo_face_1',
            createdAt: new Date().toISOString()
        },
        {
            bookingId: 'BK002',
            playerName: 'Jane Smith',
            faceData: 'demo_face_2',
            createdAt: new Date().toISOString()
        }
    ];
    
    verificationLog = [
        {
            bookingId: 'BK002',
            playerName: 'Jane Smith',
            court: 'Court B',
            time: '14:00-15:00',
            status: 'verified',
            timestamp: new Date().toISOString()
        }
    ];
    
    // Add demo cancellation queue items
    cancellationQueue = [
        {
            id: 'CQ001',
            court: 'Court C',
            date: today,
            time: '16:00-17:00',
            cancelledBy: 'Mike Wilson',
            originalBookingId: 'BK003',
            joinedBy: null,
            joinedAt: null,
            createdAt: new Date().toISOString()
        }
    ];
}

// Dark Mode Functions
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    updateDarkModeUI();
    saveUserPreferences();
}

function updateDarkModeUI() {
    const body = document.body;
    const darkModeIcon = document.getElementById('darkModeIcon');
    
    if (isDarkMode) {
        body.setAttribute('data-theme', 'dark');
        if (darkModeIcon) darkModeIcon.textContent = '☀️';
    } else {
        body.removeAttribute('data-theme');
        if (darkModeIcon) darkModeIcon.textContent = '🌙';
    }
}

function saveUserPreferences() {
    localStorage.setItem('darkMode', isDarkMode.toString());
}

// AI Chatbot Functions
function toggleChatbot() {
    const container = document.getElementById('chatbotContainer');
    const content = document.getElementById('chatbotContent');
    const toggle = document.getElementById('chatbotToggle');
    
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        content.classList.remove('hidden');
        toggle.textContent = '−';
    } else {
        container.classList.add('hidden');
        content.classList.add('hidden');
        toggle.textContent = '+';
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage('user', message);
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const response = generateAIResponse(message);
        addChatMessage('ai', response);
    }, 1000);
}

function addChatMessage(sender, message) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `p-2 rounded-lg ${sender === 'user' ? 'bg-gray-100 ml-8' : 'bg-blue-50'}`;
    
    const senderDiv = document.createElement('div');
    senderDiv.className = 'font-medium text-sm';
    senderDiv.textContent = sender === 'user' ? 'You:' : 'AI Assistant:';
    
    const textDiv = document.createElement('p');
    textDiv.className = 'text-sm text-gray-700 mt-1';
    textDiv.textContent = message;
    
    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(textDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple rule-based responses
    if (lowerMessage.includes('how to book') || lowerMessage.includes('booking')) {
        return 'To book a court: 1) Select your preferred court (A-D), 2) Choose date and time slot, 3) Enter your details, 4) Capture your face for verification, 5) Complete payment. Courts A and B are premium with better facilities!';
    }
    
    if (lowerMessage.includes('cancel') || lowerMessage.includes('cancellation')) {
        return 'Cancellation policy: You can cancel bookings up to 2 hours before your slot. Cancelled slots are added to the queue system where other players can join. Players with higher ranking scores get priority for cancelled slots.';
    }
    
    if (lowerMessage.includes('queue') || lowerMessage.includes('ranking')) {
        return 'Queue system: Players are ranked by age (30%), frequency (40%), reliability (20%), and seniority (10%). Higher scores mean better queue position. Cancellation queue operates on first-come-first-served basis for players who join.';
    }
    
    if (lowerMessage.includes('senior') || lowerMessage.includes('elderly') || lowerMessage.includes('help')) {
        return 'Senior assistance: I can help you with booking, navigation, and understanding the queue system. You can ask me "how to book", "cancellation policy", or "queue rules" anytime. The face recognition helps verify identity quickly!';
    }
    
    if (lowerMessage.includes('court') || lowerMessage.includes('facility')) {
        return 'Our facilities: Court A & B are premium ($20/hr) with air conditioning and pro lighting. Courts C & D are standard ($15/hr) and budget ($10/hr) respectively. All courts have proper flooring and net systems.';
    }
    
    return 'I\'m here to help with court bookings, queue management, and facility information. You can ask me about booking procedures, cancellation policies, queue rules, or court facilities. How else can I assist you?';
}

function quickQuestion(topic) {
    const questions = {
        'how to book': 'How do I book a court?',
        'cancellation policy': 'What is the cancellation policy?',
        'queue rules': 'How does the queue system work?'
    };
    
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = questions[topic] || '';
        sendMessage();
    }
}

// Utility Functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-${type} fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 fade-in`;
    alertDiv.style.cssText = `
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 16px;
        z-index: 1000;
    `;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}
