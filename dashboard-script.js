// Dashboard Script for pMonitor
// RTL Support, Jalali Dates, IRR Pricing

class PriceMonitorDashboard {
    constructor() {
        this.items = [];
        this.isLoading = true;

        // Colors for different price change scenarios
        this.colors = {
            priceUp: 'rgb(243, 57, 119)',      // Pink for price increase
            priceDown: 'rgb(243, 57, 119)',    // Pink for price decrease (discounted items)
            noChange: '#e0e0e0',     // Gray for no change
            incredible: '#ffeb3b'    // Bright yellow for incredible offers
        };

        this.init();
    }

    init() {
        this.showLoading();
        this.loadItemsData();
        this.setupEventListeners();
        this.setupScrollToTop();
    }

    // Load items configuration and data
    async loadItemsData() {
        try {
            // Load items configuration from GitHub
            const response = await fetch('https://raw.githubusercontent.com/eledah/pmonitor/master/items.json');
            if (!response.ok) throw new Error('Failed to load items configuration');

            this.items = await response.json();
            await this.loadAllChartData();

            this.hideLoading();
            this.updateStats();
            this.renderTableOfContents();
            this.renderCharts();

        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('خطا در بارگذاری اطلاعات کالاها');
        }
    }

    // Load individual chart data for each item
    async loadAllChartData() {
        const promises = this.items.map((item, index) =>
            this.loadChartData(item, index)
        );

        await Promise.allSettled(promises);

        // Update last update time
        const now = moment();
        const jalaliDate = now.locale('fa').format('jYYYY/jMM/jDD - HH:mm');
        document.getElementById('lastUpdate').textContent = jalaliDate;
    }

    // Load chart data for a specific item
    async loadChartData(item, index) {
        try {
            const fileName = `https://raw.githubusercontent.com/eledah/pmonitor/master/items/${item.name}.json`;
            const response = await fetch(fileName);

            if (!response.ok) {
                console.warn(`No data file found for ${item.name} (HTTP ${response.status})`);
                item.chartData = null; // Explicitly set to null so we know it failed
                item.dataPoints = 0;
                return;
            }

            const data = await response.json();
            item.chartData = this.processChartData(data);
            item.dataPoints = data.length;

        } catch (error) {
            console.error(`Error loading data for ${item.name}:`, error);
            item.chartData = null; // Explicitly set to null on any error
            item.dataPoints = 0;
        }
    }

    // Process raw data for chart display
    processChartData(rawData) {
        return rawData.map(item => ({
            date: item.Date,
            price: parseInt(item.Price) || 0,
            discount: parseInt(item.Discount) || 0,
            incredible: parseInt(item.Incredible) || 0,
            jalaliDate: this.convertToJalali(item.Date)
        }));
    }

    // Convert Gregorian date to Jalali
    convertToJalali(gregorianDate) {
        try {
            return moment(gregorianDate, 'YYYY-MM-DD').locale('fa').format('jMM/jDD');
        } catch (error) {
            console.error('Error converting date:', error);
            return gregorianDate;
        }
    }

    // Format price in IRR (Iranian Rial)
    formatPrice(price) {
        if (price === 0 || price === 'Price not found') return 'نامشخص';

        const numPrice = typeof price === 'string' ? parseInt(price) : price;
        if (isNaN(numPrice)) return 'نامشخص';

        // Format large numbers with commas
        return numPrice.toLocaleString('fa-IR') + ' تومان';
    }

    // Update header statistics
    updateStats() {
        const totalItems = this.items.length;
        const itemsWithData = this.items.filter(item => item.chartData && item.chartData.length > 0).length;

        document.getElementById('totalItems').textContent = totalItems.toLocaleString('fa-IR');

        // Calculate average data points
        const totalDataPoints = this.items.reduce((sum, item) =>
            sum + (item.dataPoints || 0), 0
        );
        const avgDataPoints = totalItems > 0 ? Math.round(totalDataPoints / totalItems) : 0;

        // You can add more stats here as needed
    }

