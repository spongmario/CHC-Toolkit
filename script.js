// Provider data structure
let providers = [];
let shiftAssignments = {
    opening: [],
    mid: [],
    close: []
};

// Load data from localStorage
function loadData() {
    const savedProviders = localStorage.getItem('chcProviders');
    const savedAssignments = localStorage.getItem('chcShiftAssignments');
    
    if (savedProviders) {
        providers = JSON.parse(savedProviders);
        // Ensure all providers have the submitted property
        providers.forEach(provider => {
            if (provider.submitted === undefined) {
                provider.submitted = false;
            }
        });
    }
    
    if (savedAssignments) {
        shiftAssignments = JSON.parse(savedAssignments);
    }
    
    renderProviders();
    updateShiftAssignments();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('chcProviders', JSON.stringify(providers));
    localStorage.setItem('chcShiftAssignments', JSON.stringify(shiftAssignments));
}

// Add provider row
function addProviderRow() {
    const newProvider = {
        id: Date.now(),
        name: '',
        patientsPerHour: 0,
        submitted: false
    };
    providers.unshift(newProvider); // Add to beginning of array
    saveData();
    renderProviders();
    // Focus on the new name input (first row)
    const container = document.getElementById('providersContainer');
    const firstRow = container.firstElementChild;
    if (firstRow) {
        const nameInput = firstRow.querySelector('.provider-name-input');
        if (nameInput) nameInput.focus();
    }
}

// Delete provider
function deleteProvider(id) {
    providers = providers.filter(p => p.id !== id);
    // Remove from shift assignments
    shiftAssignments.opening = shiftAssignments.opening.filter(pid => pid !== id);
    shiftAssignments.mid = shiftAssignments.mid.filter(pid => pid !== id);
    shiftAssignments.close = shiftAssignments.close.filter(pid => pid !== id);
    
    saveData();
    renderProviders();
    updateShiftAssignments();
}

// Update provider name
function updateProviderName(id, value) {
    const provider = providers.find(p => p.id === id);
    if (provider && !provider.submitted) {
        provider.name = value.trim();
        saveData();
        updateShiftAssignments();
    }
}

// Update provider patients per hour
function updateProviderRate(id, value) {
    const provider = providers.find(p => p.id === id);
    if (provider && !provider.submitted) {
        const rate = parseFloat(value) || 0;
        provider.patientsPerHour = rate;
        saveData();
    }
}

// Submit provider (lock it)
function submitProvider(id) {
    const provider = providers.find(p => p.id === id);
    if (provider) {
        const name = provider.name.trim();
        const rate = provider.patientsPerHour;
        
        if (!name || rate <= 0) {
            alert('Please enter a valid provider name and patients per hour before submitting.');
            return;
        }
        
        provider.submitted = true;
        saveData();
        renderProviders();
    }
}

// Edit provider (unlock it)
function editProvider(id) {
    const provider = providers.find(p => p.id === id);
    if (provider) {
        provider.submitted = false;
        saveData();
        renderProviders();
        // Focus on the name input after editing
        setTimeout(() => {
            const row = document.querySelector(`[data-provider-id="${id}"]`);
            if (row) {
                const nameInput = row.querySelector('.provider-name-input');
                if (nameInput) nameInput.focus();
            }
        }, 50);
    }
}

// Render providers list
function renderProviders() {
    const container = document.getElementById('providersContainer');
    container.innerHTML = '';
    
    if (providers.length === 0) {
        // Add one empty row by default
        addProviderRow();
        return;
    }
    
    providers.forEach(provider => {
        const providerRow = document.createElement('div');
        providerRow.className = `provider-row ${provider.submitted ? 'submitted' : ''}`;
        providerRow.setAttribute('data-provider-id', provider.id);
        
        const isSubmitted = provider.submitted;
        const disabledAttr = isSubmitted ? 'disabled' : '';
        const readonlyAttr = isSubmitted ? 'readonly' : '';
        
        providerRow.innerHTML = `
            <input type="text" 
                   class="provider-name-input" 
                   placeholder="Provider name" 
                   value="${provider.name}"
                   ${disabledAttr}
                   ${readonlyAttr}
                   onchange="updateProviderName(${provider.id}, this.value)"
                   onblur="updateProviderName(${provider.id}, this.value)">
            <input type="number" 
                   class="provider-rate-input" 
                   placeholder="# per hour" 
                   step="0.1" 
                   min="0"
                   value="${provider.patientsPerHour || ''}"
                   ${disabledAttr}
                   ${readonlyAttr}
                   onchange="updateProviderRate(${provider.id}, this.value)"
                   onblur="updateProviderRate(${provider.id}, this.value)">
            ${isSubmitted 
                ? `<button class="btn btn-small btn-secondary" onclick="editProvider(${provider.id})">Edit</button>`
                : `<button class="btn btn-small btn-primary" onclick="submitProvider(${provider.id})">Submit</button>`
            }
            <button class="btn btn-small btn-danger" onclick="deleteProvider(${provider.id})">Delete</button>
        `;
        // Append in order - since we use unshift(), newest providers are at index 0
        // and will be appended first, appearing at the top
        container.appendChild(providerRow);
    });
}

