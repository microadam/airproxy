module.exports = ZoneListener

var Emitter = require('events').EventEmitter
  , mdns = require('mdns-js')

mdns.excludeInterface('0.0.0.0')

function ZoneListener(groupManager, logger) {
  Emitter.call(this)
  this.logger = logger

  var browser = mdns.createBrowser(mdns.tcp('raop'))
  this.browser = browser
  this.groupManager = groupManager
  this.times = {}

  browser.on('ready', this.startListening.bind(this))
}

ZoneListener.prototype = Object.create(Emitter.prototype)

function filterIps(address) {
  if (address.indexOf('::') > -1) return false
  if (address.indexOf('169.') === 0) return false
  return true
}

ZoneListener.prototype.startListening = function () {

  this.browser.on('update', function (service) {
    var zoneName = getName(service.fullname)
    if (this.groupManager.getNames().indexOf(zoneName) === -1) {
      service.addresses = service.addresses.filter(filterIps)
      var zone =
        { name: zoneName
        , host: service.addresses[0]
        , port: service.port
        }
      if (!this.times[zoneName]) {
        this.emit('zoneUp', zone)
      }
      this.times[zoneName] = Date.now() / 1000
    }
  }.bind(this))

  this.browser.discover()

  setTimeout(function () {
    this.browser.stop()

    Object.keys(this.times).forEach(function (zoneName) {
      var lastSeen = this.times[zoneName]
        , now = Date.now() / 1000

      if (now - lastSeen > 60) {
        if (this.groupManager.getNames().indexOf(zoneName) === -1) {
          this.emit('zoneDown', zoneName)
        }
        delete this.times[zoneName]
      }
    }.bind(this))

    this.browser = mdns.createBrowser(mdns.tcp('raop'))
    this.browser.on('ready', this.startListening.bind(this))
  }.bind(this), 3000)
}

function getName(name) {
  var parts = name.split('@')
  return parts[parts.length - 1].replace('._raop._tcp.local', '')
}
