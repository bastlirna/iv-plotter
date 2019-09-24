import http from 'http';
import path from 'path';
import express from 'express';

import { Runtime } from "./libs/runtime";
import { SingleWebSocket } from "./libs/server";

// HTTP server
const app = express();
app.use(express.static(path.join(__dirname, 'web')));

// WebSocket server
const server = http.createServer(app);
const wss = new SingleWebSocket(server);

// Runtime
const runtime = new Runtime();

runtime.on("stop", () => {
    console.log("runtime stop event");
    wss.send({stop: true});
});

runtime.on("point", (u, i) => {
    wss.send({u: u, i: i});
});

wss.on('connection', (ws) => {
    console.log("New connection");

    // TODO send current status
});

wss.on('message', msg => {

    switch (msg.op)
    {
        case "start":
            try{
                runtime.start(msg.params);
            }catch(e){
                wss.send({"error": e});
            }
            break;

        case "stop":
            runtime.stop();
            break;

        default:
            console.log(`Unknown operation`);
    }

});


const port = 8000;

//app.listen(port, () => console.log(`Example app listening on port ${port}!`))

server.listen(port, () => console.log(`Server listening on port ${port}`));
