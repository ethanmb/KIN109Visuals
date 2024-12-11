// Global variables to store scenario data
let n, testType, alpha, sumOfProducts, r, criticalValue, effectSize, data;

function toggleRTable() {
    const rTableDiv = document.getElementById("r-table");
    const toggleButton = document.getElementById("r-table-toggle-button");

    if (rTableDiv.classList.contains("hidden")) {
        // Show r table
        rTableDiv.classList.remove("hidden");
        toggleButton.innerText = "Close r Table";
        toggleButton.style.backgroundColor = "red"; // Change button color to red
    } else {
        // Hide r table
        rTableDiv.classList.add("hidden");
        toggleButton.innerText = "Open r Table";
        toggleButton.style.backgroundColor = "green"; // Change button color to green
    }
}

// Attach the toggle function to the button
document.getElementById("r-table-toggle-button").addEventListener("click", toggleRTable);


function generateData(n, highCorrelation = false) {
    // Generate data based on correlation type
    if (highCorrelation) {
        console.log("high")
        // Generate highly correlated data
        const zX = Array.from({ length: n }, () => parseFloat((Math.random() * 2 - 1).toFixed(2))); // Z-scores for X
        const zY = zX.map(x => parseFloat((x + (Math.random() * 0.05 - 0.01)).toFixed(2))); // Z-scores for Y (strongly correlated)
        return zX.map((x, i) => ({ zX: x, zY: zY[i] }));
    } else {
        // Generate weakly correlated (or uncorrelated) data
        return Array.from({ length: n }, () => ({
            zX: parseFloat((Math.random() * 2 - 1).toFixed(2)),
            zY: parseFloat((Math.random() * 2 - 1).toFixed(2))
        }));
    }
}


// Step 1: Generate Scenario
function generateScenario() {
    // Randomly generate n (sample size) between 5 and 10
    n = Math.floor(Math.random() * 6) + 5;

    // Randomly assign alpha (0.01 or 0.05)
    alpha = Math.random() < 0.5 ? 0.01 : 0.05;

    // Randomly determine test type (one-tailed or two-tailed)
    const testOptions = ["two-tailed", "one-tailed-positive", "one-tailed-negative"];
    testType = testOptions[Math.floor(Math.random() * testOptions.length)];

    // Decide if the data should be highly correlated
    const highCorrelation = Math.random() < 0.5; // 50% chance of high correlation

    // Generate data
    data = generateData(n, highCorrelation);

    const df = n - 2;
    // Retrieve the critical value
    try {
        criticalValue = getCriticalValue(df, alpha, testType);
        console.log(`Critical Value for df=${df}, alpha=${alpha}, testType=${testType}: ±${criticalValue.toFixed(3)}`);
    } catch (error) {
        console.error("Error calculating critical value:", error.message);
    }

    // Craft scenario text based on test type
    let scenarioText = `A researcher is testing whether there is a relationship between two variables using a `;
    if (testType === "two-tailed") {
        scenarioText += `two-tailed test. They want to determine if the correlation between the variables is significantly different from zero, regardless of direction (positive or negative).`;
    } else if (testType === "one-tailed-positive") {
        scenarioText += `one-tailed test to determine if there is a positive correlation between the variables (e.g., as one variable increases, so does the other).`;
    } else if (testType === "one-tailed-negative") {
        scenarioText += `one-tailed test to determine if there is a negative correlation between the variables (e.g., as one variable increases, the other decreases).`;
    }
    scenarioText += ` The significance level is α = ${alpha}, and there are ${n} participants in the study.`;

    // Display the scenario
    document.getElementById("scenario").textContent = scenarioText;

    // Show the data table container
    document.getElementById("data-table-container").style.display = "block";

    document.getElementById("test-type-display").textContent = testType === "two-tailed"
    ? "Two-Tailed"
    : testType === "one-tailed-positive"
    ? "One-Tailed Positive"
    : "One-Tailed Negative";
    document.getElementById("critical-value-display").textContent = criticalValue.toFixed(3);


    // Populate the data table
    populateDataTable();

    // Show the next step
    document.getElementById("step-2").style.display = "block";
    setInstructionsForStep2();
}



