const jwt = require('jsonwebtoken');
const Users = require('../model/Users');
const whitelist = [
    '/users/login',
    '/me',
    '/users/logout'
];

const requireAuth = async (req, res, next) => {
    if(!whitelist.includes(req.path)){
        const { authorization } = req.headers;

        if(!authorization){
            return res.status(401).json({message: 'Authorization token required!'});
        }

        const token = authorization.split(' ')[1];
        if(!token){
            return res.status(401).json({message: 'Authorization token required!'});
        }

        try{
            const { id } =  jwt.verify(token, process.env.JWT_SECRET);
            const user = await Users.findOne({
                where: {
                    id: id
                },
                attributes: [
                    'id', 
                    'firstName', 
                    'lastName'
                ]
            });

            if(!user) {
                throw new Error('User not found.');
            }

            req.user = user;
            next();
        }catch(err){
            if(err.message === 'jwt expired') {
                err.message = 'User session timeout.';
            }
            res.status(401).json({error: err.message});
        }
    }else{
        next();
    }
}

module.exports = requireAuth;