// Update shift assignments UI
function updateShiftAssignments() {
    const shifts = ['opening', 'mid', 'close'];
    const shiftIds = ['openingShift', 'midShift', 'closeShift'];
    
    shifts.forEach((shift, index) => {
        const container = document.getElementById(shiftIds[index]);
        container.innerHTML = '';
        
        providers.forEach(provider => {
            const isAssigned = shiftAssignments[shift].includes(provider.id);
            const checkbox = document.createElement('div');
            checkbox.className = 'shift-checkbox';
            checkbox.innerHTML = `
                <label>
                    <input type="checkbox" 
                           ${isAssigned ? 'checked' : ''} 
                           onchange="toggleShiftAssignment('${shift}', ${provider.id})">
                    ${provider.name}
                </label>
            `;
            container.appendChild(checkbox);
        });
        
        if (providers.length === 0) {
            container.innerHTML = '<p class="empty-state">Add providers first</p>';
        }
    });
}

// Toggle shift assignment
function toggleShiftAssignment(shift, providerId) {
    const index = shiftAssignments[shift].indexOf(providerId);
    if (index > -1) {
        shiftAssignments[shift].splice(index, 1);
    } else {
        shiftAssignments[shift].push(providerId);
    }
    saveData();
}

// Check if selected date is Thursday
function isThursday(date) {
    const day = new Date(date).getDay();
    return day === 4; // 4 = Thursday
}

// Get shift times based on day
function getShiftTimes(isThursday) {
    if (isThursday) {
        return {
            opening: { start: 9, end: 19 }, // 9-7pm
            mid: { start: 9, end: 19 },     // 9-7pm
            close: { start: 9, end: 19 }    // 9-7pm
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

// Calculate remaining patients for a provider
// The last hour of the shift always yields 1.8 patients, regardless of rate
function calculateProviderRemainingPatients(provider, remainingHours) {
    if (remainingHours <= 0) {
        return 0;
    }
    
    // If less than 1 hour remaining, they only see 1.8 patients
    if (remainingHours < 1) {
        return 1.8;
    }
    
    // The last hour is always 1.8 patients
    // All hours before the last hour use the provider's rate
    const hoursBeforeLast = remainingHours - 1;
    const patientsFromFullHours = hoursBeforeLast * provider.patientsPerHour;
    const patientsFromLastHour = 1.8;
    
    return patientsFromFullHours + patientsFromLastHour;
}

// Calculate total remaining patients
function calculateRemainingPatients() {
    const selectedDate = document.getElementById('selectedDate').value;
    const currentTime = document.getElementById('currentTime').value;
    const patientsInLobby = parseInt(document.getElementById('patientsInLobby').value) || 0;
    
    if (!selectedDate || !currentTime) {
        alert('Please select a date and current time.');
        return;
    }
    
    const [hours, minutes] = currentTime.split(':').map(Number);
    const currentHour = hours;
    const currentMinute = minutes;
    
    const thursday = isThursday(selectedDate);
    const shiftTimes = getShiftTimes(thursday);
    
    // Show/hide Thursday notice
    document.getElementById('thursdayNotice').style.display = thursday ? 'block' : 'none';
    
    let totalRemaining = patientsInLobby;
    const breakdown = [];
    
    // Calculate for each shift
    const shifts = [
        { name: 'Opening', key: 'opening', shiftTimes: shiftTimes.opening },
        { name: 'Mid', key: 'mid', shiftTimes: shiftTimes.mid },
        { name: 'Close', key: 'close', shiftTimes: shiftTimes.close }
    ];
    
    shifts.forEach(shift => {
        const assignedProviders = shiftAssignments[shift.key]
            .map(id => providers.find(p => p.id === id))
            .filter(p => p !== undefined);
        
        assignedProviders.forEach(provider => {
            const remainingHours = calculateRemainingHours(
                currentHour,
                currentMinute,
                shift.shiftTimes.start,
                shift.shiftTimes.end
            );
            
            const remainingPatients = calculateProviderRemainingPatients(provider, remainingHours);
            totalRemaining += remainingPatients;
            
            if (remainingPatients > 0) {
                breakdown.push({
                    provider: provider.name,
                    shift: shift.name,
                    remainingHours: remainingHours.toFixed(2),
                    remainingPatients: remainingPatients.toFixed(1)
                });
            }
        });
    });
    
    // Display results
    document.getElementById('resultValue').textContent = Math.round(totalRemaining);
    
    const breakdownDiv = document.getElementById('resultBreakdown');
    if (breakdown.length > 0) {
        breakdownDiv.innerHTML = `
            <div class="breakdown-header">Breakdown:</div>
            <div class="breakdown-item">Lobby: ${patientsInLobby} patients</div>
            ${breakdown.map(item => `
                <div class="breakdown-item">
                    ${item.provider} (${item.shift}): ${item.remainingPatients} patients (${item.remainingHours} hrs remaining)
                </div>
            `).join('')}
        `;
    } else {
        breakdownDiv.innerHTML = '<div class="breakdown-item">No providers assigned or all shifts completed.</div>';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('selectedDate').value = today;
    
    // Set default time to current time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('currentTime').value = `${hours}:${minutes}`;
    
    loadData();
    
    document.getElementById('calculateBtn').addEventListener('click', calculateRemainingPatients);
    document.getElementById('addProviderRow').addEventListener('click', addProviderRow);
    
    // Update Thursday notice when date changes
    document.getElementById('selectedDate').addEventListener('change', () => {
        const selectedDate = document.getElementById('selectedDate').value;
        const thursday = isThursday(selectedDate);
        document.getElementById('thursdayNotice').style.display = thursday ? 'block' : 'none';
    });
});

