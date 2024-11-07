document.addEventListener('deviceready', function() {
    // Check if Health Connect or Google Fit is available
    cordova.plugins.health.isAvailable(function(isAvailable) {
        if (isAvailable) {
            // Try to request permissions for Health Connect
            console.log("using health connect!")
            requestHealthConnectPermissions();
        } else {
            // If not available, fall back to Pedometer sensor
            initializePedometerFallback();
        }
    });
}, false);

function requestHealthConnectPermissions() {
    cordova.plugins.health.requestAuthorization(
        { read: ['steps'] },
        function() {
            console.log("Health Connect permissions granted");
            fetchHealthConnectData();
        },
        function(error) {
            console.log("Health Connect permissions denied or unavailable");
            console.log(error)
            initializePedometerFallback(); // Fall back if permissions are denied
        }
    );
}

function fetchHealthConnectData() {
    // Fetch steps for the current day using Health Connect
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    cordova.plugins.health.query({
        startDate: startOfDay,
        endDate: endOfDay,
        dataType: 'steps',
        bucket: 'day'
    }, function(data) {
        if (data.length > 0) {
            const steps = data[0].value;
            updateSteps(steps);
        } else {
            console.log("No steps data available for today from Health Connect.");
        }
    }, function(error) {
        console.log("Failed to fetch Health Connect data: " + error);
        initializePedometerFallback(); // Fall back if data fetch fails
    });
}

function initializePedometerFallback() {
    const permissions = cordova.plugins.permissions;
    const activityRecognitionPermission = permissions.ACTIVITY_RECOGNITION;
    const todayKey = getTodayKey();

    let currentSteps = loadSteps(todayKey);
    updateSteps(currentSteps);

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
                    pedometer.startPedometerUpdates(function(pedometerData) {
                        const newSteps = pedometerData.numberOfSteps;
                        const dailySteps = newSteps + currentSteps;
                        saveSteps(todayKey, dailySteps);
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
}

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

// Helper functions for local storage management
function getTodayKey() {
    const today = new Date();
    return `steps_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
}

function loadSteps(key) {
    const storedSteps = localStorage.getItem(key);
    return storedSteps ? parseInt(storedSteps) : 0;
}

function saveSteps(key, steps) {
    localStorage.setItem(key, steps);
}
