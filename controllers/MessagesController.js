import Controllers             from '../core/Controllers.js';
import MessagesModel           from '../models/MessagesModel.js';
import InputsController        from "./InputsController.js";
import ConversationsController from "./ConversationsController.js";
import RedisConnection         from '../core/RedisConnection.js';

// init the redis publisher
const redisPublisher = await RedisConnection.getPublisherClient();

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

        return query;
    }

    static insertOne($input) {
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
                    {select: '_id updatedAt'}
                );

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
                        redisPublisher.publish('messages', JSON.stringify({
                            operation: 'insert',
                            data     : response.toObject()
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
                console.log(error);
                return reject(error);
            }
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

    static deleteOne($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.deleteOne($id).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

}

export default MessagesController;
