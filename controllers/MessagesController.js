import Controllers             from '../core/Controllers.js';
import MessagesModel           from '../models/MessagesModel.js';
import InputsController        from "./InputsController.js";
import ConversationsController from "./ConversationsController.js";
import RedisConnection         from '../core/RedisConnection.js';
import multer                  from 'multer';
import {ObjectId}              from 'mongodb';
import fs                      from 'fs';
import path                    from 'path';
import Logger                  from "../core/Logger.js";

// init the redis publisher
const redisPublisher = await RedisConnection.getPublisherClient();

// config upload service
const filesPath         = 'storage/files/messenger/';
const fileStorage       = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filesPath)
    },
    filename   : function (req, file, cb) {
        const uniqueSuffix = (new ObjectId().toString()) + '.' + file.mimetype.split('/')[1];
        cb(null, uniqueSuffix)
    }
});
const fileFilter        = (req, file, cb) => {

    // check allowed type
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
        'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/mp4',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv', 'application/rtf',
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip',
        'application/x-msdownload', 'application/vnd.android.package-archive', 'application/x-msdos-program'
    ]
    cb(null, allowedTypes.includes(file.mimetype));

};
const uploadMessageFile = multer({
    storage   : fileStorage,
    fileFilter: fileFilter,
    limits    : {fileSize: 2 * 1024 * 1024 * 1024} // 2GB
}).single('file');

class MessagesController extends Controllers {
    static model = new MessagesModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let query = {};

        // !!!!     after add validator check page and perpage is a number and > 0        !!!!

