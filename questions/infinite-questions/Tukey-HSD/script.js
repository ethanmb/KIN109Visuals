// Define global variables
let currentProblem = {};

// Define functions
function generateRawData(mean, sd, n) {
    return Array.from({ length: n }, () => {
        return (mean + jStat.normal.sample(0, sd)).toFixed(2);
    });
}

function renderHSDFormula() {
    const formulaContainer = document.getElementById("hsd-formula");
    formulaContainer.innerHTML = `\\[ \\text{HSD} = q \\cdot \\sqrt{\\frac{\\text{MS}_{\\text{error}}}{n}} \\]`;
    MathJax.typeset(); // Re-render MathJax content
}


function clearTable() {
    // Reset all inputs
    document.querySelectorAll("#calculation-area input").forEach(input => {
        input.value = ""; // Clear input values
        input.disabled = false; // Re-enable all inputs
    });

    // Clear feedback messages
    document.getElementById("pairwise-differences-feedback").innerHTML = "";
    document.getElementById("significance-feedback").innerHTML = "";
    document.getElementById("hsd-feedback").innerHTML = "";

    // Reset validation buttons
    document.getElementById("validate-differences").disabled = false; // Enable Check Differences
    document.getElementById("validate-significance").disabled = true; // Disable Check Significance
    document.getElementById("validate-hsd").disabled = false; // Disable Check HSD

    // Hide the "Generate New Problem" button
    document.getElementById("generate-new-problem-button").classList.add("hidden");
}



function calculateStatistics(group1, group2, group3) {
    const allGroups = [group1, group2, group3];

    // Calculate group means
    const groupMeans = allGroups.map(group => jStat.mean(group.map(Number)));

    // Calculate grand mean
    const grandMean = jStat.mean(groupMeans);

    // Sample size (assumes equal n across groups)
    const n = group1.length;

    // Sum of squares between groups (SSB)
    const ssBetween = n * groupMeans.reduce((sum, mean) => sum + Math.pow(mean - grandMean, 2), 0);

    // Sum of squares within groups (SSW)
    const ssWithin = allGroups.reduce((total, group, idx) => {
        return total + group.reduce((sum, value) => {
            return sum + Math.pow(value - groupMeans[idx], 2);
        }, 0);
    }, 0);

    // Degrees of freedom within groups
    const dfWithin = group1.length * 3 - 3; // (n * k) - k

    // Mean square error
    const mse = ssWithin / dfWithin;

    // Return all computed statistics
    return { ssBetween, ssWithin, mse, groupMeans, grandMean, dfWithin };
}


function generateProblem() {
    console.log("Generate Problem Button Clicked!");

    // Generate raw data for each group
    const n = Math.floor(Math.random() * 6) + 5; // Random sample size (5 to 10)
    const group1 = generateRawData(40, 5, n); // Mean = 40, SD = 5
    const group2 = generateRawData(35, 5, n); // Mean = 35, SD = 5
    const group3 = generateRawData(45, 5, n); // Mean = 45, SD = 5

    // Compute statistics using calculateStatistics
    const { ssBetween, ssWithin, mse, groupMeans, grandMean, dfWithin } =
        calculateStatistics(group1, group2, group3);

    // Store current problem details
    currentProblem = { group1, group2, group3, mse, groupMeans, dfWithin, n };

    // Question text
    const questionText = `
        A researcher conducted an experiment to evaluate the effectiveness of three recovery methods:
        Foam Rolling, Massage, and Compression Gear. The table below summarizes the group statistics.
        Conduct Tukey's HSD test to determine which methods significantly differ at α = 0.05. 
        Mean Square Error (MSE): ${mse.toFixed(2)}, Degrees of Freedom (Within): ${dfWithin}.
    `;

    // Update problem description
    const problemDescription = document.getElementById("problem-description");
    problemDescription.innerHTML = questionText;

    // Populate the table dynamically
    const problemTableBody = document.querySelector("#problem-table tbody");
    problemTableBody.innerHTML = `
        <tr>
            <td>1. Foam Rolling</td>
            <td>${groupMeans[0].toFixed(2)}</td>
            <td>${jStat.stdev(group1.map(Number)).toFixed(2)}</td>
            <td>${n}</td>
        </tr>
        <tr>
            <td>2. Massage</td>
            <td>${groupMeans[1].toFixed(2)}</td>
            <td>${jStat.stdev(group2.map(Number)).toFixed(2)}</td>
            <td>${n}</td>
        </tr>
        <tr>
            <td>3. Compression Gear</td>
            <td>${groupMeans[2].toFixed(2)}</td>
            <td>${jStat.stdev(group3.map(Number)).toFixed(2)}</td>
            <td>${n}</td>
        </tr>
    `;

    // Remove hidden class to show elements
    document.getElementById("problem-description").classList.remove("hidden");
    document.getElementById("problem-header").classList.remove("hidden");
    document.getElementById("problem-table").classList.remove("hidden");
    document.getElementById("calculation-area").classList.remove("hidden");
}


