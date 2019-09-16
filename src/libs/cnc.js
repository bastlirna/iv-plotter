// Communication for DPS5005

var ModbusRTU = require("modbus-serial");


class DPS5005CNC
{

    constructor (port) 
    {
        this._client = new ModbusRTU();

        
    }

    async connect()
    {
        if (this._client.isOpen)
        {
            return true;
        }

        let p = new Promise(resolve => {
            this._client.connectRTU("COM3", { baudRate: 9600 }, () => {
                this._client.setID(1);
                resolve();
            });
        });

        return p;
    }

    async close()
    {
        return this._client.close();
    }

    async readRegister(addr, places = 0)
    {
        var resp = await this._client.readHoldingRegisters(addr, 1);

        if (!resp.data || resp.data.length != 1)
        {
            return undefined;
        }

        var value = resp.data[0] / Math.pow(10, places);

        return value;
    }

    async writeRegister(addr, value, places = 0)
    {
        value = Math.round(value * Math.pow(10, places));
        return this._client.writeRegister(addr, value)
    }

    async readRegisters(addr, count)
    {
        var resp = await this._client.readHoldingRegisters(addr, count);

        if (!resp.data)
        {
            return undefined;
        }

        var value = resp.data;

        return value;
    }

    async writeRegisters(addr, values)
    {
        return this._client.writeRegisters(addr, values);
    }

    // --- 

    async getUSet()
    {
        return this.readRegister(0x00, 2);
    }

    async getISet()
    {
        return this.readRegister(0x01, 3);
    }

    async getUOut()
    {
        return this.readRegister(0x02, 2);
    }

    async getIOut()
    {
        return this.readRegister(0x03, 3);
    }

    async getPower()
    {
        return this.readRegister(0x04, 2);
    }

    async getUIn()
    {
        return this.readRegister(0x05, 2);
    }

    async getLock()
    {
        return this.readRegister(0x06, 0);
    }

    async getProtected()
    {
        return this.readRegister(0x07, 0);
    }

    async getCvCc()
    {
        return this.readRegister(0x08, 0);
    }

    async getOnOff()
    {
        return this.readRegister(0x09, 0);
    }

    async getBLed()
    {
        return this.readRegister(0x0A, 0);
    }

    async getModel()
    {
        return this.readRegister(0x0B, 0);
    }

    async getVersion()
    {
        return this.readRegister(0x0C, 0);
    }

    // --- set ---    

    async setUSet(value)
    {
        return this.writeRegister(0x00, value, 2);
    }

    async setISet(value)
    {
        return this.writeRegister(0x01, value, 3);
    }

    async setLock(value)
    {
        return this.writeRegister(0x06, value);
    }

    async setOnOff(value)
    {
        return this.writeRegister(0x09, value);
    }

    async setBLed(value)
    {
        return this.writeRegister(0x0A, value);
    }

    // --- helpser ---

    async setOutputSet(u, i)
    {
        await this.writeRegisters(0x00, [u * 100, i * 1000]);
    }
}

exports.DPS5005CNC = DPS5005CNC;