    // Render table of contents
    renderTableOfContents() {
        const container = document.getElementById('table-of-contents');
        container.innerHTML = '';

        this.items.forEach((item, index) => {
            const rowElement = this.createTOCRow(item, index);
            container.appendChild(rowElement);
        });
    }

    // Create table of contents row
    createTOCRow(item, index) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'toc-row slide-in-rtl';

        // Product name cell (right column)
        const nameCell = document.createElement('div');
        nameCell.className = 'toc-cell';

        const nameLink = document.createElement('a');
        nameLink.href = item.link;
        nameLink.target = '_blank';
        nameLink.className = 'toc-link';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'toc-name';
        nameDiv.textContent = item.name;
        nameDiv.style.fontFamily = "'Vazirmatn', 'Tahoma', sans-serif";

        nameLink.appendChild(nameDiv);
        nameCell.appendChild(nameLink);

        // Price cell (left column)
        const priceCell = document.createElement('div');
        priceCell.className = 'toc-cell';

        const priceInfo = this.getPriceInfo(item);
        priceCell.innerHTML = priceInfo;

        rowDiv.appendChild(nameCell);
        rowDiv.appendChild(priceCell);

        return rowDiv;
    }

    // Get price information for an item (current price and price change)
    getPriceInfo(item) {
        if (!item.chartData || item.chartData.length === 0) {
            return '<span class="toc-price">ناموجود</span>';
        }

        const latestData = item.chartData[item.chartData.length - 1];
        const currentPrice = latestData.price;

        if (currentPrice === 0 || currentPrice === 'Price not found') {
            return '<span class="toc-price">ناموجود</span>';
        }

        const formattedPrice = this.formatPrice(currentPrice);
        let priceChangeHTML = '';

        // Calculate price change if we have more than one data point
        if (item.chartData.length > 1) {
            const previousData = item.chartData[item.chartData.length - 2];
            const previousPrice = previousData.price;

            if (previousPrice > 0 && currentPrice > 0) {
                const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
                const changeSign = changePercent > 0 ? '+' : '';
                const changeColor = changePercent > 0 ? 'price-up' : changePercent < 0 ? 'price-down' : 'price-neutral';

                priceChangeHTML = `<span class="price-change ${changeColor}">(${changeSign}${changePercent.toFixed(0)}٪)</span>`;
            }
        }

        return `<div class="price-container">
            <span class="toc-price">${formattedPrice}</span>
            ${priceChangeHTML}
        </div>`;
    }

    // Render all charts
    renderCharts() {
        const container = document.getElementById('charts-grid');
        container.innerHTML = '';

        const itemsWithCharts = this.items.filter(item => item.chartData && item.chartData.length > 0);

        if (itemsWithCharts.length === 0) {
            // Show message when no charts are available
            const noChartsMsg = document.createElement('div');
            noChartsMsg.className = 'no-charts-message';
            noChartsMsg.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #888;
                font-family: 'Sahel', 'Tahoma', sans-serif;
                font-size: 16px;
                text-align: center;
                grid-column: 1 / -1;
            `;
            noChartsMsg.textContent = 'هیچ نموداری برای نمایش موجود نیست یا خطا در بارگذاری داده‌ها رخ داده است.';
            container.appendChild(noChartsMsg);
        } else {
            // Render charts for items that have valid data
            itemsWithCharts.forEach((item, index) => {
                const chartElement = this.createChartCard(item, index);
                container.appendChild(chartElement);
            });
        }

    }

    // Create chart card for an item
    createChartCard(item, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'chart-card fade-in';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'chart-title';

        const titleLink = document.createElement('a');
        titleLink.href = item.link;
        titleLink.target = '_blank';
        titleLink.textContent = item.name;
        titleLink.style.color = 'inherit';
        titleLink.style.textDecoration = 'none';

        titleDiv.appendChild(titleLink);

        const chartContainerDiv = document.createElement('div');
        chartContainerDiv.className = 'chart-container';
        chartContainerDiv.id = `chart-${index}`;

        cardDiv.appendChild(titleDiv);
        cardDiv.appendChild(chartContainerDiv);

        // Create chart asynchronously
        setTimeout(() => {
            this.createChart(chartContainerDiv.id, item);
        }, index * 100); // Stagger chart creation

        return cardDiv;
    }

    // Create individual chart
    createChart(containerId, item) {
        try {
            const data = item.chartData;

            // Validate data before proceeding
            if (!data || data.length === 0) {
                console.warn(`No chart data available for ${item.name}`);
                this.showChartError(containerId, 'اطلاعات نمودار در دسترس نیست');
                return;
            }

            // Extract data for plotting
            const dates = data.map(d => d.jalaliDate);
            const prices = data.map(d => d.price);
            const discounts = data.map(d => d.discount);
            const incredibles = data.map(d => d.incredible);

            // Validate that we have valid data
            if (dates.length === 0 || prices.length === 0) {
                console.warn(`Invalid chart data for ${item.name}`);
                this.showChartError(containerId, 'اطلاعات نامعتبر');
                return;
            }

            // Check if all prices are zero or invalid
            const validPrices = prices.filter(p => p > 0);
            if (validPrices.length === 0) {
                console.warn(`No valid prices for ${item.name}`);
                this.showChartError(containerId, 'قیمت‌ها نامعتبر هستند');
                return;
            }

            // Line is always grey, markers change color based on discount/incredible status
            const trace = {
                x: dates,
                y: prices,
                mode: 'lines+markers',
                type: 'scatter',
                name: item.name,
                line: {
                    color: '#808080',  // Always grey
                    width: 3
                    // Removed 'shape: 'spline'' to use straight lines
                },
                marker: {
                    size: 8,
                    color: prices.map((price, index) => {
                        if (incredibles[index] === 1) return this.colors.incredible;
                        if (discounts[index] > 0) return this.colors.priceDown;
                        return '#808080';  // Grey for normal prices
                    }),
                    symbol: 'circle'
                },
                hovertemplate:
                    '<b>%{y}</b><br>' +
                    '%{text}' +
                    '<b>تاریخ: %{x}</b>' +
                    '<extra></extra>',
                text: discounts.map(d => d > 0 ? d + '% OFF<br>' : '')
            };

            // Chart layout with RTL support
            const layout = {
                font: {
                    family: 'Vazirmatn, Vazir, Tahoma, sans-serif',
                    size: 12,
                    color: '#e0e0e0'
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                margin: { l: 50, r: 30, t: 30, b: 50 },
                xaxis: {
                    tickangle: -45,
                    color: '#e0e0e0',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    showgrid: true
                },
                yaxis: {
                    color: '#e0e0e0',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    showgrid: true,
                    tickformat: ','
                },
                hoverlabel: {
                    font: {
                        family: 'Vazirmatn, Vazir, Tahoma, sans-serif',
                        size: 12
                    }
                }
            };

            // Chart configuration
            const config = {
                locale: 'fa',
                responsive: true,
                displayModeBar: false,
                displaylogo: false
            };

            // Create the plot
            Plotly.newPlot(containerId, [trace], layout, config);

        } catch (error) {
            console.error(`Error creating chart for ${item.name}:`, error);
            this.showChartError(containerId, 'خطا در ایجاد نمودار');
        }
    }

    // Show error message in chart container
    showChartError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="chart-error" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #ff6b35;
                    font-family: 'Sahel', 'Tahoma', sans-serif;
                    font-size: 14px;
                    text-align: center;
                ">
                    ${message}
                </div>
            `;
        }
    }

    // Calculate price trend (positive = increasing, negative = decreasing)
    calculatePriceTrend(prices) {
        if (prices.length < 2) return 0;

        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];

        if (firstPrice === 0) return lastPrice > 0 ? 1 : 0;
        if (lastPrice === 0) return -1;

        return (lastPrice - firstPrice) / firstPrice;
    }

    // Setup event listeners
    setupEventListeners() {
    }

    // Setup scroll to top functionality
    setupScrollToTop() {
        const scrollBtn = document.getElementById('scrollToTopBtn');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });
    }

    // Scroll to top function
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    // Show loading overlay
    showLoading() {
        this.isLoading = true;
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Hide loading overlay
    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Show error message
    showError(message) {
        this.hideLoading();
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.querySelector('p').textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new PriceMonitorDashboard();
});
