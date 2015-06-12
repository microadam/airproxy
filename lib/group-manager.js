module.exports = GroupManager

var EventEmitter2 = require('eventemitter2').EventEmitter2
  , Group = require('./group')

function GroupManager(logger) {
  EventEmitter2.call(this)
  this.logger = logger
  this.groups = {}
}

GroupManager.prototype = Object.create(new EventEmitter2({ wildcard: true }))

GroupManager.prototype.create = function (name){
  this.logger.info('create group -', name)
  var group = new Group(name, this.logger)
  group.onAny(function (data) {
    this.emit(data.name, name, data.value)
  }.bind(this))
  this.groups[name] = group
}

GroupManager.prototype.destroy = function (name) {
  this.logger.info('destroy group -', name)
  this.groups[name].destroy()
  delete this.groups[name]
}

GroupManager.prototype.list = function () {
  return this.groups
}

GroupManager.prototype.addZone = function (groupName, zone) {
  this.groups[groupName].addZone(zone)
}

GroupManager.prototype.removeZone = function (groupName, zoneName) {
  this.groups[groupName].removeZone(zoneName)
}

GroupManager.prototype.setZoneVolume = function (groupName, zoneName, volume) {
  return this.groups[groupName].setZoneVolume(zoneName, volume)
}

GroupManager.prototype.getNames = function () {
  return Object.keys(this.groups)
}
