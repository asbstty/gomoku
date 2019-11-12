const {insertObj, queryObj} = require('./db')
const tableName = 'counter'

async function saveUser(name) {
  const obj = {name, createtime:Date.now()}
  try {
    const insertResult = await insertObj(tableName, obj)
    return insertResult
  } catch(err) {
    return Promise.reject('db error')
  }
}

async function queryUser(user) {
  try {
    const result = await queryObj(tableName, user)
    return result
  } catch(err) {
    return Promise.reject(err)
  }
}

module.exports = {
  saveUser,
  queryUser
}