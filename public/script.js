let chartInstances = {}; // Store chart instances globally

document.addEventListener('DOMContentLoaded', () => {
    const isLivePage = window.location.pathname.includes('live.html');

    // Check if the domain is 'vmoods.com' or 'www.vmoods.com'
    const isVmoodsDomain = window.location.hostname === 'vmoods.com' || window.location.hostname === 'www.vmoods.com';
    // Check if the pathname is exactly '/'
    const isRootPath = window.location.pathname === '/';

    // If both conditions are met, redirect to '/live.html'
    if (isVmoodsDomain && isRootPath) {
        window.location.href = '/live.html';
    }

    if (isLivePage) {
        navigateTo('screenvmware');
    }
});

function toggleFooterVisibility(show) {
    const footer = document.getElementById('footer');
    if (show) {
        footer.style.display = 'block';
    } else {
        footer.style.display = 'none';
    }
}
async function fetchResults() {
    try {
        const response = await fetch('/api/results');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching results:', error);
    }
}

async function updateCharts(charts) {
    const results = await fetchResults();
    const data = [results.hypervisor, results.vmware, results.hyperscaler];
    const maxValue = Math.max(...data); // Find the maximum value
    charts.forEach(chart => {
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].datalabels = data.map(value => ({
            opacity: value === maxValue ? 1 : 0.5 // Full opacity for the largest slice, reduced for others
        }));
        chart.update();
    });
}

function createChart(ctx, selectedOption) {
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Alternate Hypervisors', 'VMware Cloud', 'Hyperscale Cloud'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#FF0000', // Red for Alternate Hypervisor
                    '#000000', // Black for VMware Cloud Foundation
                    '#808080'  // Grey for Hyperscale Cloud
                ],
                borderColor: [
                    '#FF0000',
                    '#000000',
                    '#808080'
                ],
                borderWidth: 1
            }]
        },
        options: {
            events: [],
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateScale: true,
                animateRotate: true
            },
            plugins: {
                legend: {
                    display: false // Hide the chart label
                },
                datalabels: {
                    color: '#fff',
                    font: context => {
                        const label = context.chart.data.labels[context.dataIndex];
                        console.log(label, selectedOption); // Debugging line
                        const isSelected = label === selectedOption;
                        return {
                            weight: 'bold',
                            size: isSelected ? 40 : 32, // Larger font size for the selected option value
                            family: "'Inter', 'Helvetica', 'Arial', sans-serif"
                        };
                    },
                    formatter: (value, context) => {
                        return value;
                    },
                    anchor: 'end',
                    align: 'start',
                    offset: 0,
                    opacity: context => {
                        const label = context.chart.data.labels[context.dataIndex];
                        return label === selectedOption ? 1 : 0.8; // Full opacity for the selected option, reduced for others
                    }
                }
            },
            layout: {
                padding: {
                    bottom: 40
                }
            }
        },
        plugins: [{
            id: 'datalabels_labels',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach(function(dataset, datasetIndex) {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (!meta.hidden) {
                        const total = dataset.data.reduce((acc, curr) => acc + curr, 0);
                        meta.data.forEach(function(element, index) {
                            const dataValue = dataset.data[index];
                            const dataLabel = chart.data.labels[index];
                            const isSelected = dataLabel === selectedOption;
        
                            const fontSizeValue = isSelected ? 80 : 32;
                            const fontSizeLabel = isSelected ? 24 : 18;
                            const opacity = dataLabel === selectedOption ? 1 : 0.8;
        
                            const percentage = Math.round((dataValue / total) * 100); // Calculate percentage and round to whole number
                            
                            const model = element.tooltipPosition();
                            const x = model.x;
                            const y = model.y;
        
                            const lineHeight = isSelected ? 30 : 10; // Adjust line height for selected value
        
                            ctx.save();
                            // Draw percentage text
                            ctx.font = Chart.helpers.fontString(fontSizeValue, 'bold', Chart.defaults.font.family);
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                            ctx.fillText(`${percentage}%`, x, y - (fontSizeLabel / 2) - lineHeight); // Draw percentage higher
        
                            // Draw label text
                            const label = dataLabel.split(' '); // Split label into words
                            ctx.font = Chart.helpers.fontString(fontSizeLabel, 'bold', Chart.defaults.font.family);
                            ctx.fillText(label[0], x, y + (fontSizeLabel / 2)); // Draw first part of label
                            ctx.fillText(label.slice(1).join(' '), x, y + (fontSizeLabel * 1.5)); // Draw second part of label below
        
                            ctx.restore();
                        });
                    }
                });
            }
        }]
    });
}


