const Users = require('../model/Users');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const Helper = require('../helper/helper');
const validator = require('validator');

class UserController {
    static generateAccessToken = (id) => {
        return JWT.sign({ id }, process.env.JWT_SECRET, { expiresIn: '12h' })
    }

    static generateRefreshToken = (id) => {
        return JWT.sign({ id }, process.env.REFRESH_JWT_SECRET, { expiresIn: '24h' })
    }

    static loginUser = async (req, res) => {
        var ret = {
            status: false
        };

        try {
            if(req.method !== 'POST') {
                throw new Error('Something went wrong! Please send us an email for rectification.');
            }

            if(Object.keys(req.body).length === 0) {
                throw new Error('Please complete all required fields.');
            }

            const { username, password } = req.body;
            if(!username || !password) {
                throw new Error('Invalid username/password. Please try again.');
            }

            const user = await Users.findOne({
                where: {
                    email: username,
                    active: 1
                }
            });
            if(!user) {
                throw new Error('Invalid username/password. Please try again.');
            }

            if (!bcrypt.compare(password, user.password)) {
                throw new Error('Invalid username/password. Please try again.');
            }

            const accessToken = this.generateAccessToken(user.id);
            const refreshToken = this.generateRefreshToken(user.id);

            ret.status = true;
            ret.user = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                contact: user.contact,
                token: user.token,
                accessToken: accessToken
            };

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
            });
        } catch (err) {
            ret.error = err.message;
        }
        res.json(ret);
    }

    static registerUser = async (req, res) => {
        var ret = {
            status: false
        };

        try {   
            if(req.method != 'POST') {
                throw new Error('Invalid HTTP request.');
            }

            if(Object.keys(req.body).length === 0){
                throw new Error('Empty POST data.')
            }

            const validation = Helper.validator({
                body: req.body
            });
            if(!validation.status){
                ret.errorFields = validation.errorFields;
                throw new Error('');
            }

            const { 
                firstName, 
                lastName, 
                email, 
                contact,
            } = req.body;
            if(!validator.isEmail(email)){
                throw new Error('Invalid email.');
            }

            const user = await Users.findOne({
                where: {
                    email: email,
                    active: 1
                }
            });
            if(user) {
                ret.overWriteError = 1;
                throw new Error('This email is already registered.');
            }

            var param = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                contact: contact,
            };

            const randomPassword = Helper.generateRandomPassword();
            
            const salt = bcrypt.genSalt(10);
            const hash = await bcrypt.hash(randomPassword, parseInt(salt));
            param.password = hash;

            const newUser = await Users.create(param);
            ret.status = true;
            ret.email = email;
            ret.password = randomPassword;
        } catch (err) {
            console.log(err.message)
            ret.error = ret.overWriteError == 1 ? err.message : 'Something went wrong. Please retry again.';
        }
        res.json(ret);
    }

    static logoutUser = async (req, res) => {
        var ret = {
            status: false
        };

        try{
            if(req.method !== 'GET'){
                throw Error('Invalid HTTP request.');
            }
            try {
                const { authorization } = req.headers;
                if(!authorization){
                    return res.status(401).json({message: 'Authorization token required!'});
                }
        
                const token = authorization.split(' ')[1];
                if(!token){
                    return res.status(401).json({message: 'Authorization token required!'});
                }
        
                const { id } =  JWT.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                console.error(err.message);
            }
            ret.status = true;
        }catch(err){
            ret.error = err.message;
        }
        res.clearCookie('refreshToken');
        res.json(ret);
    }

    static refreshAccess = async (req, res) => {
        var ret = {};
        var status = 400;

        try {
            if(req.method !== 'GET') {
                throw new Error('Invalid HTTP method!');
            }
            var refreshToken = req.cookies?.refreshToken;
            if(!refreshToken) {
                status = 403;
                throw new Error('');
            }

            var cookie;
            try {
               cookie =  JWT.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
            } catch (err) {
                status = 440;
                res.clearCookie('refreshToken');
                throw new Error('Session expired.');
            }

            const user = await Users.findOne({
                where: {
                    id: cookie.id
                },
                attributes: [
                    'id', 
                    'firstName', 
                    'lastName'
                ]
            });
            if(!user){
                throw new Error('User not found!');
            }

            const accessToken = this.generateAccessToken(user.id);
            user.dataValues.accessToken = accessToken;
            status = 200;
            ret.user = user;
        } catch (err) {
            if(err.message === 'jwt expired') {
                err.message = 'Session expired.';
            }
            ret.error = err.message;
        }
        res.status(status).json(ret);
    }
}

module.exports = UserController;