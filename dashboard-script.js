// Dashboard Script for pMonitor
// RTL Support, Jalali Dates, IRR Pricing

class PriceMonitorDashboard {
    constructor() {
        this.items = [];
        this.chartsPerRow = 2;
        this.currentView = 'grid';
        this.isLoading = true;

        // Colors for different price change scenarios
        this.colors = {
            priceUp: '#ff6b35',      // Orange for price increase
            priceDown: '#4caf50',    // Green for price decrease
            noChange: '#e0e0e0',     // Gray for no change
            incredible: '#ffb74d'    // Yellow for incredible offers
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
        return numPrice.toLocaleString('fa-IR') + ' ریال';
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
            const itemElement = this.createTOCItem(item, index);
            container.appendChild(itemElement);
        });
    }

    // Create table of contents item
    createTOCItem(item, index) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'toc-item slide-in-rtl';

        const link = document.createElement('a');
        link.href = item.link;
        link.target = '_blank';
        link.className = 'toc-link';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'toc-name';
        nameDiv.textContent = item.name;

        link.appendChild(nameDiv);
        itemDiv.appendChild(link);

        return itemDiv;
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

        // Update layout based on current settings
        this.adjustChartLayout(this.chartsPerRow);
    }

    // Create chart card for an item
    createChartCard(item, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'chart-card fade-in';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'chart-title';
        titleDiv.textContent = item.name;

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

            // Determine line color based on price trend
            const priceChange = this.calculatePriceTrend(prices);
            const lineColor = priceChange > 0 ? this.colors.priceUp :
                             priceChange < 0 ? this.colors.priceDown : this.colors.noChange;

            // Create trace with markers colored by discount/incredible status
            const trace = {
                x: dates,
                y: prices,
                mode: 'lines+markers',
                type: 'scatter',
                name: item.name,
                line: {
                    color: lineColor,
                    width: 3,
                    shape: 'spline'
                },
                marker: {
                    size: 8,
                    color: prices.map((price, index) => {
                        if (incredibles[index] === 1) return this.colors.incredible;
                        if (discounts[index] > 0) return this.colors.priceDown;
                        return lineColor;
                    }),
                    symbol: 'circle'
                },
                hovertemplate:
                    '<b>%{x}</b><br>' +
                    'قیمت: %{y}<br>' +
                    'تخفیف: %{text}%<br>' +
                    '<extra></extra>',
                text: discounts.map(d => d > 0 ? d : '')
            };

            // Chart layout with RTL support
            const layout = {
                font: {
                    family: 'Vazir, Tahoma, sans-serif',
                    size: 12,
                    color: '#e0e0e0'
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                margin: { l: 50, r: 30, t: 30, b: 50 },
                xaxis: {
                    title: 'تاریخ شمسی',
                    tickangle: -45,
                    color: '#e0e0e0',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    showgrid: true
                },
                yaxis: {
                    title: 'قیمت (ریال)',
                    color: '#e0e0e0',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    showgrid: true,
                    tickformat: ','
                },
                hoverlabel: {
                    font: {
                        family: 'Vazir, Tahoma, sans-serif',
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
        // Window resize handler for responsive charts
        window.addEventListener('resize', () => {
            this.adjustChartLayout(this.chartsPerRow);
        });
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

    // Adjust chart layout (charts per row)
    adjustChartLayout(chartsPerRow, event = null) {
        this.chartsPerRow = chartsPerRow;

        const chartsGrid = document.getElementById('charts-grid');
        if (!chartsGrid) return; // Exit if charts grid not found

        const chartCards = document.querySelectorAll('.chart-card');

        // Update active button only if called from an event handler
        if (event && typeof event === 'object' && event.target && event.target.classList) {
            document.querySelectorAll('.control-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
        }

        // Calculate grid columns
        const columns = chartsPerRow;
        chartsGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

        // Update chart containers
        chartCards.forEach(card => {
            const chartContainer = card.querySelector('.chart-container');
            if (chartContainer) {
                try {
                    Plotly.relayout(chartContainer, {
                        width: chartContainer.clientWidth,
                        height: 300
                    });
                } catch (error) {
                    console.warn('Error updating chart layout:', error);
                }
            }
        });
    }

    // Toggle between grid and list view (future enhancement)
    toggleView(viewType, event = null) {
        this.currentView = viewType;

        // Update active button only if called from an event handler
        if (event && typeof event === 'object' && event.target && event.target.classList) {
            const controlButtons = document.querySelectorAll('.control-btn');
            if (controlButtons.length > 0) {
                controlButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                event.target.classList.add('active');
            }
        }

        // TODO: Implement list view if needed
        console.log(`Switched to ${viewType} view`);
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