// Populate data table dynamically
function populateDataTable() {
    const tableBody = document.getElementById("data-table-body");

    // Create table rows for each participant
    tableBody.innerHTML = data
        .map((row, index) => `<tr><td>${index + 1}</td><td>${row.zX}</td><td>${row.zY}</td></tr>`)
        .join('');

    // Ensure the table container is visible
    document.getElementById("data-table").style.display = "block";
}


// Step 2: Set Hypotheses Instructions
function setInstructionsForStep2() {
    const instructions = testType === "two-tailed"
        ? "Set up a two-tailed test (H₁: ρ ≠ 0)."
        : testType === "one-tailed-positive"
        ? "Set up a one-tailed test for a positive correlation (H₁: ρ > 0)."
        : "Set up a one-tailed test for a negative correlation (H₁: ρ < 0).";
    document.getElementById("step-3-instructions").textContent = instructions;
}

function normalizeString(input) {
    // Convert to lowercase and remove extra spaces
    return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function checkRejectionRule() {
    const rejectionRule = document.getElementById("rejection-rule").value.trim();
    const testType = document.getElementById("test-type-display").textContent; // Test type (e.g., "Two-Tailed")
    const criticalValue = parseFloat(document.getElementById("critical-value-display").textContent); // Critical value

    // Determine the correct rejection rule based on the test type
    let correctRule;
    if (testType === "Two-Tailed") {
        correctRule = `If r < -${criticalValue.toFixed(3)} or r > ${criticalValue.toFixed(3)}, Reject H0; otherwise do not reject.`;
    } else if (testType === "One-Tailed Positive") {
        correctRule = `If r > ${criticalValue.toFixed(3)}, Reject H0; otherwise do not reject.`;
    } else if (testType === "One-Tailed Negative") {
        correctRule = `If r < -${criticalValue.toFixed(3)}, Reject H0; otherwise do not reject.`;
    } else {
        const fallbackRule = `Two-Tailed: If r < -${criticalValue.toFixed(3)} or r > ${criticalValue.toFixed(3)}, Reject H0; otherwise do not reject. ` +
                             `One-Tailed Positive: If r > ${criticalValue.toFixed(3)}, Reject H0; otherwise do not reject. ` +
                             `One-Tailed Negative: If r < -${criticalValue.toFixed(3)}, Reject H0; otherwise do not reject.`;
        document.getElementById("result-rejection-rule").textContent = `Error: Invalid test type. Valid rejection rules are:\n${fallbackRule}`;
        document.getElementById("result-rejection-rule").className = "result incorrect";
        return;
    }

    // Normalize user input for comparison
    const normalizedUserRule = normalizeString(rejectionRule);
    const normalizedCorrectRule = normalizeString(correctRule);

    // Special handling for Two-Tailed Test
    if (testType === "Two-Tailed") {
        const startsCorrectly = normalizedUserRule.startsWith("if r");
        const includesLower = normalizedUserRule.includes(`r < -${criticalValue.toFixed(3)}`);
        const includesUpper = normalizedUserRule.includes(`r > ${criticalValue.toFixed(3)}`);
        const includesRejection = normalizedUserRule.includes("reject h0");
        const includesNonRejection = normalizedUserRule.includes("otherwise do not reject");

        if (startsCorrectly && includesLower && includesUpper && includesRejection && includesNonRejection) {
            document.getElementById("result-rejection-rule").textContent = "Correct! Your rejection rule is valid.";
            document.getElementById("result-rejection-rule").className = "result correct";
            document.getElementById("step-5").style.display = "block"; // Proceed to the next step
            return;
        } else {
            document.getElementById("result-rejection-rule").textContent = `Incorrect. The correct rule is: "${correctRule}".`;
            document.getElementById("result-rejection-rule").className = "result incorrect";
            return;
        }
    }

    // Validation for One-Tailed Positive Test
    if (testType === "One-Tailed Positive") {
        const startsCorrectly = normalizedUserRule.startsWith("if r");
        const includesUpper = normalizedUserRule.includes(`r > ${criticalValue.toFixed(3)}`);
        const includesRejection = normalizedUserRule.includes("reject h0");
        const includesNonRejection = normalizedUserRule.includes("otherwise do not reject");

        if (startsCorrectly && includesUpper && includesRejection && includesNonRejection) {
            document.getElementById("result-rejection-rule").textContent = "Correct! Your rejection rule is valid.";
            document.getElementById("result-rejection-rule").className = "result correct";
            document.getElementById("step-5").style.display = "block"; // Proceed to the next step
            return;
        } else {
            document.getElementById("result-rejection-rule").textContent = `Incorrect. The correct rule is: "${correctRule}".`;
            document.getElementById("result-rejection-rule").className = "result incorrect";
            return;
        }
    }

    // Validation for One-Tailed Negative Test
    if (testType === "One-Tailed Negative") {
        const startsCorrectly = normalizedUserRule.startsWith("if r");
        const includesLower = normalizedUserRule.includes(`r < -${criticalValue.toFixed(3)}`);
        const includesRejection = normalizedUserRule.includes("reject h0");
        const includesNonRejection = normalizedUserRule.includes("otherwise do not reject");

        if (startsCorrectly && includesLower && includesRejection && includesNonRejection) {
            document.getElementById("result-rejection-rule").textContent = "Correct! Your rejection rule is valid.";
            document.getElementById("result-rejection-rule").className = "result correct";
            document.getElementById("step-5").style.display = "block"; // Proceed to the next step
            return;
        } else {
            document.getElementById("result-rejection-rule").textContent = `Incorrect. The correct rule is: "${correctRule}".`;
            document.getElementById("result-rejection-rule").className = "result incorrect";
            return;
        }
    }
}




// Drag-and-Drop Logic
function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    event.target.textContent = document.getElementById(data).textContent;
}

