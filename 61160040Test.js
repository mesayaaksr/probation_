const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const mysql = require('mysql')
let app = express()
var popupS = require('popups');
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(morgan('dev'))
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }))
app.engine('html', require('ejs').renderFile);
const con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'probationSystem'
});

let user = {}
let plan ={}
let idfollow=0;
let idfollow2=0;
let studentCon = {}
let studentEnp = {}
let studentEnpReg= {}

let stuConPic = 0
let stuEnpPic = 0



let iddel = 0

let deluser = {}
let delcon = {}

let username = ""
con.connect((err) => {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established\n');
});

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/public/html/login.html');
})

//Login
app.get('/login', function (req, res, next) {
    user = {}
    let email = req.query.email
    let password = req.query.password
    con.query('SELECT * FROM mst_user WHERE username = ? AND password = ?', [email, password], function (err, data) {
        if (err) {
            return err;
        }
        if (data.length == 0) {
            return res.sendFile(__dirname + '/public/html/nonmember.html')
        }
        if (data[0] == null) {
            return res.redirect('/')
        }
        con.query('SELECT * FROM mst_user WHERE user_id = ?', [data[0].user_id], function (err, data2) {
            user = {
                data: data2[0]
            }
            res.redirect('/main')
        })
    })
})

//main
app.get('/main', function (req, res, next) {
    login = {}
    const id = user.data.user_id
    con.query('INSERT INTO  trn_manage_user (user_id, time_in) VALUES(?, NOW())', id, function (err) {
        if (err) return err;
    })
    con.query('SELECT * FROM  trn_manage_user ORDER BY manage_id DESC LIMIT 1', function (err, data) {
        login = {
            data: data[0]
        }
    })
    con.query('SELECT * FROM mst_student_consider ', (err, rows) => {
    res.render(__dirname + "/public/html/main.html", {
        name: user.data.name_user,
        position: user.data.status_user,
        studentCon: rows
    })
    })
})

//manageUser
app.get('/manageUser', function (req, res, next) {
    con.query('SELECT user_id, username, name_user, status_user FROM mst_user WHERE status_user = "อาจารย์"', (err, rows) => {
        res.render(__dirname + "/public/html/manageUser.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            user: rows,
            username: username
        })
    })
})

app.get('/manageUser/:input', function (req, res,next) {
    var search = "%" + req.params.input + "%";
    con.query('SELECT user_id,username, name_user, status_user FROM mst_user WHERE username LIKE ? OR name_user LIKE ?', [search, search], (err, rows) => {
       if (err) throw err;
       res.render(__dirname + "/public/html/manageUser.html", {
           name: user.data.name_user,
           position: user.data.status_user,
           user: rows
       })
    })
})

//AddUser
app.get('/manageUser_add', function (req, res, next) {
    res.render(__dirname + "/public/html/manageUser_add.html", {
        name: user.data.name_user,
        position: user.data.status_user
    })
})
app.post('/manageUser_adduser', function (req, res, next) {
    let username = req.body.username
    let password = req.body.password
    let nameuser = req.body.nameuser
    let statusUser = req.body.statusUser

    con.query('INSERT INTO `mst_user`(`username`, `password`, `name_user`, `status_user`) VALUES(?,?,?,?)', [username,password,nameuser,statusUser], function (err, data) {
        return res.redirect('/manageUser')
    })
})

//deleteUser
app.get('/delUser/:key', function (req, res, next) {
    iddel= req.params.key
    con.query('SELECT * FROM mst_user WHERE user_id = ?', iddel, function (err, del) {
        res.render(__dirname + "/public/html/deleteUser.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            username: del[0].username
        })
    })
})

app.get('/deleteuser', function (req, res, next) {
    if (iddel == user.data.user_id) {
        res.redirect('/manageUser');
    } else {
        con.query('DELETE FROM mst_user WHERE user_id = ? ', [iddel], (err, row) => {
            con.query('DELETE FROM trn_manage_user WHERE user_id = ? ', [iddel], (err, row) => {
                res.redirect('/manageUser');
            })
        })
    }
})

