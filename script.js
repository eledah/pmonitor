const colors = {
    purple: {
      default: "rgba(149, 76, 233, 1)",
      half: "rgba(149, 76, 233, 0.5)",
      quarter: "rgba(149, 76, 233, 0.25)",
      zero: "rgba(149, 76, 233, 0)"
    },
    indigo: {
      default: "rgba(80, 102, 120, 1)",
      quarter: "rgba(80, 102, 120, 0.25)"
    }
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
                linkElement.textContent = chartName;

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
                            const jalaliDate = moment(date, 'YYYY-MM-DD').locale('fa').format('jYYYY/jMM/jDD');
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
                                color: discounts.map(discount => discount > 0 ? '#D81B60' : '#546E7A'), 
                            },
                            line: {
                                color: 'rgb(200, 200, 200)',
                                width: 2,
                            },
                            hovertemplate: '<b>%{y}</b><br>%{text}% OFF',
                            text: discounts
                        };

                        

                        const layout = {
                            plot_bgcolor: 'rgb(25, 32, 39)',
                            paper_bgcolor: 'rgb(25, 32, 39)',
                            xaxis: {
                                title: 'تاریخ',
                                automargin: true
                            },
                            yaxis: {
                                title: 'قیمت',
                                automargin: true
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
                            displaylogo: false
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