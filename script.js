const colors = {
    black: "#100F0F",
    bg2: "#1C1B1A",
    ui: "#282726",
    ui2: "#343331",
    ui3: "#403E3C",
    tx3: "#575653",
    tx2: "#878580",
    tx: "#CECDC3",
    red: "#D81B60",
    green: "#879A39"
  };

document.addEventListener('DOMContentLoaded', function () {
    // Fetch the JSON file from the URL
    fetch('https://raw.githubusercontent.com/eledah/pmonitor/master/items.json')
        .then(response => response.json())
        .then(data => {
            // Construct fileNames based on the "name" property
            const fileNames = data.map(item => `https://raw.githubusercontent.com/eledah/pmonitor/master/items/${item.name}.json`);

            // Reference the scatter-plots container
            const mainContainer = document.getElementById('scatter-plots');

            // Reference the table of contents container
            const tocContainer = document.getElementById('p-table-of-content');

            // Loop through the JSON data to create charts and links
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const fileName = fileNames[i];
                const chartName = item.name; // Use the "name" property directly

                // Create an <a> tag with the "link" property as the href
                const linkElement = document.createElement('a');
                linkElement.href = item.link;
                linkElement.className ='chart-title'
                linkElement.target = '_blank'; // Open link in a new tab
                linkElement.textContent = "- " + chartName + " -";

                // Create a <span> tag to wrap the link
                const spanElement = document.createElement('span');
                spanElement.textContent = " | ";

                const nestedLinkElement = document.createElement('a')
                nestedLinkElement.href = `#chart-${i + 1}`;
                nestedLinkElement.textContent = chartName;
                spanElement.appendChild(nestedLinkElement);

                // Append the <span> to the TOC container
                tocContainer.appendChild(spanElement);
                
                // Create a container <div> for the chart
                const containerDiv = document.createElement('div');
                containerDiv.className = 'container-div';
                containerDiv.id = `chart-${i + 1}`;

                // Create a scatter plot <div> for the chart
                const scatterDiv = document.createElement('div');
                scatterDiv.className = 'scatter-plot';

                // Append the <a> tag with the <h2> to the main container
                containerDiv.appendChild(linkElement);
                containerDiv.appendChild(scatterDiv);
                mainContainer.appendChild(containerDiv);

                // Continue with your code for creating charts using fileName
                fetch(fileName)
                    .then(response => response.json())
                    .then(data => {
                        const dates = data.map(item => item.Date);
                        const prices = data.map(item => parseInt(item.Price));
                        const discounts = data.map(item => parseInt(item.Discount || 0));

                        // const formattedDates = dates.map(date => new Date(date).toISOString().slice(0, 10));

                        // Convert Gregorian dates to Persian (Jalali) dates
                        const formattedDates = dates.map(date => {
                            // const jalaliDate = moment(date, 'YYYY-MM-DD').locale('fa').format('jYYYY/jMM/jDD');
                            const jalaliDate = moment(date, 'YYYY-MM-DD').locale('fa').format('jMM/jDD');
                            return jalaliDate;
                        });


                        const trace = {
                            name: '',
                            x: formattedDates,
                            y: prices,
                            mode: 'lines+markers',
                            type: 'scatter',
                            marker: {
                                size: 8,
                                color: discounts.map(discount => discount > 0 ? colors.red : colors.tx2), 
                            },
                            line: {
                                color: colors.tx3,
                                width: 2,
                            },
                            hovertemplate: '<b>%{y}</b><br>%{text}% OFF',
                            text: discounts
                        };

                        

                        const layout = {
                            plot_bgcolor: colors.bg2,
                            paper_bgcolor: colors.bg2,
                            xaxis: {
                                // title: 'تاریخ',
                                automargin: true,
                                color: colors.tx,
                                gridcolor: colors.ui2,
                                zerolinecolor: colors.ui2
                            },
                            yaxis: {
                                // title: 'قیمت',
                                automargin: true,
                                color: colors.tx,
                                gridcolor: colors.ui2,
                                zerolinecolor: colors.ui2
                            },
                            font: {
                                family: 'Sahel FD',
                                size: 12,
                                color: '#7f7f7f'
                            },
                            hoverlabel: {
                                font: {
                                  family: 'Sahel FD', // Specify the desired font family
                                  size: 12, // Specify the font size
                                }
                            },
                            margin: {l:70, t:0, r:30, b:70}
                        };

                        const config = {
                            locale: 'fa',
                            responsive: true,
                            displaylogo: false,
                            displayModeBar: false
                        }

                        const plotData = [trace];

                        Plotly.newPlot(scatterDiv, plotData, layout, config);
                    })
                    .catch(error => console.error('Error loading data:', error));
            }
        })
        .catch(error => console.error('Error loading data:', error));
});

// Function to scroll to the top of the page
function scrollToTop() {
    // Scroll to the top of the page smoothly
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add a scroll event listener to show/hide the button
window.addEventListener('scroll', function() {
    var button = document.getElementById('button');
    if (window.scrollY > 500) {
        button.style.display = 'block';
    } else {
        button.style.display = 'none';
    }
});


function adjustChartLayout(chartsPerRow) {
    const containerDivs = document.querySelectorAll('.container-div');

    // Assign the scatterPlots variable here
    scatterPlots = document.querySelectorAll('.scatter-plot');
    
    // Adjust the width of each chart container
    containerDivs.forEach(container => {
        container.style.flex = `0 0 calc(${100 / chartsPerRow}% - 20px)`;
    });

    // Adjust the marker size based on the number of charts per row
    const { markerSize, lineWidth } = calculateSizes(chartsPerRow);
    scatterPlots.forEach(scatter => {
        updateMarkerAndLineWidth(scatter, markerSize, lineWidth);
    });

    // Trigger the resize event to notify the charts about the size change
    window.dispatchEvent(new Event('resize'));
}

function calculateSizes(chartsPerRow) {
    switch (chartsPerRow) {
        case 1:
            return { markerSize: 10, lineWidth: 3 };
        case 2:
            return { markerSize: 8, lineWidth: 2 };
        case 4:
            return { markerSize: 6, lineWidth: 1 };
        default:
            return { markerSize: 6, lineWidth: 1 };
    }
}

// Function to update marker size and line width for a specific chart
function updateMarkerAndLineWidth(scatter, markerSize, lineWidth) {
    const traces = scatter.data;
    traces.forEach(trace => {
        trace.marker.size = markerSize;
        trace.line.width = lineWidth;
    });
}