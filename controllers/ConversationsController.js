import Controllers        from '../core/Controllers.js';
import ConversationsModel from '../models/ConversationsModel.js';
import InputsController   from "./InputsController.js";
import {ObjectId}         from "mongodb";
import RedisConnection    from '../core/RedisConnection.js';

// init the redis publisher
const redisPublisher = await RedisConnection.getPublisherClient();

class ConversationsController extends Controllers {
    static model = new ConversationsModel();

    constructor() {
        super();
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Inputs (Type of Conversation)
                await InputsController.validateInput($input, {
                    type: {
                        type         : 'string',
                        allowedValues: ['private', 'group', 'channel', 'personal', 'support'],
                        required     : true
                    }
                });

                // init the conversation
                let conversation = {};

                // fill the conversation fields with type of it
                switch ($input.type) {
                    case 'private': {
                        // validate Inputs for private conversation
                        await InputsController.validateInput($input, {
                            contact: {type: 'mongoId', required: true}
                        });

                        // find the conversation between user and contact
                        const exitingConversation = await this.model.item({
                            type   : 'private',
                            members: {$all: [$input.contact, $input.user.data._id]}
                        }).catch(() => {
                            // do nothing
                        });

                        if (exitingConversation) {
                            return resolve({
                                code: 200,
                                data: exitingConversation.toObject()
                            });
                        }

                        conversation.type    = $input.type;
                        conversation.members = [$input.contact, $input.user.data._id];
                        conversation._owner  = $input.user.data._id;
                    }
                }

                // add to db
                await this.model.insertOne(conversation).then(
                    (response) => {

                        // publish conversation
                        redisPublisher.publish('conversations', JSON.stringify({
                            operation: 'insert',
                            data     : response.toObject()
                        }));

                        // check the result ... and return
                        return resolve({
                            code: 200,
                            data: response.toObject()
                        });
                    });
            }
            catch (error) {
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

    static listOfConversations($input) {
        return new Promise((resolve, reject) => {
            let query = {};
            let userId = new ObjectId($input.user.data._id);
            $input.options = {};

            // filter
            this.model.listOfConversations(query,$input.options, userId).then(
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
                    console.log(error);
                    return reject({
                        code: 500
                    });
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
                        data: response
                    });
                },
                (error) => {
                    return reject({
                        code: 500
                    });
                });
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

export default ConversationsController;
