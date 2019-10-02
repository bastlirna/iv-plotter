# I·V Plotter 

_Tiny application for measurement of IV characteristics via DPS 5005 digital power supply._

<p align="center">
<img src="https://raw.githubusercontent.com/bastlirna/iv-plotter/master/doc/screen1.png" alt="MQTT Wall Screenshot">
</p>

## How it works

Some of [Rui Deng](https://rdtech.aliexpress.com) digital power supplies e.g. [DPS 5005](https://www.aliexpress.com/item/1000004290003.html) can be controled from PC via USB convertor. There is oficial app, but more importnat API documentation. So why not to use this API for something interesting that official app can not do...

<p align="center">
<img src="https://raw.githubusercontent.com/bastlirna/iv-plotter/master/doc/overview.png" width="700" alt="MQTT Wall Screenshot">
</p>

### Resolution

DPS has resolution 10 mV for voltage and 1 mA for current. Also change of output is very slow and one must wait for settle down. 

This application is there for more demo or tool for explaining what is IV curve for newbes more then serious tool.

> Hovewer it can be used as example how to control DPS via API.

## How to use

```
git clone git@github.com:bastlirna/iv-plotter.git
cd app
npm install
npm start
```

And enjoy... 