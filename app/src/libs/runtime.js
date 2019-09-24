const EventEmitter = require('events');

//const cnc = require("./cnc").DPS5005CNC;

import {DPS5005CNC} from "./cnc";

import {sleep} from "./helpers";


class Runtime extends EventEmitter
{
    constructor () 
    {
        super();

        this._dps = new DPS5005CNC("COM3");

        this._stopped();
    }

    start(params) 
    {
        if (this._running) 
        {
            return;
        }

        this._params = params;
        if (this._processParams() == false)
        {
            // TODO send error
            this._stopped();
            return false;
        }

        this._points = [];
        this._running = true;
        
        var p = this._run();

        this.emit("start");

        console.log("Start");

        return true;
    }

    async stop()
    {
        if (this._running == false)
        {
            return Promise.resolve();
        }

        var p = new Promise(resolve => {
            this.once("stop", resolve);
        });

        this._cancelld = true;

        console.log("Stoping");

        return p;
    }

    getPoints()
    {
        return this._points;
    }

    _stopped()
    {
        this._running = false;
        this._cancelld = false;
        this._negative = false;

        console.log("Stopped");

        this.emit("stop");
    }

    _processParams()
    {
        this._UMax = parseInt(this._params.umax, 10);
        this._IMax = parseInt(this._params.imax, 10) / 1000;
        this._Steps = parseInt(this._params.steps, 10);
        this._Delay = parseInt(this._params.delay, 10);
        this._Mode = this._params.mode;
        this._Q = this._params.q;

        if(isNaN(this._UMax) || this._UMax <= 0 || this._UMax > 40) {
            throw "Invalid UMax";
        } 

        if(isNaN(this._IMax) || this._IMax <= 0 || this._IMax > 2) {
            throw "Invalid IMax";
        } 

        if(isNaN(this._Steps) || this._Steps <= 0 || this._Steps > 1000) {
            throw "Invalid Steps";
        } 

        if(isNaN(this._Delay) || this._Delay < 0 || this._Delay > 60000) {
            throw "Invalid Delay";
        } 

        if (!this._Mode) {
            throw "Invalid Mode";
        }
        
        if (!this._Q) {
            throw "Invalid Mode";
        }
    }

    async _run()
    {
        console.log(`Run with Umax ${this._UMax}, Imax ${this._IMax}, steps ${this._Steps}, delay ${this._Delay}, q ${this._Q}`);
        
        await  this._dps.connect();

        try
        {
            if (this._Q == "1" || this._Q == "b")
            {
                this._negative = false;
                await this._measure();
            }
            
            if (this._Q == "3" || this._Q == "b")
            {
                this._negative = true;
                await this._measure();
            }
        } 
        catch(e)
        {
            console.log(e);
        }

        await this._dps.setOnOff(0);

        this._stopped();
    }

    async _measure()
    {
        switch(this._Mode)
        {
            case "cv":
                await this._runCV();
                break;
            case "cc":
                await this._runCC();
                break;
            case "ad":
                await this._runAdaptive();
                break;
            case "rnd":
                await this._runRandom();
                break;
            default:
                console.log("Unknown mode");
                this._stopped();
        }
    }

    _addPoint(u, i)
    {
        if (this._running == false || this._cancelld == true)
        {
            throw "Cancelld";
        }

        if (this._negative)
        {
            u *= -1;
            i *= -1;
        }

        const p = {
            u: u, 
            i: i
        };

        console.log("Point", p);

        this._points.push(p);
        this.emit('point', u, i);
    }


    async _runCV()
    {
        var ccCounter = 0;
        var uStep = this._UMax / this._Steps;

        await this._dps.setISet(this._IMax);
        await this._dps.setUSet(0);

        await this._dps.setOnOff(1);

        for (var x = 0; x <= this._UMax; x += uStep)
        {
            await this._dps.setUSet(x);
            await sleep(this._Delay);

            var d = await this._dps.readRegisters(0x02, 2);

            console.log(d);

            this._addPoint(d[0]/100, d[1]/1000);

            var cv = await this._dps.getCvCc();
            if (cv == 1) 
            {
                if (ccCounter >= 2)
                {
                    break; // CC Mode, no need to continue
                }

                ccCounter ++;
            }
        }
    }

