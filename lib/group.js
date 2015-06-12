module.exports = Group

var EventEmitter2 = require('eventemitter2').EventEmitter2
  , AirTunesServer = require('nodetunes')
  , AirTunes = require('airtunes').AirTunes

function Group(name, logger) {
  EventEmitter2.call(this)
  this.logger = logger
  this.zones = {}
  this.currentClientVolume = null

  this.player = new AirTunes()
  this.player.on('buffer', onPlayerBuffer.bind(this))

  this.server = new AirTunesServer({ serverName: name, verbose: false })
  this.server.on('clientConnected', onClientConnected.bind(this))
  this.server.on('clientDisconnected', onClientDisconnected.bind(this))
  this.server.on('metadataChange', onMetadataChange.bind(this))
  this.server.on('artworkChange', onArtworkChange.bind(this))
  this.server.on('progressChange', onProgressChange.bind(this))
  this.server.on('volumeChange', onVolumeChange.bind(this))
  this.server.start()
}

Group.prototype = Object.create(new EventEmitter2({ wildcard: true }))

Group.prototype.destroy = function () {
  var zones = this.getZones()
  zones.forEach(function (zoneName) {
    this.removeZone(zoneName)
  })
}

Group.prototype.getZones = function () {
  var zones = []
  Object.keys(this.zones).forEach(function (name) {
    zones.push(this.zones[name])
  }.bind(this))
  return zones
}

Group.prototype.addZone = function (zone) {
  var zoneToAdd =
    { name: zone.name
    , host: zone.host
    , port: zone.port
    , volume: zone.volume
    }
  this.zones[zone.name] = zoneToAdd
}

Group.prototype.removeZone = function (zoneName) {
  var zone = this.zones[zoneName]

  if (!zone) return

  if (zone.device) {
    zone.device.stop()
  }

  delete this.zones[zoneName]
  if (!this.getZones().length) {
    // close connection - this doesnt seem to work?
    this.server.stop()
    this.server.start()
  }
}

Group.prototype.setZoneVolume = function (zoneName, volume) {
  this.zones[zoneName].volume = volume
  this.logger.info('set zone volume to: ' + volume)
  if (this.zones[zoneName].device) {
    this.logger.info('set actual device volume to: ' + volume)
    this.zones[zoneName].device.setVolume(volume)
  }
}

function onClientConnected(stream) {
  this.emit('clientConnected', { name: 'clientConnected' })
  this.logger.info('client connected')
  var zones = this.getZones()
  if (zones.length) {
    zones.forEach(function (zone) {
      addDevice.call(this, zone)
    }.bind(this))
    stream.pipe(this.player)
  } else {
    // close connection - this doesnt seem to work?
    this.server.stop()
    this.server.start()
  }
}

function onClientDisconnected() {
  this.emit('clientDisconnected', { name: 'clientDisconnected' })
  this.player.stopAll(function () {
    this.logger.info('player - all stopped')
  }.bind(this))
}

function onMetadataChange(meta) {
  this.emit('metadataChange', { name: 'metadataChange', value: meta })
  this.logger.info('client meta:', meta)
  this.getZones().forEach(function (zone) {
    zone.device.setTrackInfo(meta.minm, meta.asar, meta.asal)
  })
}

function onProgressChange(progress) {
  this.logger.info('progress:', progress)
}

function onArtworkChange(artwork) {
  this.logger.info('client artwork:', artwork)
}

function onVolumeChange(volume) {
  volume = 100 + volume
  if (volume < 0) {
    volume = 0
  }
  volume = Math.ceil(volume)

  if (this.currentClientVolume) {
    if (volume > this.currentClientVolume) {
      this.emit('volumeUp', { name: 'volumeUp', value: null })
    } else if (volume < this.currentClientVolume) {
      this.emit('volumeDown', { name: 'volumeDown', value: null })
    }
  }
  this.currentClientVolume = volume

  this.emit('volumeChange', { name: 'volumeChange', value: volume })
  this.logger.info('client volume:', volume)
  // this.getZones().forEach(function (zone) {
  //   zone.device.setVolume(volume)
  // })
}

function onPlayerBuffer(status) {
  this.logger.info('player status:', status)
}

function addDevice(zone) {
  var options = { port: zone.port }

  if (zone.volume) {
    options.volume = zone.volume
  }

  var device = this.player.add(zone.host, options)
  zone.device = device

  device.on('status', function (status) {
    this.logger.info(zone.name + ' status -', status)
  }.bind(this))

  device.on('error', function (error) {
    this.logger.error(zone.name + 'error -', error)
  }.bind(this))
}
