/**
 * This code was inspired by the statistical simulation tools available at:
 * https://statsapp.utsc.utoronto.ca/?m=3&p=simulation
 * 
 * While the functionality and design were inspired by this resource, the code was developed independently.
 * The original work at the provided link is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License.
 * 
 * License details: https://creativecommons.org/licenses/by-nc-nd/4.0/
 */

 const svg = d3.select("svg");
const margin = { top: 20, right: 30, bottom: 30, left: 40 };
const width = svg.attr("width") - margin.left - margin.right;
const height = svg.attr("height") - margin.top - margin.bottom;
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

let x = d3.scaleLinear().range([0, width]);
const y = d3.scaleLinear().range([height, 0]).domain([0, 0.09]);

const line = d3.line()
  .x(d => x(d.x))
  .y(d => y(d.y));

const area = d3.area()
  .x(d => x(d.x))
  .y0(height)
  .y1(d => y(d.y));

const normalDistribution = (x, mean, sigma) => {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / sigma) ** 2);
};

const updateDistribution = () => {
  const mu = +d3.select("#mean").property("value");
  const sigma = +d3.select("#sigma").property("value");
  let xmin = +d3.select("#xmin").property("value");
  let xmax = +d3.select("#xmax").property("value");

  // Dynamic x-axis scaling based on the standard deviation, centered on 50 (or any fixed point)
  const domainMin = 50 - 4 * sigma;
  const domainMax = 50 + 4 * sigma;
  x.domain([domainMin, domainMax]);

  // Check if xmin is greater than xmax
  if (xmin > xmax) {
    xmax = xmin;
    d3.select("#xmax").property("value", xmax);
    d3.select("#xmaxValue").text(xmax);
  }

  // Check if xmax is less than xmin
  if (xmax < xmin) {
    xmin = xmax;
    d3.select("#xmin").property("value", xmin);
    d3.select("#xminValue").text(xmin);
  }

  const data = d3.range(domainMin, domainMax, 0.1).map(x => ({
    x: x,
    y: normalDistribution(x, mu, sigma)
  }));

  g.selectAll("*").remove();

  // Add X-Axis (dynamic scaling for σ adjustment, fixed for mean adjustment)
  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(10).tickSize(-height));

  // Add Y-Axis
  g.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y).ticks(10).tickSize(-width));

  // Add grid lines
  g.selectAll(".tick line").attr("stroke", "#e0e0e0");

  // Draw the normal distribution line
  g.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);

  // Add vertical line at the mean
  g.append("line")
    .attr("x1", x(mu))
    .attr("x2", x(mu))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "blue")
    .attr("stroke-width", 2);

  // Add red lines for ±1 standard deviation, drawn only up to the height of the distribution curve
  const sdLine1Height = y(normalDistribution(mu - sigma, mu, sigma));
  const sdLine2Height = y(normalDistribution(mu + sigma, mu, sigma));

  g.append("line")
    .attr("x1", x(mu - sigma))
    .attr("x2", x(mu - sigma))
    .attr("y1", height)
    .attr("y2", sdLine1Height)
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4");

  g.append("line")
    .attr("x1", x(mu + sigma))
    .attr("x2", x(mu + sigma))
    .attr("y1", height)
    .attr("y2", sdLine2Height)
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4");

  // Shade areas based on Xmin and Xmax
  g.append("path")
    .datum(data.filter(d => d.x <= xmin))
    .attr("class", "area")
    .attr("d", area)
    .attr("fill", "green")
    .attr("opacity", 0.4);

  g.append("path")
    .datum(data.filter(d => d.x >= xmin && d.x <= xmax))
    .attr("class", "area")
    .attr("d", area)
    .attr("fill", "yellow")
    .attr("opacity", 0.4);

  g.append("path")
    .datum(data.filter(d => d.x >= xmax))
    .attr("class", "area")
    .attr("d", area)
    .attr("fill", "purple")
    .attr("opacity", 0.4);

  // Add vertical lines at Xmin and Xmax
  g.append("line")
    .attr("x1", x(xmin))
    .attr("x2", x(xmin))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "green")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4");

  g.append("line")
    .attr("x1", x(xmax))
    .attr("x2", x(xmax))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "purple")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4");

  // Calculate and display z-scores with on-hover transformation to the fraction format
  const zXmin = ((xmin - mu) / sigma).toFixed(2);
  const zXmax = ((xmax - mu) / sigma).toFixed(2);

  const textYOffset = 60; // High offset to position z-scores well above the distribution

  // Z-score for xmin
  const xminText = g.append("text")
    .attr("x", x(xmin) - 10)  // Adjust the x position
    .attr("y", y(normalDistribution(xmin, mu, sigma)) - textYOffset)  // Position higher above the distribution
    .attr("fill", "green")
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .text(`z = ${zXmin}`)
    .on("mouseover", function() {
      d3.select(this)
        .text(`(X - μ) / σ`);
    })
    .on("mouseout", function() {
      d3.select(this).text(`z = ${zXmin}`);
    });

  // Z-score for xmax
  const xmaxText = g.append("text")
    .attr("x", x(xmax) + 10)  // Adjust the x position
    .attr("y", y(normalDistribution(xmax, mu, sigma)) - textYOffset)  // Position higher above the distribution
    .attr("fill", "purple")
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "middle")
    .text(`z = ${zXmax}`)
    .on("mouseover", function() {
      d3.select(this)
        .text(`(X - μ) / σ`);
    })
    .on("mouseout", function() {
      d3.select(this).text(`z = ${zXmax}`);
    });

  // Add text labels to display percentages of areas
  const lessThanMin = jStat.normal.cdf(xmin, mu, sigma);
  const betweenMinMax = jStat.normal.cdf(xmax, mu, sigma) - lessThanMin;
  const greaterThanMax = 1 - jStat.normal.cdf(xmax, mu, sigma);

  g.append("text")
    .attr("x", x(mu - 3 * sigma))
    .attr("y", y(0.02))  // Fixed y position near the bottom for better visibility
    .attr("fill", "green")
    .text(`${(lessThanMin * 100).toFixed(2)}%`);

  g.append("text")
    .attr("x", x(mu))
    .attr("y", y(0.02))  // Fixed y position near the bottom for better visibility
    .attr("fill", "black")
    .text(`${(betweenMinMax * 100).toFixed(2)}%`);

  g.append("text")
    .attr("x", x(mu + 3 * sigma))
    .attr("y", y(0.02))  // Fixed y position near the bottom for better visibility
    .attr("fill", "purple")
    .text(`${(greaterThanMax * 100).toFixed(2)}%`);

  // Add text label for the mean and standard deviation (stacked and above the distribution)
  g.append("text")
    .attr("x", x(mu))
    .attr("y", height / 2 - 10)  // Position above the center
    .attr("fill", "blue")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(`μ = ${mu}`);

  g.append("text")
    .attr("x", x(mu))
    .attr("y", height / 2 + 10)  // Position below the mean text
    .attr("fill", "red")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(`σ = ${sigma}`);
};

