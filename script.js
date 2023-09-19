const fileNames = [
    'items/آویز گردنبند طلا 18 عیار زنانه.json',
    'items/آیفون ۱۳ نان‌اکتیو.json',
    'items/آینه بغل پراید.json',
    'items/برنج هاشمی ممتاز طبیعت - 10 کیلوگرم.json',
    'items/تلویزیون ال ای دی هوشمند ایکس ویژن.json',
    'items/تونر پاک کننده صورت لافارر.json',
    'items/خیار شور سالی - 1.5 کیلوگرم.json',
    'items/رژ لب جامد الیزا مدل Mini.json',
    'items/زیرپوش رکابی مردانه امیدنو.json',
    'items/عسل طبیعی سبلان.json',
    'items/فلش مموری کوئین تک.json',
    'items/ماشین لباسشویی دوو.json',
    'items/موتور برق آسترا.json',
    'items/هندزفری تسکو مدل TH 5052.json',
    'items/پنیر سفید فتا کاله.json',
    'items/پوشک بچه هانیز.json',
    'items/کتاب هر دو در نهایت می میرند.json',
    'items/کنسول Playstation 5.json',
    'items/کیف کمری چرمی.json',
    'items/گوشی موبایل شیائومی مدل Redmi Note 12 4G.json',
    'items/sample.json'
];

// Function to fetch and draw scatter plot from a local JSON file
function drawScatterPlot(filename) {
    // Extract the chart name from the filename (remove ".json" at the end and "items/")
    const chartName = filename.replace('items/', '').replace('.json', '');

    fetch(filename)
        .then(response => response.json())
        .then(data => {
            const dates = data.map(item => item.Date);
            const prices = data.map(item => parseFloat(item.Price));
            const discounts = data.map(item => parseFloat(item.Discount || 0)); // Default to 0 if Discount is not present

            // Format dates to display only Day, Month, and Year
            const formattedDates = dates.map(date => new Date(date).toISOString().slice(0, 10));

            const trace = {
                x: formattedDates,
                y: prices,
                mode: 'markers',
                type: 'scatter',
                marker: { 
                    size: 8,
                    color: discounts.map(discount => discount > 0 ? 'red' : 'green') // Color points based on discount
                },
                line: {
                    color: discounts.map(discount => discount > 0 ? 'lightred' : 'lightgreen'), // Color lines based on discount
                    width: 1 // Line width
                }
            };

            const layout = {
                title: '', // Empty title (no need for a title as <h3> contains the chart name)
                xaxis: { title: 'Date' },
                yaxis: { title: 'Price' }
            };

            const plotData = [trace];

            // Create a new div for each plot
            const div = document.createElement('div');
            div.className = 'scatter-plot';
            document.getElementById('scatter-plots').appendChild(div);

            // Create an <h3> tag for the chart name and set its text content
            const chartTitle = document.createElement('h3');
            chartTitle.textContent = chartName; // Set the chart name
            chartTitle.style.color = 'darkblue'; // Apply dark blue color

            // Create a container <div> for <h3> and the scatter plot
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';

            // Append the <h3> and the scatter plot to the container <div>
            chartContainer.appendChild(chartTitle);
            chartContainer.appendChild(div);

            // Append the container <div> to the scatter-plots container
            document.getElementById('scatter-plots').appendChild(chartContainer);

            // Render the scatter chart in the new div
            Plotly.newPlot(div, plotData, layout);
        })
        .catch(error => console.error('Error loading data:', error));
}

// Loop through the file names and draw scatter plots
for (const fileName of fileNames) {
    drawScatterPlot(fileName);
}
