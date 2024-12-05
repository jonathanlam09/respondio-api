require('express-async-errors');
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const os = require('os');
const fileUpload = require('express-fileupload');
const APP_CONST = require('./config/constant');
const Cls = require('cls-hooked');
const Uuid = require('uuid');
const clsns_sequelize = Cls.getNamespace('sequelize') ?? Cls.createNamespace('sequelize');
const router = require('./routes/index');
const cookieParser = require("cookie-parser");

var app = express();
app.use(cookieParser());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: os.tmpdir()
}));

let origin_allow = JSON.parse(process.env.CORS_ORIGIN);
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin_allow.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin access denied'), false);
    },
    credentials: true
}));

app.use((req, res, next) => {
    clsns_sequelize.bindEmitter(req);
    clsns_sequelize.bindEmitter(res);

    clsns_sequelize.run((context) => {
        const uuid = Uuid.v4();
        clsns_sequelize.set('uuid', Uuid.v4());
        next();
    });
});

app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

app.use(express.urlencoded({ limit: '10mb', extended: false }));
app.use('/api', router);
app.use(express.static(path.join(__dirname, '/')));

async function clearTransactionConnection() {
    let txn = clsns_sequelize.get('transaction');

    if (txn && !['commit', 'rollback'].includes(txn.finished)) {
        const BaseModel = require('./model/BaseModel');
        await BaseModel.rollback()?.catch?.(perr => {
        console.error(perr.stack);
        });
    }

    let managed_txn_list = clsns_sequelize.get('managed_txn_list');
    if (managed_txn_list) {
        for (let i of Object.getOwnPropertySymbols(managed_txn_list)) {
            if (managed_txn_list[i] && !['commit', 'rollback'].includes(managed_txn_list[i].finished)) {
                await managed_txn_list[i].rollback()?.catch?.(perr => {
                    console.error(perr.stack);
                });
            }
        }
    }
}

app.use((err, req, res, next) => {
    console.error(err.stack);
    clearTransactionConnection();
    res.status(500).json({ message: 'Something went wrong' });
});

module.exports = app;
