

// var points = [
//     {x: 0, y:0},
//     {x: 1, y:2},
//     {x: 2, y:5},
// ]

var points = []; // [{x: 0, y:0}, {x: 2.48, y:0.004}, {x: 2.54, y:0.005}, {x: 2.57, y:0.009}, {x: 2.58, y:0.01}, {x: 2.58, y:0.011}, {x: 2.59, y:0.014}, {x: 2.6, y:0.015}, {x: 2.6, y:0.017}, {x: 2.61, y:0.021}, {x: 2.61, y:0.022}, {x: 2.61, y:0.024}, {x: 2.62, y:0.026}, {x: 2.62, y:0.028}, {x: 2.62, y:0.029}, {x: 2.63, y:0.032}, {x: 2.63, y:0.034}, {x: 2.63, y:0.035}, {x: 2.63, y:0.039}, {x: 2.63, y:0.04}, {x: 2.63, y:0.041}, {x: 2.64, y:0.044}, {x: 2.64, y:0.046}, {x: 2.64, y:0.048}, {x: 2.64, y:0.05}, {x: 2.64, y:0.052}, {x: 2.64, y:0.054}, {x: 2.65, y:0.057}, {x: 2.65, y:0.058}, {x: 2.65, y:0.06}, {x: 2.66, y:0.062}, {x: 2.66, y:0.064}, {x: 2.66, y:0.065}, {x: 2.66, y:0.067}, {x: 2.67, y:0.07}, {x: 2.68, y:0.071}, {x: 2.68, y:0.073}, {x: 2.7, y:0.076}, {x: 2.72, y:0.077}, {x: 2.74, y:0.079}, {x: 2.81, y:0.082}, {x: 2.85, y:0.084}, {x: 2.89, y:0.085}, {x: 3.05, y:0.088}, {x: 3.56, y:0.09}, {x: 4.94, y:0.09}, {x: 5.01, y:0.09}, {x: 5.01, y:0.09}, {x: 5.01, y:0.09}];

var ready = false;
var running = false;

var config = {
    
    type: 'scatter',
    
    data: {
        datasets: [
            {
                label: 'VA',
                data: points,
                borderColor: '#333',
                backgroundColor: 'red',
                fill: false,
                cubicInterpolationMode: 'monotone',
                showLine: true,
                borderWidth: 1,

                pointBorderWidth: 0,
                pointRadius: 5,
                pointRotation: 45,
                pointBorderColor: "red",
                
                pointStyle: "cross"
            }
        ]
    },
    
    options: { 
        
        responsive: true,
        aspectRatio: 1,
            
        
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Voltage [V]',
                    fontSize: 15
                },
                ticks: {
                    fontSize: 15,
                    suggestedMin: 0,
                    suggestedMax: 5.1
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Current [mA]',
                    fontSize: 15
                },
                ticks: {
                    fontSize: 15,
                    suggestedMin: 0,
                    suggestedMax: 0.02
                }
            }]
        },

        legend: {
            display: false
        }
    }
};

window.onload = function() {
    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, config);

    document.getElementById("start-btn").addEventListener("click", onStartClick);
    
    document.getElementById("plot-line").addEventListener("click", updateStyleChart);
    document.getElementById("plot-contrast").addEventListener("click", updateStyleChart);

    connect();
    updateStyleChart();
};

var socket;

function connect()
{
    setStatus("Connecting...", "warn");

    const wsUrl = "ws://" + location.host + "/ws";
    socket = new WebSocket(wsUrl);
    
    // Connection opened
    socket.addEventListener('open', function (event) {
        console.log("WS Open");
        setStatus("Ready", "ok");
    });
    
    // WS Error
    socket.addEventListener("error", function (err) {
        console.log(err);
        socket.close();
    })

    socket.addEventListener("close", function () {
        setStatus("Disconected", "err");
        setTimeout(connect, 2000);
    });
    
    // Listen for messages
    socket.addEventListener('message', function (event) {
        console.log('Message from server ', event.data);
        var o = JSON.parse(event.data);
        processMessage(o);
    });
}

function processMessage(message)
{
    if (message.stop)
    {
        running = false;
        updateUi();
    }
    else
    {
        addPointToChart(message.u, message.i)
    }    
}

function addPointToChart(u, i)
{
    var p = {
        x:u, 
        y:i*1000
    };

    points[(u > 0) ? "push" : "unshift"](p);;

    window.myLine.update();
}

function clearChart()
{
    points.length = 0;
    window.myLine.update();
}

function updateStyleChart()
{
    var line = document.getElementById("plot-line").checked;    
    config.data.datasets[0].showLine = line;

    var highContrast = document.getElementById("plot-contrast").checked;
    if (highContrast)
    {
        config.data.datasets[0].borderWidth = 3;
        config.data.datasets[0].pointRadius = 4;
        config.data.datasets[0].pointStyle = "circle";
    }
    else
    {
        config.data.datasets[0].borderWidth = 1;
        config.data.datasets[0].pointRadius = 4;
        config.data.datasets[0].pointStyle = "cross";
    }

    window.myLine.update();
}

function call(op, params)
{
    var msg = {
        "op": op,
        "params": params
    };

    socket.send(JSON.stringify(msg));
}

function setStatus(text, style)
{
    var s = document.getElementById("status-text");

    s.innerHTML = text;
    s.className = style;
}

function updateUi() {

    if (running)
    {
        document.getElementById("start-btn").innerHTML = "Stop";
        setStatus("Running...", "warn");
    }
    else
    {
        document.getElementById("start-btn").innerHTML = "Start";
        setStatus("Ready", "ok");
    }

}

function onStartClick() 
{
    if (running)
    {
        // stop
        call("stop");
    }
    else
    {
        // start
        running = true;
        var params = getParameters();

        var min, max;

        switch (params.q)
        {
            case "1":
                min = 0; max = 1;
                break;
            case "3":
                min = -1; max = 0;
                break;
            case "b":
                min = -1; max = 1;
                break;
        }

        config.options.scales.xAxes[0].ticks.suggestedMax = max * params.umax;
        config.options.scales.xAxes[0].ticks.suggestedMin = min * params.umax;
        config.options.scales.yAxes[0].ticks.suggestedMax = max * params.imax;
        config.options.scales.yAxes[0].ticks.suggestedMin = min * params.imax;
        
        clearChart();

        call("start", params);
    }

    updateUi();
}

function getParameters()
{
    var p = {
        "umax": parseInt(document.getElementById("input-umax").value, 10),
        "imax": parseInt(document.getElementById("input-imax").value, 10),
        "steps": parseInt(document.getElementById("input-steps").value, 10),
        "delay": parseInt(document.getElementById("input-delay").value, 10),
        "mode": document.getElementById("input-mode").value,
        "q": document.getElementById("input-q").value
    };

    console.log(p);

    return p;
}
