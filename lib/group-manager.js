module.exports = GroupManager

var Group = require('./group')

function GroupManager(logger) {
  this.logger = logger
  this.groups = {}
}

GroupManager.prototype.create = function (name){
  this.logger.info('create group -', name)
  this.groups[name] = new Group(name, this.logger)
}

GroupManager.prototype.addZone = function (groupName, zone) {
  this.groups[groupName].addZone(zone)
}

GroupManager.prototype.removeZone = function (groupName, zoneName) {
  this.groups[groupName].removeZone(zoneName)
}

GroupManager.prototype.getNames = function () {
  return Object.keys(this.groups)
}