// Step 3: Check Hypotheses
function checkHypotheses() {
    const h0Symbol = document.getElementById("h0-symbol-drop").textContent.trim();
    const h1Symbol = document.getElementById("h1-symbol-drop").textContent.trim();

    // Determine correct symbols based on test type
    let correctH0, correctH1;
    if (testType === "two-tailed") {
        correctH0 = "=";
        correctH1 = "≠";
    } else if (testType === "one-tailed-positive") {
        correctH0 = "=";
        correctH1 = ">";
    } else if (testType === "one-tailed-negative") {
        correctH0 = "=";
        correctH1 = "<";
    }

    if (h0Symbol === correctH0 && h1Symbol === correctH1) {
        document.getElementById("result-hypo").textContent = "Correct! You've set up the hypotheses correctly.";
        document.getElementById("result-hypo").className = "result correct";

        // Show the next step
        document.getElementById("step-4").style.display = "block";
    } else {
        document.getElementById("result-hypo").textContent = `Incorrect. For a ${testType.replace('-', ' ')} test, the null hypothesis should use '${correctH0}' and the alternative should use '${correctH1}'.`;
        document.getElementById("result-hypo").className = "result incorrect";
    }
}

// Step 4: Check Test Statistic
function checkTestStatistic() {
    const userSumOfProducts = parseFloat(document.getElementById("sum-of-products").value);
    const userR = parseFloat(document.getElementById("correlation").value);

    // Calculate correct values
    sumOfProducts = data.reduce((sum, row) => sum + row.zX * row.zY, 0).toFixed(2); // Sum of products
    r = parseFloat((sumOfProducts / (n - 1)).toFixed(2)); // Correlation coefficient

    if (Math.abs(userSumOfProducts - sumOfProducts) < 0.01 && Math.abs(userR - r) < 0.01) {
        document.getElementById("result-step3").textContent = "Correct! You've calculated the test statistic.";
        document.getElementById("result-step3").className = "result correct";

        // Calculate degrees of freedom
        const df = n - 2;

        // Retrieve the critical value using the provided function
        try {
            criticalValue = getCriticalValue(df, alpha, testType);
        } catch (error) {
            document.getElementById("result-step3").textContent = `Error: ${error.message}`;
            document.getElementById("result-step3").className = "result incorrect";
            return;
        }

        // Display the next step and calculated values
        document.getElementById("step-6").style.display = "block";
        document.getElementById("calculated-r").textContent = `${r.toFixed(3)}`;
    } else {
        const feedback = [];
        if (Math.abs(userSumOfProducts - sumOfProducts) >= 0.01) {
            feedback.push(`The correct sum of products (ΣZₓZᵧ) is ${sumOfProducts}.`);
        }
        if (Math.abs(userR - r) >= 0.01) {
            feedback.push(`The correct correlation coefficient (r) is ${r}.`);
        }
        document.getElementById("result-step3").textContent = `Incorrect. ${feedback.join(' ')}`;
        document.getElementById("result-step3").className = "result incorrect";
    }
}


