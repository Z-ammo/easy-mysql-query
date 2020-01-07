# easy-mysql-query
Saving your time querying while using the Mysql module based on NodeJS.
## how to use
First, npm install the module.
`npm install easy-mysql-query`
you can run (not necessarily) the test and instances by
`npm run test`
under the 'development' mode.

Second, require the module in your project.
`var easyMysqlQuery = require('easy-mysql-query');`

Third, set the mysql settings.
```
  easyMysqlQuery.setConnection({
    host: '127.0.0.1', // mysql address
    port: '3306', // mysql port
    user: 'root', // your user name
    password: '', // your password
    database: '' // choose the database
  });
```
Finally, we can start our happy-querying!
The function ruquires 5 params:
`easyMysqlQuery(method, table, columns, selectors, callback);`
For example:
```
  easyMysqlQuery('select', 'users', ['name', 'age'], ['WHERE id=', ['001']], function(e, result) {
    if (e) {
      throw e;
    }
    console.log(result);
  });
```
The callback function receives two parameters, first is Error if any, second is the querying result of Mysql module.
## params
### methods
Four methods: 'insert', 'delete', 'update', 'search'.
### table
Table must be a String, which is the single table you want to use this time.
### columns
Columns can be any type during 'insert' method. Columns contains the values and probably certain column names you want to insert. 

Columns can be String or Number if there is only one column in the table.
`var columns = 'ABC';`
Columns can be Array if all columns are set in the table.
`var columns = ['Tom', 24, 10000];`
Columns must be an Object if you want to set certain columns.
```
  var columns = {
    name: 'Tom',
    age: 24
  }; 
```

Columns will be ignored during 'delete' method. You can set null.
`easyMysqlQuery('delete', 'users', null, ['WHERE id=', ['001']], function(e, result) {});`

Columns must be an Object during 'update' method. Like the insert method, but must with the column names.
```
  var columns = {
    name: 'Tom',
    age: 24
  }; 
```

Columns can be String or Array during 'search' method. This time it only contains column names.
```
  var columns = 'name';
  var columns = ['name','age','salary'];
```
### selectors
The selectors contains all the criterias added to your query. To make it simple and diretly, just use an Array and write your selectors like a normal query.
For example:
`var selectors = ['WHERE id=',[123],'AND age>',[20],'OR name LIKE',['Tom%'],'LIMIT',[5,5]];`
Don't worry about the spaces between strings, or the semicolon after the query, we will do it for you.
Note that you have to put your variables into an Array, so we can distinguish it from normal elements. Meanwhile multi-elements in one array will be seperated by ','.
> Please put variables into Array if you want to use the *anti-sql-injection* of Mysql module. In this way we can replace variables with '?' and put the real value into an independent Array. For example:
`mysql.query('SELECT * FROM users WHERE age=? AND salary<?;', ['30', 10000]), callback);`
> However, if the easy-mysql-query module works in *query* mode or if you don't really care about the origin *anti-sql-injection* of Mysql, you don't have to put variables into an Array. It will work like Array.join(), still we will add spaces while necessary.
Selectors can also be an Object. But it only works if all criterais is '=' and all logic is 'AND' and will be applied to 'WHERE' selector.
`var selectors = {id: '001'};`
## two modes
The easy-mysql-query module has two working modes, 'execute' by default and 'query'. You can switch mode by:
`easyMysqlQuery.setMode('query');`
In query mode, callback function will be ignored, the final query will be returned and you can use it in your own way.
In execute mode, we will automatically query through the Mysql module, and pass Error or result to the callback function.
> Missing callback will automatically change to 'query' mode.
## auto-uppercase
We will check the common-used reserved key words in your query and change them to uppercase if possible. This will be useful in 'query' mode. For example:
`var selectors = ['where year(birthday) between',['1988-06-02'],'and',['1993-12-31']];`
will come out as
`WHERE YEAR(birthday) BETWEEN \'1988-06-02\' AND \'1993-12-31\'`
