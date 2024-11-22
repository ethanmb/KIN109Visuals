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

    // Reset buttons
    document.getElementById("validate-ms").disabled = true;
    document.getElementById("validate-f").disabled = true;

    // Ensure they appear grey
    document.getElementById("validate-ms").style.backgroundColor = "grey";
    document.getElementById("validate-f").style.backgroundColor = "grey";
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


// Toggle F-Table visibility
function toggleFTable() {
    const fTableDiv = document.getElementById("f-table");
    const toggleButton = document.getElementById("f-table-toggle-button");

    // Check current state
    if (fTableDiv.classList.contains("hidden")) {
        // Show F-table and update button text
        fTableDiv.classList.remove("hidden");
        toggleButton.innerText = "Close F-Table";
    } else {
        // Hide F-table and reset button text
        fTableDiv.classList.add("hidden");
        toggleButton.innerText = "Open F-Table";
    }
}

// Close F-Table (triggered by either close button)
function closeFTable() {
    const fTableDiv = document.getElementById("f-table");
    const toggleButton = document.getElementById("f-table-toggle-button");

    // Hide F-table and reset button text
    fTableDiv.classList.add("hidden");
    toggleButton.innerText = "Open F-Table";
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

function validateSSColumn() {
    // Step 1: Retrieve generated data
    const currentProblem = problems[problems.length - 1];
    const { group1, group2, group3 } = currentProblem;

    const groupMeans = [parseFloat(group1.mean), parseFloat(group2.mean), parseFloat(group3.mean)];
    const groupSDs = [parseFloat(group1.sd), parseFloat(group2.sd), parseFloat(group3.sd)];
    const n = group1.n; // Same for all groups

    // Step 2: Calculate Grand Mean
    const grandMean = (groupMeans[0] + groupMeans[1] + groupMeans[2]) / 3;
    


    // Step 3: Calculate SS Between Groups (SS_BG)
    const ssBetween = n * (
        Math.pow(groupMeans[0] - grandMean, 2) +
        Math.pow(groupMeans[1] - grandMean, 2) +
        Math.pow(groupMeans[2] - grandMean, 2)
    );

    // Step 4: Calculate SS Within Groups (SS_WG)
    const ssWithin = (n - 1) * (
        Math.pow(groupSDs[0], 2) +
        Math.pow(groupSDs[1], 2) +
        Math.pow(groupSDs[2], 2)
    );

    // Step 5: Calculate SS Total
    const ssTotal = ssBetween + ssWithin;

    // Step 6: Retrieve user inputs
    const userSSBetween = parseFloat(document.getElementById("ss-between").value);
    const userSSWithin = parseFloat(document.getElementById("ss-within").value);
    const userSSTotal = parseFloat(document.getElementById("ss-total").value);

    // Step 7: Validate user inputs and provide feedback
    const feedback = document.getElementById("anova-feedback");
    let feedbackMessage = "";

    // Validate SS Between
    if (Math.abs(userSSBetween - ssBetween) < 0.01) {
        feedbackMessage += `<div style="color: green;">✔️ SS Between is correct.</div>`;
    } else {
        feedbackMessage += `<div style="color: red;">❌ SS Between is incorrect. Expected: ${ssBetween.toFixed(2)}.</div>`;
    }

    // Validate SS Within
    if (Math.abs(userSSWithin - ssWithin) < 0.01) {
        feedbackMessage += `<div style="color: green;">✔️ SS Within is correct.</div>`;
    } else {
        feedbackMessage += `<div style="color: red;">❌ SS Within is incorrect. Expected: ${ssWithin.toFixed(2)}.</div>`;
    }

    // Validate SS Total
    if (Math.abs(userSSTotal - ssTotal) < 0.01) {
        feedbackMessage += `<div style="color: green;">✔️ SS Total is correct.</div>`;
    } else {
        feedbackMessage += `<div style="color: red;">❌ SS Total is incorrect. Expected: ${ssTotal.toFixed(2)}.</div>`;
    }

    console.log("Group 1 Mean:", group1.mean);
    console.log("Group 2 Mean:", group2.mean);
    console.log("Group 3 Mean:", group3.mean);
    console.log("n:", n);
    console.log("Weighted Sum:", (groupMeans[0] * n + groupMeans[1] * n + groupMeans[2] * n).toFixed(2));
    console.log("Grand Mean:", grandMean.toFixed(2));

    // Display Feedback
    feedback.innerHTML = feedbackMessage;

    // Enable MS button if SS validation passes
    const msButton = document.getElementById("validate-ms");
    if (!feedbackMessage.includes("❌")) {
        msButton.disabled = false;
        msButton.style.backgroundColor = ""; // Reset to active style
    }
}

function validateMSColumn() {
    // Step 1: Retrieve generated data and SS values
    const currentProblem = problems[problems.length - 1];
    const { dfBetween, dfWithin } = currentProblem;

    const ssBetween = parseFloat(document.getElementById("ss-between").value);
    const ssWithin = parseFloat(document.getElementById("ss-within").value);

    // Step 2: Calculate MS Between and MS Within
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;

    // Step 3: Retrieve user inputs
    const userMSBetween = parseFloat(document.getElementById("ms-between").value);
    const userMSWithin = parseFloat(document.getElementById("ms-within").value);

    // Step 4: Validate user inputs
    const feedback = document.getElementById("anova-feedback");
    let feedbackMessage = "";

    // Validate MS Between
    if (Math.abs(userMSBetween - msBetween) < 0.01) {
        feedbackMessage += `<div style="color: green;">✔️ MS Between is correct.</div>`;
    } else {
        feedbackMessage += `<div style="color: red;">❌ MS Between is incorrect. Expected: ${msBetween.toFixed(2)}.</div>`;
    }

    // Validate MS Within
    if (Math.abs(userMSWithin - msWithin) < 0.01) {
        feedbackMessage += `<div style="color: green;">✔️ MS Within is correct.</div>`;
    } else {
        feedbackMessage += `<div style="color: red;">❌ MS Within is incorrect. Expected: ${msWithin.toFixed(2)}.</div>`;
    }

    // Display Feedback
    feedback.innerHTML = feedbackMessage;
    // Enable F button if MS validation passes
    const fButton = document.getElementById("validate-f");
    if (!feedbackMessage.includes("❌")) {
        fButton.disabled = false;
        fButton.style.backgroundColor = ""; // Reset to active style
    }
}

function validateFColumn() {
    // Step 1: Retrieve user inputs for MS Between and MS Within
    const userMSBetween = parseFloat(document.getElementById("ms-between").value);
    const userMSWithin = parseFloat(document.getElementById("ms-within").value);
    const userFStatistic = parseFloat(document.getElementById("f-statistic").value);

    // Step 2: Calculate the F-statistic
    const calculatedFStatistic = userMSBetween / userMSWithin;

    // Step 3: Validate user input for F-statistic
    const feedback = document.getElementById("anova-feedback");
    let feedbackMessage = "";

    if (Math.abs(userFStatistic - calculatedFStatistic) < 0.01) {
        feedbackMessage += `<div style="color: green;">✔️ F-Statistic is correct.</div>`;
        feedback.innerHTML = feedbackMessage;
        showStep("step-5-decision");
        document.getElementById("calculated-f-display").innerText = calculatedFStatistic.toFixed(2);
        document.getElementById("critical-f-display").innerText = document.getElementById("critical-f-value").value;
    } else {
        feedbackMessage += `<div style="color: red;">❌ F-Statistic is incorrect. Expected: ${calculatedFStatistic.toFixed(2)}.</div>`;
    }

    // Display Feedback
    feedback.innerHTML = feedbackMessage;
}


// Event listeners
document.getElementById("generate-problem-button").addEventListener("click", generateProblem);
document.getElementById("submit-hypotheses-button").addEventListener("click", checkHypotheses);
document.getElementById("submit-df-button").addEventListener("click", checkDegreesOfFreedom);
document.getElementById("submit-critical-f-button").addEventListener("click", checkCriticalFValue);
document.getElementById("validate-ss").addEventListener("click", validateSSColumn);
document.getElementById("f-table-toggle-button").addEventListener("click", toggleFTable);
document.getElementById("close-f-table-button").addEventListener("click", closeFTable);
document.getElementById("validate-ms").addEventListener("click", validateMSColumn);
document.getElementById("validate-f").addEventListener("click", validateFColumn);
