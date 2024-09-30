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

// Create the SVG container for the Venn diagram
const vennSvg = d3.select("#venn")
    .append("svg")
    .attr("width", 200)
    .attr("height", 100);

// Draw the circles for the Venn diagram
const circleX = vennSvg.append("circle")
    .attr("cx", 50)
    .attr("cy", 50)
    .attr("r", 40)
    .attr("fill", "#4DB661")
    .attr("opacity", 0.5);

const circleY = vennSvg.append("circle")
    .attr("cx", 150)
    .attr("cy", 50)
    .attr("r", 40)
    .attr("fill", "lightgreen")
    .attr("opacity", 0.5);

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

    // Update the Venn diagram
    updateVennDiagram(correlation);
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
    const meanX = d3.mean(data, d => d.x);
    const meanY = d3.mean(data, d => d.y);
    const numerator = d3.sum(data, d => (d.x - meanX) * (d.y - meanY));
    const denominator = Math.sqrt(
        d3.sum(data, d => Math.pow(d.x - meanX, 2)) * d3.sum(data, d => Math.pow(d.y - meanY, 2))
    );
    return numerator / denominator;
}

// Function to adjust the correlation by transforming the data
function adjustCorrelation(targetCorrelation) {
    if (data.length < 2) return;

    sliderActive = true;  // Indicate that the slider is being used

    // Calculate current means and standard deviations
    const meanX = d3.mean(dataOriginal, d => d.x);
    const meanY = d3.mean(dataOriginal, d => d.y);
    const sdX = d3.deviation(dataOriginal, d => d.x);
    const sdY = d3.deviation(dataOriginal, d => d.y);

    // Compute the new positions based on the target correlation
    data = dataOriginal.map(d => {
        const xStandardized = (d.x - meanX) / sdX;
        const yStandardized = (d.y - meanY) / sdY;

        const newY = targetCorrelation * xStandardized * sdY + yStandardized * Math.sqrt(1 - targetCorrelation ** 2) * sdY + meanY;
        const newX = (xStandardized * sdX) + meanX;  // Adjust the x as well to keep the balance
        return { x: newX, y: newY };
    });

    update();
}

// Initialize the visualization
update();

// Event listener for the correlation slider
d3.select("#correlationSlider").on("input", function() {
    const targetCorrelation = +this.value;
    d3.select("#correlationValue").text(targetCorrelation.toFixed(2));
    adjustCorrelation(targetCorrelation);
    sliderActive = false;  // Slider is no longer being actively used after adjustment
});

// Event listeners for the add, delete, and move buttons
d3.select("#addBtn").on("click", function() {
    mode = 'add';
    d3.selectAll(".btn").classed("selected", false);
    d3.select(this).classed("selected", true);
    svg.style("cursor", "crosshair"); // Green "+" cursor for add mode
    disableDrag(); // Disable dragging during add mode
});

d3.select("#deleteBtn").on("click", function() {
    mode = 'delete';
    d3.selectAll(".btn").classed("selected", false);
    d3.select(this).classed("selected", true);
    svg.style("cursor", "default"); // Default cursor for delete mode
    disableDrag(); // Disable dragging during delete mode
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