function navigateTo(screenId, selectedOption) {
    console.log(`Navigating to: ${screenId}`);
    const screen = document.getElementById(screenId);
    if (!screen) {
        console.error(`No element found with ID: ${screenId}`);
        return;
    }
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('visible');
    });
    screen.classList.remove('hidden');
    screen.classList.add('visible');

    if (screenId === 'contactForm') {
        // Clear the email input field
        document.getElementById('email').value = '';
    }

    toggleFooterVisibility(screenId !== 'home'); // Show footer on all screens except home
    updateChartsAndRecreate(screenId, selectedOption); // Update and recreate chart when navigating
}

async function updateChartsAndRecreate(screenId, selectedOption) {
    const results = await fetchResults();
    const data = [results.hypervisor, results.vmware, results.hyperscaler];

    const chartIdMap = {
        screenvmware: 'chart-vmware',
        screenhypervisor: 'chart-hypervisor',
        screenhyperscaler: 'chart-hyperscaler'
    };

    const canvasId = chartIdMap[screenId];
    if (canvasId) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');

        // Destroy existing chart instance if it exists
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }

        // Create a new chart instance and store it
        chartInstances[canvasId] = createChart(ctx, selectedOption);
        chartInstances[canvasId].data.datasets[0].data = data;
        chartInstances[canvasId].update();
    }
}

let userSelection = ''; // Variable to store the user's selection

async function handleSelection(selection) {
    await recordSelection(selection);
    const selectedLabelMap = {
        vmware: 'VMware Cloud',
        hypervisor: 'Alternate Hypervisors',
        hyperscaler: 'Hyperscale Cloud'
    };
    userSelection = selectedLabelMap[selection]; // Store the user's selection
    navigateTo(`screen${selection}`, selectedLabelMap[selection]);
}


async function recordSelection(selection) {
    try {
        const response = await fetch('/api/record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ selection })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error recording selection:', error);
    }
}

// Initialize home screen visibility and load selections
if(document.getElementById('home')){
    document.getElementById('home').classList.add('visible');
}
toggleFooterVisibility(false); // Hide footer initially

let selectedHypervisor = ''; // Global variable to store the selected hypervisor

function selectHypervisor(hypervisor) {
    selectedHypervisor = hypervisor;
    navigateTo('contactForm'); // Proceed to the contact form
}

document.getElementById('expertForm').addEventListener('submit', function(event) {
    event.preventDefault();
    function sendJSONPRequest() {
        // Define the endpoint
        const url = 'https://go.expedient.com/l/12902/2024-08-23/k5f215';
    
        // Get the value of the input field with the ID of 'email'
        const emailInput = document.getElementById('email').value;

        //Check for null in userSelection
        if(userSelection == ''){ 
            userSelection = 'cloud workloads'
        }

        // Define the parameters you want to send, including the email
        const params = {
            email: emailInput, // Add the email input value here
            selection: userSelection, // Add the user's selection here
            hyperVisor: selectedHypervisor //Selected hypervisor 
        };

        // Serialize the parameters to a query string
        const queryString = new URLSearchParams(params).toString();

        // Create a unique callback function name
        const callbackName = 'jsonpCallback_' + Math.random().toString(36).substring(2, 15);

        // Attach the callback to the window object
        window[callbackName] = function(response) {
            // Handle the JSONP response here
            console.log('JSONP Response:', response);

            // Clean up by removing the script tag and callback
            delete window[callbackName];
            document.body.removeChild(script);
        };

        // Create the script element
        const script = document.createElement('script');

        // Set the src attribute to the URL with the callback parameter
        script.src = `${url}?${queryString}&callback=${callbackName}`;

        // Append the script to the document to initiate the request
        document.body.appendChild(script);
    }
    
    // Call the function to send the request
    sendJSONPRequest();

    const email = document.getElementById('email').value;
    alert(`Form submitted with email ${email}, a representative from Expedient we'll be reaching out.`);
    // Here you can handle the form submission, e.g., sending data to the server
    const isLivePage = window.location.pathname.includes('live.html');
    
    if (isLivePage) {
        navigateTo('screenvmware');
    }else{
        navigateTo('home'); // Navigate back to home after submission
    }
});

// Add event listener to footer to navigate to home
document.getElementById('footer').addEventListener('click', function() {
    navigateTo('home');
    updateChartsAndRecreate('home', ''); // Fetch and update charts when navigating to home
});

async function initializeChartForScreen(screenId) {
    const data = await fetchResults();
    let canvasId = '';

    if (screenId === 'screenvmware') {
        canvasId = 'chart-vmware';
    }

    if (canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const chart = createChart(ctx, data);
        setInterval(() => {
            updateCharts([chart]);
        }, 5000);
    }
}