function toggleQTable() {
    const qTableDiv = document.getElementById("q-table");
    const toggleButton = document.getElementById("q-table-toggle-button");

    if (qTableDiv.classList.contains("hidden")) {
        // Show q-table
        qTableDiv.classList.remove("hidden");
        toggleButton.innerText = "Close q Table";
        toggleButton.style.backgroundColor = "red"; // Change to red
    } else {
        // Hide q-table
        qTableDiv.classList.add("hidden");
        toggleButton.innerText = "Open q Table";
        toggleButton.style.backgroundColor = "green"; // Change to green
    }
}

// Attach the toggle function to the button
document.getElementById("q-table-toggle-button").addEventListener("click", toggleQTable);


function closeQTable() {
    const qTableDiv = document.getElementById("q-table");
    const toggleButton = document.getElementById("q-table-toggle-button");

    // Hide q-table and reset button text
    qTableDiv.classList.add("hidden");
    toggleButton.innerText = "Open q Table";
}

// Attach the toggle function to the button
document.getElementById("q-table-toggle-button").addEventListener("click", toggleQTable);

const qTable = {
    5: 4.60,
    6: 4.34,
    7: 4.16,
    8: 4.04,
    9: 3.95,
    10: 3.88,
    11: 3.82,
    12: 3.77,
    13: 3.73,
    14: 3.70,
    15: 3.67,
    16: 3.65,
    17: 3.63,
    18: 3.61,
    19: 3.59,
    20: 3.58,
    24: 3.53,
    30: 3.49,
    40: 3.44,
    60: 3.40,
    120: 3.36,
    "Infinity": 3.31,
};

const groupComparisonNames = {
    "row-g1-g2": "Group 1 vs Group 2",
    "row-g1-g3": "Group 1 vs Group 3",
    "row-g2-g3": "Group 2 vs Group 3"
};


function getCriticalQ(dfWithin) {
    const keys = Object.keys(qTable).map(Number).sort((a, b) => a - b); // Sorted keys
    for (let i = 0; i < keys.length; i++) {
        if (dfWithin <= keys[i]) {
            return qTable[keys[i]];
        }
    }
    return qTable["Infinity"]; // Default to the largest df value
}

function validateDifferences() {
    const { groupMeans } = currentProblem;

    const pairwiseDiffs = [
        Math.abs(groupMeans[0] - groupMeans[1]), // Group 1 vs Group 2
        Math.abs(groupMeans[0] - groupMeans[2]), // Group 1 vs Group 3
        Math.abs(groupMeans[1] - groupMeans[2])  // Group 2 vs Group 3
    ];

    const inputIDs = ["diff-g1-g2", "diff-g1-g3", "diff-g2-g3"];
    const rowIDs = ["row-g1-g2", "row-g1-g3", "row-g2-g3"];

    let feedbackMessage = "";
    let allCorrect = true;

    pairwiseDiffs.forEach((expectedDiff, idx) => {
        const diffInput = document.getElementById(inputIDs[idx]);
        const row = document.getElementById(rowIDs[idx]);

        if (!diffInput) {
            console.error(`Missing input for comparison ${rowIDs[idx]}`);
            return;
        }

        const userDiff = parseFloat(diffInput.value);
        const comparison = groupComparisonNames[rowIDs[idx]]; // Get user-friendly name

        if (isNaN(userDiff)) {
            feedbackMessage += `<div style="color: red;">❌ ${comparison}: Please enter a valid number.</div>`;
            allCorrect = false;
            return;
        }

        if (Math.abs(userDiff - expectedDiff) < 0.01) {
            feedbackMessage += `<div style="color: green;">✔️ ${comparison}: Difference is correct.</div>`;
            diffInput.disabled = true; // Lock the input field
        } else {
            feedbackMessage += `<div style="color: red;">❌ ${comparison}: Difference is incorrect. Expected: ${expectedDiff.toFixed(2)}.</div>`;
            allCorrect = false;
        }
    });

    // Append feedback message
    document.getElementById("pairwise-differences-feedback").innerHTML = feedbackMessage;

    // Enable "Check Significance" button if all differences are correct
    if (allCorrect) {
        document.getElementById("validate-significance").disabled = false;
    }
}