// Ensure sliders are logically consistent and update them
d3.select("#xmin").on("input", function() {
  let xmin = +d3.select("#xmin").property("value");
  let xmax = +d3.select("#xmax").property("value");

  // If xmin is greater than xmax, move xmax to match xmin
  if (xmin > xmax) {
    xmax = xmin;
    d3.select("#xmax").property("value", xmax);
    d3.select("#xmaxValue").text(xmax); // Update the display text
  }

  d3.select("#xminValue").text(xmin); // Update the display text
  updateDistribution();
});

d3.select("#xmax").on("input", function() {
  let xmax = +d3.select("#xmax").property("value");
  let xmin = +d3.select("#xmin").property("value");

  // If xmax is less than xmin, move xmin to match xmax
  if (xmax < xmin) {
    xmin = xmax;
    d3.select("#xmin").property("value", xmin);
    d3.select("#xminValue").text(xmin); // Update the display text
  }

  d3.select("#xmaxValue").text(xmax); // Update the display text
  updateDistribution();
});

// Update distribution when mean and sigma sliders are adjusted
d3.select("#mean").on("input", function() {
  d3.select("#meanValue").text(this.value);
  updateDistribution();
});

d3.select("#sigma").on("input", function() {
  d3.select("#sigmaValue").text(this.value);
  updateDistribution();
});

updateDistribution();
