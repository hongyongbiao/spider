const Mysql=require('mysql-pro')

let db=new Mysql({
    mysql:{
        host: '127.0.0.1',//数据库地址
        port:3306,
        user: 'root',//账号
        password: 'root',//密码
        database: 'tmall_shouji',//库名
        multipleStatements: true //允许执行多条语句
    }
})

module.exports = db