//editUser
app.get('/manageUser_edit/:keyuser', function (req, res, next) {
    manageUser = req.params.keyuser
    con.query('SELECT `username`,`password`,`name_user`,`status_user` FROM mst_user WHERE user_id = ?', manageUser, function (err, data2) {
        res.render(__dirname + "/public/html/manageUser_edit.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            manageUser : manageUser,

            user_id: manageUser,
            username:data2[0].username,
            password:data2[0].password,
            nameuser:data2[0].name_user

        })
    })
})
app.post('/edituser/:key', function (req, res, next) {
    const id = req.params.key
    console.log(id)
    console.log(req.body.password)
    con.query('UPDATE mst_user SET username = ?, password = ?, name_user = ?, status_user = ? WHERE mst_user.user_id = ?',
        [req.body.username, req.body.password, req.body.nameuser, req.body.statusUser, id], (err, row) => {
            if(err)throw err
            console.log(row.changedRows)
        })
    con.query('SELECT * FROM mst_user WHERE user_id = ?', [user.data.user_id], function (err, data2) {
        user = {
            data: data2[0]
        }
        res.redirect('/manageUser')
    })
})

//manageStudentConsider
app.get('/manageStudentConsider', function (req, res,next) {
    con.query('SELECT * FROM mst_student_consider WHERE stu_con_ed_level = "ตรี พิเศษ" ', (err, rows) => {
        if (err) throw err;
        res.render(__dirname + "/public/html/manageStu_con.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            studentCon: rows,
        })
     })
})

app.get('/manageStudentConsider/:input', function (req, res,next) {
    var search = "%" + req.params.input + "%";
    con.query('SELECT * FROM mst_student_consider WHERE id_student_con LIKE ? OR stu_con_name LIKE ?', [search, search], (err, rows) => {
       if (err) throw err;
       res.render(__dirname + "/public/html/manageStu_con.html", {
           name: user.data.name_user,
           position: user.data.status_user,
           studentCon: rows
       })
    })
})

//AddStudentConsider
app.get('/manageStudentCon_add', function (req, res, next) {
    res.render(__dirname + "/public/html/manageStu_con_add.html", {
        name: user.data.name_user,
        position: user.data.status_user
    })
})
app.post('/manageStudentCon_addStu', function (req, res, next) {
    let studentIDCon = req.body.studentIDCon
    let nameStuCon = req.body.nameStuCon
    let stuLevelCon = req.body.stuLevelCon
    let stuGpaCon = req.body.stuGpaCon
    let stuStatusCon = req.body.stuStatusCon
    let creditPassedCon = req.body.creditPassedCon
    let creditDownCon = req.body.creditDownCon
    let considerCon = req.body.considerCon
    let considertime = req.body.considertime
    con.query('INSERT INTO `mst_student_consider`(`id_student_con`, `stu_con_name`,`stu_con_ed_level`,  `stu_con_gpa`, `stu_con_status`, `stu_con_cr_passed`, `stu_con_cr_down`, `stu_con_consider`,`stu_con_time`) VALUES(?,?,?,?,?,?,?,?,?)', [studentIDCon, nameStuCon, stuLevelCon, stuGpaCon, stuStatusCon,creditPassedCon,creditDownCon,considerCon,considertime], function (err, data) {
        return res.redirect('/manageStudentConsider')
    })
})

//EdiStudentConsider
app.get('/manageCon_edit/:keyuser', function (req, res, next) {
    manageCon = req.params.keyuser
   
    con.query('SELECT `stu_con_id`,`id_student_con`,`stu_con_name`,`stu_con_gpa`,`stu_con_cr_passed`,`stu_con_cr_down`,`stu_con_ed_level`,`stu_con_status`,`stu_con_consider`,`stu_con_time` FROM mst_student_consider WHERE stu_con_id = ?', manageCon, function (err, data2) {
        res.render(__dirname + "/public/html/manageStu_con_edit.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            manageCon : manageCon,

            studentIDCon:data2[0].id_student_con,
            nameStuCon:data2[0].stu_con_name,
            stuLevelCon:data2[0].stu_con_ed_level,
            stuGpaCon:data2[0].stu_con_gpa,
            stuStatusCon:data2[0].stu_con_status_stu,
            creditPassedCon:data2[0].stu_con_cr_passed	,
            creditDownCon:data2[0].stu_con_cr_down,
            considerCon:data2[0].stu_con_consider,
            considertime:data2[0].stu_con_time	

        })
    })
})
app.post('/editStudentConsider/:key', function (req, res, next) {
    const id = req.params.key
    console.log(id)
    con.query('UPDATE mst_student_consider SET id_student_con = ?, stu_con_name = ?, stu_con_gpa = ?,stu_con_ed_level = ? , stu_con_status = ?,stu_con_cr_passed = ? , stu_con_cr_down = ?,stu_con_consider = ?,stu_con_time = ? WHERE mst_student_consider.stu_con_id = ?',
        [req.body.studentIDCon, req.body.nameStuCon, req.body.stuGpaCon ,req.body.stuLevelCon, req.body.stuStatusCon, req.body.creditPassedCon, req.body.creditDownCon, req.body.considerCon, req.body.considertime, id], (err, row) => {
            if(err)throw err
        })
    con.query('SELECT * FROM mst_student_consider WHERE stu_con_id = ?', [user.data.user_id], function (err, data2) {
        
        user = {
            data: data2[0]
        }
        res.redirect('/manageStudentConsider')
    })
})

