// Shift assignments - simple boolean flags
let shiftAssignments = {
    opening: false,
    mid: false,
    close: false,
    thursday1: false,
    thursday2: false,
    thursday3: false
};

// Load data from localStorage
function loadData() {
    const savedAssignments = localStorage.getItem('chcShiftAssignments');
    
    if (savedAssignments) {
        const saved = JSON.parse(savedAssignments);
        // Handle migration from old array format to new boolean format
        if (Array.isArray(saved.opening)) {
            shiftAssignments.opening = saved.opening.length > 0;
            shiftAssignments.mid = saved.mid && saved.mid.length > 0;
            shiftAssignments.close = saved.close && saved.close.length > 0;
            shiftAssignments.thursday1 = saved.thursday1 && saved.thursday1.length > 0;
            shiftAssignments.thursday2 = saved.thursday2 && saved.thursday2.length > 0;
            shiftAssignments.thursday3 = saved.thursday3 && saved.thursday3.length > 0;
            } else {
            // New format - boolean flags
            shiftAssignments = { ...shiftAssignments, ...saved };
        }
    }
    
    updateShiftAssignments();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('chcShiftAssignments', JSON.stringify(shiftAssignments));
}

// Update shift assignments UI
function updateShiftAssignments() {
    const shiftType = document.getElementById('shiftType').value;
    const isThursday = shiftType === 'thursday';
    
    const shiftsContainer = document.getElementById('shiftsContainer');
    shiftsContainer.innerHTML = '';
    
    if (isThursday) {
        // Thursday: show 3 shifts all 9-7
        const shifts = [
            { key: 'thursday1', label: 'Shift 1 (9-7)', checkboxId: 'thursdayShift1Checkbox' },
            { key: 'thursday2', label: 'Shift 2 (9-7)', checkboxId: 'thursdayShift2Checkbox' },
            { key: 'thursday3', label: 'Shift 3 (9-7)', checkboxId: 'thursdayShift3Checkbox' }
        ];
        
        shifts.forEach(shift => {
            const checkboxGroup = document.createElement('div');
            checkboxGroup.className = 'shift-checkbox-group';
            checkboxGroup.innerHTML = `
                <label class="shift-checkbox-label">
                    <input type="checkbox" id="${shift.checkboxId}" class="shift-checkbox" ${shiftAssignments[shift.key] ? 'checked' : ''}>
                    <span class="shift-checkbox-text">${shift.label}</span>
                </label>
            `;
            shiftsContainer.appendChild(checkboxGroup);
            
            // Add event listener
            const checkbox = document.getElementById(shift.checkboxId);
            checkbox.addEventListener('change', function() {
                shiftAssignments[shift.key] = this.checked;
                saveData();
                calculateRemainingPatients();
            });
        });
    } else {
        // Normal: show 3 different shifts
        const shifts = [
            { key: 'opening', label: 'Opening Shift (8-6)', checkboxId: 'openingShiftCheckbox' },
            { key: 'mid', label: 'Mid Shift (9-7)', checkboxId: 'midShiftCheckbox' },
            { key: 'close', label: 'Close Shift (10-8)', checkboxId: 'closeShiftCheckbox' }
        ];
        
        shifts.forEach(shift => {
            const checkboxGroup = document.createElement('div');
            checkboxGroup.className = 'shift-checkbox-group';
            checkboxGroup.innerHTML = `
                <label class="shift-checkbox-label">
                    <input type="checkbox" id="${shift.checkboxId}" class="shift-checkbox" ${shiftAssignments[shift.key] ? 'checked' : ''}>
                    <span class="shift-checkbox-text">${shift.label}</span>
                </label>
            `;
            shiftsContainer.appendChild(checkboxGroup);
            
            // Add event listener
            const checkbox = document.getElementById(shift.checkboxId);
            checkbox.addEventListener('change', function() {
                shiftAssignments[shift.key] = this.checked;
    saveData();
    calculateRemainingPatients();
            });
        });
    }
}

// Set current time to now
function setCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeInput = document.getElementById('currentTime');
    if (timeInput) {
        timeInput.value = `${hours}:${minutes}`;
        calculateRemainingPatients();
        // Visual feedback
        timeInput.focus();
        setTimeout(() => timeInput.blur(), 300);
    }
}

// Get shift times based on shift type
function getShiftTimes(isThursday) {
    if (isThursday) {
        return {
            thursday1: { start: 9, end: 19 }, // 9-7pm
            thursday2: { start: 9, end: 19 }, // 9-7pm
            thursday3: { start: 9, end: 19 }  // 9-7pm
        };
    } else {
        return {
            opening: { start: 8, end: 18 }, // 8-6pm
            mid: { start: 9, end: 19 },     // 9-7pm
            close: { start: 10, end: 20 }   // 10-8pm
        };
    }
}

// Calculate remaining hours for a provider
function calculateRemainingHours(currentHour, currentMinute, shiftStart, shiftEnd) {
    const currentTimeDecimal = currentHour + currentMinute / 60;
    
    // If current time is before shift start, return full shift hours
    if (currentTimeDecimal < shiftStart) {
        return shiftEnd - shiftStart;
    }
    
    // If current time is after shift end, return 0
    if (currentTimeDecimal >= shiftEnd) {
        return 0;
    }
    
    // Calculate remaining hours
    const remaining = shiftEnd - currentTimeDecimal;
    return Math.max(0, remaining);
}

// Calculate remaining patients for a shift at 2 patients/hour
function calculateShiftRemainingPatients(remainingHours) {
    if (remainingHours <= 0) {
        return 0;
    }
    
    // If less than 1 hour remaining, they only see 2 patients
    if (remainingHours < 1) {
        return 2;
    }
    
    // The last hour is always 2 patients
    // All hours before the last hour are also 2 patients/hour
    const hoursBeforeLast = remainingHours - 1;
    const patientsFromFullHours = hoursBeforeLast * 2;
    const patientsFromLastHour = 2;
    
    return patientsFromFullHours + patientsFromLastHour;
}

// Get the latest shift end time based on shift type
function getLatestShiftEndTime(isThursday) {
    if (isThursday) {
        return 19; // 7pm for Thursday shifts
    } else {
        return 20; // 8pm for normal shifts
    }
}

// Calculate total remaining patients
function calculateRemainingPatients() {
    const shiftType = document.getElementById('shiftType').value;
    const currentTime = document.getElementById('currentTime').value;
    const patientsInLobby = parseInt(document.getElementById('patientsInLobby').value) || 0;
    
    // If no time is set yet, don't calculate (will update automatically once time is set)
    if (!currentTime) {
        return;
    }
    
    const [hours, minutes] = currentTime.split(':').map(Number);
    const currentHour = hours;
    const currentMinute = minutes;
    
    // Debug: Log the time values to help troubleshoot
    console.log('Time input value:', currentTime);
    console.log('Parsed hours:', currentHour, 'minutes:', currentMinute);
    
    const isThursday = shiftType === 'thursday';
    const latestShiftEnd = getLatestShiftEndTime(isThursday);
    const currentTimeDecimal = currentHour + currentMinute / 60;
    
    console.log('Current time decimal:', currentTimeDecimal, 'Latest shift end:', latestShiftEnd);
    console.log('Is after closing?', currentTimeDecimal >= latestShiftEnd);
    
    // Format time for display
    const displayHour = currentHour === 0 ? 12 : (currentHour > 12 ? currentHour - 12 : currentHour);
    const ampm = currentHour >= 12 ? 'PM' : 'AM';
    const displayTime = `${displayHour}:${String(currentMinute).padStart(2, '0')} ${ampm}`;
    
    // Check if current time is after the clinic closes
    if (currentTimeDecimal >= latestShiftEnd) {
        const closingTime = latestShiftEnd === 19 ? '7:00 PM' : '8:00 PM';
        const resultBox = document.getElementById('result');
        if (resultBox) {
            resultBox.classList.add('closed');
        }
        const resultValue = document.getElementById('resultValue');
        if (resultValue) {
            resultValue.textContent = 'CLOSED';
        }
        // Hide Rickey message when closed
        const rickeyMessage = document.getElementById('rickeyMessage');
        if (rickeyMessage) {
            rickeyMessage.style.display = 'none';
        }
        const resultBreakdown = document.getElementById('resultBreakdown');
        if (resultBreakdown) {
            resultBreakdown.innerHTML = `
                <div class="breakdown-header" style="color: #ffeb3b; font-weight: bold;">⚠️ Clinic Closed</div>
                <div class="breakdown-item" style="margin-top: 10px;">
                    Current time: ${displayTime} (${currentHour}:${String(currentMinute).padStart(2, '0')})<br>
                    The clinic closed at ${closingTime}. No remaining patient capacity calculations are available after closing time.
                </div>
            `;
        }
        return;
    }
    
    // Remove closed class if clinic is open
    const resultBox = document.getElementById('result');
    resultBox.classList.remove('closed');
    
    const shiftTimes = getShiftTimes(isThursday);
    
    let totalProviderCapacity = 0;
    const breakdown = [];
    
    // Calculate for each shift
    let shifts;
    if (isThursday) {
        shifts = [
            { name: 'Shift 1', key: 'thursday1', shiftTimes: shiftTimes.thursday1 },
            { name: 'Shift 2', key: 'thursday2', shiftTimes: shiftTimes.thursday2 },
            { name: 'Shift 3', key: 'thursday3', shiftTimes: shiftTimes.thursday3 }
        ];
    } else {
        shifts = [
            { name: 'Opening', key: 'opening', shiftTimes: shiftTimes.opening },
            { name: 'Mid', key: 'mid', shiftTimes: shiftTimes.mid },
            { name: 'Close', key: 'close', shiftTimes: shiftTimes.close }
        ];
    }
    
    // Check if any shifts are filled
    let hasAnyShifts = false;
    shifts.forEach(shift => {
        if (shiftAssignments[shift.key]) {
            hasAnyShifts = true;
            
            const remainingHours = calculateRemainingHours(
                currentHour,
                currentMinute,
                shift.shiftTimes.start,
                shift.shiftTimes.end
            );
            
            const remainingPatients = calculateShiftRemainingPatients(remainingHours);
            totalProviderCapacity += remainingPatients;
            
            if (remainingPatients > 0) {
                breakdown.push({
                    shift: shift.name,
                    remainingHours: remainingHours.toFixed(2),
                    remainingPatients: remainingPatients.toFixed(1)
                });
            }
        }
    });
    
    // Round down total provider capacity to nearest whole number
    const roundedProviderCapacity = Math.floor(totalProviderCapacity);
    
    // Display results
    const resultValue = document.getElementById('resultValue');
    const breakdownDiv = document.getElementById('resultBreakdown');
    
    // Check if no shifts are filled
    if (!hasAnyShifts) {
        // If no shifts filled, show negative of lobby patients (can't accept more)
        const remainingCapacity = 0 - patientsInLobby;
        resultValue.textContent = remainingCapacity;
        resultBox.classList.add('no-providers');
        // Remove any color coding classes to keep the brown no-providers color
        resultBox.classList.remove('capacity-red', 'capacity-yellow', 'capacity-green', 'capacity-negative');
        
        // Show/hide Rickey message
        const rickeyMessage = document.getElementById('rickeyMessage');
        if (rickeyMessage) {
            if (remainingCapacity < 0) {
                rickeyMessage.textContent = "You Pulled a Rickey! Time to encourage patients leave.";
                rickeyMessage.style.display = 'block';
            } else {
                rickeyMessage.style.display = 'none';
            }
        }
        
        breakdownDiv.innerHTML = `
            <div class="breakdown-header" style="color: #fff8dc; font-weight: bold;">⚠️ No Shifts Filled</div>
            <div class="breakdown-item" style="margin-top: 10px;">
                Check which shifts are filled below to calculate remaining patient capacity.
            </div>
        `;
        return;
    }
    
    // Remove no-providers class if shifts are filled
    resultBox.classList.remove('no-providers');
    
    // Calculate remaining capacity: rounded down total provider capacity minus patients in lobby
    const remainingCapacity = roundedProviderCapacity - patientsInLobby;
    resultValue.textContent = remainingCapacity;
    
    // Apply color coding based on remaining capacity
    resultValue.className = 'result-value'; // Reset classes
    resultBox.classList.remove('capacity-red', 'capacity-yellow', 'capacity-green', 'capacity-negative');
    
    // Show/hide Rickey message
    const rickeyMessage = document.getElementById('rickeyMessage');
    if (rickeyMessage) {
        if (remainingCapacity < 0) {
            rickeyMessage.textContent = "You Pulled a Rickey! Time to encourage patients leave.";
            rickeyMessage.style.display = 'block';
        } else {
            rickeyMessage.style.display = 'none';
        }
    }
    
    if (remainingCapacity < 0) {
        resultBox.classList.add('capacity-negative');
    } else if (remainingCapacity <= 1) {
        resultBox.classList.add('capacity-red');
    } else if (remainingCapacity <= 4) {
        resultBox.classList.add('capacity-yellow');
    } else {
        resultBox.classList.add('capacity-green');
    }
    
    if (breakdown.length > 0) {
        breakdownDiv.innerHTML = `
            <div class="breakdown-header">Breakdown:</div>
            ${breakdown.map(item => `
                <div class="breakdown-item" style="font-size: 0.9em;">
                    ${item.shift}: ${Math.floor(parseFloat(item.remainingPatients))} patients (${item.remainingHours} hrs remaining)
                </div>
            `).join('')}
        `;
    } else {
        breakdownDiv.innerHTML = `
            <div class="breakdown-header">Breakdown:</div>
            <div class="breakdown-item" style="margin-top: 10px; color: #ffeb3b;">All filled shifts have completed.</div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default time to current time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('currentTime').value = `${hours}:${minutes}`;
    
    loadData();
    
    const shiftTypeSelect = document.getElementById('shiftType');
    const setCurrentTimeBtn = document.getElementById('setCurrentTimeBtn');
    
    // Set current time button
    if (setCurrentTimeBtn) {
        setCurrentTimeBtn.addEventListener('click', setCurrentTime);
    }
    
    // Auto-update when patients in lobby changes
    const patientsInLobbyInput = document.getElementById('patientsInLobby');
    if (patientsInLobbyInput) {
        patientsInLobbyInput.addEventListener('input', calculateRemainingPatients);
        patientsInLobbyInput.addEventListener('change', calculateRemainingPatients);
    }
    
    // Auto-update when time changes
    const currentTimeInput = document.getElementById('currentTime');
    if (currentTimeInput) {
        currentTimeInput.addEventListener('change', calculateRemainingPatients);
        currentTimeInput.addEventListener('input', calculateRemainingPatients);
    }
    
    // Auto-calculate on page load after time is set
    setTimeout(() => {
        if (currentTimeInput && currentTimeInput.value) {
            calculateRemainingPatients();
        }
    }, 200);
    
    // Also try immediately after a longer delay (in case loadData takes time)
    setTimeout(() => {
        if (currentTimeInput && currentTimeInput.value) {
            calculateRemainingPatients();
        }
    }, 500);
    
    // Update shift assignments when shift type changes
    if (shiftTypeSelect) {
        shiftTypeSelect.addEventListener('change', () => {
            updateShiftAssignments();
            calculateRemainingPatients();
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + T: Set current time
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            setCurrentTime();
        }
    });
    
    // Add visual feedback for number inputs
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('invalid', function() {
            this.setCustomValidity('Please enter a valid number');
        });
        input.addEventListener('input', function() {
            this.setCustomValidity('');
        });
    });
    
    // Initialize navigation
    initializeNavigation();
    initializeHamburgerMenu();
    
    // On mobile, set Clinical Pathways as the default page instead of Respiratory Illness Dashboard
    if (window.innerWidth <= 768) {
        // Remove active class from respiratory-panel page and nav item
        const respiratoryPage = document.getElementById('respiratory-panel-page');
        const respiratoryNavItem = document.querySelector('.nav-item[data-page="respiratory-panel"]');
        if (respiratoryPage) {
            respiratoryPage.classList.remove('active');
        }
        if (respiratoryNavItem) {
            respiratoryNavItem.classList.remove('active');
        }
        // Set pathways as the active page on mobile
        navigateToPage('pathways');
    }
    
    // Initialize Clinical Pathways
    initializePathways();
    
    // Initialize DB stores for handouts
    initDB().then(() => {
        initHandoutsDB().catch(err => console.error('Error initializing handouts DB:', err));
    }).catch(err => console.error('Error initializing DB:', err));
});

// ==================== Navigation System ====================

function navigateToPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        }
    });
    
    // Re-render pathways when navigating to pathways page
    if (pageId === 'pathways') {
        const searchInput = document.getElementById('pathwaySearch');
        const currentFilter = searchInput ? searchInput.value : '';
        // Reload custom names to ensure they're fresh, then render
        loadCustomDisplayNames().then(() => {
            // Force recalculation of all display names
            pathways.forEach(pathway => {
                pathway.displayName = getDisplayName(pathway.file, pathway.name, 'pathway');
            });
            renderPathways(currentFilter);
        }).catch(() => {
            // If loading fails, still render with what we have
            renderPathways(currentFilter);
        });
    }
    
    // Initialize PT when navigating to physical therapy page
    if (pageId === 'physical-therapy') {
        initializePT();
    }
    
    // Initialize Handouts when navigating to patient resources page
    if (pageId === 'patient-resources') {
        initializeHandouts();
    }
    
    // Initialize Forms when navigating to forms page
    if (pageId === 'forms') {
        initializeForms();
    }
    
    // Initialize Dosing Calculator when navigating to dosing calculator page
    if (pageId === 'dosing-calculator') {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            initializeDosingCalculator();
        }, 100);
    }
    
    // Initialize Pediatric Dosing Calculator when navigating to pediatric dosing page
    if (pageId === 'pediatric-dosing') {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            initializePediatricDosing();
        }, 100);
    }
}

function initializeNavigation() {
    // Add click handlers to nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            navigateToPage(pageId);
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768 && closeSidebar) {
                closeSidebar();
            }
        });
    });
}

// Hamburger Menu Toggle Functionality
let closeSidebar = null;

function initializeHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (!hamburgerMenu || !sidebar || !sidebarOverlay) return;

    function openSidebar() {
        sidebar.classList.add('mobile-open');
        sidebarOverlay.classList.add('active');
        hamburgerMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSidebar = function() {
        sidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = '';
    };

    function toggleSidebar() {
        if (sidebar.classList.contains('mobile-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    // Toggle on hamburger click
    hamburgerMenu.addEventListener('click', toggleSidebar);

    // Close on overlay click
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeSidebar();
        }
    });

    // Handle window resize - ensure sidebar behavior is correct
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            // Desktop: remove mobile classes, sidebar always visible
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('active');
            hamburgerMenu.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            // Mobile: ensure sidebar is closed if it was open
            if (sidebar.classList.contains('mobile-open')) {
                // Keep it open if user had it open
            } else {
                sidebar.classList.remove('mobile-open');
                sidebarOverlay.classList.remove('active');
                hamburgerMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
            // On mobile, if respiratory-panel is active, switch to pathways
            const respiratoryPage = document.getElementById('respiratory-panel-page');
            if (respiratoryPage && respiratoryPage.classList.contains('active')) {
                navigateToPage('pathways');
            }
        }
    });

    // Initialize sidebar state based on screen size
    // On desktop (>768px), sidebar is always visible (no class needed)
    // On mobile (<=768px), sidebar starts closed
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
    }
}

// Make navigateToPage available globally for buttons
window.navigateToPage = navigateToPage;

// ==================== Clinical Pathways System ====================

// GitHub configuration - Update this with your repository URL
// For GitHub Pages, use the raw.githubusercontent.com URL:
// Format: https://raw.githubusercontent.com/USERNAME/REPO-NAME/BRANCH
// Example: https://raw.githubusercontent.com/yourusername/Patient-Calculator/main
// 
// For local development, this will auto-detect. For GitHub Pages, uncomment and set:
// const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main';

// Auto-detect: if on GitHub Pages, use raw.githubusercontent.com, otherwise use local path
let GITHUB_BASE_URL;
if (window.location.hostname.includes('github.io') || window.location.hostname.includes('github.com')) {
    // Extract repo info from GitHub Pages URL
    const pathParts = window.location.pathname.split('/').filter(p => p);
    if (pathParts.length >= 2) {
        const username = pathParts[0];
        const repo = pathParts[1];
        GITHUB_BASE_URL = `https://raw.githubusercontent.com/${username}/${repo}/main`;
    } else {
        // Fallback to local
        GITHUB_BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    }
} else if (window.location.protocol === 'file:') {
    // Opening index.html directly: use paths relative to this file (./documents/...).
    // Note: Chrome/Edge often block fetch() from file:// — use a local HTTP server to preview.
    GITHUB_BASE_URL = '.';
} else {
    // Local development (http://localhost, Live Server, etc.)
    GITHUB_BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
}

