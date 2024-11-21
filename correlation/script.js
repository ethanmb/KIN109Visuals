const width = 600, height = 400;
const margin = { top: 20, right: 20, bottom: 40, left: 40 };
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background-color", "#FFF")
    .on("click", function(event) {
        if (mode === 'add') {
            const coords = d3.pointer(event, this);  // Get coordinates relative to the SVG
            data.push({ x: xScale.invert(coords[0]), y: yScale.invert(coords[1]) });
            update();
            resetOriginalData();  // Reset original data after adding a point
        }
    });

svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .append("rect")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("fill", "transparent");


function scaleDatasaurus(data, xRange, yRange) {
    const xMin = d3.min(data, d => d.x);
    const xMax = d3.max(data, d => d.x);
    const yMin = d3.min(data, d => d.y);
    const yMax = d3.max(data, d => d.y);

    return data.map(d => ({
        x: ((d.x - xMin+7) / (xMax - xMin)) * (xRange[1] - xRange[0]) + xRange[0], // Scale x to [0, 120]
        y: ((d.y - yMin) / (yMax - yMin)) * (yRange[1] - yRange[0]) + yRange[0]  // Scale y to [80, 120]
    }));
}
    
function loadDatasaurus(callback) {
    d3.csv("datasaurus.csv").then(function(data) {
        // Filter for only rows with dataset == "dino"
        const dinoData = data.filter(d => d.dataset === "dino")
                             .map(d => ({
                                 x: +d.x,  // Convert x and y to numbers
                                 y: +d.y
                             }));
        
        // Scale the data to fit the chart's axis ranges
        const scaledData = scaleDatasaurus(dinoData, [0, 120], [80, 120]);
        
        callback(scaledData);
    });
}


let x = 0;
// Initialize the app with Datasaurus
loadDatasaurus(function(dinoData) {
    if (x === 0){
        originalData = dinoData; // Use the Datasaurus as the original dataset
        data = originalData.map(d => ({ ...d })); // Copy of the data for manipulation
        x=1;
        update(); // Render the initial chart with Datasaurus
    }
    else{
        return;
    }
});
let originalData = generateInitialData(); // Store the immutable original dataset
let data = originalData.map(d => ({ ...d })); // Create a working copy for modifications
let dataOriginal = data.map(d => ({ ...d })); // Store the original data points
let mode = 'add';
let sliderActive = false;

const xScale = d3.scaleLinear().domain([0, 120]).range([0, chartWidth]);
const yScale = d3.scaleLinear().domain([80, 120]).range([chartHeight, 0]);