function getCriticalValue(df, alpha, testType) {

     // Normalize testType to handle one-tailed-positive and one-tailed-negative as "one-tailed"
     if (testType === "one-tailed-positive" || testType === "one-tailed-negative") {
        testType = "one-tailed";
    }

    const criticalValues = {
        1: { "0.05-one-tailed": 0.988, "0.05-two-tailed": 0.997, "0.01-one-tailed": 0.9995, "0.01-two-tailed": 0.9999 },
        2: { "0.05-one-tailed": 0.900, "0.05-two-tailed": 0.950, "0.01-one-tailed": 0.980, "0.01-two-tailed": 0.990 },
        3: { "0.05-one-tailed": 0.805, "0.05-two-tailed": 0.878, "0.01-one-tailed": 0.934, "0.01-two-tailed": 0.959 },
        4: { "0.05-one-tailed": 0.729, "0.05-two-tailed": 0.811, "0.01-one-tailed": 0.882, "0.01-two-tailed": 0.917 },
        5: { "0.05-one-tailed": 0.669, "0.05-two-tailed": 0.755, "0.01-one-tailed": 0.833, "0.01-two-tailed": 0.875 },
        6: { "0.05-one-tailed": 0.621, "0.05-two-tailed": 0.707, "0.01-one-tailed": 0.789, "0.01-two-tailed": 0.834 },
        7: { "0.05-one-tailed": 0.582, "0.05-two-tailed": 0.666, "0.01-one-tailed": 0.750, "0.01-two-tailed": 0.798 },
        8: { "0.05-one-tailed": 0.549, "0.05-two-tailed": 0.632, "0.01-one-tailed": 0.715, "0.01-two-tailed": 0.765 },
        9: { "0.05-one-tailed": 0.521, "0.05-two-tailed": 0.602, "0.01-one-tailed": 0.682, "0.01-two-tailed": 0.735 },
        10: { "0.05-one-tailed": 0.497, "0.05-two-tailed": 0.576, "0.01-one-tailed": 0.658, "0.01-two-tailed": 0.708 },
        11: { "0.05-one-tailed": 0.476, "0.05-two-tailed": 0.553, "0.01-one-tailed": 0.634, "0.01-two-tailed": 0.684 },
        12: { "0.05-one-tailed": 0.457, "0.05-two-tailed": 0.532, "0.01-one-tailed": 0.612, "0.01-two-tailed": 0.661 },
        13: { "0.05-one-tailed": 0.441, "0.05-two-tailed": 0.514, "0.01-one-tailed": 0.592, "0.01-two-tailed": 0.641 },
        14: { "0.05-one-tailed": 0.426, "0.05-two-tailed": 0.497, "0.01-one-tailed": 0.574, "0.01-two-tailed": 0.623 },
        15: { "0.05-one-tailed": 0.412, "0.05-two-tailed": 0.482, "0.01-one-tailed": 0.558, "0.01-two-tailed": 0.606 },
        16: { "0.05-one-tailed": 0.400, "0.05-two-tailed": 0.468, "0.01-one-tailed": 0.542, "0.01-two-tailed": 0.590 },
        17: { "0.05-one-tailed": 0.389, "0.05-two-tailed": 0.456, "0.01-one-tailed": 0.529, "0.01-two-tailed": 0.575 },
        18: { "0.05-one-tailed": 0.379, "0.05-two-tailed": 0.444, "0.01-one-tailed": 0.515, "0.01-two-tailed": 0.561 },
        19: { "0.05-one-tailed": 0.369, "0.05-two-tailed": 0.433, "0.01-one-tailed": 0.503, "0.01-two-tailed": 0.549 },
        20: { "0.05-one-tailed": 0.360, "0.05-two-tailed": 0.423, "0.01-one-tailed": 0.492, "0.01-two-tailed": 0.537 },
        21: { "0.05-one-tailed": 0.352, "0.05-two-tailed": 0.413, "0.01-one-tailed": 0.482, "0.01-two-tailed": 0.526 },
        22: { "0.05-one-tailed": 0.344, "0.05-two-tailed": 0.404, "0.01-one-tailed": 0.472, "0.01-two-tailed": 0.515 },
        23: { "0.05-one-tailed": 0.337, "0.05-two-tailed": 0.396, "0.01-one-tailed": 0.462, "0.01-two-tailed": 0.505 },
        24: { "0.05-one-tailed": 0.330, "0.05-two-tailed": 0.388, "0.01-one-tailed": 0.453, "0.01-two-tailed": 0.496 },
        25: { "0.05-one-tailed": 0.323, "0.05-two-tailed": 0.381, "0.01-one-tailed": 0.445, "0.01-two-tailed": 0.487 },
        26: { "0.05-one-tailed": 0.317, "0.05-two-tailed": 0.374, "0.01-one-tailed": 0.437, "0.01-two-tailed": 0.479 },
        27: { "0.05-one-tailed": 0.311, "0.05-two-tailed": 0.367, "0.01-one-tailed": 0.430, "0.01-two-tailed": 0.471 },
        28: { "0.05-one-tailed": 0.306, "0.05-two-tailed": 0.361, "0.01-one-tailed": 0.423, "0.01-two-tailed": 0.463 },
        29: { "0.05-one-tailed": 0.301, "0.05-two-tailed": 0.355, "0.01-one-tailed": 0.416, "0.01-two-tailed": 0.456 },
        30: { "0.05-one-tailed": 0.296, "0.05-two-tailed": 0.349, "0.01-one-tailed": 0.409, "0.01-two-tailed": 0.449 },
        40: { "0.05-one-tailed": 0.257, "0.05-two-tailed": 0.304, "0.01-one-tailed": 0.358, "0.01-two-tailed": 0.393 },
        60: { "0.05-one-tailed": 0.211, "0.05-two-tailed": 0.250, "0.01-one-tailed": 0.295, "0.01-two-tailed": 0.325 },
        120: { "0.05-one-tailed": 0.150, "0.05-two-tailed": 0.178, "0.01-one-tailed": 0.210, "0.01-two-tailed": 0.232 },
        "infinity": { "0.05-one-tailed": 0.117, "0.05-two-tailed": 0.150, "0.01-one-tailed": 0.178, "0.01-two-tailed": 0.210 },
    };

    // Determine the key for one-tailed or two-tailed test
    const alphaKey = `${alpha.toFixed(2)}-${testType}`;

    // Determine the degrees of freedom category
    let dfKey = df;
    if (df > 120) {
        dfKey = "infinity";
    } else if (!criticalValues[dfKey]) {
        // If df is not listed, throw an error
        throw new Error(`Critical value for df = ${df} not found in the table.`);
    }

    // Return the corresponding critical value
    if (criticalValues[dfKey] && criticalValues[dfKey][alphaKey]) {
        return criticalValues[dfKey][alphaKey];
    } else {
        throw new Error(
            `Critical value not found for alpha = ${alpha}, df = ${df}, testType = ${testType}`
        );
    }
}