let pathways = [];

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                objectStore.createIndex('name', 'name', { unique: false });
                objectStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                console.log('IndexedDB pathways store created');
            }
            // Create PT stores if they don't exist
            if (!db.objectStoreNames.contains('ptGuides')) {
                const ptStore = db.createObjectStore('ptGuides', { keyPath: 'id' });
                ptStore.createIndex('name', 'name', { unique: false });
                console.log('IndexedDB PT guides store created');
            }
            if (!db.objectStoreNames.contains('ptRecommendations')) {
                const recStore = db.createObjectStore('ptRecommendations', { keyPath: 'id' });
                recStore.createIndex('title', 'title', { unique: false });
                console.log('IndexedDB PT recommendations store created');
            }
            // Create handouts store if it doesn't exist
            if (!db.objectStoreNames.contains('handouts')) {
                const handoutsStore = db.createObjectStore('handouts', { keyPath: 'id' });
                handoutsStore.createIndex('name', 'name', { unique: false });
                console.log('IndexedDB handouts store created');
            }
        };
    });
}

async function loadPathways() {
    try {
        // Load manifest from GitHub
        const manifestUrl = `${GITHUB_BASE_URL}/documents/pathways-manifest.json`;
        console.log('Loading pathways from:', manifestUrl);
        
        const response = await fetch(manifestUrl);
        if (!response.ok) {
            throw new Error(`Failed to load pathways manifest: ${response.statusText}`);
        }
        
        const manifest = await response.json();
        await loadCustomDisplayNames(); // Load custom names from GitHub
        pathways = manifest.map((item, index) => {
            const pathway = {
                id: index,
                file: item.file,
                name: item.name,
                displayName: getDisplayName(item.file, item.name, 'pathway'),
                fileType: item.type || getFileExtension(item.name),
                url: `${GITHUB_BASE_URL}/documents/${item.file}`,
                relatedPathway: item.relatedPathway || null,
                category: item.category || 'pathway' // Default to 'pathway' for backward compatibility
            };
            
            // Handle nested pathway
            if (item.nestedPathway) {
                pathway.nestedPathway = {
                    file: item.nestedPathway.file,
                    name: item.nestedPathway.name,
                    displayName: getDisplayName(item.nestedPathway.file, item.nestedPathway.name, 'pathway'),
                    fileType: item.nestedPathway.type || getFileExtension(item.nestedPathway.name),
                    url: `${GITHUB_BASE_URL}/documents/${item.nestedPathway.file}`
                };
            }
            
            return pathway;
        });
        
        console.log('Loaded', pathways.length, 'pathways from GitHub');
        renderPathways();
        return pathways;
    } catch (error) {
        console.error('Error loading pathways:', error);
        pathways = [];
        renderPathways();
        // Show user-friendly error
        const container = document.getElementById('pathwaysList');
        if (container) {
            container.innerHTML = `
                <div class="empty-pathways">
                    <div class="empty-icon">⚠️</div>
                    <h3>Unable to Load Documents</h3>
                    <p>Could not load pathways from GitHub. Please check the repository configuration.</p>
                </div>
            `;
        }
    }
}

async function savePathway(pathway) {
    try {
        if (!db) {
            await initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(pathway);
            
            request.onsuccess = () => {
                console.log('Pathway saved to IndexedDB:', pathway.name);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Error saving pathway:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Error saving pathway:', error);
        throw error;
    }
}

async function deletePathwayFromDB(id) {
    try {
        if (!db) {
            await initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('Pathway deleted from IndexedDB');
                resolve();
            };
            
            request.onerror = () => {
                console.error('Error deleting pathway:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Error deleting pathway:', error);
        throw error;
    }
}

function renderPathways(filter = '', category = null) {
    const container = document.getElementById('pathwaysList');
    if (!container) return;
    
    // Get active category if not provided
    if (category === null) {
        const activeTab = document.querySelector(`.language-tab[data-section="pathways"].active`);
        category = activeTab ? activeTab.dataset.category : 'guide';
    }
    
    // Recalculate display names to ensure they're up to date
    pathways.forEach(pathway => {
        pathway.displayName = getDisplayName(pathway.file, pathway.name, 'pathway');
        if (pathway.nestedPathway) {
            pathway.nestedPathway.displayName = getDisplayName(pathway.nestedPathway.file, pathway.nestedPathway.name, 'pathway');
        }
    });
    
    let filteredPathways = [...pathways]; // Create a copy to avoid mutating original
    
    // Filter by category
    if (category) {
        filteredPathways = filteredPathways.filter(p => p.category === category);
    }
    
    // Apply filter if provided
    if (filter) {
        const searchLower = filter.toLowerCase();
        filteredPathways = filteredPathways.filter(p => {
            const matchesMain = (p.displayName || p.name).toLowerCase().includes(searchLower) ||
                p.name.toLowerCase().includes(searchLower) ||
                (p.description && p.description.toLowerCase().includes(searchLower));
            
            // Also check nested pathway if it exists
            if (p.nestedPathway) {
                const matchesNested = (p.nestedPathway.displayName || p.nestedPathway.name).toLowerCase().includes(searchLower) ||
                    p.nestedPathway.name.toLowerCase().includes(searchLower);
                return matchesMain || matchesNested;
            }
            
            return matchesMain;
        });
    }
    
    // Sort alphabetically by display name
    filteredPathways.sort((a, b) => {
        const nameA = (a.displayName || a.name).toLowerCase();
        const nameB = (b.displayName || b.name).toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    if (filteredPathways.length === 0 && pathways.length === 0) {
        container.innerHTML = `
            <div class="empty-pathways">
                <div class="empty-icon">📋</div>
                <h3>No Clinical Pathways Yet</h3>
                <p>Upload your first clinical pathway document to get started.</p>
                <button class="btn btn-primary" onclick="document.getElementById('pathwayFileInput').click()">
                    Upload First Pathway
                </button>
            </div>
        `;
        return;
    }
    
    if (filteredPathways.length === 0) {
        const categoryLabel = category === 'guide' ? 'Guides' : 'Clinical Pathways';
        container.innerHTML = `
            <div class="empty-pathways">
                <div class="empty-icon">🔍</div>
                <h3>No ${categoryLabel} Found</h3>
                <p>No ${categoryLabel.toLowerCase()} match your search criteria.</p>
            </div>
        `;
        return;
    }
    
    // Create list HTML
    // Add dosing calculator links if category is 'guide'
    const dosingCalculatorLinks = category === 'guide' ? `
        <div class="pathway-list-item" onclick="showDosingCalculator()">
            <div class="pathway-list-icon">💊</div>
            <div class="pathway-list-info" style="flex:1;">
                <div class="pathway-list-name">Medication Dosing Calculator</div>
                <div class="pathway-list-meta">Calculate medication dosages based on patient weight</div>
            </div>
            <div class="pathway-list-actions" onclick="event.stopPropagation()">
                <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); showDosingCalculator();">Open</button>
            </div>
        </div>
        <div class="pathway-list-item" onclick="showPediatricDosing()">
            <div class="pathway-list-icon">👶</div>
            <div class="pathway-list-info" style="flex:1;">
                <div class="pathway-list-name">Pediatric Tylenol/Motrin Dosing</div>
                <div class="pathway-list-meta">Calculate pediatric acetaminophen and ibuprofen dosages</div>
            </div>
            <div class="pathway-list-actions" onclick="event.stopPropagation()">
                <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); showPediatricDosing();">Open</button>
            </div>
        </div>
    ` : '';
    
    container.innerHTML = `
        <div class="pathway-list-container">
            ${dosingCalculatorLinks}
            ${filteredPathways.map((pathway) => {
                const fileIcon = getFileIcon(pathway.fileType);
                // Find the actual index in the original pathways array
                const actualIndex = pathways.findIndex(p => p.id === pathway.id);
                const hasNested = pathway.nestedPathway !== undefined;
                
                // For pathways with nested versions, clean up the display name
                let displayName = pathway.displayName || pathway.name;
                if (hasNested) {
                    // Clean up name like "Pediatric UTI Algorithm - Seattle Children's" to "Pediatric UTI Seattle Children's"
                    displayName = displayName
                        .replace(/\s*Algorithm\s*/gi, ' ')
                        .replace(/\s*-\s*/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
                
                // Build action buttons
                let actionButtons = '';
                let itemOnClick = '';
                if (hasNested && pathway.nestedPathway) {
                    // Show Simple and Detailed buttons instead of View
                    const simpleUrl = escapeJsString(pathway.url);
                    const simpleName = escapeJsString(displayName);
                    const detailedUrl = escapeJsString(pathway.nestedPathway.url);
                    const detailedName = escapeJsString(pathway.nestedPathway.displayName || pathway.nestedPathway.name);
                    
                    // Clicking the name opens the simple file
                    itemOnClick = `onclick="viewPathwayByUrl('${simpleUrl}', '${simpleName}');"`;
                    
                    actionButtons = `
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); viewPathwayByUrl('${simpleUrl}', '${simpleName}');">Simple</button>
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); viewPathwayByUrl('${detailedUrl}', '${detailedName}');">Detailed</button>
                        <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); downloadPathway(${actualIndex})">Download</button>
                    `;
                } else {
                    // Regular pathway with View and Download
                    itemOnClick = `onclick="viewPathway(${actualIndex})"`;
                    actionButtons = `
                        <button class="btn btn-primary btn-small" onclick="viewPathway(${actualIndex})">View</button>
                        <button class="btn btn-secondary btn-small" onclick="downloadPathway(${actualIndex})">Download</button>
                    `;
                }
                
                return `
                    <div class="pathway-list-item" ${itemOnClick}>
                        <div class="pathway-list-icon">${fileIcon}</div>
                        <div class="pathway-list-info" style="flex:1;">
                            <div class="pathway-list-name">${escapeHtml(displayName)}</div>
                        </div>
                        <div class="pathway-list-actions" onclick="event.stopPropagation()">
                            ${actionButtons}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getFileIcon(fileType) {
    if (fileType === 'pdf') return '📄';
    if (fileType === 'link') return '🔗';
    if (fileType === 'doc' || fileType === 'docx') return '📝';
    if (fileType === 'txt') return '📃';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileType)) return '🖼️';
    return '📎';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeJsString(str) {
    // Escape for use in single-quoted JavaScript strings
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

async function handleFileUpload(files) {
    if (!files || files.length === 0) {
        console.error('No files selected');
        return;
    }
    
    // Initialize DB if needed
    if (!db) {
        try {
            await initDB();
        } catch (error) {
            alert('Error initializing database: ' + error.message);
            return;
        }
    }
    
    const fileArray = Array.from(files);
    let processedCount = 0;
    let errorCount = 0;
    
    // Process files sequentially to avoid overwhelming the browser
    for (let index = 0; index < fileArray.length; index++) {
        const file = fileArray[index];
        
        // Check file size (limit to 100MB for IndexedDB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        
        if (file.size > maxSize) {
            alert(`File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is 100MB.`);
            errorCount++;
            continue;
        }
        
        try {
            // Read file as ArrayBuffer for IndexedDB (more efficient than base64)
            const arrayBuffer = await file.arrayBuffer();
            
            const pathway = {
                id: Date.now() + Math.random() + index,
                name: file.name,
                fileType: getFileExtension(file.name),
                size: file.size,
                uploadDate: new Date().toISOString(),
                data: arrayBuffer, // Store as ArrayBuffer
                mimeType: file.type
            };
            
            // Save to IndexedDB
            await savePathway(pathway);
            pathways.push(pathway);
            processedCount++;
            
            console.log(`Uploaded ${processedCount}/${fileArray.length}: ${file.name}`);
        } catch (error) {
            console.error('Error processing file:', error);
            alert(`Error uploading file "${file.name}": ${error.message}`);
            errorCount++;
        }
    }
    
    // Render and show success message
    renderPathways();
    if (processedCount > 0) {
        alert(`Successfully uploaded ${processedCount} file(s)!`);
    }
    if (errorCount > 0) {
        alert(`Failed to upload ${errorCount} file(s).`);
    }
}

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function viewPathway(index) {
    const pathway = pathways[index];
    if (!pathway) return;
    
    // Find related pathway if it exists
    let relatedPathwayIndex = -1;
    let relatedPathwayUrl = null;
    if (pathway.relatedPathway) {
        relatedPathwayIndex = pathways.findIndex(p => p.file === pathway.relatedPathway);
        if (relatedPathwayIndex !== -1) {
            relatedPathwayUrl = pathways[relatedPathwayIndex].url;
        }
    }
    
    // Open document from GitHub URL
    const newWindow = window.open();
    const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    if (imageTypes.includes(pathway.fileType)) {
        newWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(pathway.displayName || pathway.name)}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { margin: 0; background: #1a1a1e; min-height: 100vh; }
                        .img-wrap { padding: 0; box-sizing: border-box; }
                        .img-wrap img { display: block; width: 100%; max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    <div class="img-wrap">
                        <img src="${pathway.url}" alt="${escapeHtml(pathway.displayName || pathway.name)}" />
                    </div>
                </body>
            </html>
        `);
    } else if (pathway.fileType === 'pdf') {
        // For PDFs, embed directly with optional related pathway banner
        let relatedBanner = '';
        if (relatedPathwayUrl && relatedPathwayIndex !== -1) {
            const relatedName = pathways[relatedPathwayIndex].displayName || pathways[relatedPathwayIndex].name;
            relatedBanner = `
                <div style="position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;padding:12px 20px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                    <div style="flex:1;min-width:200px;">
                        <strong style="font-size:0.9em;">📋 Related Pathway Available:</strong>
                        <span style="font-size:0.85em;margin-left:8px;">${escapeHtml(relatedName)}</span>
                    </div>
                    <button onclick="window.open('${relatedPathwayUrl}', '_blank');" style="padding:8px 16px;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:6px;cursor:pointer;font-weight:600;font-size:0.9em;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)';" onmouseout="this.style.background='rgba(255,255,255,0.2)';">
                        View Detailed Pathway →
                    </button>
                </div>
            `;
        }
        const backButtonTop = relatedBanner ? '50px' : '0';
        const embedTop = relatedBanner ? '50px' : '0';
        const embedHeight = relatedBanner ? 'calc(100vh - 50px)' : '100vh';
        newWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(pathway.name)}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        .mobile-back-button {
                            display: none;
                        }
                        @media (max-width: 768px) {
                            .mobile-back-button {
                                display: block;
                                position: fixed;
                                top: ${relatedBanner ? '60px' : '10px'};
                                left: 10px;
                                z-index: 10001;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                padding: 10px 18px;
                                font-size: 0.95em;
                                font-weight: 600;
                                cursor: pointer;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                                border-radius: 8px;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                transition: all 0.2s ease;
                            }
                            .mobile-back-button:active {
                                background: linear-gradient(135deg, #5568d3 0%, #6a3d91 100%);
                                transform: scale(0.98);
                                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                            }
                            embed {
                                top: ${relatedBanner ? '50px' : '0'} !important;
                                height: ${relatedBanner ? 'calc(100vh - 50px)' : '100vh'} !important;
                            }
                        }
                    </style>
                </head>
                <body style="margin:0;padding:0;">
                    <button class="mobile-back-button" onclick="window.close();" aria-label="Go back">← Back</button>
                    ${relatedBanner}
                    <embed src="${pathway.url}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:${embedTop};left:0;width:100%;height:${embedHeight};" />
                </body>
            </html>
        `);
    } else {
        // For other files, try to display or download
        newWindow.document.write(`
            <html>
                <head><title>${escapeHtml(pathway.name)}</title></head>
                <body style="margin:20px;font-family:Arial;">
                    <h2>${escapeHtml(pathway.name)}</h2>
                    <p>This file type cannot be displayed in the browser. Please download it to view.</p>
                    <button onclick="window.location.href='${pathway.url}'" download="${escapeHtml(pathway.name)}" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;">
                        Download File
                    </button>
                </body>
            </html>
        `);
    }
}

function downloadPathway(index) {
    const pathway = pathways[index];
    if (!pathway) return;
    
    // Direct download from GitHub
    const link = document.createElement('a');
    link.href = pathway.url;
    link.download = pathway.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function toggleNestedPathway(nestedId, iconElement) {
    const nestedElement = document.getElementById(nestedId);
    if (!nestedElement) return;
    
    const isExpanded = nestedElement.style.display !== 'none';
    nestedElement.style.display = isExpanded ? 'none' : 'block';
    iconElement.textContent = isExpanded ? '▶' : '▼';
}

function viewNestedPathway(url, name) {
    viewPathwayByUrl(url, name);
}

function viewPathwayByUrl(url, name) {
    const newWindow = window.open();
    newWindow.document.write(`
        <html>
            <head>
                <title>${escapeHtml(name)}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    .mobile-back-button {
                        display: none;
                    }
                    @media (max-width: 768px) {
                        .mobile-back-button {
                            display: block;
                            position: fixed;
                            top: 10px;
                            left: 10px;
                            z-index: 10001;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            padding: 10px 18px;
                            font-size: 0.95em;
                            font-weight: 600;
                            cursor: pointer;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                            border-radius: 8px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            transition: all 0.2s ease;
                        }
                        .mobile-back-button:active {
                            background: linear-gradient(135deg, #5568d3 0%, #6a3d91 100%);
                            transform: scale(0.98);
                            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                        }
                        embed {
                            top: 0 !important;
                            height: 100vh !important;
                        }
                    }
                </style>
            </head>
            <body style="margin:0;padding:0;">
                <button class="mobile-back-button" onclick="window.close();" aria-label="Go back">← Back</button>
                <embed src="${url}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:0;left:0;width:100%;height:100vh;" />
            </body>
        </html>
    `);
}

async function renamePathway(index) {
    const pathway = pathways[index];
    if (!pathway) return;
    
    const currentName = pathway.displayName || pathway.name;
    const newName = prompt(`Rename "${currentName}" to:`, currentName);
    
    if (!newName || newName.trim() === '') {
        return; // User cancelled or entered empty name
    }
    
    const trimmedName = newName.trim();
    if (trimmedName === currentName) {
        return; // Name unchanged
    }
    
    // Update custom display name in memory
    if (!customDisplayNames.pathways) {
        customDisplayNames.pathways = {};
    }
    customDisplayNames.pathways[pathway.file] = trimmedName;
    
    // Update the pathway's display name
    pathway.displayName = trimmedName;
    
    // Show updated JSON for user to copy
    const updatedJSON = generateCustomNamesJSON();
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:white;padding:30px;border-radius:12px;max-width:600px;max-height:80vh;overflow:auto;">
            <h3 style="margin-top:0;color:#667eea;">Update custom-display-names.json</h3>
            <p>Copy this JSON and update <code>documents/custom-display-names.json</code> in your repository:</p>
            <textarea readonly style="width:100%;height:200px;font-family:monospace;font-size:12px;padding:10px;border:2px solid #ddd;border-radius:6px;">${updatedJSON}</textarea>
            <div style="margin-top:15px;display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="const textarea = this.closest('div[style*=\"position:fixed\"]').querySelector('textarea'); navigator.clipboard.writeText(textarea.value); alert('Copied to clipboard!'); this.closest('div[style*=\"position:fixed\"]').remove();" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;">Copy & Close</button>
                <button onclick="this.closest('div[style*=\"position:fixed\"]').remove();" style="padding:10px 20px;background:#718096;color:white;border:none;border-radius:6px;cursor:pointer;">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Also save to localStorage as temporary cache
    localStorage.setItem('chcCustomDisplayNames', JSON.stringify(customDisplayNames));
    
    // Re-render (preserve current search filter)
    const searchInput = document.getElementById('pathwaySearch');
    const currentFilter = searchInput ? searchInput.value : '';
    renderPathways(currentFilter);
}

async function deletePathway(index) {
    alert('To delete documents, remove them from the pathways-manifest.json file and delete the file from the documents/pathways folder in the repository.');
}


async function initializePathways() {
    await loadPathways();
    
    // Search handler
    const searchInput = document.getElementById('pathwaySearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderPathways(e.target.value);
        });
    }
}

// Switch pathway category tab
function switchPathwayCategoryTab(category) {
    // Update active tab
    const tabs = document.querySelectorAll(`.language-tab[data-section="pathways"]`);
    tabs.forEach(tab => {
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Re-render pathways with the selected category
    const searchInput = document.getElementById('pathwaySearch');
    const currentFilter = searchInput ? searchInput.value : '';
    renderPathways(currentFilter, category);
}

// Make functions available globally
window.viewPathway = viewPathway;
window.downloadPathway = downloadPathway;
window.renamePathway = renamePathway;
window.deletePathway = deletePathway;
window.switchPathwayCategoryTab = switchPathwayCategoryTab;

// ==================== Physical Therapy System ====================

const PT_STORE_NAME = 'ptGuides';
const PT_RECOMMENDATIONS_STORE = 'ptRecommendations';

let ptGuides = [];

// Store custom display names (admin-only feature)
let customDisplayNames = {
    pathways: {},
    ptGuides: {},
    handouts: {},
    forms: {}
};

// Initialize PT DB stores
function initPTDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            initDB().then(() => {
                initPTStores().then(resolve).catch(reject);
            }).catch(reject);
        } else {
            initPTStores().then(resolve).catch(reject);
        }
    });
}

