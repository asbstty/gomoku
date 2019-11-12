var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/';
var dbName = 'gomoku'

function createConn() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, {useNewUrlParser: true}, (err, db) => {
      if(err) {
        reject(err)
      }
      resolve(db)
    })
  })
}

function insertObj(tableName, obj) {
  console.log('tableName', tableName, obj)
  return new Promise((resolve, reject) => {
    createConn().then(db => {
      var dbo = db.db(dbName)
      dbo.collection(tableName).insertOne(obj, (err, res) => {
        if(err) {
          reject(err)
        } else {
          resolve(res)
        }
        db.close()
      })
    }).catch(err => {
      reject(err)
    })
  })
}

function queryObj(tableName, obj) {
  return new Promise((resolve, reject) => {
    createConn().then(db => {
      var dbo = db.db(dbName)
      dbo.collection(tableName).find(obj).toArray((err, result) => {
        if(err) {
          reject(err)
        } else {
          resolve(result)
        }
        db.close()
      })
    }).catch(err => {
      reject(err)
    })
  })
}

module.exports = {
  insertObj,
  queryObj
}