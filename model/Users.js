const BaseModel = require('./BaseModel');
const Notes = require('./Notes');

module.exports = class Users extends BaseModel {
    static TABLENAME = 'users';

    static {
        var Sequelize = this.Sequelize;

        this.init({
            id: {
                type: Sequelize.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            firstName: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            lastName: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            contact: {
                type: Sequelize.STRING(12),
                allowNull: false,
            },
            password: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            isFirstLogin: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 1
            },
            active: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 1
            },
            createdBy: {
                type: Sequelize.INTEGER.UNSIGNED
            },
            updatedBy: {
                type: Sequelize.INTEGER.UNSIGNED
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
            }
        });

        const Notes = this.loadModel('Notes');
        this.hasMany(Notes, {
            as: '_notes',
            foreignKey: 'usersId',
            sourceKey: 'id',
        });

        this.beforeValidate((model, options) => {
            if (model.isNewRecord) {
                model.createdAt = this.sequelize.literal('NOW()');
            } 
        });

        this.beforeUpdate((model, options) => {
            model.updatedAt = this.sequelize.literal('NOW()');
        });
    }

    getFullname() {
        return this.firstName + ' ' + this.lastName;
    }

    async getNotes (params) {
        params.where = {
            active: 1
        };
        return await this.get_notes(params);
    }
}
