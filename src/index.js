const WebSocket = require('ws');
 
const Runtime = require("./libs/runtime").Runtime;

const r = new Runtime();

const wss = new WebSocket.Server({
  port: 8080
});

function send(data)
{
    let s = JSON.stringify(data);

    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(s);
        }
    });
}

r.on("point", (u, i) => {
    send({
        u: u,
        i: i
    });
});

r.on("stop", () => {
    console.log("stop event");
    send({stop: true});
})


wss.on('connection', async function connection(ws) {

    ws.on('message', function incoming(message) {
       console.log('received: %s', message);
       processMessage(message);
    });

    //send(r.getPoints());
});

wss.on('message', function incoming(data) {
    console.log(data);
    processMessage(data);
});

function processMessage(msg)
{
    var m = JSON.parse(msg);

    if (m.op == "start")
    {
        try{
            r.start(m.params);
        }catch(e){
            send({"error": e});
        }
    }

    if (m.op == "stop")
    {
        r.stop();
    }
}