function initPTStores() {
    return new Promise((resolve, reject) => {
        // Just check if stores exist - they should be created in initDB's onupgradeneeded
        // If they don't exist, we need to trigger an upgrade
        const needsPTStore = !db.objectStoreNames.contains(PT_STORE_NAME);
        const needsRecStore = !db.objectStoreNames.contains(PT_RECOMMENDATIONS_STORE);
        
        if (needsPTStore || needsRecStore) {
            // Close current connection and reopen with higher version
            const currentVersion = db.version;
            db.close();
            const newVersion = currentVersion + 1;
            const request = indexedDB.open(DB_NAME, newVersion);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (needsPTStore && !db.objectStoreNames.contains(PT_STORE_NAME)) {
                    const objectStore = db.createObjectStore(PT_STORE_NAME, { keyPath: 'id' });
                    objectStore.createIndex('name', 'name', { unique: false });
                }
                if (needsRecStore && !db.objectStoreNames.contains(PT_RECOMMENDATIONS_STORE)) {
                    const objectStore = db.createObjectStore(PT_RECOMMENDATIONS_STORE, { keyPath: 'id' });
                    objectStore.createIndex('title', 'title', { unique: false });
                }
            };
            
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            
            request.onerror = () => {
                console.error('Error upgrading DB:', request.error);
                reject(request.error);
            };
        } else {
            // Stores already exist
            resolve(db);
        }
    });
}

async function loadPTGuides() {
    try {
        // Load manifest from GitHub
        const manifestUrl = `${GITHUB_BASE_URL}/documents/pt-manifest.json`;
        console.log('Loading PT guides from:', manifestUrl);
        
        const response = await fetch(manifestUrl);
        if (!response.ok) {
            throw new Error(`Failed to load PT manifest: ${response.statusText}`);
        }
        
        const manifest = await response.json();
        await loadCustomDisplayNames(); // Load custom names from GitHub
        ptGuides = manifest.map((item, index) => {
            return {
                id: index,
                file: item.file,
                name: item.name,
                displayName: getDisplayName(item.file, item.name, 'pt'),
                fileType: item.type || getFileExtension(item.name),
                url: `${GITHUB_BASE_URL}/documents/${item.file}`
            };
        });
        
        console.log('Loaded', ptGuides.length, 'PT guides from GitHub');
        updateLanguageTabs('pt');
        const language = getActiveLanguage('pt');
        renderPTGuides('', language);
        return ptGuides;
    } catch (error) {
        console.error('Error loading PT guides:', error);
        ptGuides = [];
        updateLanguageTabs('pt');
        const language = getActiveLanguage('pt');
        renderPTGuides('', language);
    }
}

// Load custom display names from localStorage
// Load custom display names from GitHub
async function loadCustomDisplayNames() {
    try {
        const namesUrl = `${GITHUB_BASE_URL}/documents/custom-display-names.json`;
        console.log('Loading custom display names from:', namesUrl);
        const response = await fetch(namesUrl);
        
        if (response.ok) {
            const data = await response.json();
            customDisplayNames = data;
            console.log('Custom display names loaded:', customDisplayNames);
            console.log('Pathways keys:', Object.keys(customDisplayNames.pathways || {}));
    } else {
        console.warn('Custom display names file not found (status:', response.status, '), using defaults');
            if (!customDisplayNames) {
                customDisplayNames = { pathways: {}, ptGuides: {}, handouts: {} };
            }
        }
    } catch (error) {
        console.error('Error loading custom display names:', error);
        // Fallback to localStorage if GitHub load fails
        const saved = localStorage.getItem('chcCustomDisplayNames');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                customDisplayNames = parsed;
                console.log('✓ Loaded custom display names from localStorage:', customDisplayNames);
            } catch (e) {
                console.error('Error parsing localStorage custom names:', e);
                if (!customDisplayNames) {
                    customDisplayNames = { pathways: {}, ptGuides: {}, handouts: {}, forms: {} };
                }
            }
        } else {
            if (!customDisplayNames) {
                customDisplayNames = { pathways: {}, ptGuides: {}, handouts: {}, forms: {} };
            }
        }
    }
    
    // Ensure structure exists
    if (!customDisplayNames.pathways) {
        customDisplayNames.pathways = {};
    }
    if (!customDisplayNames.ptGuides) {
        customDisplayNames.ptGuides = {};
    }
    if (!customDisplayNames.handouts) {
        customDisplayNames.handouts = {};
    }
    if (!customDisplayNames.forms) {
        customDisplayNames.forms = {};
    }
}

// Get display name for a file (custom name or original)
function getDisplayName(filePath, originalName, type) {
    // filePath is like "pathways/file.pdf" or "pt-guides/file.pdf" or "handouts/file.pdf"
    let category;
    if (type === 'pathway') {
        category = 'pathways';
    } else if (type === 'pt') {
        category = 'ptGuides';
    } else if (type === 'handout') {
        category = 'handouts';
    } else if (type === 'form') {
        category = 'forms';
    } else {
        category = 'pathways'; // default
    }
    
    // Ensure customDisplayNames is initialized
    if (!customDisplayNames) {
        customDisplayNames = { pathways: {}, ptGuides: {}, handouts: {}, forms: {} };
    }
    if (!customDisplayNames[category]) {
        customDisplayNames[category] = {};
    }
    
    const customName = customDisplayNames[category][filePath];
    if (customName) {
        return customName;
    }
    return originalName;
}

// Generate updated JSON content for the custom-display-names.json file
function generateCustomNamesJSON() {
    return JSON.stringify(customDisplayNames, null, 2);
}

async function savePTGuide(guide) {
    try {
        if (!db) await initDB();
        if (!db.objectStoreNames.contains(PT_STORE_NAME)) await initPTDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PT_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PT_STORE_NAME);
            const request = store.put(guide);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        throw error;
    }
}

async function savePTRecommendation(recommendation) {
    try {
        if (!db) await initDB();
        if (!db.objectStoreNames.contains(PT_RECOMMENDATIONS_STORE)) await initPTDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PT_RECOMMENDATIONS_STORE], 'readwrite');
            const store = transaction.objectStore(PT_RECOMMENDATIONS_STORE);
            const request = store.put(recommendation);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        throw error;
    }
}

async function deletePTGuideFromDB(id) {
    try {
        if (!db) await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PT_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PT_STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        throw error;
    }
}

async function deletePTRecommendationFromDB(id) {
    try {
        if (!db) await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PT_RECOMMENDATIONS_STORE], 'readwrite');
            const store = transaction.objectStore(PT_RECOMMENDATIONS_STORE);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        throw error;
    }
}

// Language detection and grouping functions
function parseLanguageFromFileName(fileName) {
    // Remove file extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').toLowerCase();
    
    // Common language indicators
    const languagePatterns = {
        'spanish': ['spanish', 'español', 'espanol', 'esp'],
        'french': ['french', 'français', 'francais', 'fr'],
        'german': ['german', 'deutsch', 'de'],
        'chinese': ['chinese', '中文', 'ch'],
        'japanese': ['japanese', '日本語', 'ja'],
        'korean': ['korean', '한국어', 'ko'],
        'portuguese': ['portuguese', 'português', 'portugues', 'pt'],
        'italian': ['italian', 'italiano', 'it'],
        'russian': ['russian', 'русский', 'ru']
    };
    
    // Check for language indicators (using word boundaries for short patterns to avoid false matches)
    for (const [lang, patterns] of Object.entries(languagePatterns)) {
        for (const pattern of patterns) {
            // For short patterns (2-3 chars), use word boundaries to avoid false matches
            // For longer patterns, use simple includes check
            if (pattern.length <= 3) {
                const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (regex.test(nameWithoutExt)) {
                    return lang;
                }
            } else {
                if (nameWithoutExt.includes(pattern)) {
                    return lang;
                }
            }
        }
    }
    
    // Default to English if no language indicator found
    return 'english';
}