//DeleteStudentConsider
app.get('/delCon/:key', function (req, res, next) {
    iddel= req.params.key
    con.query('SELECT * FROM mst_student_consider WHERE stu_con_id = ?', iddel, function (err, del) {
        res.render(__dirname + "/public/html/deleteConsider.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            stu_con_name: del[0].stu_con_name
        })
    })
})

app.get('/deleteConsider', function (req, res, next) {
    if (iddel == user.data.stu_con_id) {
        res.redirect('/manageStudentConsider');
    } else {
        con.query('DELETE FROM mst_student_consider WHERE stu_con_id = ? ', [iddel], (err, row) => {
            con.query('DELETE FROM trn_follow_student_consider WHERE stu_con_id = ? ', [iddel], (err, row) => {
                res.redirect('/manageStudentConsider');
            })
        })
    }
})

//manageStudentEnp
app.get('/manageStudentEnp', function (req, res,next) {
   con.query('SELECT * FROM mst_student_end_not_plan WHERE stu_enp_ed_level = "ตรี พิเศษ"  ', (err, rows) => {
       if (err) throw err;
       res.render(__dirname + "/public/html/manageStu_enp.html", {
           name: user.data.name_user,
           position: user.data.status_user,
           studentEnp: rows
       })
    })
})
app.get('/manageStudentEnp/:input', function (req, res,next) {
    var search = "%" + req.params.input + "%";
    con.query('SELECT * FROM mst_student_end_not_plan WHERE id_student_enp LIKE ? OR stu_enp_name LIKE ?', [search, search], (err, rows) => {
       if (err) throw err;
       res.render(__dirname + "/public/html/manageStu_enp.html", {
           name: user.data.name_user,
           position: user.data.status_user,
           studentEnp: rows
        })
    })
})

