var nullLogger = require('mc-logger')
  , ZoneListener = require('./lib/zone-listener')
  , GroupManager = require('./lib/group-manager')

module.exports = function createAirProxy(logger) {
  if (!logger) {
    logger = nullLogger
  }

  var groupManager = new GroupManager(logger)
    , zoneListener = new ZoneListener(groupManager, logger)

  return {
    groupManager: groupManager
  , zoneListener: zoneListener
  }
}