function getBaseName(fileName) {
    // Remove file extension
    let nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Remove language indicators to get base name
    const languagePatterns = [
        'spanish', 'español', 'espanol', 'esp',
        'french', 'français', 'francais', 'fr',
        'german', 'deutsch', 'de',
        'chinese', '中文', 'ch',
        'japanese', '日本語', 'ja',
        'korean', '한국어', 'ko',
        'portuguese', 'português', 'portugues', 'pt',
        'italian', 'italiano', 'it',
        'russian', 'русский', 'ru'
    ];
    
    const nameLower = nameWithoutExt.toLowerCase();
    for (const pattern of languagePatterns) {
        const regex = new RegExp(`\\s*${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
        nameWithoutExt = nameWithoutExt.replace(regex, '').trim();
    }
    
    return nameWithoutExt;
}

function groupGuidesByLanguage(guides) {
    const grouped = {};
    
    guides.forEach(guide => {
        const baseName = getBaseName(guide.name);
        const language = parseLanguageFromFileName(guide.name);
        
        if (!grouped[baseName]) {
            grouped[baseName] = {};
        }
        
        grouped[baseName][language] = guide;
    });
    
    return grouped;
}

function getLanguageDisplayName(language) {
    const displayNames = {
        'english': 'English',
        'spanish': 'Spanish',
        'french': 'French',
        'german': 'German',
        'chinese': 'Chinese',
        'japanese': 'Japanese',
        'korean': 'Korean',
        'portuguese': 'Portuguese',
        'italian': 'Italian',
        'russian': 'Russian'
    };
    return displayNames[language] || language.charAt(0).toUpperCase() + language.slice(1);
}

function renderPTGuides(filter = '', language = null) {
    const container = document.getElementById('ptList');
    if (!container) return;
    
    // Check available languages to determine if we should filter
    const availableLanguages = getAvailableLanguages('pt');
    const hasMultipleLanguages = availableLanguages.length > 1;
    
    // Get active language from tab if not provided
    if (language === null) {
        language = getActiveLanguage('pt');
    }
    
    let filteredGuides = [...ptGuides];
    
    // Filter by language only if multiple languages are available
    if (hasMultipleLanguages) {
        filteredGuides = filteredGuides.filter(g => {
            const guideLanguage = parseLanguageFromFileName(g.name);
            return guideLanguage === language;
        });
    }
    
    // Then apply search filter
    if (filter) {
        const searchLower = filter.toLowerCase();
        filteredGuides = filteredGuides.filter(g => 
            g.name.toLowerCase().includes(searchLower) ||
            (g.displayName && g.displayName.toLowerCase().includes(searchLower))
        );
    }
    
    if (filteredGuides.length === 0 && ptGuides.length === 0) {
        container.innerHTML = `
            <div class="empty-pathways">
                <div class="empty-icon">🏃</div>
                <h3>No Physical Therapy Guides Yet</h3>
                <p>Physical therapy guides are managed by administrators. Contact your administrator to add documents.</p>
            </div>
        `;
        return;
    }
    
    if (filteredGuides.length === 0) {
        container.innerHTML = `
            <div class="empty-pathways">
                <div class="empty-icon">🔍</div>
                <h3>No Guides Found</h3>
                <p>No ${getLanguageDisplayName(language)} guides match your search criteria.</p>
            </div>
        `;
        return;
    }
    
    // Sort alphabetically by display name
    filteredGuides.sort((a, b) => {
        const nameA = (a.displayName || a.name).toLowerCase();
        const nameB = (b.displayName || b.name).toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    container.innerHTML = `
        <div class="pathway-list-container">
            ${filteredGuides.map((guide) => {
                const fileIcon = getFileIcon(guide.fileType);
                const displayName = guide.displayName || guide.name;
                const actualIndex = ptGuides.findIndex(g => g.id === guide.id);
                const escapedBaseName = getBaseName(guide.name).replace(/'/g, "\\'");
                
                return `
                    <div class="pathway-list-item" onclick="viewPTGuideByLanguage('${escapedBaseName}', '${language}')">
                        <div class="pathway-list-icon">${fileIcon}</div>
                        <div class="pathway-list-info" style="flex: 1; display: flex; align-items: center; gap: 12px;">
                            <div class="pathway-list-name">${escapeHtml(displayName)}</div>
                        </div>
                        <div class="pathway-list-actions" onclick="event.stopPropagation()">
                            <button class="btn btn-primary btn-small" onclick="viewPTGuideByLanguage('${escapedBaseName}', '${language}')">View</button>
                            <button class="btn btn-secondary btn-small" onclick="downloadPTGuide(${actualIndex})">Download</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    // Update tab visibility based on available languages
    updateLanguageTabs('pt');
}


async function handlePTFileUpload(files) {
    if (!files || files.length === 0) return;
    
    if (!db) {
        try {
            await initDB();
            await initPTDB();
        } catch (error) {
            alert('Error initializing database: ' + error.message);
            return;
        }
    }
    
    const fileArray = Array.from(files);
    let processedCount = 0;
    
    for (let index = 0; index < fileArray.length; index++) {
        const file = fileArray[index];
        const maxSize = 100 * 1024 * 1024;
        
        if (file.size > maxSize) {
            alert(`File "${file.name}" is too large. Maximum size is 100MB.`);
            continue;
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const guide = {
                id: Date.now() + Math.random() + index,
                name: file.name,
                fileType: getFileExtension(file.name),
                size: file.size,
                uploadDate: new Date().toISOString(),
                data: arrayBuffer,
                mimeType: file.type
            };
            
            await savePTGuide(guide);
            ptGuides.push(guide);
            processedCount++;
        } catch (error) {
            alert(`Error uploading file "${file.name}": ${error.message}`);
        }
    }
    
    const language = getActiveLanguage('pt');
    renderPTGuides('', language);
    if (processedCount > 0) {
        alert(`Successfully uploaded ${processedCount} file(s)!`);
    }
}

function viewPTGuide(index) {
    const guide = ptGuides[index];
    if (!guide) return;
    
    // Open document from GitHub URL (defaults to English)
    openPTGuideWindow(guide);
}

function viewPTGuideByLanguage(baseName, language) {
    // Find the guide with matching base name and language
    const guide = ptGuides.find(g => {
        const guideBaseName = getBaseName(g.name);
        const guideLanguage = parseLanguageFromFileName(g.name);
        return guideBaseName === baseName && guideLanguage === language;
    });
    
    if (guide) {
        openPTGuideWindow(guide);
    }
}

function openPTGuideWindow(guide) {
    // Open document from GitHub URL
    const newWindow = window.open();
    if (guide.fileType === 'pdf') {
        newWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(guide.name)}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        .mobile-back-button {
                            display: none;
                        }
                        @media (max-width: 768px) {
                            .mobile-back-button {
                                display: block;
                                position: fixed;
                                top: 10px;
                                left: 10px;
                                z-index: 10001;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                padding: 10px 18px;
                                font-size: 0.95em;
                                font-weight: 600;
                                cursor: pointer;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                                border-radius: 8px;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                transition: all 0.2s ease;
                            }
                            .mobile-back-button:active {
                                background: linear-gradient(135deg, #5568d3 0%, #6a3d91 100%);
                                transform: scale(0.98);
                                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                            }
                            embed {
                                top: 0 !important;
                                height: 100vh !important;
                            }
                        }
                    </style>
                </head>
                <body style="margin:0;padding:0;">
                    <button class="mobile-back-button" onclick="window.close();" aria-label="Go back">← Back</button>
                    <embed src="${guide.url}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:0;left:0;width:100%;height:100vh;" />
                </body>
            </html>
        `);
    } else {
        newWindow.document.write(`
            <html>
                <head><title>${escapeHtml(guide.name)}</title></head>
                <body style="margin:20px;font-family:Arial;">
                    <h2>${escapeHtml(guide.name)}</h2>
                    <p>This file type cannot be displayed in the browser. Please download it to view.</p>
                    <button onclick="window.location.href='${guide.url}'" download="${escapeHtml(guide.name)}" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;">
                        Download File
                    </button>
                </body>
            </html>
        `);
    }
}

function downloadPTGuide(index) {
    const guide = ptGuides[index];
    if (!guide) return;
    
    // Direct download from GitHub
    const link = document.createElement('a');
    link.href = guide.url;
    link.download = guide.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function renamePTGuide(index) {
    const guide = ptGuides[index];
    if (!guide) return;
    
    const currentName = guide.displayName || guide.name;
    const newName = prompt(`Rename "${currentName}" to:`, currentName);
    
    if (!newName || newName.trim() === '') {
        return; // User cancelled or entered empty name
    }
    
    const trimmedName = newName.trim();
    if (trimmedName === currentName) {
        return; // Name unchanged
    }
    
    // Update custom display name in memory
    if (!customDisplayNames.ptGuides) {
        customDisplayNames.ptGuides = {};
    }
    customDisplayNames.ptGuides[guide.file] = trimmedName;
    
    // Update the guide's display name
    guide.displayName = trimmedName;
    
    // Show updated JSON for user to copy
    const updatedJSON = generateCustomNamesJSON();
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:white;padding:30px;border-radius:12px;max-width:600px;max-height:80vh;overflow:auto;">
            <h3 style="margin-top:0;color:#667eea;">Update custom-display-names.json</h3>
            <p>Copy this JSON and update <code>documents/custom-display-names.json</code> in your repository:</p>
            <textarea readonly style="width:100%;height:200px;font-family:monospace;font-size:12px;padding:10px;border:2px solid #ddd;border-radius:6px;">${updatedJSON}</textarea>
            <div style="margin-top:15px;display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="const textarea = this.closest('div[style*=\"position:fixed\"]').querySelector('textarea'); navigator.clipboard.writeText(textarea.value); alert('Copied to clipboard!'); this.closest('div[style*=\"position:fixed\"]').remove();" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;">Copy & Close</button>
                <button onclick="this.closest('div[style*=\"position:fixed\"]').remove();" style="padding:10px 20px;background:#718096;color:white;border:none;border-radius:6px;cursor:pointer;">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Also save to localStorage as temporary cache
    localStorage.setItem('chcCustomDisplayNames', JSON.stringify(customDisplayNames));
    
    // Re-render
    const searchInput = document.getElementById('ptSearch');
    const language = getActiveLanguage('pt');
    renderPTGuides(searchInput ? searchInput.value : '', language);
}

async function deletePTGuide(index) {
    alert('To delete documents, remove them from the pt-manifest.json file and delete the file from the documents/pt-guides folder in the repository.');
}



async function initializePT() {
    await loadPTGuides();
    
    const searchInput = document.getElementById('ptSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const language = getActiveLanguage('pt');
            renderPTGuides(e.target.value, language);
        });
    }
}

// Resource type tab switching function
function switchResourceTypeTab(section, resourceType) {
    // Update active tab
    const tabs = document.querySelectorAll(`.resource-type-tab[data-section="${section}"]`);
    tabs.forEach(tab => {
        if (tab.dataset.resourceType === resourceType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Re-render the appropriate section
    const searchInputs = {
        'pt': document.getElementById('ptSearch'),
        'handouts': document.getElementById('handoutsSearch'),
        'forms': document.getElementById('formsSearch')
    };
    
    const searchValue = searchInputs[section] ? searchInputs[section].value : '';
    
    if (section === 'handouts') {
        const language = getActiveLanguage('handouts');
        renderHandouts(searchValue, language);
    }
}

// Language tab switching function
function switchLanguageTab(section, language) {
    // Update active tab
    const tabs = document.querySelectorAll(`.language-tab[data-section="${section}"]`);
    tabs.forEach(tab => {
        if (tab.dataset.language === language) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Re-render the appropriate section
    const searchInputs = {
        'pt': document.getElementById('ptSearch'),
        'handouts': document.getElementById('handoutsSearch'),
        'forms': document.getElementById('formsSearch')
    };
    
    const searchValue = searchInputs[section] ? searchInputs[section].value : '';
    
    if (section === 'pt') {
        renderPTGuides(searchValue, language);
    } else if (section === 'handouts') {
        renderHandouts(searchValue, language);
    } else if (section === 'forms') {
        renderForms(searchValue, language);
    }
}

// Get active resource type for a section
function getActiveResourceType(section) {
    const activeTab = document.querySelector(`.resource-type-tab[data-section="${section}"].active`);
    return activeTab ? activeTab.dataset.resourceType : 'handouts';
}

// Get active language for a section
function getActiveLanguage(section) {
    const activeTab = document.querySelector(`.language-tab[data-section="${section}"].active`);
    return activeTab ? activeTab.dataset.language : 'english';
}

// Get available languages for a section
function getAvailableLanguages(section) {
    let items = [];
    if (section === 'pt') {
        items = ptGuides;
    } else if (section === 'handouts') {
        items = handouts;
    } else if (section === 'forms') {
        items = forms;
    }
    
    const languages = new Set();
    items.forEach(item => {
        const lang = parseLanguageFromFileName(item.name);
        languages.add(lang);
    });
    
    return Array.from(languages);
}

// Update tab visibility based on available languages
function updateLanguageTabs(section) {
    const tabsContainer = document.querySelector(`.language-tabs[data-section="${section}"]`);
    
    if (!tabsContainer) return;
    
    const availableLanguages = getAvailableLanguages(section);
    const hasMultipleLanguages = availableLanguages.length > 1;
    
    // Hide/show tabs container
    if (hasMultipleLanguages) {
        tabsContainer.style.display = 'flex';
        
        // Show/hide individual tabs
        const englishTab = tabsContainer.querySelector(`.language-tab[data-language="english"][data-section="${section}"]`);
        const spanishTab = tabsContainer.querySelector(`.language-tab[data-language="spanish"][data-section="${section}"]`);
        
        if (englishTab) {
            englishTab.style.display = availableLanguages.includes('english') ? 'block' : 'none';
        }
        if (spanishTab) {
            spanishTab.style.display = availableLanguages.includes('spanish') ? 'block' : 'none';
        }
        
        // Ensure at least one tab is active
        const activeTab = tabsContainer.querySelector(`.language-tab[data-section="${section}"].active`);
        if (!activeTab || (activeTab.style.display === 'none')) {
            // Find first available language tab and make it active
            const visibleTabs = Array.from(tabsContainer.querySelectorAll(`.language-tab[data-section="${section}"]`))
                .filter(tab => tab.style.display !== 'none');
            if (visibleTabs.length > 0) {
                tabsContainer.querySelectorAll(`.language-tab[data-section="${section}"]`).forEach(tab => tab.classList.remove('active'));
                visibleTabs[0].classList.add('active');
            }
        }
    } else {
        // Hide tabs container if only one language (or no languages)
        tabsContainer.style.display = 'none';
    }
}

// Make PT functions available globally
window.viewPTGuide = viewPTGuide;
window.viewPTGuideByLanguage = viewPTGuideByLanguage;
window.downloadPTGuide = downloadPTGuide;
window.renamePTGuide = renamePTGuide;
window.deletePTGuide = deletePTGuide;
window.switchLanguageTab = switchLanguageTab;
window.switchResourceTypeTab = switchResourceTypeTab;

// ==================== Vaccine Schedule Tab Switching ====================
function switchVaccineScheduleTab(scheduleType) {
    // Update active tab
    const tabs = document.querySelectorAll(`.language-tab[data-section="vaccine-schedule"]`);
    tabs.forEach(tab => {
        if (tab.dataset.language === scheduleType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Show/hide sections
    const adultCdcSection = document.getElementById('adult-cdc-vaccine-schedule-section');
    const pediatricCdcSection = document.getElementById('pediatric-cdc-vaccine-schedule-section');
    const pediatricAapSection = document.getElementById('pediatric-aap-vaccine-schedule-section');
    
    // Hide all sections first
    if (adultCdcSection) adultCdcSection.style.display = 'none';
    if (pediatricCdcSection) pediatricCdcSection.style.display = 'none';
    if (pediatricAapSection) pediatricAapSection.style.display = 'none';
    
    // Show the selected section
    if (scheduleType === 'adult-cdc') {
        if (adultCdcSection) adultCdcSection.style.display = 'block';
    } else if (scheduleType === 'pediatric-cdc') {
        if (pediatricCdcSection) pediatricCdcSection.style.display = 'block';
    } else if (scheduleType === 'pediatric-aap') {
        if (pediatricAapSection) pediatricAapSection.style.display = 'block';
    }
}

window.switchVaccineScheduleTab = switchVaccineScheduleTab;

// ==================== Patient Resources (Handouts) System ====================

const HANDOUTS_STORE_NAME = 'handouts';
let handouts = [];

// ==================== Forms System ====================

const FORMS_STORE_NAME = 'forms';
let forms = [];

// Initialize Handouts DB stores
function initHandoutsDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            initDB().then(() => {
                initHandoutsStores().then(resolve).catch(reject);
            }).catch(reject);
        } else {
            initHandoutsStores().then(resolve).catch(reject);
        }
    });
}

function initHandoutsStores() {
    return new Promise((resolve, reject) => {
        const needsHandoutsStore = !db.objectStoreNames.contains(HANDOUTS_STORE_NAME);
        
        if (needsHandoutsStore) {
            const currentVersion = db.version;
            db.close();
            const newVersion = currentVersion + 1;
            const request = indexedDB.open(DB_NAME, newVersion);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (needsHandoutsStore && !db.objectStoreNames.contains(HANDOUTS_STORE_NAME)) {
                    const objectStore = db.createObjectStore(HANDOUTS_STORE_NAME, { keyPath: 'id' });
                    objectStore.createIndex('name', 'name', { unique: false });
                    console.log('IndexedDB handouts store created');
                }
            };
            
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            
            request.onerror = () => {
                console.error('Error upgrading DB:', request.error);
                reject(request.error);
            };
        } else {
            resolve(db);
        }
    });
}

async function loadHandouts() {
    try {
        // Load manifest from GitHub
        const manifestUrl = `${GITHUB_BASE_URL}/documents/handouts-manifest.json`;
        console.log('Loading handouts from:', manifestUrl);
        
        const response = await fetch(manifestUrl);
        if (!response.ok) {
            throw new Error(`Failed to load handouts manifest: ${response.statusText}`);
        }
        
        const manifest = await response.json();
        await loadCustomDisplayNames(); // Load custom names from GitHub
        handouts = manifest.map((item, index) => {
            const fileType = item.type || getFileExtension(item.name);
            const url = item.url
                ? item.url
                : `${GITHUB_BASE_URL}/documents/${item.file}`;
            return {
                id: index,
                file: item.file,
                name: item.name,
                displayName: getDisplayName(item.file, item.name, 'handout'),
                fileType,
                url
            };
        });
        
        console.log('Loaded', handouts.length, 'handouts from GitHub');
        updateLanguageTabs('handouts');
        const language = getActiveLanguage('handouts');
        renderHandouts('', language);
        return handouts;
    } catch (error) {
        console.error('Error loading handouts:', error);
        handouts = [];
        updateLanguageTabs('handouts');
        const language = getActiveLanguage('handouts');
        renderHandouts('', language);
    }
}

async function saveHandout(handout) {
    try {
        if (!db) await initDB();
        if (!db.objectStoreNames.contains(HANDOUTS_STORE_NAME)) await initHandoutsDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([HANDOUTS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(HANDOUTS_STORE_NAME);
            const request = store.put(handout);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        throw error;
    }
}

function renderHandouts(filter = '', language = null) {
    const container = document.getElementById('handoutsList');
    if (!container) return;
    
    // Recalculate display names to ensure they're up to date
    handouts.forEach(handout => {
        handout.displayName = getDisplayName(handout.file, handout.name, 'handout');
    });
    
    // Get active resource type (handouts vs patient-education)
    const resourceType = getActiveResourceType('handouts');
    
    // Check available languages to determine if we should filter
    const availableLanguages = getAvailableLanguages('handouts');
    const hasMultipleLanguages = availableLanguages.length > 1;
    
    // Get active language from tab if not provided
    if (language === null) {
        language = getActiveLanguage('handouts');
    }
    
    let filteredHandouts = [...handouts];
    
    // Filter by resource type
    // Patient Education should only show hidradenitis education
    // Handouts should exclude hidradenitis education
    if (resourceType === 'patient-education') {
        // Only show hidradenitis education
        filteredHandouts = filteredHandouts.filter(h => {
            const name = (h.displayName || h.name).toLowerCase();
            return name.includes('hidradenitis') || name.includes('hid supp');
        });
    } else {
        // Exclude hidradenitis education from handouts
        filteredHandouts = filteredHandouts.filter(h => {
            const name = (h.displayName || h.name).toLowerCase();
            return !name.includes('hidradenitis') && !name.includes('hid supp');
        });
    }
    
    // Filter by language only if multiple languages are available
    if (hasMultipleLanguages) {
        filteredHandouts = filteredHandouts.filter(h => {
            const handoutLanguage = parseLanguageFromFileName(h.name);
            return handoutLanguage === language;
        });
    }
    
    // Apply search filter if provided
    if (filter) {
        const searchLower = filter.toLowerCase();
        filteredHandouts = filteredHandouts.filter(h => 
            (h.displayName || h.name).toLowerCase().includes(searchLower) ||
            h.name.toLowerCase().includes(searchLower)
        );
    }
    
    // Sort alphabetically by display name
    filteredHandouts.sort((a, b) => {
        const nameA = (a.displayName || a.name).toLowerCase();
        const nameB = (b.displayName || b.name).toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    if (filteredHandouts.length === 0 && handouts.length === 0) {
        container.innerHTML = `
            <div class="empty-pathways">
                <div class="empty-icon">📢</div>
                <h3>No Patient Resources Yet</h3>
                <p>Patient resources are managed by administrators. Contact your administrator to add documents.</p>
            </div>
        `;
        return;
    }
    
    if (filteredHandouts.length === 0) {
        const resourceTypeName = resourceType === 'patient-education' ? 'patient education' : 'handouts';
        container.innerHTML = `
            <div class="empty-pathways">
                <div class="empty-icon">🔍</div>
                <h3>No Resources Found</h3>
                <p>No ${getLanguageDisplayName(language)} ${resourceTypeName} match your search criteria.</p>
            </div>
        `;
        return;
    }
    
    // Create list HTML
    container.innerHTML = `
        <div class="pathway-list-container">
            ${filteredHandouts.map((handout) => {
                const fileIcon = getFileIcon(handout.fileType);
                // Find the actual index in the original handouts array
                const actualIndex = handouts.findIndex(h => h.id === handout.id);
                const displayName = handout.displayName || handout.name;
                const downloadBtn =
                    handout.fileType === 'link'
                        ? ''
                        : `<button class="btn btn-secondary btn-small" onclick="downloadHandout(${actualIndex})">Download</button>`;
                return `
                    <div class="pathway-list-item" onclick="viewHandout(${actualIndex})">
                        <div class="pathway-list-icon">${fileIcon}</div>
                        <div class="pathway-list-info">
                            <div class="pathway-list-name">${escapeHtml(displayName)}</div>
                        </div>
                        <div class="pathway-list-actions" onclick="event.stopPropagation()">
                            <button class="btn btn-primary btn-small" onclick="viewHandout(${actualIndex})">View</button>
                            ${downloadBtn}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    // Update tab visibility based on available languages
    updateLanguageTabs('handouts');
}

function viewHandout(index) {
    const handout = handouts[index];
    if (!handout) return;

    if (handout.fileType === 'link') {
        window.open(handout.url, '_blank', 'noopener,noreferrer');
        return;
    }

    // Open document from GitHub URL
    const newWindow = window.open();
    if (handout.fileType === 'pdf') {
        // For PDFs, embed directly
        newWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(handout.name)}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        .mobile-back-button {
                            display: none;
                        }
                        @media (max-width: 768px) {
                            .mobile-back-button {
                                display: block;
                                position: fixed;
                                top: 10px;
                                left: 10px;
                                z-index: 10001;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                padding: 10px 18px;
                                font-size: 0.95em;
                                font-weight: 600;
                                cursor: pointer;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                                border-radius: 8px;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                transition: all 0.2s ease;
                            }
                            .mobile-back-button:active {
                                background: linear-gradient(135deg, #5568d3 0%, #6a3d91 100%);
                                transform: scale(0.98);
                                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                            }
                            embed {
                                top: 0 !important;
                                height: 100vh !important;
                            }
                        }
                    </style>
                </head>
                <body style="margin:0;padding:0;">
                    <button class="mobile-back-button" onclick="window.close();" aria-label="Go back">← Back</button>
                    <embed src="${handout.url}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:0;left:0;width:100%;height:100vh;" />
                </body>
            </html>
        `);
    } else {
        // For other files, try to display or download
        newWindow.document.write(`
            <html>
                <head><title>${escapeHtml(handout.name)}</title></head>
                <body style="margin:20px;font-family:Arial;">
                    <h2>${escapeHtml(handout.name)}</h2>
                    <p>This file type cannot be displayed in the browser. Please download it to view.</p>
                    <button onclick="window.location.href='${handout.url}'" download="${escapeHtml(handout.name)}" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;">
                        Download File
                    </button>
                </body>
            </html>
        `);
    }
}

function downloadHandout(index) {
    const handout = handouts[index];
    if (!handout) return;

    if (handout.fileType === 'link') {
        return;
    }

    // Direct download from GitHub
    const link = document.createElement('a');
    link.href = handout.url;
    link.download = handout.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function renameHandout(index) {
    const handout = handouts[index];
    if (!handout) return;
    
    const currentName = handout.displayName || handout.name;
    const newName = prompt(`Rename "${currentName}" to:`, currentName);
    
    if (!newName || newName.trim() === '') {
        return; // User cancelled or entered empty name
    }
    
    const trimmedName = newName.trim();
    if (trimmedName === currentName) {
        return; // Name unchanged
    }
    
    // Update custom display name in memory
    if (!customDisplayNames.handouts) {
        customDisplayNames.handouts = {};
    }
    customDisplayNames.handouts[handout.file] = trimmedName;
    
    // Update the handout's display name
    handout.displayName = trimmedName;
    
    // Show updated JSON for user to copy
    const updatedJSON = generateCustomNamesJSON();
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:white;padding:30px;border-radius:12px;max-width:600px;max-height:80vh;overflow:auto;">
            <h3 style="margin-top:0;color:#667eea;">Update custom-display-names.json</h3>
            <p>Copy this JSON and update <code>documents/custom-display-names.json</code> in your repository:</p>
            <textarea readonly style="width:100%;height:200px;font-family:monospace;font-size:12px;padding:10px;border:2px solid #ddd;border-radius:6px;">${updatedJSON}</textarea>
            <div style="margin-top:15px;display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="const textarea = this.closest('div[style*=\"position:fixed\"]').querySelector('textarea'); navigator.clipboard.writeText(textarea.value); alert('Copied to clipboard!'); this.closest('div[style*=\"position:fixed\"]').remove();" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;">Copy & Close</button>
                <button onclick="this.closest('div[style*=\"position:fixed\"]').remove();" style="padding:10px 20px;background:#718096;color:white;border:none;border-radius:6px;cursor:pointer;">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Also save to localStorage as temporary cache
    localStorage.setItem('chcCustomDisplayNames', JSON.stringify(customDisplayNames));
    
    // Re-render (preserve current search filter)
    const searchInput = document.getElementById('handoutsSearch');
    const currentFilter = searchInput ? searchInput.value : '';
    const language = getActiveLanguage('handouts');
    renderHandouts(currentFilter, language);
}

async function deleteHandout(index) {
    alert('To delete documents, remove them from the handouts-manifest.json file and delete the file from the documents/handouts folder in the repository.');
}

async function initializeHandouts() {
    await loadHandouts();
    
    const searchInput = document.getElementById('handoutsSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const language = getActiveLanguage('handouts');
            renderHandouts(e.target.value, language);
        });
    }
}

// Make handouts functions available globally
window.viewHandout = viewHandout;
window.downloadHandout = downloadHandout;
window.renameHandout = renameHandout;
window.deleteHandout = deleteHandout;

// ==================== Forms System ====================

async function loadForms() {
    try {
        // Load manifest from GitHub
        const manifestUrl = `${GITHUB_BASE_URL}/documents/forms-manifest.json`;
        console.log('Loading forms from:', manifestUrl);
        
        const response = await fetch(manifestUrl);
        if (!response.ok) {
            throw new Error(`Failed to load forms manifest: ${response.statusText}`);
        }
        
        const manifest = await response.json();
        await loadCustomDisplayNames(); // Load custom names from GitHub
        forms = manifest.map((item, index) => {
            return {
                id: index,
                file: item.file,
                name: item.name,
                displayName: getDisplayName(item.file, item.name, 'form'),
                fileType: item.type || getFileExtension(item.name),
                url: `${GITHUB_BASE_URL}/documents/${item.file}`
            };
        });
        
        console.log('Loaded', forms.length, 'forms from GitHub');
        updateLanguageTabs('forms');
        const language = getActiveLanguage('forms');
        renderForms('', language);
        return forms;
    } catch (error) {
        console.error('Error loading forms:', error);
        forms = [];
        updateLanguageTabs('forms');
        const language = getActiveLanguage('forms');
        renderForms('', language);
    }
}

function renderForms(filter = '', language = null) {
    const container = document.getElementById('formsList');
    if (!container) return;
    
    // Recalculate display names to ensure they're up to date
    forms.forEach(form => {
        form.displayName = getDisplayName(form.file, form.name, 'form');
    });
    
    // Check available languages to determine if we should filter
    const availableLanguages = getAvailableLanguages('forms');
    const hasMultipleLanguages = availableLanguages.length > 1;
    
    // Get active language from tab if not provided
    if (language === null) {
        language = getActiveLanguage('forms');
    }
    
    let filteredForms = [...forms];
    
    // Filter by language only if multiple languages are available
    if (hasMultipleLanguages) {
        filteredForms = filteredForms.filter(f => {
            const formLanguage = parseLanguageFromFileName(f.name);
            return formLanguage === language;
        });
    }
    
    // Apply search filter if provided
    if (filter) {
        const searchLower = filter.toLowerCase();
        filteredForms = filteredForms.filter(f => 
            (f.displayName || f.name).toLowerCase().includes(searchLower) ||
            f.name.toLowerCase().includes(searchLower)
        );
    }
    
    if (filteredForms.length === 0 && forms.length === 0) {
        container.innerHTML = `
            <div class="empty-pathways">
                <div class="empty-icon">📝</div>
                <h3>No Forms Yet</h3>
                <p>Forms are managed by administrators. Contact your administrator to add documents.</p>
            </div>
        `;
        return;
    }
    
    if (filteredForms.length === 0) {
        container.innerHTML = `
            <div class="empty-pathways">
                <div class="empty-icon">🔍</div>
                <h3>No Forms Found</h3>
                <p>No ${getLanguageDisplayName(language)} forms match your search criteria.</p>
            </div>
        `;
        return;
    }
    
    // Sort alphabetically by display name
    filteredForms.sort((a, b) => {
        const nameA = (a.displayName || a.name).toLowerCase();
        const nameB = (b.displayName || b.name).toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    container.innerHTML = `
        <div class="pathway-list-container">
            ${filteredForms.map((form) => {
                const fileIcon = getFileIcon(form.fileType);
                const displayName = form.displayName || form.name;
                const actualIndex = forms.findIndex(f => f.id === form.id);
                const escapedBaseName = getBaseName(form.name).replace(/'/g, "\\'");
                
                return `
                    <div class="pathway-list-item" onclick="viewFormByLanguage('${escapedBaseName}', '${language}')">
                        <div class="pathway-list-icon">${fileIcon}</div>
                        <div class="pathway-list-info" style="flex: 1; display: flex; align-items: center; gap: 12px;">
                            <div class="pathway-list-name">${escapeHtml(displayName)}</div>
                        </div>
                        <div class="pathway-list-actions" onclick="event.stopPropagation()">
                            <button class="btn btn-primary btn-small" onclick="viewFormByLanguage('${escapedBaseName}', '${language}')">View</button>
                            <button class="btn btn-secondary btn-small" onclick="downloadForm(${actualIndex})">Download</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    // Update tab visibility based on available languages
    updateLanguageTabs('forms');
}

function viewForm(index) {
    const form = forms[index];
    if (!form) return;
    
    // Open document from GitHub URL (defaults to English)
    openFormWindow(form);
}

function viewFormByLanguage(baseName, language) {
    // Find the form with matching base name and language
    const form = forms.find(f => {
        const formBaseName = getBaseName(f.name);
        const formLanguage = parseLanguageFromFileName(f.name);
        return formBaseName === baseName && formLanguage === language;
    });
    
    if (form) {
        openFormWindow(form);
    }
}

function openFormWindow(form) {
    // Open document from GitHub URL
    const newWindow = window.open();
    if (form.fileType === 'html') {
        // For HTML forms (like excuse letter), open directly
        // Provider data will be loaded from localStorage in the new window
        // (works if same origin) or from window.opener if available
        newWindow.location.href = form.url;
    } else if (form.fileType === 'pdf') {
        // For PDFs, embed directly
        newWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(form.name)}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        .mobile-back-button {
                            display: none;
                        }
                        @media (max-width: 768px) {
                            .mobile-back-button {
                                display: block;
                                position: fixed;
                                top: 10px;
                                left: 10px;
                                z-index: 10001;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                padding: 10px 18px;
                                font-size: 0.95em;
                                font-weight: 600;
                                cursor: pointer;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                                border-radius: 8px;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                transition: all 0.2s ease;
                            }
                            .mobile-back-button:active {
                                background: linear-gradient(135deg, #5568d3 0%, #6a3d91 100%);
                                transform: scale(0.98);
                                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                            }
                            embed {
                                top: 0 !important;
                                height: 100vh !important;
                            }
                        }
                    </style>
                </head>
                <body style="margin:0;padding:0;">
                    <button class="mobile-back-button" onclick="window.close();" aria-label="Go back">← Back</button>
                    <embed src="${form.url}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:0;left:0;width:100%;height:100vh;" />
                </body>
            </html>
        `);
    } else {
        // For other files, try to display or download
        newWindow.document.write(`
            <html>
                <head><title>${escapeHtml(form.name)}</title></head>
                <body style="margin:20px;font-family:Arial;">
                    <h2>${escapeHtml(form.name)}</h2>
                    <p>This file type cannot be displayed in the browser. Please download it to view.</p>
                    <button onclick="window.location.href='${form.url}'" download="${escapeHtml(form.name)}" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;">
                        Download File
                    </button>
                </body>
            </html>
        `);
    }
}

function downloadForm(index) {
    const form = forms[index];
    if (!form) return;
    
    // Direct download from GitHub
    const link = document.createElement('a');
    link.href = form.url;
    link.download = form.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function renameForm(index) {
    const form = forms[index];
    if (!form) return;
    
    const currentName = form.displayName || form.name;
    const newName = prompt(`Rename "${currentName}" to:`, currentName);
    
    if (!newName || newName.trim() === '') {
        return; // User cancelled or entered empty name
    }
    
    const trimmedName = newName.trim();
    if (trimmedName === currentName) {
        return; // Name unchanged
    }
    
    // Update custom display name in memory
    if (!customDisplayNames.forms) {
        customDisplayNames.forms = {};
    }
    customDisplayNames.forms[form.file] = trimmedName;
    
    // Update the form's display name
    form.displayName = trimmedName;
    
    // Show updated JSON for user to copy
    const updatedJSON = generateCustomNamesJSON();
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:white;padding:30px;border-radius:12px;max-width:600px;max-height:80vh;overflow:auto;">
            <h3 style="margin-top:0;color:#667eea;">Update custom-display-names.json</h3>
            <p>Copy this JSON and update <code>documents/custom-display-names.json</code> in your repository:</p>
            <textarea readonly style="width:100%;height:200px;font-family:monospace;font-size:12px;padding:10px;border:2px solid #ddd;border-radius:6px;">${updatedJSON}</textarea>
            <div style="margin-top:15px;display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="const textarea = this.closest('div[style*=\"position:fixed\"]').querySelector('textarea'); navigator.clipboard.writeText(textarea.value); alert('Copied to clipboard!'); this.closest('div[style*=\"position:fixed\"]').remove();" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;">Copy & Close</button>
                <button onclick="this.closest('div[style*=\"position:fixed\"]').remove();" style="padding:10px 20px;background:#718096;color:white;border:none;border-radius:6px;cursor:pointer;">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Also save to localStorage as temporary cache
    localStorage.setItem('chcCustomDisplayNames', JSON.stringify(customDisplayNames));
    
    // Re-render (preserve current search filter)
    const searchInput = document.getElementById('formsSearch');
    const currentFilter = searchInput ? searchInput.value : '';
    const language = getActiveLanguage('forms');
    renderForms(currentFilter, language);
}

async function deleteForm(index) {
    alert('To delete documents, remove them from the forms-manifest.json file and delete the file from the documents/handouts folder in the repository.');
}

async function initializeForms() {
    await loadForms();
    
    const searchInput = document.getElementById('formsSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const language = getActiveLanguage('forms');
            renderForms(e.target.value, language);
        });
    }
}

// Make forms functions available globally
window.viewForm = viewForm;
window.viewFormByLanguage = viewFormByLanguage;
window.downloadForm = downloadForm;
window.renameForm = renameForm;
window.deleteForm = deleteForm;

// Expose providers and BASE_PROVIDERS for excuse letter and other forms
// Use Object.defineProperty to create a getter that always returns current providers
Object.defineProperty(window, 'providers', {
    get: function() { return providers; },
    enumerable: true,
    configurable: true
});
window.BASE_PROVIDERS = BASE_PROVIDERS;

// ==================== Dosing Calculator ====================

function showDosingCalculator() {
    // Navigate to dosing calculator page
    navigateToPage('dosing-calculator');
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768 && closeSidebar) {
        closeSidebar();
    }
}

function goBackToPathways() {
    // Navigate to pathways page
    navigateToPage('pathways');
    
    // Switch to the Guides tab
    if (typeof switchPathwayCategoryTab === 'function') {
        switchPathwayCategoryTab('guide');
    }
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768 && closeSidebar) {
        closeSidebar();
    }
}

// Make goBackToPathways available globally
window.goBackToPathways = goBackToPathways;

function initializeDosingCalculator() {
    const weightInput = document.getElementById('patientWeight');
    const weightUnitKg = document.getElementById('weightUnitKg');
    const weightUnitLbs = document.getElementById('weightUnitLbs');
    const dosePerKgInput = document.getElementById('dosePerKg');
    const doseUnitDay = document.getElementById('doseUnitDay');
    const doseUnitDose = document.getElementById('doseUnitDose');
    const doseUnitDisplay = document.getElementById('doseUnitDisplay');
    const doseUnitSelector = document.querySelector('.dose-unit-selector');
    const concentrationInput = document.getElementById('medicationConcentration');
    const frequencyInput = document.getElementById('dosingFrequency');
    const resultBox = document.getElementById('dosingResult');
    const resultValue = document.getElementById('dosingResultValue');
    const resultBreakdown = document.getElementById('dosingBreakdown');
    const dosingMainResult = document.getElementById('dosingMainResult');
    const maxDoseTypeNone = document.getElementById('maxDoseTypeNone');
    const maxDoseTypeDaily = document.getElementById('maxDoseTypeDaily');
    const maxDoseTypePerDose = document.getElementById('maxDoseTypePerDose');
    const maxDoseInputContainer = document.getElementById('maxDoseInputContainer');
    const maxDoseValue = document.getElementById('maxDoseValue');
    const prescriptionDaysInput = document.getElementById('prescriptionDays');
    
    function getFrequencyLabel(hours) {
        const labels = {
            1: 'Every hour (Q1H)',
            2: 'Every 2 hours (Q2H)',
            4: 'Every 4 hours (Q4H)',
            6: 'Every 6 hours (Q6H)',
            8: 'Every 8 hours (Q8H)',
            12: 'Every 12 hours (Q12H)',
            24: 'Daily (Q24H)',
            48: 'Every 48 hours (Q48H)'
        };
        return labels[hours] || `Every ${hours} hours`;
    }
    
    function getPrescriptionFrequency(hours) {
        const dosesPerDay = 24 / hours;
        if (dosesPerDay === 1) return 'once daily';
        if (dosesPerDay === 2) return 'twice daily';
        if (dosesPerDay === 3) return 'three times daily';
        if (dosesPerDay === 4) return 'four times daily';
        if (dosesPerDay === 6) return 'six times daily';
        if (dosesPerDay === 12) return 'twelve times daily';
        if (dosesPerDay === 24) return 'every hour';
        // For other frequencies, use the original format
        return getFrequencyLabel(hours).toLowerCase();
    }
    
    function parseConcentration(inputValue) {
        if (!inputValue || inputValue.trim() === '') return null;
        
        const value = inputValue.trim();
        
        // Check if it contains a slash (ratio format like "100/5" or "100mg/5mL")
        if (value.includes('/')) {
            // Extract numbers from the ratio (handles formats like "100/5", "100mg/5mL", "100/5mL")
            const parts = value.split('/');
            if (parts.length === 2) {
                // Extract first number (numerator)
                const numeratorMatch = parts[0].match(/(\d+\.?\d*)/);
                // Extract second number (denominator)
                const denominatorMatch = parts[1].match(/(\d+\.?\d*)/);
                
                if (numeratorMatch && denominatorMatch) {
                    const numerator = parseFloat(numeratorMatch[1]);
                    const denominator = parseFloat(denominatorMatch[1]);
                    if (denominator > 0) {
                        return numerator / denominator;
                    }
                }
            }
            return null;
        }
        
        // Try to parse as direct number
        const directValue = parseFloat(value);
        if (!isNaN(directValue) && directValue > 0) {
            return directValue;
        }
        
        return null;
    }
    
    function parseDoseRange(inputValue) {
        if (!inputValue || inputValue.trim() === '') return null;
        
        const value = inputValue.trim();
        
        // Check if it's a range (contains dash, hyphen, or "to")
        const rangeMatch = value.match(/(\d+\.?\d*)\s*[-–—to]\s*(\d+\.?\d*)/i);
        if (rangeMatch) {
            const min = parseFloat(rangeMatch[1]);
            const max = parseFloat(rangeMatch[2]);
            if (!isNaN(min) && !isNaN(max) && min > 0 && max > 0 && min <= max) {
                return { min, max, isRange: true };
            }
        }
        
        // Try to parse as single value
        const singleValue = parseFloat(value);
        if (!isNaN(singleValue) && singleValue > 0) {
            return { min: singleValue, max: singleValue, isRange: false };
        }
        
        return null;
    }
    
    function calculateOptimizedDose(minMg, maxMg, concentration, frequencyHours) {
        // Calculate middle of range - keep unrounded for all calculations
        const middleMg = (minMg + maxMg) / 2;
        
        if (concentration && concentration > 0) {
            // For liquid: prioritize whole numbers, then 0.5 increments
            // Keep unrounded values for all calculations
            const minMl = minMg / concentration;
            const maxMl = maxMg / concentration;
            const middleMl = middleMg / concentration;
            
            // First, try to find a whole number near the middle that's within range
            const wholeNumberMl = Math.round(middleMl);
            const wholeNumberMg = wholeNumberMl * concentration;
            
            if (wholeNumberMg >= minMg && wholeNumberMg <= maxMg) {
                // Whole number works! Return it (rounding happens only at display)
                return { ml: wholeNumberMl, mg: wholeNumberMg, mlUnrounded: middleMl, mgUnrounded: middleMg };
            }
            
            // If whole number doesn't work, try the next closest whole numbers
            const lowerWhole = Math.floor(middleMl);
            const upperWhole = Math.ceil(middleMl);
            
            // Check if lower whole number is in range
            const lowerWholeMg = lowerWhole * concentration;
            if (lowerWholeMg >= minMg && lowerWholeMg <= maxMg) {
                return { ml: lowerWhole, mg: lowerWholeMg, mlUnrounded: middleMl, mgUnrounded: middleMg };
            }
            
            // Check if upper whole number is in range
            const upperWholeMg = upperWhole * concentration;
            if (upperWholeMg >= minMg && upperWholeMg <= maxMg) {
                return { ml: upperWhole, mg: upperWholeMg, mlUnrounded: middleMl, mgUnrounded: middleMg };
            }
            
            // No whole number works, fall back to 0.5 increments
            const roundedMl = Math.round(middleMl * 2) / 2; // Round to nearest 0.5
            const optimizedMg = roundedMl * concentration;
            
            // Ensure it's within range
            if (optimizedMg < minMg) {
                // Round up to nearest 0.5 that's at least min
                const roundedMinMl = Math.ceil(minMl * 2) / 2;
                return { ml: roundedMinMl, mg: roundedMinMl * concentration, mlUnrounded: middleMl, mgUnrounded: middleMg };
            } else if (optimizedMg > maxMg) {
                // Round down to nearest 0.5 that's at most max
                const roundedMaxMl = Math.floor(maxMl * 2) / 2;
                return { ml: roundedMaxMl, mg: roundedMaxMl * concentration, mlUnrounded: middleMl, mgUnrounded: middleMg };
            } else {
                return { ml: roundedMl, mg: optimizedMg, mlUnrounded: middleMl, mgUnrounded: middleMg };
            }
        } else {
            // For mg: round to nearest whole number for display selection
            const roundedMg = Math.round(middleMg);
            
            // Ensure it's within range
            if (roundedMg < minMg) {
                return { ml: null, mg: Math.ceil(minMg), mgUnrounded: middleMg };
            } else if (roundedMg > maxMg) {
                return { ml: null, mg: Math.floor(maxMg), mgUnrounded: middleMg };
            } else {
                return { ml: null, mg: roundedMg, mgUnrounded: middleMg };
            }
        }
    }
    
    function calculateDose() {
        const weightInputValue = parseFloat(weightInput.value);
        const weightUnit = weightUnitKg && weightUnitKg.checked ? 'kg' : 'lbs';
        const doseRange = parseDoseRange(dosePerKgInput.value);
        const concentration = parseConcentration(concentrationInput.value);
        const frequencyHours = frequencyInput ? parseFloat(frequencyInput.value) : null;
        const doseUnit = doseUnitDay && doseUnitDay.checked ? 'day' : 'dose';
        
        // Get max dose settings
        const maxDoseType = maxDoseTypeNone && maxDoseTypeNone.checked ? 'none' :
                           (maxDoseTypeDaily && maxDoseTypeDaily.checked ? 'daily' :
                           (maxDoseTypePerDose && maxDoseTypePerDose.checked ? 'perDose' : 'none'));
        const maxDoseValueInput = maxDoseValue ? parseFloat(maxDoseValue.value) : null;
        const maxDoseMg = (!isNaN(maxDoseValueInput) && maxDoseValueInput > 0) ? maxDoseValueInput : null;
        
        // Get prescription days
        const prescriptionDays = prescriptionDaysInput ? parseFloat(prescriptionDaysInput.value) : null;
        const hasPrescriptionDays = !isNaN(prescriptionDays) && prescriptionDays > 0;
        
        // Only require weight and dose per kg (concentration is optional)
        if (!weightInputValue || !doseRange || weightInputValue <= 0 || doseRange.min <= 0) {
            resultBox.style.display = 'none';
            return;
        }
        
        // Convert weight to kg if needed (1 kg = 2.20462 lbs)
        const weightInKg = weightUnit === 'lbs' ? weightInputValue / 2.20462 : weightInputValue;
        
        // Calculate doses based on whether input is per day or per dose
        let dailyTotalMinMg, dailyTotalMaxMg;
        let perDoseMinMg = null, perDoseMaxMg = null;
        
        if (doseUnit === 'day') {
            // Input is mg/kg/day - calculate daily total first
            dailyTotalMinMg = weightInKg * doseRange.min;
            dailyTotalMaxMg = weightInKg * doseRange.max;
        } else {
            // Input is mg/kg/dose - calculate per dose first
            perDoseMinMg = weightInKg * doseRange.min;
            perDoseMaxMg = weightInKg * doseRange.max;
            
            // Calculate daily total from per dose (need frequency)
            if (frequencyHours && frequencyHours > 0) {
                const dosesPerDay = 24 / frequencyHours;
                dailyTotalMinMg = perDoseMinMg * dosesPerDay;
                dailyTotalMaxMg = perDoseMaxMg * dosesPerDay;
            } else {
                // No frequency specified, can't calculate daily total
                // Set daily total same as per dose for now (will be handled in display logic)
                dailyTotalMinMg = perDoseMinMg;
                dailyTotalMaxMg = perDoseMaxMg;
            }
        }
        
        // Apply max daily limit if specified
        let maxDailyLimitApplied = false;
        if (maxDoseType === 'daily' && maxDoseMg !== null) {
            if (dailyTotalMinMg > maxDoseMg) {
                dailyTotalMinMg = maxDoseMg;
                maxDailyLimitApplied = true;
            }
            if (dailyTotalMaxMg > maxDoseMg) {
                dailyTotalMaxMg = maxDoseMg;
                maxDailyLimitApplied = true;
            }
        }
        
        // Calculate per dose if frequency is provided (or if input is already per dose)
        let perDoseMinMl = null;
        let perDoseMaxMl = null;
        let optimizedDose = null;
        let maxPerDoseLimitApplied = false;
        
        // If input is per day, we need to calculate per dose from daily total
        // If input is per dose, we already have perDoseMinMg and perDoseMaxMg
        if (doseUnit === 'day' && frequencyHours && frequencyHours > 0) {
            const dosesPerDay = 24 / frequencyHours;
            perDoseMinMg = dailyTotalMinMg / dosesPerDay;
            perDoseMaxMg = dailyTotalMaxMg / dosesPerDay;
        }
        // If doseUnit === 'dose', perDoseMinMg and perDoseMaxMg are already set above
        
        if (perDoseMinMg !== null && perDoseMaxMg !== null) {
            const dosesPerDay = frequencyHours && frequencyHours > 0 ? 24 / frequencyHours : 1;
            
            // Apply max per dose limit if specified
            if (maxDoseType === 'perDose' && maxDoseMg !== null) {
                if (perDoseMinMg > maxDoseMg) {
                    perDoseMinMg = maxDoseMg;
                    maxPerDoseLimitApplied = true;
                }
                if (perDoseMaxMg > maxDoseMg) {
                    perDoseMaxMg = maxDoseMg;
                    maxPerDoseLimitApplied = true;
                }
                // Recalculate daily totals based on capped per dose
                dailyTotalMinMg = perDoseMinMg * dosesPerDay;
                dailyTotalMaxMg = perDoseMaxMg * dosesPerDay;
            }
            
            if (concentration && concentration > 0) {
                perDoseMinMl = perDoseMinMg / concentration;
                perDoseMaxMl = perDoseMaxMg / concentration;
                
                // Calculate optimized dose
                optimizedDose = calculateOptimizedDose(perDoseMinMg, perDoseMaxMg, concentration, frequencyHours);
            } else {
                // Calculate optimized dose for mg only
                optimizedDose = calculateOptimizedDose(perDoseMinMg, perDoseMaxMg, null, frequencyHours);
            }
        }
        
        // Helper function to add limit note to breakdown
        function addLimitNote(html) {
            if (maxDailyLimitApplied && maxDoseType === 'daily') {
                html += `<div class="breakdown-card" style="background: rgba(255, 193, 7, 0.15); border-color: rgba(255, 193, 7, 0.4);">
                    <div class="breakdown-card-title">⚠️ Limit Applied</div>
                    <div class="breakdown-card-content" style="font-style: italic;">Limited by max daily dose: ${maxDoseMg} mg/day</div>
                </div>`;
            } else if (maxPerDoseLimitApplied && maxDoseType === 'perDose') {
                html += `<div class="breakdown-card" style="background: rgba(255, 193, 7, 0.15); border-color: rgba(255, 193, 7, 0.4);">
                    <div class="breakdown-card-title">⚠️ Limit Applied</div>
                    <div class="breakdown-card-content" style="font-style: italic;">Limited by max per dose: ${maxDoseMg} mg</div>
                </div>`;
            }
            return html;
        }
        
        // Helper function to generate prescription script and bottle size
        function addPrescriptionScript(html, doseMl, frequencyText, days, minMl = null, maxMl = null) {
            if (!hasPrescriptionDays || !concentration || doseMl === null) {
                return html;
            }
            
            // Format the dose for the script (round to 1 decimal if needed, otherwise whole number)
            // Use the formatted value for calculations to match what's displayed
            let doseMlFormatted;
            if (doseMl % 1 === 0) {
                doseMlFormatted = Math.round(doseMl);
            } else {
                // Round to 1 decimal place: multiply by 10, round, divide by 10
                doseMlFormatted = Math.round(doseMl * 10) / 10;
            }
            
            // Calculate total mL needed using the formatted dose value
            let dosesPerDay = 1; // Default for daily dosing
            if (frequencyHours && frequencyHours > 0) {
                dosesPerDay = 24 / frequencyHours;
            }
            const totalMl = doseMlFormatted * dosesPerDay * days;
            
            // Generate prescription script - format display properly
            const scriptDoseDisplay = doseMlFormatted % 1 === 0 ? Math.round(doseMlFormatted).toString() : doseMlFormatted.toFixed(1);
            const minDisplay = minMl !== null ? minMl.toFixed(1) : '';
            const maxDisplay = maxMl !== null ? maxMl.toFixed(1) : '';
            const rangeInfo = minMl !== null && maxMl !== null ? ` data-min="${minMl}" data-max="${maxMl}"` : '';
            
            html += `<div class="breakdown-card">
                <div class="breakdown-card-title">Prescription Script</div>
                <div class="breakdown-card-content" style="font-size: 1.05em; letter-spacing: 0.3px;">Take <input type="text" class="editable-dose-input" value="${scriptDoseDisplay}" data-original="${doseMlFormatted}"${rangeInfo} style="width: 45px; text-align: center; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 2px 4px; color: white; font-size: 1em; font-weight: 600; margin: 0 4px;" /> mL by mouth ${frequencyText} x ${Math.round(days)} ${days === 1 ? 'day' : 'days'}</div>
                <div class="breakdown-card-content" style="margin-top: 8px; font-size: 0.9em; opacity: 0.85; font-weight: 500;">Bottle Size: <span class="bottle-size-value">${totalMl.toFixed(1)}</span> mL</div>
            </div>`;
            
            return html;
        }
        
        // Build prescription-like output
        let resultText = '';
        let breakdownHTML = '';
        
        // Check if limit was applied and values are now equal (treat range as single value)
        const limitApplied = maxDailyLimitApplied || maxPerDoseLimitApplied;
        let treatAsSingleValue = false;
        let treatDailyAsSingle = false;
        
        if (limitApplied && doseRange.isRange) {
            if (frequencyHours && perDoseMinMg !== null && perDoseMaxMg !== null) {
                // Check if per dose values are equal (within 0.01 mg tolerance)
                treatAsSingleValue = Math.abs(perDoseMinMg - perDoseMaxMg) < 0.01;
            } else if (!frequencyHours) {
                // Check if daily values are equal (within 0.01 mg tolerance)
                treatDailyAsSingle = Math.abs(dailyTotalMinMg - dailyTotalMaxMg) < 0.01;
            }
        }
        
        if (frequencyHours && perDoseMinMg !== null) {
            const frequencyText = getPrescriptionFrequency(frequencyHours);
            
            if (doseRange.isRange && !treatAsSingleValue) {
                // Show range with optimized dose
                if (perDoseMinMl !== null) {
                    // Liquid with range
                    if (optimizedDose && optimizedDose.ml !== null) {
                        resultText = `${optimizedDose.ml.toFixed(1)} mL ${frequencyText}`;
                        breakdownHTML = `
                            <div class="breakdown-card" style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3);">
                                <div class="breakdown-card-title" style="font-size: 1.1em; font-weight: 700; margin-bottom: 8px;">Recommended Dose</div>
                                <div class="breakdown-card-content" style="font-size: 1.15em; font-weight: 600;">${optimizedDose.ml.toFixed(1)} mL (${Math.round(optimizedDose.mg)} mg) every ${frequencyHours} hours</div>
                            </div>
                            <div class="breakdown-card">
                                <div class="breakdown-card-title">Range</div>
                                <div class="breakdown-card-content">
                                    <div style="margin-bottom: 6px;">Min: ${perDoseMinMl.toFixed(1)} mL (${Math.round(perDoseMinMg)} mg) every ${frequencyHours} hours</div>
                                    <div style="margin-bottom: 6px;">Max: ${perDoseMaxMl.toFixed(1)} mL (${Math.round(perDoseMaxMg)} mg) every ${frequencyHours} hours</div>
                                    <div style="margin-top: 8px; font-weight: 600;">Total Daily: ${Math.round(dailyTotalMinMg)}-${Math.round(dailyTotalMaxMg)} mg</div>
                                </div>
                            </div>
                        `;
                        breakdownHTML = addLimitNote(breakdownHTML);
                        // Use the displayed optimized dose value (already rounded) for prescription script
                        // This ensures bottle size is based on the final rounded mL per dose
                        breakdownHTML = addPrescriptionScript(breakdownHTML, optimizedDose.ml, frequencyText, prescriptionDays, perDoseMinMl, perDoseMaxMl);
                    } else {
                        resultText = `${perDoseMinMl.toFixed(1)}-${perDoseMaxMl.toFixed(1)} mL ${frequencyText}`;
                        breakdownHTML = `
                            <div class="breakdown-card">
                                <div class="breakdown-card-title">Dose Range</div>
                                <div class="breakdown-card-content">
                                    <div style="margin-bottom: 6px;">${Math.round(perDoseMinMg)}-${Math.round(perDoseMaxMg)} mg every ${frequencyHours} hours</div>
                                    <div style="font-weight: 600;">Total Daily: ${Math.round(dailyTotalMinMg)}-${Math.round(dailyTotalMaxMg)} mg</div>
                                </div>
                            </div>
                        `;
                        breakdownHTML = addLimitNote(breakdownHTML);
                        // Use average of min and max for prescription script
                        const avgDoseMl = (perDoseMinMl + perDoseMaxMl) / 2;
                        breakdownHTML = addPrescriptionScript(breakdownHTML, avgDoseMl, frequencyText, prescriptionDays, perDoseMinMl, perDoseMaxMl);
                    }
                } else {
                    // mg only with range
                    if (optimizedDose && optimizedDose.mg !== null) {
                        resultText = `${optimizedDose.mg} mg ${frequencyText}`;
                        breakdownHTML = `
                            <div class="breakdown-card" style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3);">
                                <div class="breakdown-card-title" style="font-size: 1.1em; font-weight: 700; margin-bottom: 8px;">Recommended Dose</div>
                                <div class="breakdown-card-content" style="font-size: 1.15em; font-weight: 600;">${optimizedDose.mg} mg every ${frequencyHours} hours</div>
                            </div>
                            <div class="breakdown-card">
                                <div class="breakdown-card-title">Range</div>
                                <div class="breakdown-card-content">
                                    <div style="margin-bottom: 6px;">Min: ${Math.round(perDoseMinMg)} mg every ${frequencyHours} hours</div>
                                    <div style="margin-bottom: 6px;">Max: ${Math.round(perDoseMaxMg)} mg every ${frequencyHours} hours</div>
                                    <div style="margin-top: 8px; font-weight: 600;">Total Daily: ${Math.round(dailyTotalMinMg)}-${Math.round(dailyTotalMaxMg)} mg</div>
                                </div>
                            </div>
                        `;
                        breakdownHTML = addLimitNote(breakdownHTML);
                        // If we have concentration, calculate mL for prescription
                        // Calculate from the displayed mg value to ensure consistency
                        if (concentration && concentration > 0) {
                            const optimizedDoseMl = optimizedDose.mg / concentration;
                            const minMl = perDoseMinMg / concentration;
                            const maxMl = perDoseMaxMg / concentration;
                            breakdownHTML = addPrescriptionScript(breakdownHTML, optimizedDoseMl, frequencyText, prescriptionDays, minMl, maxMl);
                        }
                    } else {
                        resultText = `${Math.round(perDoseMinMg)}-${Math.round(perDoseMaxMg)} mg ${frequencyText}`;
                        breakdownHTML = `<div class="breakdown-item">${Math.round(dailyTotalMinMg)}-${Math.round(dailyTotalMaxMg)} mg per day</div>`;
                        breakdownHTML = addLimitNote(breakdownHTML);
                        // If we have concentration, calculate mL for prescription
                        if (concentration && concentration > 0) {
                            const avgDoseMg = (perDoseMinMg + perDoseMaxMg) / 2;
                            const avgDoseMl = avgDoseMg / concentration;
                            const minMl = perDoseMinMg / concentration;
                            const maxMl = perDoseMaxMg / concentration;
                            breakdownHTML = addPrescriptionScript(breakdownHTML, avgDoseMl, frequencyText, prescriptionDays, minMl, maxMl);
                        }
                    }
                }
            } else {
                // Single value (not a range, or range treated as single due to limit)
                const perDoseMg = perDoseMinMg; // Use min (they're equal when treatAsSingleValue is true)
                const perDoseMl = perDoseMinMl;
                // When treatAsSingleValue is true, daily totals should also be equal
                const dailyTotalMg = treatAsSingleValue ? dailyTotalMinMg : dailyTotalMinMg;
                
                if (perDoseMl !== null) {
                    resultText = `${perDoseMl.toFixed(1)} mL ${frequencyText}`;
                    // For single values, add total daily to the main result card, no breakdown card needed
                    breakdownHTML = '';
                    breakdownHTML = addLimitNote(breakdownHTML);
                    breakdownHTML = addPrescriptionScript(breakdownHTML, perDoseMl, frequencyText, prescriptionDays);
                } else {
                    resultText = `${Math.round(perDoseMg)} mg ${frequencyText}`;
                    breakdownHTML = '';
                    if (maxDailyLimitApplied || maxPerDoseLimitApplied) {
                        breakdownHTML = addLimitNote('');
                    }
                }
            }
        } else {
            // Show daily total (no frequency)
            if (doseRange.isRange && !treatDailyAsSingle) {
                if (concentration && concentration > 0) {
                    const dailyTotalMinMl = dailyTotalMinMg / concentration;
                    const dailyTotalMaxMl = dailyTotalMaxMg / concentration;
                    const optimizedDaily = calculateOptimizedDose(dailyTotalMinMg, dailyTotalMaxMg, concentration, null);
                    
                    if (optimizedDaily && optimizedDaily.ml !== null) {
                        resultText = `${optimizedDaily.ml.toFixed(1)} mL once daily`;
                        breakdownHTML = `
                            <div class="breakdown-card" style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3);">
                                <div class="breakdown-card-title" style="font-size: 1.1em; font-weight: 700; margin-bottom: 8px;">Recommended Dose</div>
                                <div class="breakdown-card-content" style="font-size: 1.15em; font-weight: 600;">${optimizedDaily.ml.toFixed(1)} mL (${Math.round(optimizedDaily.mg)} mg) once daily</div>
                            </div>
                            <div class="breakdown-card">
                                <div class="breakdown-card-title">Range</div>
                                <div class="breakdown-card-content">
                                    <div style="margin-bottom: 6px;">Min: ${dailyTotalMinMl.toFixed(1)} mL (${Math.round(dailyTotalMinMg)} mg) per day</div>
                                    <div>Max: ${dailyTotalMaxMl.toFixed(1)} mL (${Math.round(dailyTotalMaxMg)} mg) per day</div>
                                </div>
                            </div>
                        `;
                        breakdownHTML = addLimitNote(breakdownHTML);
                        // Use the displayed optimized dose value (already rounded) for prescription script
                        // This ensures bottle size is based on the final rounded mL per dose
                        breakdownHTML = addPrescriptionScript(breakdownHTML, optimizedDaily.ml, 'once daily', prescriptionDays, dailyTotalMinMl, dailyTotalMaxMl);
                    } else {
                        resultText = `${dailyTotalMinMl.toFixed(1)}-${dailyTotalMaxMl.toFixed(1)} mL once daily`;
                        breakdownHTML = `<div class="breakdown-item">${Math.round(dailyTotalMinMg)}-${Math.round(dailyTotalMaxMg)} mg per day</div>`;
                        breakdownHTML = addLimitNote(breakdownHTML);
                        // Use average for prescription script
                        const avgDailyMl = (dailyTotalMinMl + dailyTotalMaxMl) / 2;
                        breakdownHTML = addPrescriptionScript(breakdownHTML, avgDailyMl, 'once daily', prescriptionDays, dailyTotalMinMl, dailyTotalMaxMl);
                    }
                } else {
                    const optimizedDaily = calculateOptimizedDose(dailyTotalMinMg, dailyTotalMaxMg, null, null);
                    if (optimizedDaily && optimizedDaily.mg !== null) {
                        resultText = `${optimizedDaily.mg} mg once daily`;
                        breakdownHTML = `
                            <div class="breakdown-card" style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3);">
                                <div class="breakdown-card-title" style="font-size: 1.1em; font-weight: 700; margin-bottom: 8px;">Recommended Dose</div>
                                <div class="breakdown-card-content" style="font-size: 1.15em; font-weight: 600;">${optimizedDaily.mg} mg once daily</div>
                            </div>
                            <div class="breakdown-card">
                                <div class="breakdown-card-title">Range</div>
                                <div class="breakdown-card-content">
                                    <div style="margin-bottom: 6px;">Min: ${Math.round(dailyTotalMinMg)} mg per day</div>
                                    <div>Max: ${Math.round(dailyTotalMaxMg)} mg per day</div>
                                </div>
                            </div>
                        `;
                        breakdownHTML = addLimitNote(breakdownHTML);
                        // If we have concentration, calculate mL for prescription
                        // Calculate from the displayed mg value to ensure consistency
                        if (concentration && concentration > 0) {
                            const optimizedDailyMl = optimizedDaily.mg / concentration;
                            const minMl = dailyTotalMinMg / concentration;
                            const maxMl = dailyTotalMaxMg / concentration;
                            breakdownHTML = addPrescriptionScript(breakdownHTML, optimizedDailyMl, 'once daily', prescriptionDays, minMl, maxMl);
                        }
                    } else {
                        resultText = `${Math.round(dailyTotalMinMg)}-${Math.round(dailyTotalMaxMg)} mg once daily`;
                        if (maxDailyLimitApplied) {
                            breakdownHTML = addLimitNote('');
                        }
                        // If we have concentration, calculate mL for prescription
                        if (concentration && concentration > 0) {
                            const avgDailyMg = (dailyTotalMinMg + dailyTotalMaxMg) / 2;
                            const avgDailyMl = avgDailyMg / concentration;
                            const minMl = dailyTotalMinMg / concentration;
                            const maxMl = dailyTotalMaxMg / concentration;
                            breakdownHTML = addPrescriptionScript(breakdownHTML, avgDailyMl, 'once daily', prescriptionDays, minMl, maxMl);
                        }
                    }
                }
            } else {
                // Single value, no frequency (or range treated as single due to limit)
                const dailyTotalMg = treatDailyAsSingle ? dailyTotalMinMg : dailyTotalMinMg;
                
                if (concentration && concentration > 0) {
                    const dailyTotalMl = dailyTotalMg / concentration;
                    resultText = `${dailyTotalMl.toFixed(1)} mL once daily`;
                    // For single values, no breakdown card needed - total daily will be in main card
                    breakdownHTML = '';
                    breakdownHTML = addLimitNote(breakdownHTML);
                    breakdownHTML = addPrescriptionScript(breakdownHTML, dailyTotalMl, 'once daily', prescriptionDays);
                } else {
                    resultText = `${Math.round(dailyTotalMg)} mg once daily`;
                    breakdownHTML = '';
                    if (maxDailyLimitApplied) {
                        breakdownHTML = addLimitNote('');
                    }
                }
            }
        }
        
        resultValue.textContent = resultText;
        resultBreakdown.innerHTML = breakdownHTML;
        resultBox.style.display = 'block';
        
        // Hide main dose card if there's a range (optimized and range cards show the info)
        // For single values, add total daily info to the main card
        if (dosingMainResult) {
            if (doseRange && doseRange.isRange && !treatAsSingleValue && !treatDailyAsSingle) {
                dosingMainResult.style.display = 'none';
                // Remove any breakdown from main card when hidden
                const existingBreakdown = dosingMainResult.querySelector('.dosing-main-breakdown');
                if (existingBreakdown) {
                    existingBreakdown.remove();
                }
            } else {
                dosingMainResult.style.display = 'block';
                
                // For single values, add total daily information to the main card
                const isSingleValue = !doseRange.isRange || treatAsSingleValue || treatDailyAsSingle;
                if (isSingleValue) {
                    // Calculate total daily - use the values we calculated earlier
                    let totalDailyMg = null;
                    if (frequencyHours && perDoseMinMg !== null && perDoseMinMg !== undefined) {
                        const dosesPerDay = 24 / frequencyHours;
                        totalDailyMg = perDoseMinMg * dosesPerDay;
                    } else if (dailyTotalMinMg !== null && dailyTotalMinMg !== undefined) {
                        totalDailyMg = dailyTotalMinMg;
                    }
                    
                    // Add total daily to main card if we have it
                    if (totalDailyMg !== null && totalDailyMg !== undefined) {
                        let existingBreakdown = dosingMainResult.querySelector('.dosing-main-breakdown');
                        if (!existingBreakdown) {
                            existingBreakdown = document.createElement('div');
                            existingBreakdown.className = 'dosing-main-breakdown';
                            existingBreakdown.style.cssText = 'margin-top: 12px; font-size: 0.95em; opacity: 0.9; font-weight: 500;';
                            resultValue.parentNode.appendChild(existingBreakdown);
                        }
                        existingBreakdown.textContent = `Total Daily: ${Math.round(totalDailyMg)} mg`;
                    } else {
                        // Remove breakdown if we don't have total daily
                        const existingBreakdown = dosingMainResult.querySelector('.dosing-main-breakdown');
                        if (existingBreakdown) {
                            existingBreakdown.remove();
                        }
                    }
                } else {
                    // Remove breakdown if it exists (for ranges)
                    const existingBreakdown = dosingMainResult.querySelector('.dosing-main-breakdown');
                    if (existingBreakdown) {
                        existingBreakdown.remove();
                    }
                }
            }
        }
        
        // Attach event listeners to editable dose inputs
        attachEditableDoseListeners();
    }
    
    // Attach event listeners to editable dose inputs in the prescription script
    function attachEditableDoseListeners() {
        const editableInputs = resultBreakdown.querySelectorAll('.editable-dose-input');
        editableInputs.forEach(input => {
            // Remove existing listeners by cloning
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            // Live update as user types
            newInput.addEventListener('input', function() {
                updatePrescriptionFromEditableDose(newInput, true);
            });
            
            newInput.addEventListener('blur', function() {
                updatePrescriptionFromEditableDose(newInput, false);
            });
            
            newInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    newInput.blur();
                }
            });
        });
    }
    
    // Update prescription script and bottle size when editable dose is changed
    function updatePrescriptionFromEditableDose(input, isLiveUpdate) {
        const inputValue = input.value.trim();
        const originalValue = parseFloat(input.dataset.original);
        const minValue = input.dataset.min ? parseFloat(input.dataset.min) : null;
        const maxValue = input.dataset.max ? parseFloat(input.dataset.max) : null;
        
        // Allow empty input during typing (for live updates)
        if (inputValue === '' || inputValue === '.') {
            if (isLiveUpdate) {
                // During live update, allow partial input but don't calculate
                return;
            } else {
                // On blur, reset to original if empty
                input.value = originalValue % 1 === 0 ? Math.round(originalValue).toString() : originalValue.toFixed(1);
                return;
            }
        }
        
        const newValue = parseFloat(inputValue);
        
        // Validate the input
        if (isNaN(newValue) || newValue <= 0) {
            if (isLiveUpdate) {
                // During typing, allow invalid input temporarily
                return;
            } else {
                // On blur, reset to original if invalid
                input.value = originalValue % 1 === 0 ? Math.round(originalValue).toString() : originalValue.toFixed(1);
                return;
            }
        }
        
        // Validate against min/max if provided (only on blur)
        if (!isLiveUpdate && minValue !== null && maxValue !== null) {
            if (newValue < minValue || newValue > maxValue) {
                // Reset to original if out of range
                input.value = originalValue % 1 === 0 ? Math.round(originalValue).toString() : originalValue.toFixed(1);
                return;
            }
        }
        
        // Update the dose value (format on blur, allow raw input during typing)
        let formattedValue = newValue;
        if (!isLiveUpdate) {
            formattedValue = newValue % 1 === 0 ? Math.round(newValue) : Math.round(newValue * 10) / 10;
            input.value = formattedValue % 1 === 0 ? Math.round(formattedValue).toString() : formattedValue.toFixed(1);
            input.dataset.original = formattedValue;
        }
        
        // Recalculate bottle size (use current input value for live updates)
        const prescriptionDays = prescriptionDaysInput ? parseFloat(prescriptionDaysInput.value) : null;
        if (!isNaN(prescriptionDays) && prescriptionDays > 0 && !isNaN(newValue) && newValue > 0) {
            const frequencyHours = frequencyInput ? parseFloat(frequencyInput.value) : null;
            let dosesPerDay = 1;
            if (frequencyHours && frequencyHours > 0) {
                dosesPerDay = 24 / frequencyHours;
            }
            const totalMl = newValue * dosesPerDay * prescriptionDays;
            
            // Update bottle size display
            const bottleSizeElement = resultBreakdown.querySelector('.bottle-size-value');
            if (bottleSizeElement) {
                bottleSizeElement.textContent = totalMl.toFixed(1);
            }
        }
    }
    
    // Update placeholder and unit display based on selected unit
    function updateWeightPlaceholder() {
        const weightUnit = weightUnitKg && weightUnitKg.checked ? 'kg' : 'lbs';
        if (weightInput) {
            weightInput.placeholder = `Enter weight`;
        }
        const unitDisplay = document.getElementById('weightUnitDisplay');
        if (unitDisplay) {
            unitDisplay.textContent = weightUnit;
        }
    }
    
    // Track previous unit for conversion
    let previousUnit = weightUnitKg && weightUnitKg.checked ? 'kg' : 'lbs';
    
    // Convert weight when switching units
    function convertWeightOnUnitChange(newUnit) {
        const currentValue = parseFloat(weightInput.value);
        if (!isNaN(currentValue) && currentValue > 0 && previousUnit !== newUnit) {
            if (previousUnit === 'lbs' && newUnit === 'kg') {
                // Converting from lbs to kg
                const convertedValue = currentValue / 2.20462;
                weightInput.value = convertedValue.toFixed(1);
            } else if (previousUnit === 'kg' && newUnit === 'lbs') {
                // Converting from kg to lbs
                const convertedValue = currentValue * 2.20462;
                weightInput.value = convertedValue.toFixed(1);
            }
        }
        previousUnit = newUnit;
    }
    
    // Update button styles when radio buttons change
    function updateUnitButtonStyles() {
        const unitLabels = document.querySelectorAll('.unit-radio-label');
        unitLabels.forEach(label => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                label.classList.add('checked');
            } else {
                label.classList.remove('checked');
            }
        });
    }
    
    // Update max dose button styles when radio buttons change
    function updateMaxDoseButtonStyles() {
        const maxDoseLabels = document.querySelectorAll('.max-dose-radio-label');
        const toggleSwitch = document.querySelector('.max-dose-toggle-switch');
        
        maxDoseLabels.forEach(label => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                label.classList.add('checked');
            } else {
                label.classList.remove('checked');
            }
        });
        
        // Update toggle switch class for browsers without :has() support
        if (toggleSwitch) {
            toggleSwitch.classList.remove('max-dose-none', 'max-dose-daily', 'max-dose-perdose');
            if (maxDoseTypeNone && maxDoseTypeNone.checked) {
                toggleSwitch.classList.add('max-dose-none');
            } else if (maxDoseTypeDaily && maxDoseTypeDaily.checked) {
                toggleSwitch.classList.add('max-dose-daily');
            } else if (maxDoseTypePerDose && maxDoseTypePerDose.checked) {
                toggleSwitch.classList.add('max-dose-perdose');
            }
        }
    }
    
    // Handle max dose type changes
    function handleMaxDoseTypeChange() {
        if (maxDoseInputContainer) {
            if (maxDoseTypeNone && maxDoseTypeNone.checked) {
                maxDoseInputContainer.classList.remove('show');
                // Hide after animation completes
                setTimeout(() => {
                    if (maxDoseInputContainer && !maxDoseInputContainer.classList.contains('show')) {
                        maxDoseInputContainer.style.display = 'none';
                    }
                }, 300);
                if (maxDoseValue) maxDoseValue.value = '';
            } else {
                // Show the container first, then animate
                if (maxDoseInputContainer.style.display === 'none') {
                    maxDoseInputContainer.style.display = 'block';
                    // Force reflow to ensure display change is applied
                    void maxDoseInputContainer.offsetHeight;
                }
                // Add show class to trigger animation
                requestAnimationFrame(() => {
                    if (maxDoseInputContainer) {
                        maxDoseInputContainer.classList.add('show');
                    }
                });
                
                if (maxDoseTypeDaily && maxDoseTypeDaily.checked) {
                    if (maxDoseValue) maxDoseValue.placeholder = 'Enter max daily dose';
                } else if (maxDoseTypePerDose && maxDoseTypePerDose.checked) {
                    if (maxDoseValue) maxDoseValue.placeholder = 'Enter max per dose';
                }
            }
        }
        updateMaxDoseButtonStyles();
        calculateDose();
    }
    
    // Add event listeners
    if (weightInput) {
        weightInput.addEventListener('input', calculateDose);
    }
    // Update weight unit selector slider position
    function updateWeightUnitSlider() {
        const weightUnitSelector = document.querySelector('.weight-unit-selector');
        if (weightUnitSelector) {
            weightUnitSelector.classList.remove('weight-unit-kg', 'weight-unit-lbs');
            if (weightUnitKg && weightUnitKg.checked) {
                weightUnitSelector.classList.add('weight-unit-kg');
            } else if (weightUnitLbs && weightUnitLbs.checked) {
                weightUnitSelector.classList.add('weight-unit-lbs');
            }
        }
    }
    
    // Update dose unit selector slider position and label
    function updateDoseUnitSlider() {
        if (doseUnitSelector) {
            doseUnitSelector.classList.remove('dose-unit-day', 'dose-unit-dose');
            if (doseUnitDay && doseUnitDay.checked) {
                doseUnitSelector.classList.add('dose-unit-day');
                if (doseUnitDisplay) doseUnitDisplay.textContent = '/day';
            } else if (doseUnitDose && doseUnitDose.checked) {
                doseUnitSelector.classList.add('dose-unit-dose');
                if (doseUnitDisplay) doseUnitDisplay.textContent = '/dose';
            }
        }
    }
    
    // Update dose unit button styles
    function updateDoseUnitButtonStyles() {
        const doseUnitLabels = document.querySelectorAll('.dose-unit-radio-label');
        doseUnitLabels.forEach(label => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                label.classList.add('checked');
            } else {
                label.classList.remove('checked');
            }
        });
    }
    
    // Initialize weight unit slider
    updateWeightUnitSlider();
    
    // Initialize dose unit slider
    if (doseUnitDay && doseUnitDose) {
        updateDoseUnitSlider();
        updateDoseUnitButtonStyles();
        
        doseUnitDay.addEventListener('change', () => {
            updateDoseUnitSlider();
            updateDoseUnitButtonStyles();
            calculateDose();
        });
        
        doseUnitDose.addEventListener('change', () => {
            updateDoseUnitSlider();
            updateDoseUnitButtonStyles();
            calculateDose();
        });
    }
    
    if (weightUnitKg) {
        weightUnitKg.addEventListener('change', () => {
            convertWeightOnUnitChange('kg');
            updateUnitButtonStyles();
            updateWeightPlaceholder();
            updateWeightUnitSlider();
            calculateDose();
        });
    }
    if (weightUnitLbs) {
        weightUnitLbs.addEventListener('change', () => {
            convertWeightOnUnitChange('lbs');
            updateUnitButtonStyles();
            updateWeightPlaceholder();
            updateWeightUnitSlider();
            calculateDose();
        });
    }
    
    // Initialize placeholder
    updateWeightPlaceholder();
    if (dosePerKgInput) {
        dosePerKgInput.addEventListener('input', calculateDose);
    }
    if (concentrationInput) {
        concentrationInput.addEventListener('input', calculateDose);
    }
    if (frequencyInput) {
        frequencyInput.addEventListener('change', calculateDose);
    }
    
    // Max dose event listeners
    if (maxDoseTypeNone) {
        maxDoseTypeNone.addEventListener('change', handleMaxDoseTypeChange);
    }
    if (maxDoseTypeDaily) {
        maxDoseTypeDaily.addEventListener('change', handleMaxDoseTypeChange);
    }
    if (maxDoseTypePerDose) {
        maxDoseTypePerDose.addEventListener('change', handleMaxDoseTypeChange);
    }
    if (maxDoseValue) {
        maxDoseValue.addEventListener('input', calculateDose);
    }
    if (prescriptionDaysInput) {
        prescriptionDaysInput.addEventListener('input', calculateDose);
    }
    
    // Initialize button styles
    updateUnitButtonStyles();
    updateMaxDoseButtonStyles();
    handleMaxDoseTypeChange(); // Initialize the max dose input visibility
}

// Make showDosingCalculator available globally
window.showDosingCalculator = showDosingCalculator;

// ==================== Pediatric Tylenol/Motrin Dosing Calculator ====================

// Dosing data based on the charts
const TYLENOL_DOSING = [
    { weightLbs: [6, 11], weightKg: [2.7, 5.4], age: '0-3 mos', suspension: 1.25, tablets: null },
    { weightLbs: [12, 17], weightKg: [5.5, 7.9], age: '4-11 mos', suspension: 2.5, tablets: null },
    { weightLbs: [18, 23], weightKg: [8, 10.9], age: '12-23 mos', suspension: 3.75, tablets: null },
    { weightLbs: [24, 35], weightKg: [11, 15.9], age: '2-3 yrs', suspension: 5, tablets: 1 },
    { weightLbs: [36, 47], weightKg: [16, 21.9], age: '4-5 yrs', suspension: 7.5, tablets: 1.5 },
    { weightLbs: [48, 59], weightKg: [22, 26.9], age: '6-8 yrs', suspension: 10, tablets: 2 },
    { weightLbs: [60, 71], weightKg: [27, 32.9], age: '9-10 yrs', suspension: 12.5, tablets: 2.5 },
    { weightLbs: [72, 95], weightKg: [33, 43.2], age: '11+ yrs', suspension: 15, tablets: 3 }
];

const MOTRIN_DOSING = [
    { weightLbs: [12, 17], weightKg: [5.5, 7.9], age: '6-11 mos', drops: 1.25, suspension: null, tablets: null },
    { weightLbs: [18, 23], weightKg: [8, 10.9], age: '12-23 mos', drops: 1.875, suspension: null, tablets: null },
    { weightLbs: [24, 35], weightKg: [11, 15.9], age: '2-3 yrs', drops: null, suspension: 5, tablets: 1 },
    { weightLbs: [36, 47], weightKg: [16, 21.9], age: '4-5 yrs', drops: null, suspension: 7.5, tablets: 1.5 },
    { weightLbs: [48, 59], weightKg: [22, 26.9], age: '6-8 yrs', drops: null, suspension: 10, tablets: 2 },
    { weightLbs: [60, 71], weightKg: [27, 32.9], age: '9-10 yrs', drops: null, suspension: 12.5, tablets: 2.5 },
    { weightLbs: [72, 95], weightKg: [33, 43.2], age: '11+ yrs', drops: null, suspension: 15, tablets: 3 }
];

function showPediatricDosing() {
    // Navigate to pediatric dosing page
    navigateToPage('pediatric-dosing');
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768 && closeSidebar) {
        closeSidebar();
    }
}