//manageStudentEnp_add
app.get('/manageStudentEnp_add', function (req, res, next) {
    res.render(__dirname + "/public/html/manageStu_enp_add.html", {
        name: user.data.name_user,
        position: user.data.status_user
    })
})
app.post('/manageStudentEnp_addStu', function (req, res, next) {
    let studentIDEnp = req.body.studentIDEnp
    let nameStuEnp = req.body.nameStuEnp
    let stuLevelEnp = req.body.stuLevelEnp
    let stuGpaEnp = req.body.stuGpaEnp
    let stuStatusEnp = req.body.stuStatusEnp
    let creditPassedEnp = req.body.creditPassedEnp
    let creditDownEnp = req.body.creditDownEnp
    console.log(studentIDEnp)


    con.query('INSERT INTO `mst_student_end_not_plan`(`id_student_enp`, `stu_enp_name`, `stu_enp_ed_level`,`stu_enp_gpa`, `stu_enp_status`, `stu_enp_cr_passed`, `stu_enp_cr_down`) VALUES(?,?,?,?,?,?,?)', [studentIDEnp, nameStuEnp, stuLevelEnp, stuGpaEnp, stuStatusEnp,creditPassedEnp,creditDownEnp], function (err, data) {
        return res.redirect('/manageStudentEnp')
    })
})
//EdiStudentEndNotPlan
app.get('/manageEnp_edit/:keyuser', function (req, res, next) {
    manageEnp = req.params.keyuser
   
    con.query('SELECT `stu_enp_id`,`id_student_enp`,`stu_enp_name`,`stu_enp_ed_level`,`stu_enp_gpa`,`stu_enp_status`,`stu_enp_cr_passed`,`stu_enp_cr_down` FROM mst_student_end_not_plan WHERE stu_enp_id = ?', manageEnp, function (err, data2) {
        res.render(__dirname + "/public/html/manageStu_enp_edit.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            manageEnp : manageEnp,

            studentIDEnp:data2[0].id_student_enp,
            nameStuEnp:data2[0].stu_enp_name,
            stuLevelEnp:data2[0].stu_enp_ed_level,
            stuGpaEnp:data2[0].stu_enp_gpa,
            stuStatusEnp:data2[0].stu_enp_status,
            creditPassedEnp:data2[0].stu_enp_cr_passed,
            creditDownEnp:data2[0].stu_enp_cr_down

        })
    })
})
app.post('/editStudentEnp/:key', function (req, res, next) {
    const id = req.params.key
    con.query('UPDATE mst_student_end_not_plan SET id_student_enp = ?, stu_enp_name = ?, stu_enp_gpa = ?,stu_enp_ed_level = ? , stu_enp_status = ?,stu_enp_cr_passed = ? , stu_enp_cr_down = ? WHERE mst_student_end_not_plan.stu_enp_id = ?',
        [req.body.studentIDEnp, req.body.nameStuEnp, req.body.stuGpaEnp ,req.body.stuLevelEnp, req.body.stuStatusEnp, req.body.creditPassedEnp, req.body.creditDownEnp, id], (err, row) => {
            if(err)throw err
        })
    con.query('SELECT * FROM mst_student_end_not_plan WHERE stu_enp_id = ?', [user.data.user_id], function (err, data2) {
        
        user = {
            data: data2[0]
        }
        res.redirect('/manageStudentEnp')
    })
})

// DeleteStudentEnp
app.get('/delEnp/:key', function (req, res, next) {
    iddel= req.params.key
    con.query('SELECT * FROM mst_student_end_not_plan WHERE stu_enp_id = ?', iddel, function (err, del) {
        res.render(__dirname + "/public/html/deleteEnp.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            stu_enp_name: del[0].stu_enp_name
        })
    })
})

app.get('/deleteEnp', function (req, res, next) {
    if (iddel == user.data.stu_enp_id) {
        res.redirect('/manageStudentEnp');
    } else {
        con.query('DELETE FROM mst_student_end_not_plan WHERE stu_enp_id = ? ', [iddel], (err, row) => {
            con.query('DELETE FROM trn_follow_student_end_not_plan WHERE stu_con_id = ? ', [iddel], (err, row) => {

                res.redirect('/manageStudentEnp');
            })
            
        })
    }
})

//followStudentConsider
app.get('/followStudent', function (req, res,next) {
    con.query('SELECT * FROM mst_student_consider WHERE stu_con_ed_level = "ตรี พิเศษ" ', (err, rows) => {
        if (err) throw err;
        res.render(__dirname + "/public/html/followStudent.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            studentCon: rows
        })
     })
})

app.get('/followStudent/:input', function (req, res,next) {
    var search = "%" + req.params.input + "%";
    con.query('SELECT * FROM mst_student_consider WHERE id_student_con LIKE ? OR stu_con_name LIKE ?', [search, search], (err, rows) => {
       if (err) throw err;
       res.render(__dirname + "/public/html/followStudent.html", {
           name: user.data.name_user,
           position: user.data.status_user,
           studentCon: rows
       })
    })
})


app.get('/followStudentCon/:key', function (req, res, next) {
    idfollow = req.params.key
    console.log(idfollow)
    con.query('SELECT * FROM mst_student_consider  WHERE stu_con_id = ?', idfollow, function (err, data1) {
        con.query('SELECT * FROM trn_follow_student_consider  WHERE stu_con_id = ?', idfollow, function (err, row) {
        res.render(__dirname + "/public/html/followStudentPlane.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            idfollow : idfollow,
            studentID: data1[0].id_student_con,
            nameStu: data1[0].stu_con_name,
            stuLevel: data1[0].stu_con_ed_level,
            stuGpa: data1[0].stu_con_gpa,
            stuStatus: data1[0].stu_con_status,
            creditPassed: data1[0].stu_con_cr_passed,
            creditDown: data1[0].stu_con_cr_down,
            stuCon: data1[0].stu_con_consider,

            studentConReg: row,
            })
        })
    })
})
app.post('/followStudentReg', function (req, res, next) {
    const dateNow = new Date();
    let stuConReg = req.body.stuConReg

    console.log(idfollow)
    con.query('INSERT INTO `trn_follow_student_consider` ( `stu_con_id`,`stu_con_reg_plan`, `stu_con_datetime`) VALUES(?,?,?)', [idfollow,stuConReg,dateNow], function (err, data) {
        return res.redirect('/followStudent')
    })
})

