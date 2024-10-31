document.addEventListener('deviceready', function() {
    if (Pedometer) {
      Pedometer.isStepCountingAvailable(function(isAvailable) {
        if (isAvailable) {
          // Start pedometer updates
          Pedometer.startPedometerUpdates(function(pedometerData) {
            // pedometerData contains: steps, distance, floors ascended/descended, etc.
            updateSteps(pedometerData.numberOfSteps);
          }, function(error) {
            console.log("Error starting pedometer updates: " + error);
          });
        } else {
          console.log("Step counting is not available on this device.");
        }
      });
    }
  }, false);
  
  function updateSteps(steps) {
    // Update the UI with the current number of steps
    document.getElementById('steps').innerHTML = "Steps today: " + steps;
  
    // Update the "circle closing" logic here
    updateCircle(steps);
  }
  
  function updateCircle(steps) {
    const goal = 10000; // Example step goal
    const percentage = Math.min((steps / goal) * 100, 100);
    const circle = document.getElementById('progress-circle');
    
    // Adjust the circle's progress based on the percentage of steps completed
    circle.style.strokeDasharray = `${percentage} 100`;
  }
  