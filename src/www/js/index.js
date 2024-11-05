document.addEventListener('deviceready', function() {
    const permissions = cordova.plugins.permissions;
    const activityRecognitionPermission = permissions.ACTIVITY_RECOGNITION;
    const todayKey = getTodayKey();

    // Load steps for the current day from local storage
    let currentSteps = loadSteps(todayKey);
    updateSteps(currentSteps);

    // Check and request the Activity Recognition permission
    permissions.checkPermission(activityRecognitionPermission, function(status) {
        if (!status.hasPermission) {
            permissions.requestPermission(activityRecognitionPermission, permissionSuccess, permissionError);
        } else {
            startPedometer();
        }
    }, permissionError);

    function permissionSuccess(status) {
        if (status.hasPermission) {
            startPedometer();
        } else {
            console.log("Permission not granted for Activity Recognition.");
        }
    }

    function permissionError() {
        console.log("Permission request failed.");
    }

    function startPedometer() {
        if (pedometer) {
            pedometer.isStepCountingAvailable(function(isAvailable) {
                if (isAvailable) {
                    // Start pedometer updates
                    pedometer.startPedometerUpdates(function(pedometerData) {
                        const newSteps = pedometerData.numberOfSteps;
                        const dailySteps = newSteps + currentSteps; // Accumulate with stored steps
                        saveSteps(todayKey, dailySteps); // Save to local storage
                        updateSteps(dailySteps);
                    }, function(error) {
                        console.log("Error starting pedometer updates: " + error);
                    });
                } else {
                    console.log("Step counting is not available on this device.");
                }
            });
        }
    }
}, false);

function updateSteps(steps) {
    document.getElementById('steps').innerHTML = "Steps today: " + steps;
    updateCircle(steps);
}

function updateCircle(steps) {
    const goal = 10000;
    const percentage = Math.min((steps / goal) * 100, 100);
    const circle = document.getElementById('progress-circle');
    
    // Calculate circumference and set dash offset
    const radius = circle.getAttribute('r');
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

// Helper function to generate a unique key for today's date
function getTodayKey() {
    const today = new Date();
    return `steps_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
}

// Load steps from local storage
function loadSteps(key) {
    const storedSteps = localStorage.getItem(key);
    return storedSteps ? parseInt(storedSteps) : 0;
}

// Save steps to local storage
function saveSteps(key, steps) {
    localStorage.setItem(key, steps);
}
