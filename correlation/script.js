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

let data = generateInitialData();
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
    
                // Calculate new positions for both circles
                const leftCircleX = (width / 2) - distance / 2; // Move left circle right by half the distance
                const rightCircleX = (width / 2) + distance / 2; // Move right circle left by half the distance
    
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
                    revertToLowCorrelation();
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


function adjustCorrelation(targetCorrelation) {
    if (data.length < 2) return;

    sliderActive = true;

    const meanX = d3.mean(dataOriginal, d => d.x);
    const meanY = d3.mean(dataOriginal, d => d.y);
    const sdX = d3.deviation(dataOriginal, d => d.x) || 1; // Prevent zero SD
    const sdY = d3.deviation(dataOriginal, d => d.y) || 1; // Prevent zero SD

    // Perturb data slightly if sliding back from ±1
    if (Math.abs(targetCorrelation) < 1 && Math.abs(calculateCorrelation(dataOriginal)) === 1) {
        dataOriginal = dataOriginal.map(d => ({
            x: d.x + (Math.random() - 0.5) * 0.1 * sdX,
            y: d.y + (Math.random() - 0.5) * 0.1 * sdY,
        }));
    }

    const clampedCorrelation = Math.max(-1, Math.min(1, targetCorrelation));
    const orthogonalComponent = Math.sqrt(Math.max(0, 1 - clampedCorrelation ** 2));

    data = dataOriginal.map(d => {
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
    adjustCorrelation(targetCorrelation); // Update scatterplot
    vennDiagram.update(targetCorrelation); // Update Venn diagram
});


// Event listeners for the add, delete, and move buttons
d3.select("#addBtn").on("click", function() {
    mode = 'add';
    d3.selectAll(".btn").classed("selected", false);
    d3.select(this).classed("selected", true);
    svg.style("cursor", "crosshair"); // Green "+" cursor for add mode
    disableDrag(); // Disable dragging during add mode
    resetOriginalData(); // Recompute dataOriginal after modification
    update();
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
