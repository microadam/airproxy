var bunyan = require('bunyan')
  , logger = bunyan.createLogger({ name: 'air-proxy' })
  , ZoneListener = require('./lib/zone-listener')
  , GroupManager = require('./lib/group-manager')
  , groupManager = new GroupManager(logger)
  , zoneListener = new ZoneListener(groupManager, logger)

zoneListener.on('zoneUp', function (zone) {
  logger.info('zone up - ', zone.name)
  groupManager.addZone('Proxy', zone)
})

zoneListener.on('zoneDown', function (zoneName) {
  logger.info('zone down - ', zoneName)
  groupManager.removeZone('Proxy', zoneName)
})

groupManager.create('Proxy')
