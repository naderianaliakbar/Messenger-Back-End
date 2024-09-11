import mongoose from "mongoose";

export default class DataBaseConnection {

    static async connect() {
        const user     = encodeURIComponent(process.env.MongoDB_USER);
        const password = encodeURIComponent(process.env.MongoDB_PASSWORD);
        const host     = encodeURIComponent(process.env.MongoDB_HOST);
        const database = encodeURIComponent(process.env.MongoDB_DATABASE);
        const uri      = 'mongodb://' +
            user + ':' + password + '@' +
            host + ':27017/' +
            database + '?' +
            'authSource=admin';
        await mongoose.connect(uri);

        // set strict populate to false
       mongoose.set('strictPopulate', false);

        console.log('DataBase Connection created');
    }
}
