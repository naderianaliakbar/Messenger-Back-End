import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class ConversationsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            type          : {type: String, enum: ['private', 'group', 'channel', 'personal', 'support']},
            name          : String, // groups and channels
            members       : [{type: Schema.Types.ObjectId, ref: 'users'}],
            admins        : { // groups and channels
                type   : [{type: Schema.Types.ObjectId, ref: 'users'}],
                default: undefined
            },
            _owner        : {type: Schema.Types.ObjectId, ref: 'users'},
            description   : {type: String, default: undefined}, // groups and channels
            avatars       : {type: [String], default: undefined}, // groups and channels
            _pinnedMessage: {type: Schema.Types.ObjectId, ref: 'messages'},
            settings      : Schema.Types.Mixed
        },
        {timestamps: true});

    constructor() {
        super('conversations', ConversationsModel.schema);
    }

}

export default ConversationsModel;
