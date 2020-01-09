const mysql = require('mysql');

const SELECT = 'select';
const INSERT = 'insert';
const DELETE = 'delete';
const UPDATE = 'update';
const MODE = {
  execute: 'execute',
  query: 'query'
};
const occupiedVarWithSpaceUpper = [
  'WHERE',
  'LIKE',
  'ASC','DESC',
  'BETWEEN',
  'AND','OR','NOT',
  'YEAR','QUARTER','MONTH','WEEK'
];
const occupiedVarWithSpaceLower = [
  'where',
  'like',
  'asc','desc',
  'between',
  'and','or','not',
  'year','quarter','month','week'
];
const occupiedVarWithoutSpace = [
  '>','<','=','<=','>=','!='
];
const occupiedVar = [
  '*',
  ...occupiedVarWithoutSpace,
  ...occupiedVarWithSpaceUpper,
  ...occupiedVarWithSpaceLower
];

let mysqlParam = {};
let mysqlPool = null;
let mysqlConnection = null;
let mode = MODE.execute;

let parseString = function (string) {
  if (typeof string === 'string' && occupiedVar.indexOf(string) === -1 && mode === MODE.query) {
    return '\'' + string + '\'';
  }
  else return string;
};

let processColumns = function (data) {
  if (typeof data === 'object') {
    for (let key in data) {
      data[key] = parseString(data[key]);
    }
  }
  if (typeof data === 'string') {
    data = parseString(data);
  }
  return data;
};

let processSelector = function (data) {
  if (typeof data !== 'object') {
    return data;
  }
  if (!Array.isArray(data)) {
    for (let key in data) {
      data[key] = parseString(data[key]);
    }
    return data;
  }
  return data.map(function (item) {
    if (Array.isArray(item)) {
      item = item.map(subItem => parseString(subItem));
    }
    return item;
  })
};

