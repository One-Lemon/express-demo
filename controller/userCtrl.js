// 数据库
const UserModel = require('../model/user');
// 加密模块
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// 用户注册
const reg = (req, res) => {
    // 获取用户名去数据库进行对比
    let name = req.body.username;
    UserModel.findOne({
        username: name
    }).then((data) => {
        if (data) {
            res.send({
                code: -1,
                msg: '用户名存在，请更换用户名'
            })
            return;
        }

        //  修改密码为加密后的
        let body = Object.assign({}, req.body, {
            password: bcrypt.hashSync(req.body.password, 10)
        })

        // 实例化对象
        let user = new UserModel(body);
        user.save().then(() => {
            res.send({
                code: 0,
                msg: '用户注册成功'
            })
        }).catch((err) => {
            console.log(err.message);
            res.send({
                code: -1,
                msg: '注册失败'
            })
        })
    })
}


// 用户登录
const login = (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    UserModel.findOne({
        username: username
    }).then((data) => {
        // data为获取到的数据库的内容，进行判断
        if (!data) {
            res.send({
                code: -1,
                msg: '用户名错误，请重新输入'
            })
            return;
        }
        let pwd = data.password; //数据库中的密码
        let isOk = bcrypt.compareSync(password, pwd);
        if (isOk) {
            let token = jwt.sign({
                id: data._id,
                username: data.username
            }, 'icon');

            res.send({
                code: 0,
                msg: '登录成功',
                data: {
                    token: token,
                    userInfo: {
                        username: data.username,
                        icon: data.icon
                    }
                }
            })
        } else {
            res.send({
                code: -1,
                msg: '密码错误'
            })
        }
    })
}


// 修改头像
const upload = (req, res) => {
    // 添加时间戳，保证上传的图片不同
    let newFileName = new Date().getTime() + '_' + req.file.originalname;
    // 拼接文件名
    let newPath = path.resolve(__dirname, '../public', newFileName);
    // 获取图片
    let data = fs.readFileSync(req.file.path);
    // 在新地址写入图片
    fs.writeFileSync(newPath, data);



    // 数据库中修改
    UserModel.updateOne({
        _id: req.id
    }, {
        icon: `http://localhost:4444/${newFileName}`
    }).then(() => {
        res.send({
            code: 0,
            msg: '修改成功',
            data: {
                icon: `http://localhost:4444/${newFileName}`
            }
        })
    }).catch(err => {
        console.log(err.message);
        res.send({
            code: -1,
            msg: '头像修改失败'
        })
    })
}



// 删除用户信息
const del = (req, res) => {
    // 根据用户名进行修改
    let name = req.body.username;
    UserModel.findOne({
        username: name
    }).then((data) => {
        // 这个用户是否存在？
        if (!data) {
            res.send({
                code: -1,
                msg: '用户不存在，无法删除'
            })
            return;
        }
        // 存在执行
        UserModel.deleteOne({
            username: name
        }).then(() => {
            res.send({
                code: 0,
                msg: '删除成功'
            })
        }).catch((err) => {
            console.log(err);
            res.send({
                code: -1,
                msg: '删除失败'
            })
        })
    })
}


//修改用户信息
const update = (req, res) => {
    console.log(req.body);
    // 根据用户名进行修改
    let name = req.body.username;
    //能够修改密码或者性别
    let pwd = req.body.password;
    let sex = req.body.sex;

    // 从数据库中获取数据，如果不更改即保持不变
    UserModel.findOne({
        username: name
    }).then((data) => {
        console.log(data.password);
        UserModel.updateOne({
            username: name
        }, {
            password: pwd ? bcrypt.hashSync(pwd, 10) : data.password,
            sex: sex || data.sex
        }).then(() => {
            res.send({
                code: 0,
                msg: '修改成功'
            })
        }).catch(err => {
            console.log(err);
            res.send({
                code: -1,
                msg: '修改失败'
            })
        })

    })
}




// 暴露
module.exports = {
    reg,
    login,
    del,
    update,
    upload
}