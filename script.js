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

document.addEventListener('DOMContentLoaded', function () {
    for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i];
        const chartName = fileName.replace('items/', '').replace('.json', '');

        fetch(fileName)
            .then(response => response.json())
            .then(data => {
                const dates = data.map(item => item.Date);
                const prices = data.map(item => parseFloat(item.Price));
                const discounts = data.map(item => parseFloat(item.Discount || 0));

                const formattedDates = dates.map(date => new Date(date).toISOString().slice(0, 10));

                const trace = {
                    x: formattedDates,
                    y: prices,
                    mode: 'line+markers',
                    type: 'scatter',
                    marker: {
                        size: 8,
                        color: discounts.map(discount => discount > 0 ? 'red' : 'green')
                    },
                    line: {
                        color: discounts.map(discount => discount > 0 ? 'lightred' : 'lightgreen'),
                        width: 1
                    }
                };

                const layout = {
                    xaxis: { title: 'Date' },
                    yaxis: { title: 'Price' }
                };

                const plotData = [trace];

                const div = document.createElement('div');
                div.className = 'scatter-plot';
                document.getElementById('scatter-plots').appendChild(div);

                const chartTitle = document.createElement('h3');
                chartTitle.textContent = chartName;
                chartTitle.style.color = 'darkblue';
                chartTitle.id = `chart-${i + 1}`;
                div.appendChild(chartTitle);

                Plotly.newPlot(div, plotData, layout);
            })
            .catch(error => console.error('Error loading data:', error));
    }
});