let easyMysqlQuery = function (method, table, columns, querySelector, callback) {
  // use pool first
  if (!callback) {
    mode = MODE.query;
  }
  let pool = mysqlPool || mysqlConnection || null;
  let sendError = function (e) {
    if (mode === MODE.execute) {
      callback(e);
    }
    else {
      throw e;
    }
  };
  if (mode === MODE.execute && !pool) {
    sendError(new Error('Mysql settings not found! Run .setPool() or .setConnection() first.'));
    return;
  }
  if (method === 'SELECT' || method === 'Select') {
    method = 'select';
  }
  else if (method === 'INSERT' || method === 'Insert') {
    method = 'insert';
  }
  else if (method === 'DELETE' || method === 'Delete') {
    method = 'delete';
  }
  else if (method === 'UPDATE' || method === 'Update') {
    method = 'update';
  }
  // process columns and querySelector
  if (mode === MODE.query) {
    if (method === 'insert' || method === 'update') {
      columns = processColumns(columns);
    }
    querySelector = processSelector(querySelector);
  }
  // final query and its params
  let query = '';
  let params = [];
  try{
    // table must be string
    if (typeof table !== 'string') {
      sendError(new Error('Wrong table!'));
    }
    switch (method) {
      case SELECT:
        query += 'SELECT ';
        // column can be string while single column
        if (Array.isArray(columns)) {
          for (let name of columns) {
            query += name + ','
          }
          query = query.slice(0, -1);
        }
        else if (typeof columns === 'string') {
          query += columns;
        }
        else {
          sendError(new Error('Wrong column names!'));
        }
        query += ' FROM ' + table;
        break;
      case INSERT:
        query += 'INSERT INTO ' + table;
        // column must be object, array, or string
        if (typeof columns === 'string') {
          if (columns.length === 0) {
            sendError(new Error('Columns undefined!'));
            return;
          }
        }
        // can be string while there is only one column
        if (typeof columns !== 'object') {
          if (mode === MODE.execute) {
            query += ' VALUES (?)';
          }
          else {
            query += ' VALUES (' + columns + ')';
          }
          params.push(columns);
        }
        // can be array while all columns are set
        else if (Array.isArray(columns)) {
          query += ' VALUES (';
          for (let key in columns) {
            if (mode === MODE.execute) {
              query += '?,';
            }
            else {
              query += columns[key] + ',';
            }
            params.push(columns[key]);
          }
          query = query.slice(0, -1);
          query += ')'
        }
        // object can set certain columns
        else {
          let values = ' VALUES (';
          query += ' (';
          for (let key in columns) {
            query += key + ',';
            if (mode === MODE.execute) {
              values += '?,';
            }
            else {
              values += columns[key] + ',';
            }
            params.push(columns[key]);
          }
          query = query.slice(0, -1);
          values = values.slice(0, -1);
          query += ')';
          values += ')';
          query += values;
        }
        break;
      case DELETE:
        query += 'DELETE FROM ' + table;
        break;
      case UPDATE:
        query += 'UPDATE ' + table;
        if (typeof columns !== 'object') {
          sendError(new Error('Columns should be Object!'));
          return;
        }
        query += ' SET ';
        for (let key in columns) {
          if (mode === MODE.execute) {
            query += key + '=?,';
          }
          else {
            query += key + '=' + columns[key] + ',';
          }
          params.push(columns[key]);
        }
        query = query.slice(0, -1);
        break;
      default:
        sendError(new Error('Wrong method!'));
        break;
    }
    // add selectors
    if (querySelector && (method === SELECT || method === DELETE || method === UPDATE)) {
      if (typeof querySelector !== 'object') {
        sendError(new Error('Query-selector must be an Array or Object!'));
        return;
      }
      if (Array.isArray(querySelector)) {
        let needSpace = true;
        if (querySelector[0][0] !== ' ') {
          query += ' ';
        }
        for (let key in querySelector) {
          if (Array.isArray(querySelector[key])) {
            for (let i = 0; i < querySelector[key].length; i++) {
              if (mode === MODE.execute) {
                query += '?,';
              }
              else {
                query += querySelector[key][i] + ',';
              }
              params.push(querySelector[key][i]);
            }
            query = query.slice(0, -1) + ' ';
            needSpace = true;
          }
          else if (typeof querySelector[key] === 'string') {
            query += querySelector[key];
            needSpace = true;
            for (let i in occupiedVarWithoutSpace) {
              let spaceExp = new RegExp('^.*(' + occupiedVarWithoutSpace[i] + '|\\s)$', 'g');
              if (spaceExp.test(querySelector[key])) {
                needSpace = false;
                break;
              }
            }
            query += needSpace ? ' ' : '';
          }
          else {
            sendError(new Error('Wrong query-selector element type! Index: ' + key));
          }
        }
        if (needSpace) {
          query = query.slice(0, -1);
        }
      }
      else {
        query += ' WHERE ';
        for (let key in querySelector) {
          if (mode === MODE.execute) {
            query += key + '=?,';
          }
          else {
            query += key + '=' + querySelector[key] + ' AND ';
          }
          params.push(querySelector[key]);
        }
        query = query.slice(0, -5);
      }
    }
    if (mode === MODE.query) {
      for (let i = 0; i < occupiedVarWithSpaceLower.length; i++) {
        let regExp = new RegExp('(\?=.*\\s)' + occupiedVarWithSpaceLower[i] + '(\?=(\\s|;|\\().*)', 'g');
        query = query.replace(regExp, occupiedVarWithSpaceUpper[i]);
      }
    }
    if (query[query.length - 1] !== ';') {
      query += ';';
    }
    switch (mode) {
      case MODE.execute:
        // run query
        pool.query(query, params, function (e, result) {
          callback(e, result);
          if (pool === mysqlConnection) {
            pool.end();
          }
        });
        break;
      case MODE.query:
        if (callback) {
          callback(null, query);
        }
        else {
          return query;
        }
        break;
      default:
        sendError(new Error('Invalid easy-mysql-query mode! Should be "execute" or "query". Use .setMode() to change mode.'));
    }
  }
  catch (e) {
    sendError(e);
  }
};

easyMysqlQuery.setPool = (param) => {
  mysqlParam = param;
  mysqlPool = mysql.createPool(param);
};

easyMysqlQuery.setConnection = (param) => {
  mysqlParam = param;
  mysqlConnection = mysql.createConnection(param);
};

easyMysqlQuery.getPool = easyMysqlQuery.getConnection = () => {
  return mysqlParam;
};

easyMysqlQuery.setMode = (param) => {
  mode = param;
};

module.exports = easyMysqlQuery;
