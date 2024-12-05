
class Helper {
    static validator = (data) => {
        var ret = {
            status: false,
            message: null
        };
        const keys = Object.keys(data.body);
        for(var i=0;i<keys.length;i++){
            const val = data.body[keys[i]];
            if(data.exclude){
                if(!data.exclude.includes(keys[i])){
                    if(val == ''){
                        ret.var = keys[i][0].toUpperCase() + keys[i].slice(1) + ' cannot be empty!';
                        return ret;
                    }
                }
            }
        }
        ret.status = true;
        return ret;
    }

    static generateRandomPassword(length = 12) {
        const allChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var password = '';
        for (let i=0;i<length;i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        password = password.split('').sort(() => Math.random() - 0.5).join('');
        return password;
    }
}

module.exports = Helper