// Example usage
try {
    console.log(getCriticalValue(28, 0.01, "two-tailed")); // Expected: 0.463
    console.log(getCriticalValue(15, 0.05, "one-tailed")); // Expected: 0.412
} catch (error) {
    console.error(error.message);
}

// Step 2: Check Critical Value
function checkCriticalValue() {
    const userCriticalValue = parseFloat(document.getElementById("user-critical-value").value);

    if (Math.abs(userCriticalValue - criticalValue) < 0.001) {
        document.getElementById("result-critical-value").textContent = "Correct! You've identified the critical value.";
        document.getElementById("result-critical-value").className = "result correct";

        // Proceed to the next step
        document.getElementById("step-3").style.display = "block";
    } else {
        document.getElementById("result-critical-value").textContent = `Incorrect. The correct critical value is ±${criticalValue.toFixed(3)}.`;
        document.getElementById("result-critical-value").className = "result incorrect";
    }
}


// Step 4: Check Decision
function checkDecision() {
    const userDecision = document.getElementById("decision").value;

    // Determine correct decision based on critical value
    const correctDecision = Math.abs(r) >= criticalValue ? "reject" : "fail-to-reject";

    if (userDecision === correctDecision) {
        document.getElementById("result-step4").textContent = "Correct! Your decision is consistent with the test statistic.";
        document.getElementById("result-step4").className = "result correct";

        // Show Step 5
        document.getElementById("step-7").style.display = "block";
    } else {
        const feedback = `The correct decision is to ${correctDecision} the null hypothesis because the correlation coefficient (${r.toFixed(
            3
        )}) is ${
            correctDecision === "reject" ? "greater than or equal to" : "less than"
        } the critical value (${criticalValue.toFixed(3)}).`;
        document.getElementById("result-step4").textContent = `Incorrect. ${feedback}`;
        document.getElementById("result-step4").className = "result incorrect";
    }
}

