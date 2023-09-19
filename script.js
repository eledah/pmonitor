// Function to fetch and draw scatter plot from a local JSON file using Chart.js
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

            const datasets = [{
                label: chartName,
                data: prices,
                borderColor: discounts.map(discount => discount > 0 ? 'red' : 'green'), // Color points based on discount
                backgroundColor: 'transparent', // Transparent background
                pointRadius: 6, // Point size
                pointBackgroundColor: discounts.map(discount => discount > 0 ? 'red' : 'green'), // Color points based on discount
                pointBorderColor: 'transparent', // Transparent point border
                pointBorderWidth: 0, // Point border width
            }];

            const chartData = {
                labels: formattedDates,
                datasets: datasets,
            };

            const chartOptions = {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day', // Display only Day, Month, and Year
                        },
                    },
                    y: {
                        beginAtZero: true,
                        max: Math.ceil(Math.max(...prices)), // Set max Y-axis value
                        callback: function (value) {
                            return value.toFixed(1); // Round Y-axis labels to 1 decimal place
                        },
                    },
                },
            };

            const chartContainer = document.createElement('div');
            chartContainer.className = 'scatter-plot';
            document.getElementById('scatter-plots').appendChild(chartContainer);

            // Create a <h3> tag for the chart name and set its text content
            const chartTitle = document.createElement('h3');
            chartTitle.textContent = chartName;
            chartTitle.style.color = 'darkblue';

            // Append the <h3> and the chart canvas to the chart container
            chartContainer.appendChild(chartTitle);

            // Create a canvas element for the Chart.js chart
            const canvas = document.createElement('canvas');
            chartContainer.appendChild(canvas);

            // Create the Chart.js scatter plot
            new Chart(canvas, {
                type: 'scatter',
                data: chartData,
                options: chartOptions,
            });
        })
        .catch(error => console.error('Error loading data:', error));
}

// Array of local JSON file names and corresponding chart ids
const chartData = [
    {
        fileName: 'items/آویز گردنبند طلا 18 عیار زنانه.json',
        chartId: 'chart-1' // Unique id for the chart container
    },
    {
        fileName: 'items/آیفون ۱۳ نان‌اکتیو.json',
        chartId: 'chart-2' // Unique id for the chart container
    },
    {
        fileName: 'items/آینه بغل پراید.json',
        chartId: 'chart-3' // Unique id for the chart container
    },
    {
        fileName: 'items/برنج هاشمی ممتاز طبیعت - 10 کیلوگرم.json',
        chartId: 'chart-4' // Unique id for the chart container
    },
    {
        fileName: 'items/تلویزیون ال ای دی هوشمند ایکس ویژن.json',
        chartId: 'chart-5' // Unique id for the chart container
    },
    {
        fileName: 'items/تونر پاک کننده صورت لافارر.json',
        chartId: 'chart-6' // Unique id for the chart container
    },
    {
        fileName: 'items/خیار شور سالی - 1.5 کیلوگرم.json',
        chartId: 'chart-7' // Unique id for the chart container
    },
    {
        fileName: 'items/رژ لب جامد الیزا مدل Mini.json',
        chartId: 'chart-8' // Unique id for the chart container
    },
    {
        fileName: 'items/زیرپوش رکابی مردانه امیدنو.json',
        chartId: 'chart-9' // Unique id for the chart container
    },
    {
        fileName: 'items/عسل طبیعی سبلان.json',
        chartId: 'chart-10' // Unique id for the chart container
    },
    {
        fileName: 'items/فلش مموری کوئین تک.json',
        chartId: 'chart-11' // Unique id for the chart container
    },
    {
        fileName: 'items/ماشین لباسشویی دوو.json',
        chartId: 'chart-12' // Unique id for the chart container
    },
    {
        fileName: 'items/موتور برق آسترا.json',
        chartId: 'chart-13' // Unique id for the chart container
    },
    {
        fileName: 'items/هندزفری تسکو مدل TH 5052.json',
        chartId: 'chart-14' // Unique id for the chart container
    },
    {
        fileName: 'items/پنیر سفید فتا کاله.json',
        chartId: 'chart-15' // Unique id for the chart container
    },
    {
        fileName: 'items/پوشک بچه هانیز.json',
        chartId: 'chart-16' // Unique id for the chart container
    },
    {
        fileName: 'items/کتاب هر دو در نهایت می میرند.json',
        chartId: 'chart-17' // Unique id for the chart container
    },
    {
        fileName: 'items/کنسول Playstation 5.json',
        chartId: 'chart-18' // Unique id for the chart container
    },
    {
        fileName: 'items/کیف کمری چرمی.json',
        chartId: 'chart-19' // Unique id for the chart container
    },
    {
        fileName: 'items/گوشی موبایل شیائومی مدل Redmi Note 12 4G.json',
        chartId: 'chart-20' // Unique id for the chart container
    },
];

// Loop through the chart data and draw scatter plots using Chart.js
for (const data of chartData) {
    drawScatterPlot(data.fileName, data.chartId);
}