function findDosingByWeight(weight, isKg, dosingArray) {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) return null;
    
    for (const dose of dosingArray) {
        const weightRange = isKg ? dose.weightKg : dose.weightLbs;
        if (weightValue >= weightRange[0] && weightValue <= weightRange[1]) {
            return dose;
        }
    }
    return null;
}

function calculatePediatricDosing() {
    const weightInput = document.getElementById('pedWeight');
    const weightUnitLbs = document.getElementById('pedWeightUnitLbs');
    const tylenolSection = document.getElementById('tylenolSection');
    const motrinSection = document.getElementById('motrinSection');
    const tylenolResults = document.getElementById('tylenolResults');
    const motrinResults = document.getElementById('motrinResults');
    
    if (!weightInput || !tylenolSection || !motrinSection) return;
    
    const weight = weightInput.value.trim();
    if (!weight) {
        tylenolSection.style.display = 'none';
        motrinSection.style.display = 'none';
        return;
    }
    
    const isKg = weightUnitLbs && !weightUnitLbs.checked;
    const weightValue = parseFloat(weight);
    
    if (isNaN(weightValue) || weightValue <= 0) {
        tylenolSection.style.display = 'none';
        motrinSection.style.display = 'none';
        return;
    }
    
    // Check minimum weight requirements
    const minWeightTylenol = isKg ? 2.7 : 6;  // 6 lbs / 2.7 kg
    const minWeightMotrin = isKg ? 5.5 : 12;  // 12 lbs / 5.5 kg
    const maxWeight = isKg ? 43.2 : 95;  // 95 lbs / 43.2 kg
    
    // Check if weight is too low for Tylenol
    if (weightValue < minWeightTylenol) {
        tylenolResults.innerHTML = `
            <div class="dosing-error">
                <strong>Weight too low:</strong> Patient weight (${weight} ${isKg ? 'kg' : 'lbs'}) is below the minimum dosing range (${minWeightTylenol} ${isKg ? 'kg' : 'lbs'}). 
                Please consult with a healthcare provider for appropriate dosing.
            </div>
        `;
        tylenolSection.style.display = 'block';
        motrinSection.style.display = 'none';
        return;
    }
    
    // Check maximum weight
    
    if (weightValue > maxWeight) {
        tylenolResults.innerHTML = `
            <div class="dosing-warning">
                <strong>Weight exceeds chart range:</strong> Patient weight (${weight} ${isKg ? 'kg' : 'lbs'}) exceeds the maximum range on this chart (${maxWeight} ${isKg ? 'kg' : 'lbs'}). 
                Please consult with a healthcare provider for appropriate dosing.
            </div>
        `;
        tylenolSection.style.display = 'block';
        motrinResults.innerHTML = `
            <div class="dosing-warning">
                <strong>Weight exceeds chart range:</strong> Patient weight (${weight} ${isKg ? 'kg' : 'lbs'}) exceeds the maximum range on this chart (${maxWeight} ${isKg ? 'kg' : 'lbs'}). 
                Please consult with a healthcare provider for appropriate dosing.
            </div>
        `;
        motrinSection.style.display = 'block';
        return;
    }
    
    // Check if weight is too low for Motrin (but still show Tylenol)
    if (weightValue < minWeightMotrin) {
        // Show Tylenol results
        const tylenolDose = findDosingByWeight(weightValue, isKg, TYLENOL_DOSING);
        if (tylenolDose) {
            let html = `<div class="dosing-info">`;
            html += `<div class="dosing-header"><strong>Weight:</strong> ${weight} ${isKg ? 'kg' : 'lbs'} | <strong>Age Range:</strong> ${tylenolDose.age}</div>`;
            html += `<div class="dosing-options">`;
            
            if (tylenolDose.suspension !== null) {
                html += `<div class="dosing-option">`;
                html += `<div class="dosing-option-title">Infants' & Children's Oral Suspension</div>`;
                html += `<div class="dosing-option-details">Active Ingredient: acetaminophen 160 mg/5 mL</div>`;
                html += `<div class="dosing-amount"><strong>${tylenolDose.suspension} mL</strong></div>`;
                html += `</div>`;
            }
            
            if (tylenolDose.tablets !== null) {
                html += `<div class="dosing-option">`;
                html += `<div class="dosing-option-title">Chewable Tablets</div>`;
                html += `<div class="dosing-option-details">Active Ingredient: acetaminophen 160 mg/Chew</div>`;
                html += `<div class="dosing-amount"><strong>${tylenolDose.tablets} ${tylenolDose.tablets === 1 ? 'tab' : 'tabs'}</strong></div>`;
                html += `</div>`;
            }
            
            html += `</div></div>`;
            tylenolResults.innerHTML = html;
            tylenolSection.style.display = 'block';
        }
        
        // Show Motrin warning
        motrinResults.innerHTML = `
            <div class="dosing-error">
                <strong>⚠️ DO NOT USE:</strong> Ibuprofen should NOT be used in infants under 6 months of age or weighing less than 12 lbs (5.5 kg).
            </div>
        `;
        motrinSection.style.display = 'block';
        return;
    }
    
    // Find Tylenol dosing
    const tylenolDose = findDosingByWeight(weightValue, isKg, TYLENOL_DOSING);
    if (tylenolDose) {
        let html = `<div class="dosing-info">`;
        html += `<div class="dosing-header"><strong>Weight:</strong> ${weight} ${isKg ? 'kg' : 'lbs'} | <strong>Age Range:</strong> ${tylenolDose.age}</div>`;
        html += `<div class="dosing-options">`;
        
        if (tylenolDose.suspension !== null) {
            html += `<div class="dosing-option">`;
            html += `<div class="dosing-option-title">Infants' & Children's Oral Suspension</div>`;
            html += `<div class="dosing-option-details">Active Ingredient: acetaminophen 160 mg/5 mL</div>`;
            html += `<div class="dosing-amount"><strong>${tylenolDose.suspension} mL</strong></div>`;
            html += `</div>`;
        }
        
        if (tylenolDose.tablets !== null) {
            html += `<div class="dosing-option">`;
            html += `<div class="dosing-option-title">Chewable Tablets</div>`;
            html += `<div class="dosing-option-details">Active Ingredient: acetaminophen 160 mg/Chew</div>`;
            html += `<div class="dosing-amount"><strong>${tylenolDose.tablets} ${tylenolDose.tablets === 1 ? 'tab' : 'tabs'}</strong></div>`;
            html += `</div>`;
        }
        
        html += `</div></div>`;
        tylenolResults.innerHTML = html;
        tylenolSection.style.display = 'block';
    } else {
        tylenolSection.style.display = 'none';
    }
    
    // Find Motrin dosing (only if weight is >= 12 lbs / 5.5 kg)
    const motrinDose = findDosingByWeight(weightValue, isKg, MOTRIN_DOSING);
    if (motrinDose && weightValue >= minWeightMotrin) {
        let html = `<div class="dosing-info">`;
        html += `<div class="dosing-header"><strong>Weight:</strong> ${weight} ${isKg ? 'kg' : 'lbs'} | <strong>Age Range:</strong> ${motrinDose.age}</div>`;
        html += `<div class="dosing-options">`;
        
        if (motrinDose.drops !== null) {
            html += `<div class="dosing-option">`;
            html += `<div class="dosing-option-title">Concentrated Infants' Drops</div>`;
            html += `<div class="dosing-option-details">Active Ingredient: ibuprofen 50 mg/1.25 mL</div>`;
            html += `<div class="dosing-amount"><strong>${motrinDose.drops} mL</strong></div>`;
            html += `</div>`;
        }
        
        if (motrinDose.suspension !== null) {
            html += `<div class="dosing-option">`;
            html += `<div class="dosing-option-title">Children's Oral Suspension</div>`;
            html += `<div class="dosing-option-details">Active Ingredient: ibuprofen 100 mg/5 mL</div>`;
            html += `<div class="dosing-amount"><strong>${motrinDose.suspension} mL</strong></div>`;
            html += `</div>`;
        }
        
        if (motrinDose.tablets !== null) {
            html += `<div class="dosing-option">`;
            html += `<div class="dosing-option-title">Chewable Tablets</div>`;
            html += `<div class="dosing-option-details">Active Ingredient: ibuprofen 100 mg/Chew</div>`;
            html += `<div class="dosing-amount"><strong>${motrinDose.tablets} ${motrinDose.tablets === 1 ? 'tab' : 'tabs'}</strong></div>`;
            html += `</div>`;
        }
        
        html += `</div></div>`;
        motrinResults.innerHTML = html;
        motrinSection.style.display = 'block';
    } else {
        motrinSection.style.display = 'none';
    }
}

