const BaseModel = require('./BaseModel');
const Logger = require('../helper/logger');

module.exports = class Notes extends BaseModel {
    static TABLENAME = 'notes';

    static {
        var Sequelize = this.Sequelize;

        this.init({
            id: {
                type: Sequelize.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            usersId: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false
            },
            type: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false
            },
            remarks: {
                type: Sequelize.TEXT
            },
            active: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 1
            },
            createdBy: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false
            },
            updatedBy: {
                type: Sequelize.INTEGER.UNSIGNED
            },
            createdAt: {
                type: Sequelize.DATE
            },
            updatedAt: {
                type: Sequelize.DATE
            }
        });

        this.beforeValidate((model, options) => {
            if (model.isNewRecord) {
                model.createdBy = options.user.id;
                model.createdAt = this.sequelize.literal('NOW()');
            }
        });

        this.beforeUpdate((model, options) => {
            model.updatedBy = options.user.id;
            model.updatedAt = this.sequelize.literal('NOW()');
        });
    }

    static async createNote(type, params, user) {
        try {
            var ret = { status: false };
            let noteType = type == 1 ? 'work' : type == 2 ? 'personal' : null;

            if (noteType) {
                Logger.log(`Note with type ${noteType} is being created.`);

                await Notes.create({
                    ...params,
                    type: type, 
                }, {user: user});
                ret.status = true;
            } else {
                Logger.log('Invalid note type.');
                throw new Error('Invalid note type!');
            }
            ret.status = true;
        } catch (err) {
            ret.error = err.message;
        }
        return ret;
    }
}