    async _runCC()
    {
        var iStep = this._IMax / this._Steps;
        var cvCounter = 0;

        await this._dps.setISet(0);
        await this._dps.setUSet(this._UMax);

        await this._dps.setOnOff(1);

        for (var x = 0; x <= this._IMax; x += iStep)
        {
            await this._dps.setISet(x);
            await sleep(this._Delay);

            var d = await this._dps.readRegisters(0x02, 2);

            console.log(d);


            this._addPoint(d[0]/100, d[1]/1000);

            var cv = await this._dps.getCvCc();
            if (cv == 0) 
            {
                if (cvCounter >= 2)
                {
                    break; // CV Mode, no need to continue
                }

                cvCounter ++;
            }
        }
    }

    async _runRandom()
    {
        await this._dps.setISet(this._IMax);
        await this._dps.setUSet(0);

        await this._dps.setOnOff(1);

        for (var n = 0; n <= this._Steps; n ++)
        {
            var x = Math.round(Math.random() * this._UMax * 100) / 100;
            console.log(x);
            await this._dps.setUSet(x);
            await sleep(this._Delay);

            var d = await this._dps.readRegisters(0x02, 2);

            console.log(d);

            var cv = await this._dps.getCvCc();
            if (cv == 0) 
            {
                this._addPoint(d[0]/100, d[1]/1000);
            }
        }
    }

    async _runAdaptive()
    {
        var uStep = this._UMax / this._Steps;
        var iStep = this._IMax / this._Steps;
        
        console.log(`uStep ${uStep}, iStep ${iStep}`);

        var maxChangeC = 0.5;

        var cv = true;

        await this._dps.setISet(this._IMax);
        await this._dps.setUSet(0);

        await this._dps.setOnOff(1);

        var nextI = 0;
        var nextU = 0;

        for (var n = 0; n < this._Steps * 2; n++)
        {
            if (cv)
            {
                console.log("---- CV");
                await this._dps.setUSet(nextU);
                console.log(`Uout ${nextU}`);
            }
            else
            {
                console.log("---- CC");
                await this._dps.setISet(nextI);
                console.log(`Iout ${nextI}`);
            }

            await sleep(this._Delay);

            var d = await this._dps.readRegisters(0x02, 2);
            var u = d[0] / 100;
            var i = d[1] / 1000;

            console.log(`${u} V | ${i} mA`)

            if (cv)
            {
                console.log(`I: ${i}, max change: ${nextI + iStep * maxChangeC}`);
                if (i >= nextI + iStep * maxChangeC)
                {
                    console.log("--> CC");
                    cv = false; // swicth to CC
                    
                    await this._dps.setISet(i);
                    await this._dps.setUSet(this._UMax);
                    
                    continue;
                }
            }
            else
            {
                console.log(`U: ${u}, max change: ${nextU + uStep * maxChangeC}`);
                if (u >= nextU + uStep * maxChangeC)
                {
                    console.log("--> CV");

                    cv = true; // swicth to CV

                    await this._dps.setUSet(u);
                    await this._dps.setISet(this._IMax);

                    continue;
                }
            }

            this._addPoint(u, i);

            // max is here as prevetion from oscilation

            if (cv)
            {
                nextI = i + iStep;
                nextU = Math.max(u, nextU) + uStep;
            }
            else
            {
                nextI = Math.max(i, nextI) + iStep;
                nextU = u + uStep;
            }
            
            
            
            

            console.log(`Next U ${nextU}, next I ${nextI}`);

            if (nextI > this._IMax || nextU > this._UMax) 
            {
                break;
            }
        }


    }
}

exports.Runtime = Runtime;