        // pagination
        if ($input.pagination) {
            $input.perPage = $input.perPage ?? 10;
            $input.page    = $input.page ?? 1;
            $input.offset  = ($input.page - 1) * $input.perPage;
        }

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = Number($input.sortDirection);
        } else {
            $input.sort = {createdAt: -1};
        }

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {

            }
        }

        // remove deleted messages from result
        query['_deletedFor'] = {
            $nin: [$input.user.data._id]
        };

        return query;
    }

    static insertOne($input, $type = 'api') {
        return new Promise(async (resolve, reject) => {
            try {
                // check valid conversation id
                await InputsController.validateInput($input, {
                    _conversation: {type: 'mongoId', required: true},
                    type         : {
                        type         : 'string',
                        allowedValues: ['text', 'image', 'video', 'file', 'audio', 'sticker', 'system'],
                        required     : true
                    },
                });

                // find the conversation
                const conversation = await ConversationsController.get(
                    $input._conversation,
                    {select: '_id updatedAt members'}
                );

                // check the user is member of the conversation
                if (!conversation.data.members.includes($input.user.data._id)) {
                    return resolve({
                        code: 403
                    });
                }

                let message           = {};
                // set type of message
                message.type          = $input.type;
                // set conversation id
                message._conversation = conversation.data._id;

                switch ($input.type) {
                    case 'text':
                        // validate textMessage Input
                        await InputsController.validateInput($input, {
                            content        : {type: 'string', required: true},
                            _replyToMessage: {type: 'mongoId'}
                        });

                        message.content         = $input.content;
                        message._replyToMessage = $input._replyToMessage ?? undefined;

                        break;
                    case 'image':
                    case 'video':
                    case 'audio':
                    case 'file':
                        if ($type === 'system') {
                            message.attachment = $input.attachment;
                        } else {
                            return resolve({
                                code: 400,
                                data: {
                                    message: 'You cannot register this type of message. Please upload the file'
                                }
                            });
                        }
                        break;
                }

                // add user self to readBy field
                message._readBy = [$input.user.data._id];
                // set sender of message
                message._sender = $input.user.data._id;

                // add to db
                await this.model.insertOne(message).then(
                    (response) => {
                        // update conversation updatedAt field
                        conversation.data.updatedAt = new Date();
                        conversation.data.save();

                        // publish message
                        let publishData   = response.toObject();
                        publishData._user = $input.user.data._id;
                        redisPublisher.publish('messages', JSON.stringify({
                            operation: 'insert',
                            data     : publishData
                        }));

                        // check the result ... and return
                        return resolve({
                            code: 200,
                            data: response.toObject()
                        });
                    },
                    (response) => {
                        return reject(response);
                    });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static uploadFile($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // check valid conversation id
                await InputsController.validateInput($input, {
                    _conversation: {type: 'mongoId', required: true},
                });

                // find the conversation
                const conversation = await ConversationsController.get(
                    $input._conversation,
                    {select: '_id members'}
                );

                // check the user is member of the conversation
                if (!conversation.data.members.includes($input.user.data._id)) {
                    return resolve({
                        code: 403
                    });
                }

                // upload files with multer
                uploadMessageFile($input.req, $input.res, async (err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            data: err
                        });
                    }

                    // create message
                    let message = {
                        _conversation: $input._conversation,
                        user         : $input.user,
                        attachments  : []
                    };

                    let type;
                    // get the type of file
                    if ($input.req.file.mimetype.startsWith('image/')) {
                        type = 'image';
                    } else if ($input.req.file.mimetype.startsWith('video/')) {
                        type = 'video';
                    } else if ($input.req.file.mimetype.startsWith('audio/')) {
                        type = 'audio';
                    } else {
                        type = 'file';
                    }

                    // set the type
                    message.type = type;

                    // add the file to attachment
                    message.attachment = {
                        file: $input.req.file.filename,
                        name: $input.req.file.originalname,
                        size: $input.req.file.size,
                        type: $input.req.file.mimetype
                    };

                    await this.insertOne(message, 'system').then(
                        (response) => {
                            return resolve({
                                code: 200,
                                data: response.data
                            });
                        },
                        (error) => {
                            return reject(error);
                        }
                    );

                });


            } catch (error) {
                return reject(error);
            }
        });
    }

    static getFile($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // check valid conversation id
                await InputsController.validateInput($input, {
                    _conversation: {type: 'mongoId', required: true},
                    fileName     : {type: 'string', required: true}
                });

                // find the conversation
                const conversation = await ConversationsController.get(
                    $input._conversation,
                    {select: '_id members'}
                );

                // check the user is member of the conversation
                if (!conversation.data.members.includes($input.user.data._id)) {
                    return resolve({
                        code: 403
                    });
                }

                // get message
                const fileMessage = await this.model.item({
                    'attachment.file': $input.fileName
                });

                // check file exists
                fs.access(filesPath + $input.fileName, fs.constants.F_OK,
                    (err) => {
                        if (err) {
                            return reject({code: 404});
                        }
                    });

                // delete File
                fs.readFile(filesPath + $input.fileName,
                    (error, buffer) => {
                        if (error) return reject({code: 500});

                        return resolve({
                            code       : 200,
                            data       : buffer,
                            contentType: fileMessage.attachment.type
                        })

                    });

            } catch (error) {
                return reject(error);
            }
        });
    }

    static read($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // check valid conversation id
                await InputsController.validateInput($input, {
                    _conversation: {type: 'mongoId', required: true},
                    _message     : {type: 'mongoId', required: true},
                });

                // find the conversation
                const conversation = await ConversationsController.get(
                    $input._conversation,
                    {select: '_id'}
                );

                // find the message
                const message = await this.get(
                    $input._message,
                    {select: '_id _readBy'}
                );

                // check message read before
                if (message.data._readBy.includes($input.user.data._id)) {
                    return resolve({
                        code: 400,
                        data: {
                            message: 'This message has already been read'
                        }
                    });
                }

                // add user id to _readBy
                message.data._readBy.push($input.user.data._id);
                // save to db
                await message.data.save().then(
                    (response) => {

                        // publish read status
                        redisPublisher.publish('messages', JSON.stringify({
                            operation: 'read',
                            data     : {
                                _id          : $input._message,
                                _conversation: $input._conversation,
                                _user        : $input.user.data._id
                            }
                        }));

                        return resolve({code: 200});
                    }
                );

            } catch (error) {
                return reject(error);
            }
        });
    }

    static get($id, $options = {}, $type = 'api') {
        return new Promise((resolve, reject) => {
            this.model.get($id, $options).then(
                async (response) => {
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static item($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static listOfMessages($input) {
        return new Promise(async (resolve, reject) => {
            try {

                // check inputs is valid
                await InputsController.validateInput($input, {
                    _conversation: {type: 'mongoId', required: true}
                });

                // check conversation
                const conversation = await ConversationsController.get($input._conversation, {
                    select: 'members'
                });

                // check user is member of conversation
                if (!conversation.data.members.includes($input.user.data._id)) {
                    return reject({
                        code: 403
                    });
                }

                let query = this.queryBuilder($input);

                let options = {
                    sort: $input.sort,
                };

                if ($input.pagination) {
                    options.skip  = $input.offset;
                    options.limit = $input.perPage;
                }

                // filter
                const messages = await this.model.list(query, options);
                if (messages) {
                    return resolve({
                        code: 200,
                        data: {
                            list: messages
                        }
                    });
                }

            } catch (error) {
                return reject(error);
            }
        });
    }

    static list($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.list($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: {
                            list: response
                        }
                    });
                },
                (error) => {
                    return reject({
                        code: 500
                    });
                });
        });
    }

    static updateOne($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {
                title: {
                    en: $input.title.en,
                    fa: $input.title.fa
                }
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // check valid conversation id
                await InputsController.validateInput($input, {
                    _conversation: {type: 'mongoId', required: true},
                    _message     : {type: 'mongoId', required: true}
                });

                // find the conversation
                const conversation = await ConversationsController.get(
                    $input._conversation,
                    {select: '_id members'}
                );

                // check the user is member of the conversation
                if (!conversation.data.members.includes($input.user.data._id)) {
                    return resolve({
                        code: 403
                    });
                }

                const message = await this.model.get($input._message, {
                    select: '_id attachment _deletedFor'
                });

                // add user _id to deleted for
                if (message._deletedFor) {
                    if(!message._deletedFor.includes($input.user.data._id)) {
                        message._deletedFor.push($input.user.data._id);
                    }
                } else {
                    message._deletedFor = [$input.user.data._id];
                }

                if (message._deletedFor.length === conversation.data.members.length || $input.deleteForEveryone) {
                    // delete the message for everyone
                    await this.model.deleteOne($input._message).then(
                        async (response) => {
                            redisPublisher.publish('messages', JSON.stringify({
                                operation: 'delete',
                                data     : {
                                    _id          : $input._message,
                                    _user        : $input.user.data._id,
                                    _conversation: $input._conversation
                                }
                            }));

                            // delete file of the message
                            if (message.attachment) {
                                await fs.unlink(filesPath + message.attachment.file,(error) => {
                                    if(error) {
                                        Logger.systemError('deleteMessageFile', error);
                                    }
                                });
                            }

                            return resolve({
                                code: 200
                            });
                        }
                    );
                } else {
                    // save the message _deletedFor
                    await message.save().then(
                        (response) => {
                            return resolve({
                                code: 200
                            })
                        }
                    );
                }
            } catch (error) {
                console.log(error);
                return reject(error);
            }
        });
    }

}

export default MessagesController;
