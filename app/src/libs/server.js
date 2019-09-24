import WebSocket from 'ws';
import EventEmitter from 'events';

export class SingleWebSocket extends EventEmitter
{
    constructor (server)
    {
        super();

        this._wss = new WebSocket.Server({
            server: server,
            path: "/ws"
        });

        this._wss.on('connection', (ws) => {
            
            ws.on('message', message => this._processIncomeingMessage(ws, message));

            this.emit("connection", ws);
        });
    }

    _processIncomeingMessage (client, message)
    {
        try
        {
            let data = JSON.parse(message);
            console.log('received:', data);
            this.emit("message", data, client);
        } 
        catch (e)
        {
            console.log('received invalied data: %s', message);
        }
    }

    send (message)
    {
        var data = JSON.stringify(message);

        this._wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) 
            {
                client.send(data);
            }
        });
    }

}

