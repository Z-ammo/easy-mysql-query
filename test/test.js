const should = require('should');

let emq = require('../lib/easyMysqlQuery');
let selector = {};
let columns = {};
let mysqlParam = {
  host: '127.0.0.1',
  port: '3306',
  user: 'root',
  password: 'abc123',
  database: 'my_base'
};

describe('query', function () {
  before(function () {
    emq.setMode('query');
    emq.setPool(mysqlParam);
  })
  describe('#set connection or pool', function () {
    it('should be origin settings', function () {
      emq.getPool().should.equal(mysqlParam)
    })
  })
  describe('#SELECT', function () {
    it('should be SELECT * FROM users;', function () {
      emq('select', 'users', '*').should.equal('SELECT * FROM users;');
    })
    it('should be SELECT name FROM users WHERE id=123;', function () {
      selector = ['WHERE id=',[123]];
      emq('select', 'users', 'name', selector).should.equal('SELECT name FROM users WHERE id=123;');
    })
    it('should be SELECT name,gender FROM users WHERE id=123 AND age>20 OR name LIKE \'Tom%\' LIMIT 5,5;', function () {
      selector = ['WHERE id=',[123],'AND age>',[20],'OR name LIKE',['Tom%'],'LIMIT',[5,5]];
      emq('select', 'users', ['name', 'gender'], selector).should.equal('SELECT name,gender FROM users WHERE id=123 AND age>20 OR name LIKE \'Tom%\' LIMIT 5,5;');
    })
    it('should be SELECT name,gender FROM users WHERE age>20 ORDER BY name DESC;', function () {
      selector = ['WHERE age>',[20],'ORDER BY name DESC'];
      emq('select', 'users', ['name', 'gender'], selector).should.equal('SELECT name,gender FROM users WHERE age>20 ORDER BY name DESC;');
    })
    it('should be SELECT name FROM users WHERE age=20 AND name=\'Mike\';', function () {
      selector = {age: 20, name: 'Mike'};
      emq('select', 'users', ['name'], selector).should.equal('SELECT name FROM users WHERE age=20 AND name=\'Mike\';');
    })
  })
  describe('#DELETE', function () {
    it('should be DELETE FROM users WHERE age<20;', function () {
      selector = ['WHERE age<', [20]];
      emq('delete', 'users', null, selector).should.equal('DELETE FROM users WHERE age<20;');
    })
  })
  describe('#UPDATE', function () {
    it('should be UPDATE users SET age=30,salary=10000 WHERE id=101;', function () {
      columns = {
        age: 30,
        salary: 10000
      };
      selector = ['WHERE id=', [101]];
      emq('update', 'users', columns, selector).should.equal('UPDATE users SET age=30,salary=10000 WHERE id=101;');
    })
  })
  describe('#INSERT', function () {
    it('should be INSERT INTO users VALUES (101,\'TOM\',20,10000);', function () {
      columns = [101, 'TOM', 20, 10000];
      emq('insert', 'users', columns, null).should.equal('INSERT INTO users VALUES (101,\'TOM\',20,10000);');
    })
    it('should be INSERT INTO users (name,age,salary) VALUES (\'TOM\',20,10000);', function () {
      columns = {
        name: 'TOM',
        age: 20,
        salary: 10000
      };
      emq('insert', 'users', columns, null).should.equal('INSERT INTO users (name,age,salary) VALUES (\'TOM\',20,10000);');
    })
    it('should be INSERT INTO users VALUES (\'TOM\');', function () {
      columns = 'TOM';
      emq('insert', 'users', columns, null).should.equal('INSERT INTO users VALUES (\'TOM\');');
    })
  })
  describe('#critical-word-auto-uppercase', function () {
    it('should be SELECT age FROM users WHERE YEAR(birthday) BETWEEN \'1988-06-02\' AND \'1993-12-31\';', function () {
      selector = ['where year(birthday) between',['1988-06-02'],'and',['1993-12-31']];
      emq('select', 'users', 'age', selector).should.equal('SELECT age FROM users WHERE YEAR(birthday) BETWEEN \'1988-06-02\' AND \'1993-12-31\';');
    })
  })
  after(function () {
    emq.setMode('execute');
  })
});