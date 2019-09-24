
var cnc = require("./libs/cnc").DPS5005CNC;

var c = new cnc();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main()
{
    await c.connect();

    /*
    var data = await c.readRegister(0x05, 2);
    console.log(data);

    var data = await c.readRegister(0x00, 2);
    console.log(data);

    var data = await c.readRegister(0x01, 3);
    console.log(data);*/
/*
    var data = await c.readRegister(0x00, 2);
    console.log(data);

    await c.writeRegister(0x00, 200);

    var data = await c.readRegister(0x00, 2);
    console.log(data);

    await c.writeRegister(0x09, 0);

    var data = await c.readRegister(0x09);
    console.log(data);
*/

    await c.setISet(0.1);
    await c.setUSet(0.00);

    await c.setOnOff(1);

    for (var x = 0; x <= 5; x += 0.1)
    {
        await c.setUSet(x);
        await sleep(100);

        var u = await c.getUOut();
        var i = await c.getIOut();

        var cv = await c.getVcCc();

        console.log(x + ";" + u + ";" + i + ";" + cv);
    }

    await c.setOnOff(0);

    // await c.setISet(0.00);
    // await c.setUSet(5.00);

    // await c.setOnOff(1);

    // for (var x = 0.000; x <= 0.1; x += 0.002)
    // {
    //     await c.setISet(x);
    //     await sleep(100);

    //     var u = await c.getUOut();
    //     var i = await c.getIOut();

    //     var cv = await c.getVcCc();

    //     console.log(x + ";" + u + ";" + i + ";" + cv);
    // }

    // await c.setOnOff(0);
    
    c.close();
}


(async () => {
    try {
        var text = await main();
    } catch (e) {
        // Deal with the fact the chain failed
    }
})();


