//导入模块
let express = require('express'); //创建web应用的模块
let svgCaptcha = require('svg-captcha'); //生成验证码的模块
let path = require('path'); //路径模块
let bodyParser = require('body-parser'); //post提交 序列化表单模块
let session = require('express-session'); //使用session(会话技术) 存储数据的模块
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'student';


let app = express();
//托管静态页面
app.use(express.static(path.join(__dirname, 'static')));
// app.use(bodyParser.urlencoded({ extended: false }));
let urlencodedParser = bodyParser.urlencoded({
    extended: false
})

app.use(session({
    secret: 'keyboard cat',
    cookie: {
        maxAge: 60000
    }
}));

//进入登录页面
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'views', 'login.html'));
})
//登录逻辑
app.post('/login', urlencodedParser, (req, res) => {
    //获取数据
    let userName = req.body.userName;
    let password = req.body.password;
    let code = req.session.captcha.toLocaleLowerCase();
    if (code === req.session.captcha) {
        //验证通过,进入首页
        req.session.userInfo = {
            userName,
            password
        }
        res.redirect('/index');
    } else {
        //重新登录
        res.redirect('/login');
        console.log('验证码错误');
    }
})
//注册 进入注册页
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'views', 'register.html'));
})
//注册 实现注册逻辑
app.post('/register', urlencodedParser, (req, res) => {
    //接收数据
    let userName = req.body.userName;
    let password = req.body.password;
    //连接数据库
    MongoClient.connect(url,{ useNewUrlParser: true },function (err, client) {
        const db = client.db(dbName);
        const collection = db.collection('student');//要操作的集合
        //判断用户名是否存在
        collection.find({userName}).toArray(function(err, docs) {
          if(docs.length == 0){
            //可以注册
            collection.insertOne(
                {userName,password},
              function(err, result) {
               if(err) throw err;
               res.redirect("/login");
              });
          }else{
              //用户名重复

              res.redirect("/register");
          }
          });
        
    });
    //增加数据
    //关闭数据库
    //返回登录页
})

//进入首页的逻辑
app.get('/index', (req, res) => {
    if (req.session.userInfo) {
        res.sendFile(path.join(__dirname, 'static', 'views', 'index.html'));
    } else {
        res.redirect('/login');
    }

})
//登出逻辑
app.get('/logout', (req, res) => {
    delete req.session.userInfo;
    res.redirect('/login');
})
//生成验证码并返回
app.get('/login/captcha', function (req, res) {
    var captcha = svgCaptcha.create();
    req.session.captcha = captcha.text.toLocaleLowerCase();
    res.type('svg');
    res.status(200).send(captcha.data);
});
//开始监听
app.listen(8888, '127.0.0.1', () => {
    console.log("success");
})