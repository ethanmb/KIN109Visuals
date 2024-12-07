// Define global variables
let currentProblem = {};

// Define functions
function generateRawData(mean, sd, n) {
    return Array.from({ length: n }, () => {
        return (mean + jStat.normal.sample(0, sd)).toFixed(2);
    });
}

function calculateStatistics(group1, group2, group3) {
    const allGroups = [group1, group2, group3];

    const groupMeans = allGroups.map(group => jStat.mean(group.map(Number)));
    const grandMean = jStat.mean(groupMeans);

    const n = group1.length;
    const ssBetween = n * groupMeans.reduce((sum, mean) => sum + Math.pow(mean - grandMean, 2), 0);

    const ssWithin = allGroups.reduce((total, group, idx) => {
        return total + group.reduce((sum, value) => {
            return sum + Math.pow(value - groupMeans[idx], 2);
        }, 0);
    }, 0);

    const dfWithin = group1.length * 3 - 3;
    const mse = ssWithin / dfWithin;

    return { ssBetween, ssWithin, mse, groupMeans, grandMean, dfWithin };
}

function generateProblem() {
    console.log("Generate Problem Button Clicked!");

    const n = Math.floor(Math.random() * 6) + 5; // Random sample size (5 to 10)
    const group1 = generateRawData(40, 5, n); // Mean = 40, SD = 5
    const group2 = generateRawData(35, 5, n); // Mean = 50, SD = 5
    const group3 = generateRawData(45, 5, n); // Mean = 35, SD = 5

    const { ssBetween, ssWithin, mse, groupMeans, grandMean, dfWithin } =
        calculateStatistics(group1, group2, group3);

    currentProblem = { group1, group2, group3, mse, groupMeans, dfWithin, n };

    // Question text
    const questionText = `
        A researcher conducted an experiment to evaluate the effectiveness of three recovery methods:
        Foam Rolling, Massage, and Compression Gear. The table below summarizes the group statistics.
        Conduct Tukey's HSD test to determine which methods significantly differ at α = 0.05. Mean Square Error (MSE): ${mse.toFixed(2)}, Degrees of Freedom (Within): ${dfWithin}.
    `;

    // Update problem description
    const problemDescription = document.getElementById("problem-description");
    problemDescription.innerHTML = questionText;

    // Populate the table dynamically
    const problemTableBody = document.querySelector("#problem-table tbody");
    problemTableBody.innerHTML = `
        <tr>
            <td>Foam Rolling</td>
            <td>${groupMeans[0].toFixed(2)}</td>
            <td>${jStat.stdev(group1.map(Number)).toFixed(2)}</td>
            <td>${n}</td>
        </tr>
        <tr>
            <td>Massage</td>
            <td>${groupMeans[1].toFixed(2)}</td>
            <td>${jStat.stdev(group2.map(Number)).toFixed(2)}</td>
            <td>${n}</td>
        </tr>
        <tr>
            <td>Compression Gear</td>
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


function submitResults() {
    const { groupMeans, mse, dfWithin, n } = currentProblem;
    const k = groupMeans.length; // Number of groups

    // Internal calculation of qCritical
    const alpha = 0.05;
    const qCritical = jStat.studentizedRange.inv(1 - alpha, k, dfWithin);
    const hsd = (qCritical * Math.sqrt(mse / n)).toFixed(2);

    // Calculate pairwise differences
    const pairwiseDiffs = [
        Math.abs(groupMeans[0] - groupMeans[1]),
        Math.abs(groupMeans[0] - groupMeans[2]),
        Math.abs(groupMeans[1] - groupMeans[2]),
    ];

    const feedback = pairwiseDiffs.map((diff, idx) => {
        const comparison = ["Group 1 vs Group 2", "Group 1 vs Group 3", "Group 2 vs Group 3"][idx];
        const significant = diff > hsd ? "Significant" : "Not Significant";
        return `<li>${comparison}: Difference = ${diff.toFixed(2)}, HSD = ${hsd}, ${significant}</li>`;
    }).join("");

    document.getElementById("feedback").innerHTML = `<ul>${feedback}</ul>`;
    document.getElementById("feedback-area").classList.remove("hidden");
}

function showQTable() {
    document.getElementById("q-table-modal").classList.remove("hidden");
}

function closeQTable() {
    document.getElementById("q-table-modal").classList.add("hidden");
}


// Attach event listeners
document.getElementById("generate-problem-button").addEventListener("click", generateProblem);
document.getElementById("submit-results-button").addEventListener("click", submitResults);