const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top + chartHeight})`)
    .call(xAxis)
    .attr("class", "x-axis")
    .attr("color", "black");

svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .call(yAxis)
    .attr("class", "y-axis")
    .attr("color", "black");

// Line for the regression
const regressionLine = svg.append("line")
    .attr("stroke", "red")
    .attr("stroke-width", 2);

    function initializeVennDiagram(containerId, width, height, radius) {
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    
        // Initialize the left circle (blue)
        const circleX = svg.append("circle")
            .attr("cx", width / 2 - radius) // Start slightly left
            .attr("cy", height / 2) // Centered vertically
            .attr("r", radius)
            .attr("fill", "blue")
            .attr("opacity", 0.6);
    
        // Initialize the right circle (orange)
        const circleY = svg.append("circle")
            .attr("cx", width / 2 + radius) // Start slightly right
            .attr("cy", height / 2) // Centered vertically
            .attr("r", radius)
            .attr("fill", "orange")
            .attr("opacity", 0.6);
    
        return {
            svg,
            circleX,
            circleY,
            update(correlation) {
                const rSquared = Math.pow(correlation, 2); // Shared variance
                const maxDistance = 2 * radius; // Maximum distance when edges touch
                const distance = maxDistance * Math.sqrt(1 - rSquared); // Scaled distance between centers
            
                // Ensure overlap for both positive and negative correlations
                const leftCircleX = (width / 2) - Math.abs(distance / 2);
                const rightCircleX = (width / 2) + Math.abs(distance / 2);
            
                // Update positions of the circles
                circleX.attr("cx", leftCircleX);
                circleY.attr("cx", rightCircleX);
            
                // Update text for shared variance
                svg.selectAll("text").remove();
                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", height - 10)
                    .attr("text-anchor", "middle")
                    .text(`Shared Variance: ${(rSquared * 100).toFixed(1)}%`)
                    .style("font-size", "14px")
                    .style("fill", "#333");
            }
            
            
        };
    }
    

    

const vennDiagram = initializeVennDiagram("#vennDiagram", 300, 150, 50);

// Function to update the Venn diagram based on correlation
function updateVennDiagram(correlation) {
    // Calculate the overlap by adjusting the distance between circle centers
    const overlap = 100 - 100 * Math.abs(correlation);
    circleY.attr("cx", 50 + overlap);
}

// Function to generate initial random data points
function generateInitialData() {
    return d3.range(50).map(() => ({
        x: Math.random() * 110 + 10,  // x values will range from 10 to 120
        y: Math.random() * 30 + 85    // y values will range from 85 to 115
    }));
}

// Function to reset the original data array to the current state
function resetOriginalData() {
    sliderActive = false;  // Reset the slider state
    dataOriginal = data.map(d => ({ ...d }));  // Store the current state as the original
}

// Function to revert to a low correlation state (random distribution)
function revertToLowCorrelation() {
    const meanX = d3.mean(dataOriginal, d => d.x);
    const meanY = d3.mean(dataOriginal, d => d.y);
    const sdX = d3.deviation(dataOriginal, d => d.x);
    const sdY = d3.deviation(dataOriginal, d => d.y);

    // Revert points to a random distribution within the original data range
    data = data.map(() => ({
        x: meanX + (Math.random() - 0.5) * 2 * sdX,
        y: meanY + (Math.random() - 0.5) * 2 * sdY
    }));

    resetOriginalData();  // Reset the original data to the new low correlation state
    update();
}

// Function to update the entire visualization
function update() {
    const circles = svg.selectAll("circle").data(data);

    circles.enter()
        .append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 5)
        .attr("fill", "#00A47F")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("click", function(event, d) {
            event.stopPropagation(); // Prevent the SVG's click event from firing
            if (mode === 'delete') {
                data = data.filter(p => p !== d);
                // Revert to a low correlation state after removing a point
                if (Math.abs(calculateCorrelation(data)) > 0.8) {  // If the current correlation is high
                    //revertToLowCorrelation();
                } else {
                    resetOriginalData();  // Otherwise, just reset the original data
                }
                update();
            }
        })
        .on("mouseover", function(event, d) {
            if (mode === 'delete') {
                d3.select(this).attr("fill", "red").style("cursor", "pointer");
            } else if (mode === 'move') {
                d3.select(this).style("cursor", "grab");
            }
        })
        .on("mouseout", function(event, d) {
            if (mode === 'delete') {
                d3.select(this).attr("fill", "#00A47F").style("cursor", "default");
            } else if (mode === 'move') {
                d3.select(this).style("cursor", "default");
            }
        });

    circles
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y));

    circles.exit().remove();

    updateCorrelationLine();
    updateStatistics();

    // Recalculate and update the slider and correlation value
    const correlation = calculateCorrelation(data);
    d3.select("#correlationSlider").property("value", correlation);
    d3.select("#correlationValue").text(correlation.toFixed(2));

    // Update the Venn diagram ONLY when initializing
    if (!sliderActive) {
        vennDiagram.update(correlation);
    }
}

// Function to update the regression line
function updateCorrelationLine() {
    if (data.length < 2) return; // No line if not enough data

    const meanX = d3.mean(data, d => d.x);
    const meanY = d3.mean(data, d => d.y);
    const slope = d3.sum(data, d => (d.x - meanX) * (d.y - meanY)) / d3.sum(data, d => (d.x - meanX) ** 2);
    const intercept = meanY - slope * meanX;  // Correctly compute the intercept using the meanX

    // Points for the regression line
    const x1 = xScale.domain()[0];
    const y1 = slope * x1 + intercept;
    const x2 = xScale.domain()[1];
    const y2 = slope * x2 + intercept;

    regressionLine
        .attr("x1", xScale(x1))
        .attr("y1", yScale(y1))
        .attr("x2", xScale(x2))
        .attr("y2", yScale(y2));
}

// Function to update the statistical information display
function updateStatistics() {
    const meanX = d3.mean(data, d => d.x);
    const meanY = d3.mean(data, d => d.y);
    const sdX = d3.deviation(data, d => d.x);
    const sdY = d3.deviation(data, d => d.y);

    d3.select("#meanX").text(`Mean(x): ${meanX.toFixed(2)}`);
    d3.select("#meanY").text(`Mean(y): ${meanY.toFixed(2)}`);
    d3.select("#sdX").text(`SD(x): ${sdX.toFixed(2)}`);
    d3.select("#sdY").text(`SD(y): ${sdY.toFixed(2)}`);
}

// Function to calculate the correlation between x and y
function calculateCorrelation(data) {
    const n = data.length;
    if (n < 2) return 0; // No correlation for insufficient data

    const meanX = d3.mean(data, d => d.x);
    const meanY = d3.mean(data, d => d.y);

    const numerator = d3.sum(data, d => (d.x - meanX) * (d.y - meanY));
    const denominator = Math.sqrt(
        d3.sum(data, d => Math.pow(d.x - meanX, 2)) *
        d3.sum(data, d => Math.pow(d.y - meanY, 2))
    );
    

    return numerator / denominator || 0; // Prevent division by zero
}

let newPoints = []; // Track newly added points

function alignNewPoints() {
    if (newPoints.length === 0) return;

    const meanX = d3.mean(data, d => d.x);
    const meanY = d3.mean(data, d => d.y);
    const sdX = d3.deviation(data, d => d.x) || 1; // Avoid zero SD
    const sdY = d3.deviation(data, d => d.y) || 1;

    // Move new points closer to the dataset's mean
    newPoints = newPoints.map(point => ({
        x: point.x + (meanX - point.x), // Move halfway to the mean
        y: point.y + (meanY - point.y), // Move halfway to the mean
    }));

    // Merge aligned points back into the main dataset
    data = [...data.filter(p => !newPoints.includes(p)), ...newPoints];
}



function adjustCorrelation(targetCorrelation) {
    if (data.length < 2) return;

    const meanX = d3.mean(originalData, d => d.x); // Use original data for mean
    const meanY = d3.mean(originalData, d => d.y);
    const sdX = d3.deviation(originalData, d => d.x) || 1;
    const sdY = d3.deviation(originalData, d => d.y) || 1;

    const clampedCorrelation = Math.max(-1, Math.min(1, targetCorrelation));
    const orthogonalComponent = Math.sqrt(Math.max(0, 1 - clampedCorrelation ** 2));

    data = originalData.map(d => {
        const xStandardized = (d.x - meanX) / sdX;
        const yStandardized = (d.y - meanY) / sdY;

        const newY = clampedCorrelation * xStandardized * sdY +
                     yStandardized * orthogonalComponent * sdY + meanY;
        const newX = xStandardized * sdX + meanX;

        return { x: newX, y: newY };
    });

    update();
}




// Initialize the visualization
update();



function resetOriginalData() {
    const correlation = Math.abs(calculateCorrelation(data));

    const meanX = d3.mean(data, d => d.x);
    const meanY = d3.mean(data, d => d.y);
    const sdX = d3.deviation(data, d => d.x) || 1;
    const sdY = d3.deviation(data, d => d.y) || 1;

    if (correlation > 0.8) {
        // Introduce variability proportional to correlation
        const perturbFactor = (1 - correlation) * 0.2; // Higher for higher correlations
        dataOriginal = data.map(d => ({
            x: d.x + (Math.random() - 0.5) * perturbFactor * sdX,
            y: d.y + (Math.random() - 0.5) * perturbFactor * sdY,
        }));
    } else {
        // For lower correlations, just reset to the current dataset
        dataOriginal = data.map(d => ({ ...d }));
    }

    sliderActive = false; // Reset slider state
}




// Event listener for the correlation slider
d3.select("#correlationSlider").on("input", function() {
    const targetCorrelation = +this.value;
    d3.select("#correlationValue").text(targetCorrelation.toFixed(2));
    data = originalData.map(d => ({ ...d }));
    // Adjust data to match the target correlation
    adjustCorrelation(targetCorrelation);

    // Recalculate the actual correlation of the transformed data
    const recalculatedCorrelation = calculateCorrelation(data);
    console.log("Recalculated Correlation:", recalculatedCorrelation);

    // Update the Venn diagram and scatterplot with the recalculated correlation
    vennDiagram.update(recalculatedCorrelation);
    update();
});


// Event listeners for the add, delete, and move buttons
d3.select("#addBtn").on("click", function() {
    mode = 'add';
    d3.selectAll(".btn").classed("selected", false);
    d3.select(this).classed("selected", true);
    svg.style("cursor", "crosshair"); // Green "+" cursor for add mode
    disableDrag(); // Disable dragging during add mode
    const coords = d3.pointer(event, this);
    const newPoint = { x: xScale.invert(coords[0]), y: yScale.invert(coords[1]) };
    data.push(newPoint);
    newPoints.push(newPoint); // Track this new point
    console.log("New point added:", newPoint); // Log the new point
    console.log("Current newPoints array:", newPoints);
    update();
    resetOriginalData(); // Reinitialize the dataset state
});

d3.select("#deleteBtn").on("click", function() {
    mode = 'delete';
    d3.selectAll(".btn").classed("selected", false);
    d3.select(this).classed("selected", true);
    svg.style("cursor", "default"); // Default cursor for delete mode
    disableDrag(); // Disable dragging during delete mode
    resetOriginalData(); // Recompute dataOriginal after modification
    update();
});

d3.select("#moveBtn").on("click", function() {
    mode = 'move';
    d3.selectAll(".btn").classed("selected", false);
    d3.select(this).classed("selected", true);
    svg.style("cursor", "default"); // Default cursor for move mode
    enableDrag(); // Enable dragging during move mode
});

// Function to enable dragging of points
function enableDrag() {
    svg.selectAll("circle").call(d3.drag()
        .on("drag", function(event, d) {
            const coords = d3.pointer(event, this);  // Get coordinates relative to the circle
            d.x = xScale.invert(coords[0]);
            d.y = yScale.invert(coords[1]);
            update();
            resetOriginalData();  // Reset original data after dragging a point
        })
    );
}

// Function to disable dragging of points
function disableDrag() {
    svg.selectAll("circle").on(".drag", null); // Disable dragging
}

// Function to reset the visualization
function resetData() {
    data = generateInitialData(); // Generate new random data
    dataOriginal = data.map(d => ({ ...d })); // Store a fresh copy
    originalData = data.map(d => ({ ...d })); // Store a fresh copy
    sliderActive = false; // Reset slider state

    // Reset slider value
    d3.select("#correlationSlider").property("value", 0);
    d3.select("#correlationValue").text("0");

    // Update all visualizations
    update();
    vennDiagram.update(0); // Reset the Venn diagram
    console.log("Data reset to initial state.");
}

// Event listener for the reset button
d3.select("#resetBtn").on("click", resetData);
