const {insertObj, queryObj} = require('./db')
const tableName = 'user'

async function saveUser(name) {
  const obj = {name, createtime:Date.now()}
  try {
    const insertResult = await insertObj(tableName, obj)
    return insertResult.ops[0]
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