app.get('/deleteRegCon/:key', function (req, res, next) {
    iddel = req.params.key
    con.query('DELETE FROM trn_follow_student_consider WHERE follow_stu_con_id = ? ', [iddel], (err, row) => {
            res.redirect('/followStudent');
        
    })
})

//followStudentEnp
app.get('/followStudentEnp', function (req, res,next) {  
   con.query('SELECT * FROM mst_student_end_not_plan WHERE stu_enp_ed_level = "ตรี พิเศษ"', (err, rows) => {
       if (err) throw err;
       res.render(__dirname + "/public/html/followStudentEnp.html", {
           name: user.data.name_user,
           position: user.data.status_user,
           studentEnp: rows
       })
    })
})
app.get('/followStudentEnp/:input', function (req, res,next) {
    var search = "%" + req.params.input + "%";
    con.query('SELECT * FROM mst_student_end_not_plan WHERE id_student_enp LIKE ? OR stu_enp_name LIKE ?', [search, search], (err, rows) => {
       if (err) throw err;
       res.render(__dirname + "/public/html/followStudentEnp.html", {
           name: user.data.name_user,
           position: user.data.status_user,
           studentEnp: rows
        })
    })
})

app.get('/followStudentEnpReg/:key1', function (req, res, next) {
    idfollow2 = req.params.key1
    console.log(idfollow2)
    con.query('SELECT * FROM mst_student_end_not_plan  WHERE stu_enp_id = ?', idfollow2, function (err, data2) {
        con.query('SELECT * FROM trn_follow_student_end_not_plan  WHERE stu_enp_id = ?', idfollow2, function (err, row2) {
        res.render(__dirname + "/public/html/followStudentPlaneEnp.html", {
            name: user.data.name_user,
            position: user.data.status_user,
            idfollow2 : idfollow2,
            
            stu_enp_id:data2[0].stu_enp_id,
            studentID: data2[0].id_student_enp,
            nameStu: data2[0].stu_enp_name,
            stuLevel: data2[0].stu_enp_ed_level,
            stuGpa: data2[0].stu_enp_gpa,
            stuStatus: data2[0].stu_enp_status,
            creditPassed: data2[0].stu_enp_cr_passed,
            creditDown: data2[0].stu_enp_cr_down,

            studentEnpReg: row2
            })
        })
    })
})

app.post('/followStudentRegEnp', function (req, res, next) {
    const dateNow = new Date();
    let stuEnpReg = req.body.stuEnpReg

    console.log(idfollow2)
    con.query('INSERT INTO `trn_follow_student_end_not_plan` (`stu_enp_id`,`stu_enp_reg_plan`,`stu_enp_datetime`) VALUES(?,?,?)', [idfollow2,stuEnpReg,dateNow], function (err, data) {
        return res.redirect('/followStudentEnp')
    })
})
app.get('/deleteRegEnp/:key', function (req, res, next) {
    iddel = req.params.key
    con.query('DELETE FROM trn_follow_student_end_not_plan WHERE follow_stu_enp_id = ? ', [iddel], (err, row) => {
            res.redirect('/followStudentEnp');
        
    })
})

app.get('/logout', function (req, res, next) {
    const id = login.data.manage_id
    const dateNow = new Date();
    console.log(id)
    console.log(dateNow)
    user = {}
    iddel = 0
    deluser = {}
    username = ""
    con.query('UPDATE trn_manage_user set time_out = ? WHERE manage_id = ? ', [dateNow, id], function (err, data) {
        return res.redirect('/')
    })
})

app.listen(3000, function () {
    console.log('Server Listen at http://127.0.0.1:3000/')
})