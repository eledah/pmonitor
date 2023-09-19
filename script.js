const fileNames = [
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/آویز گردنبند طلا 18 عیار زنانه.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/آیفون ۱۳ نان‌اکتیو.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/آینه بغل پراید.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/برنج هاشمی ممتاز طبیعت - 10 کیلوگرم.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/تلویزیون ال ای دی هوشمند ایکس ویژن.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/تونر پاک کننده صورت لافارر.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/خیار شور سالی - 1.5 کیلوگرم.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/رژ لب جامد الیزا مدل Mini.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/زیرپوش رکابی مردانه امیدنو.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/عسل طبیعی سبلان.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/فلش مموری کوئین تک.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/ماشین لباسشویی دوو.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/موتور برق آسترا.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/هندزفری تسکو مدل TH 5052.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/پنیر سفید فتا کاله.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/پوشک بچه هانیز.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/کتاب هر دو در نهایت می میرند.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/کنسول Playstation 5.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/کیف کمری چرمی.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/گوشی موبایل شیائومی مدل Redmi Note 12 4G.json',
    'https://raw.githubusercontent.com/eledah/pmonitor/master/items/sample.json'
];

document.addEventListener('DOMContentLoaded', function () {
    for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i];
        const chartName = fileName.replace('https://raw.githubusercontent.com/eledah/pmonitor/master/items/', '').replace('.json', '');

        fetch(fileName)
            .then(response => response.json())
            .then(data => {
                const dates = data.map(item => item.Date);
                const prices = data.map(item => parseInt(item.Price));
                const discounts = data.map(item => parseInt(item.Discount || 0));

                const formattedDates = dates.map(date => new Date(date).toISOString().slice(0, 10));

                const trace = {
                    x: formattedDates,
                    y: prices,
                    mode: 'lines+markers',
                    type: 'scatter',
                    marker: {
                        size: 8,
                        color: discounts.map(discount => discount > 0 ? 'rgb(198, 40, 40)' : 'rgb(46, 125, 50)')
                    },
                    line: {
                        color: 'rgb(165, 214, 167)',
                        width: 2
                    }
                };

                const layout = {
                    autosize: false,
                    width: 1000,
                    height: 500,
                    xaxis: { title: 'Date' },
                    yaxis: { title: 'Price' }

                };

                const plotData = [trace];

                const div = document.createElement('div');
                div.className = 'scatter-plot';
                document.getElementById('scatter-plots').appendChild(div);

                const chartTitle = document.createElement('h3');
                chartTitle.textContent = chartName;
                chartTitle.style.color = 'rgb(3, 155, 229)';
                chartTitle.id = `chart-${i + 1}`;
                chartTitle.className = 'chart-title'
                div.appendChild(chartTitle);

                Plotly.newPlot(div, plotData, layout);
            })
            .catch(error => console.error('Error loading data:', error));
    }
});