// Step 6: Decision

// Step 7: Check Effect Size
function checkEffectSize() {
    console.log("checkEffectSize function triggered");

    const userEffectSize = parseFloat(document.getElementById("effect-size").value);

    // Calculate correct effect size
    effectSize = parseFloat((r ** 2).toFixed(2));
    console.log(`Effect Size: ${effectSize}, User Input: ${userEffectSize}`);

    if (Math.abs(userEffectSize - effectSize) < 0.01) {
        console.log("Correct effect size calculated");
        document.getElementById("result-step5").textContent = "Correct! You've calculated the effect size.";
        document.getElementById("result-step5").className = "result correct";


        // Show "Generate New Problem" button
        const generateButton = document.getElementById("generate-problem-button");
        console.log("Generate Button:", generateButton);

        if (generateButton) {
            generateButton.classList.remove("hidden");
        } else {
            console.error("Generate Problem Button not found!");
        }
    } else {
        console.log("Incorrect effect size calculated");
        document.getElementById("result-step5").textContent = "Incorrect. Please check your calculations.";
        document.getElementById("result-step5").className = "result incorrect";
    }
}



function generateNewProblem() {
    console.log("Generating a new problem...");

    // Hide all steps
    const steps = [
        "data-table-container",
        "step-2",
        "step-3",
        "step-4",
        "step-5",
        "step-6",
        "step-7"
    ];

    steps.forEach(stepId => {
        const element = document.getElementById(stepId);
        if (element) {
            element.style.display = "none";
            console.log(`Hid step: ${stepId}`);
        }
    });

    // Clear all inputs
    const inputFields = [
        "user-critical-value",
        "sum-of-products",
        "correlation",
        "rejection-rule",
        "decision",
        "effect-size"
    ];

    inputFields.forEach(inputId => {
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            if (inputElement.tagName === "SELECT") {
                inputElement.value = ""; // Reset dropdown
            } else if (inputElement.tagName === "TEXTAREA" || inputElement.tagName === "INPUT") {
                inputElement.value = ""; // Reset text input and text area
            }
            console.log(`Cleared input: ${inputId}`);
        }
    });

    // Clear results or feedback
    const resultElements = [
        "result-critical-value",
        "result-hypo",
        "result-rejection-rule",
        "result-step3",
        "result-step4",
        "result-step5"
    ];

    resultElements.forEach(resultId => {
        const resultElement = document.getElementById(resultId);
        if (resultElement) {
            resultElement.textContent = ""; // Clear feedback text
            resultElement.className = "result"; // Reset class
            console.log(`Cleared result: ${resultId}`);
        }
    });

    // Reset data table body
    const dataTableBody = document.getElementById("data-table-body");
    if (dataTableBody) {
        dataTableBody.innerHTML = "";
        console.log("Cleared data table.");
    }

    // Reset drag-and-drop areas
    const dropAreas = [
        { id: "h0-symbol-drop", placeholder: "[Drop Here]" },
        { id: "h1-symbol-drop", placeholder: "[Drop Here]" }
    ];

    dropAreas.forEach(dropArea => {
        const element = document.getElementById(dropArea.id);
        if (element) {
            element.textContent = dropArea.placeholder; // Reset to placeholder text
            console.log(`Reset drag-and-drop area: ${dropArea.id}`);
        }
    });

    // Call generateScenario to create a new problem
    generateScenario();
}
