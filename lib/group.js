module.exports = Group

var AirTunesServer = require('nodetunes')
  , AirTunes = require('airtunes').AirTunes

function Group(name, logger) {
  this.logger = logger
  this.zones = {}

  this.player = new AirTunes()
  this.player.on('buffer', onPlayerBuffer.bind(this))

  this.server = new AirTunesServer({ serverName: name, verbose: false })
  this.server.on('clientConnected', onClientConnected.bind(this))
  this.server.on('clientDisconnected', onClientDisconnected.bind(this))
  this.server.on('metadataChange', onMetadataChange.bind(this))
  this.server.on('artworkChange', onArtworkChange.bind(this))
  this.server.on('volumeChange', onVolumeChange.bind(this))
  this.server.start()
}

Group.prototype.getZones = function () {
  var zones = []
  Object.keys(this.zones).forEach(function (name) {
    zones.push(this.zones[name])
  }.bind(this))
  return zones
}

Group.prototype.addZone = function (zone) {
  this.zones[zone.name] = zone
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

function onClientConnected(stream) {
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
  this.player.stopAll(function () {
    this.logger.info('player - all stopped')
  }.bind(this))
}

function onMetadataChange(meta) {
  this.logger.info('client meta:', meta)
  this.getZones().forEach(function (zone) {
    zone.device.setTrackInfo(meta.minm, meta.asar, meta.asal)
  })
}

function onArtworkChange(artwork) {
  this.logger.info('client artwork:', artwork)
}

function onVolumeChange(volume) {
  volume = 100 + volume
  if (volume < 0) {
    volume = 0
  }
  this.logger.info('client volume:', volume)
  this.getZones().forEach(function (zone) {
    zone.device.setVolume(volume)
  })
}

function onPlayerBuffer(status) {
  this.logger.info('player status:', status)
}

function addDevice(zone) {
  var device = this.player.add(zone.host, { port: zone.port })
  zone.device = device

  device.on('status', function (status) {
    this.logger.info(zone.name + ' status -', status)
  }.bind(this))

  device.on('error', function (error) {
    this.logger.error(zone.name + 'error -', error)
  }.bind(this))
}
