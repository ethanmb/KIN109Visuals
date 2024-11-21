

// Global array to store generated problems
const problems = [];

// Utility function to show the next step
function showStep(stepId) {
    const step = document.getElementById(stepId);
    if (step) {
        step.classList.remove("hidden");
    }
}

function generateProblem() {
    const problemDescription = document.getElementById("problem-description");

    // Randomly generate a sample size between 3 and 10
    const n = Math.floor(Math.random() * 8) + 3; // Generates a random number between 3 and 10

    // Randomized data generation for groups
    const group1 = { mean: (10 + Math.random() * 40).toFixed(2), sd: (1 + Math.random() * 4).toFixed(2), n };
    const group2 = { mean: (10 + Math.random() * 40).toFixed(2), sd: (1 + Math.random() * 4).toFixed(2), n };
    const group3 = { mean: (10 + Math.random() * 40).toFixed(2), sd: (1 + Math.random() * 4).toFixed(2), n };

    // Total sample size
    const totalSampleSize = group1.n + group2.n + group3.n;

    // Degrees of freedom
    const dfBetween = 3 - 1; // k - 1 (3 groups)
    const dfWithin = totalSampleSize - 3; // N - k
    const dfTotal = totalSampleSize - 1; // N - 1

    // Save the current problem for later use
    problems.push({ group1, group2, group3, dfBetween, dfWithin, dfTotal });

    // Generate the problem text dynamically
    const problemText = `
        A biomechanics researcher wants to test whether good, average, and poor sprinters differ
        in their horizontal foot speed. She classified sprinters into three groups based on sprint times.
        The horizontal foot speed at touchdown in feet per second was analyzed:
        <ul>
            <li>Group 1: Mean = ${group1.mean}, SD = ${group1.sd}, N = ${group1.n}</li>
            <li>Group 2: Mean = ${group2.mean}, SD = ${group2.sd}, N = ${group2.n}</li>
            <li>Group 3: Mean = ${group3.mean}, SD = ${group3.sd}, N = ${group3.n}</li>
        </ul>
        Conduct a hypothesis test with α = 0.05.
    `;

    // Update the problem display
    problemDescription.innerHTML = problemText;

    // Show the first step
    showStep("step-1-hypotheses");
}



// Drag and drop functionality
function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.innerText);
}

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    event.target.innerText = data;
}

// Check hypotheses
function checkHypotheses() {
    const h0Areas = document.querySelectorAll('#step-1-hypotheses .drop-area');
    const h0Symbols = Array.from(h0Areas).map(area => area.innerText.trim());

    if (h0Symbols.every(symbol => symbol === "=")) {
        document.getElementById("hypotheses-feedback").innerText = "Correct! H₀ states that all means are equal.";
        document.getElementById("hypotheses-feedback").style.color = "green";

        // Show the next step
        showStep("step-2-null-distribution");
    } else {
        document.getElementById("hypotheses-feedback").innerText = "Incorrect. H₀ should state that all means are equal.";
        document.getElementById("hypotheses-feedback").style.color = "red";
    }
}

// Check degrees of freedom
function checkDegreesOfFreedom() {
    // Fetch user inputs
    const dfBetweenInput = parseInt(document.getElementById("df-between").value);
    const dfWithinInput = parseInt(document.getElementById("df-within").value);
    const dfTotalInput = parseInt(document.getElementById("df-total").value);

    // Retrieve expected values from the current problem
    const currentProblem = problems[problems.length - 1]; // Get the most recently generated problem
    const { dfBetween, dfWithin, dfTotal } = currentProblem;

    // Feedback element
    const feedback = document.getElementById("df-feedback");

    if (dfBetweenInput === dfBetween && dfWithinInput === dfWithin && dfTotalInput === dfTotal) {
        feedback.innerText = "Correct! Degrees of freedom are calculated correctly.";
        feedback.style.color = "green";

        // Show the next step (Critical F-Value)
        showStep("step-3-critical-f");
    } else {
        feedback.innerText = `Incorrect. Check your calculations:
            \nExpected dfBetween: ${dfBetween}, dfWithin: ${dfWithin}, dfTotal: ${dfTotal}.`;
        feedback.style.color = "red";
    }
}


// F-table display
function showFTable() {
    document.getElementById("f-table").classList.remove("hidden");
}

function closeFTable() {
    document.getElementById("f-table").classList.add("hidden");
}

function showCriticalFStep() {
    const currentProblem = problems[problems.length - 1]; // Get the most recent problem
    const { dfBetween, dfWithin } = currentProblem;

    // Update the displayed degrees of freedom
    document.getElementById("df-between-display").innerText = dfBetween;
    document.getElementById("df-within-display").innerText = dfWithin;

    // Show the step
    showStep("step-3-critical-f");
}

// Check critical F-value
function checkCriticalFValue() {
    // Fetch user input
    const criticalFInput = parseFloat(document.getElementById("critical-f-value").value);

    // Retrieve current problem data
    const currentProblem = problems[problems.length - 1];
    const { dfBetween, dfWithin } = currentProblem;

    // Alpha level for the test
    const alpha = 0.05;

    // Use jstat to calculate the critical F-value
    const expectedCriticalF = jStat.centralF.inv(1 - alpha, dfBetween, dfWithin);

    // Feedback element
    const feedback = document.getElementById("critical-f-feedback");

    // Check if the user's input is close to the expected value
    if (Math.abs(criticalFInput - expectedCriticalF) < 0.001) {
        feedback.innerText = "Correct! The critical F-value is accurate.";
        feedback.style.color = "green";

        // Show the next step (ANOVA Table)
        showAnovaTableStep();
    } else {
        feedback.innerText = `Incorrect. The correct critical F-value is ${expectedCriticalF.toFixed(3)}.`;
        feedback.style.color = "red";
    }
}

function showAnovaTableStep() {
    const currentProblem = problems[problems.length - 1]; // Get the most recent problem
    const { dfBetween, dfWithin, dfTotal } = currentProblem;

    // Populate the degrees of freedom cells
    document.getElementById("df-between-cell").innerText = dfBetween;
    document.getElementById("df-within-cell").innerText = dfWithin;
    document.getElementById("df-total-cell").innerText = dfTotal;

    // Show the ANOVA table step
    showStep("step-4-anova-table");
}


// Event listeners
document.getElementById("generate-problem-button").addEventListener("click", generateProblem);
document.getElementById("submit-hypotheses-button").addEventListener("click", checkHypotheses);
document.getElementById("submit-df-button").addEventListener("click", checkDegreesOfFreedom);
document.getElementById("show-f-table-button").addEventListener("click", showFTable);
document.getElementById("close-f-table-button").addEventListener("click", closeFTable);
document.getElementById("submit-critical-f-button").addEventListener("click", checkCriticalFValue);
