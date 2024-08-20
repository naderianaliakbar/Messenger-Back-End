import Controllers             from '../core/Controllers.js';
import MessagesModel           from '../models/MessagesModel.js';
import InputsController        from "./InputsController.js";
import ConversationsController from "./ConversationsController.js";

class MessagesController extends Controllers {
    static model = new MessagesModel();

    constructor() {
        super();
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
                    {select: '_id'}
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