function switchDosingChart(chartType) {
    const tylenolChart = document.getElementById('tylenolChart');
    const motrinChart = document.getElementById('motrinChart');
    const tabs = document.querySelectorAll('.chart-tab');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.chart === chartType) {
            tab.classList.add('active');
        }
    });
    
    if (chartType === 'tylenol') {
        tylenolChart.classList.add('active');
        motrinChart.classList.remove('active');
    } else {
        tylenolChart.classList.remove('active');
        motrinChart.classList.add('active');
    }
}

function initializePediatricDosing() {
    const weightInput = document.getElementById('pedWeight');
    const weightUnitLbs = document.getElementById('pedWeightUnitLbs');
    const weightUnitKg = document.getElementById('pedWeightUnitKg');
    const weightUnitDisplay = document.getElementById('pedWeightUnitDisplay');
    
    if (!weightInput || !weightUnitLbs || !weightUnitKg) return;
    
    // Update unit display
    function updatePedUnitDisplay() {
        if (weightUnitDisplay) {
            weightUnitDisplay.textContent = weightUnitLbs.checked ? 'lbs' : 'kg';
        }
    }
    
    // Event listeners
    weightInput.addEventListener('input', calculatePediatricDosing);
    weightInput.addEventListener('change', calculatePediatricDosing);
    
    weightUnitLbs.addEventListener('change', () => {
        updatePedUnitDisplay();
        calculatePediatricDosing();
    });
    
    weightUnitKg.addEventListener('change', () => {
        updatePedUnitDisplay();
        calculatePediatricDosing();
    });
    
    updatePedUnitDisplay();
}

// Make functions available globally
window.showPediatricDosing = showPediatricDosing;
window.switchDosingChart = switchDosingChart;



