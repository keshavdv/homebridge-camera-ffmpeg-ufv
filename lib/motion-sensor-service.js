'use-strict';

var debug = require('debug')('camera-ffmpeg-ufv');
var mqtt = require('mqtt')

var object = {};

object.createService = function (hap, nvrConfig, discoveredCamera, cache) {
    // var Accessory = hap.Accessory;
    var Service = hap.Service;
    var Characteristic = hap.Characteristic;
    var MotionSensor = {
        timers: [],
        lastDetected: 0,
        getStatusActive: function () {
            // TODO: Armed
            var val = 1;
            val = Boolean(val);
            val = Number(val);
            return val;
        }
    };

    var name = discoveredCamera.name + " Motion Sensor";

    var service = new Service.MotionSensor(name);

    var client  = mqtt.connect('mqtt://' + nvrConfig.frigateMqttHost)
    var topic = 'frigate/' + nvrConfig.frigateConfig[discoveredCamera.name].alias + '/person';
    client.on('connect', function () {
      client.subscribe(topic, function (err) {
        if (!err) {
          debug(name + " subscribed to " + topic);
        } else {
          debug(name + " failed to subscribe to " + topic + ":" + err.message);
        }
      })
    })
 
    client.on('message', function (topic, message) {
        var value = 0;
        if(message.toString() === "ON") {
          var now = Date.now();
          if (now > MotionSensor.lastDetected + (nvrConfig.frigateConfig[discoveredCamera.name].cooldown * 1000)) {
            value = 1;
            MotionSensor.lastDetected = now;
          } else {
            debug(name + " skipping state change due to cooldown period");
            return;
          }
       	}
        service.setCharacteristic(Characteristic.MotionDetected, value);
        debug(name + " sensor state change: " + value);
    })

    service.destroy = function() {
    }

    return service;
};

module.exports = object;