function validateSignificance() {
    const { groupMeans, mse, n } = currentProblem;

    const hsd = getCriticalQ(currentProblem.dfWithin) * Math.sqrt(mse / n);
    const pairwiseDiffs = [
        Math.abs(groupMeans[0] - groupMeans[1]), // Group 1 vs Group 2
        Math.abs(groupMeans[0] - groupMeans[2]), // Group 1 vs Group 3
        Math.abs(groupMeans[1] - groupMeans[2])  // Group 2 vs Group 3
    ];

    const inputIDs = ["significant-g1-g2", "significant-g1-g3", "significant-g2-g3"];
    const rowIDs = ["row-g1-g2", "row-g1-g3", "row-g2-g3"];

    let feedbackMessage = "";
    let allCorrect = true;

    pairwiseDiffs.forEach((diff, idx) => {
        const significanceInput = document.getElementById(inputIDs[idx]);
        const row = document.getElementById(rowIDs[idx]);

        if (!significanceInput) {
            console.error(`Missing significance input for ${rowIDs[idx]}`);
            return;
        }

        const userSignificance = significanceInput.value.toLowerCase();

        if (userSignificance !== "yes" && userSignificance !== "no") {
            feedbackMessage += `<div style="color: red;">❌ ${groupComparisonNames[rowIDs[idx]]}: Invalid input. Please enter "Yes" or "No".</div>`;
            allCorrect = false;
            return;
        }

        const isSignificant = diff > hsd;

        if ((userSignificance === "yes") === isSignificant) {
            feedbackMessage += `<div style="color: green;">✔️ ${groupComparisonNames[rowIDs[idx]]}: Significance judgment is correct.</div>`;
            significanceInput.disabled = true;
        } else {
            const expected = isSignificant ? "Yes" : "No";
            feedbackMessage += `<div style="color: red;">❌ ${groupComparisonNames[rowIDs[idx]]}: Significance judgment is incorrect. Expected: ${expected}.</div>`;
            allCorrect = false;
        }
    });

    document.getElementById("significance-feedback").innerHTML = feedbackMessage;

    if (allCorrect) {
        document.getElementById("validate-hsd").disabled = false;

        // If everything is correct, show the "Generate New Problem" button
        document.getElementById("generate-new-problem-button").classList.remove("hidden");
    }
}






function validateHSD() {
    const { mse, n } = currentProblem;

    const expectedHSD = getCriticalQ(currentProblem.dfWithin) * Math.sqrt(mse / n);
    const userHSD = parseFloat(document.getElementById("hsd-input").value);

    let feedbackMessage = "";

    if (Math.abs(userHSD - expectedHSD) < 0.01) {
        feedbackMessage += `<div style="color: green;">✔️ HSD is correct.</div>`;
        document.getElementById("hsd-input").disabled = true;
    } else {
        feedbackMessage += `<div style="color: red;">❌ HSD is incorrect. Expected: ${expectedHSD.toFixed(2)}.</div>`;
    }

    // Append feedback message
    document.getElementById("hsd-feedback").innerHTML = feedbackMessage;
}




function showQTable() {
    document.getElementById("q-table-modal").classList.remove("hidden");
}

function closeQTable() {
    document.getElementById("q-table-modal").classList.add("hidden");
}


// Attach event listeners
document.getElementById("generate-problem-button").addEventListener("click", generateProblem);
document.getElementById("validate-differences").addEventListener("click", validateDifferences);
document.getElementById("validate-significance").addEventListener("click", validateSignificance);
document.getElementById("validate-hsd").addEventListener("click", validateHSD);
document.getElementById("generate-new-problem-button").addEventListener("click", () => {
    clearTable(); // Clear the table
    generateProblem(); // Generate new problem
});
document.addEventListener("DOMContentLoaded", () => {
    renderHSDFormula(); // Render HSD formula on page load
});
