module.exports = ZoneListener

var Emitter = require('events').EventEmitter
  // TODO: switch to mdns-js eventually?
  , mdns = require('mdns')

function ZoneListener(groupManager, logger) {
  Emitter.call(this)
  this.logger = logger

  var browser = mdns.createBrowser(mdns.tcp('raop'))
  this.browser = browser
  this.groupManager = groupManager

  this.startListening()
}

ZoneListener.prototype = Object.create(Emitter.prototype)

ZoneListener.prototype.startListening = function () {
  this.browser.on('serviceUp', function(serviceInfo) {
    var zoneName = getName(serviceInfo.name)
    if (this.groupManager.getNames().indexOf(zoneName) === -1) {
      var zone =
        { name: zoneName
        , host: serviceInfo.host
        , port: serviceInfo.port
        }
      this.emit('zoneUp', zone)
    }
  }.bind(this))

  this.browser.on('serviceDown', function(serviceInfo) {
    var zoneName = getName(serviceInfo.name)
    if (this.groupManager.getNames().indexOf(zoneName) === -1) {
      this.emit('zoneDown', zoneName)
    }
  }.bind(this))

  this.browser.on('error', function (error) {
    this.logger.error('MDNS browser error -', error)
  }.bind(this))

  this.browser.start()
}

function getName(name) {
  var parts = name.split('@')
  return parts[parts.length - 1]
}
